// I video del telefono pesano troppo (un minuto dall'iPhone = 100-350 MB): prima di caricarli li riportiamo a 720p,
// come fa WhatsApp, direttamente sul telefono (WebCodecs, hardware). L'audio resta quello originale, senza ricodifica.
// Se il telefono non ce la fa, si prova a caricare l'originale.
const MP4BOX = "https://esm.sh/mp4box@0.5.2";
const MUXER = "https://esm.sh/mp4-muxer@5.1.3";
export const LIMITE_MB = 50;

export function sipuoComprimere() {
  return typeof VideoDecoder !== "undefined" && typeof VideoEncoder !== "undefined" && typeof OffscreenCanvas !== "undefined";
}

/** Video pronto da caricare: compresso se serve. avanza(0..1) per la barra. */
export async function preparaVideo(file, avanza = () => {}) {
  if (!file?.type?.startsWith("video") || file.size < 18 * 1024 * 1024 || !sipuoComprimere()) return file;
  try {
    const piccolo = await comprimi(file, avanza);
    return piccolo && piccolo.size < file.size ? piccolo : file;
  } catch (e) {
    console.warn("compressione video non riuscita", e);
    return file;
  }
}

async function comprimi(file, avanza) {
  const [{ createFile, DataStream }, { Muxer, ArrayBufferTarget }] = await Promise.all([import(MP4BOX), import(MUXER)]);
  const buf = await file.arrayBuffer();
  buf.fileStart = 0;
  const mp4 = createFile();
  const info = await new Promise((ok, ko) => { mp4.onReady = ok; mp4.onError = ko; mp4.appendBuffer(buf); mp4.flush(); });
  const vt = info.videoTracks?.[0], at = info.audioTracks?.[0];
  if (!vt) return null;
  const trak = mp4.getTrackById(vt.id), voce = trak.mdia.minf.stbl.stsd.entries[0];
  const box = voce.avcC ?? voce.hvcC ?? voce.vpcC ?? voce.av1C;
  let description;
  if (box) { const s = new DataStream(undefined, 0, DataStream.BIG_ENDIAN); box.write(s); description = new Uint8Array(s.buffer, 8); }
  const configDec = { codec: vt.codec.startsWith("vp08") ? "vp8" : vt.codec, codedWidth: vt.video.width, codedHeight: vt.video.height, description };
  if (!(await VideoDecoder.isConfigSupported(configDec)).supported) return null;

  // rotazione (i video in verticale dell'iPhone sono girati con la matrice della traccia)
  const m = vt.matrix ?? [65536, 0, 0, 0, 65536, 0, 0, 0, 1073741824];
  const gradi = ((Math.round(Math.atan2(m[1], m[0]) * 180 / Math.PI) % 360) + 360) % 360;
  const rotazione = [0, 90, 180, 270].reduce((a, b) => (Math.abs(b - gradi) < Math.abs(a - gradi) ? b : a), 0);
  const lato = 1280, k = Math.min(1, lato / Math.max(vt.video.width, vt.video.height));
  const w = Math.round(vt.video.width * k / 2) * 2, h = Math.round(vt.video.height * k / 2) * 2;
  const fps = vt.nb_samples && vt.duration ? vt.nb_samples / (vt.duration / vt.timescale) : 30;
  const bitrate = Math.round(Math.min(2_800_000, w * h * fps * 0.09));

  let configEnc = null;
  for (const codec of ["avc1.640028", "avc1.4d0028", "avc1.42001f"]) {
    const c = { codec, width: w, height: h, bitrate, framerate: Math.min(60, Math.round(fps) || 30), avc: { format: "avc" } };
    if ((await VideoEncoder.isConfigSupported(c)).supported) { configEnc = c; break; }
  }
  if (!configEnc) return null;

  // audio così com'è (AAC del telefono)
  let audio = null, audioDesc = null;
  if (at && at.codec.startsWith("mp4a")) {
    const e = mp4.getTrackById(at.id).mdia.minf.stbl.stsd.entries[0];
    const dsi = e.esds?.esd?.descs?.[0]?.descs?.[0]?.data;
    if (dsi) { audio = { codec: "aac", numberOfChannels: at.audio.channel_count, sampleRate: at.audio.sample_rate }; audioDesc = new Uint8Array(dsi); }
  }
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({ target, video: { codec: "avc", width: w, height: h, rotation: rotazione }, audio: audio ?? undefined,
    fastStart: "in-memory", firstTimestampBehavior: "offset" });

  // tutti i campioni
  const campioni = { v: [], a: [] };
  mp4.onSamples = (id, _u, s) => { (id === vt.id ? campioni.v : campioni.a).push(...s); };
  mp4.setExtractionOptions(vt.id, null, { nbSamples: 1e9 });
  if (audio) mp4.setExtractionOptions(at.id, null, { nbSamples: 1e9 });
  mp4.start(); mp4.flush();

  let errore = null;
  const tela = new OffscreenCanvas(w, h), ctx = tela.getContext("2d");
  const enc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => { errore = e; } });
  enc.configure(configEnc);
  let n = 0;
  const totale = campioni.v.length;
  const dec = new VideoDecoder({
    output: (frame) => {
      ctx.drawImage(frame, 0, 0, w, h);
      const nuovo = new VideoFrame(tela, { timestamp: frame.timestamp, duration: frame.duration ?? undefined });
      frame.close();
      enc.encode(nuovo, { keyFrame: n % 90 === 0 }); nuovo.close(); n++;
      avanza(Math.min(0.99, n / totale));
    },
    error: (e) => { errore = e; },
  });
  dec.configure(configDec);
  for (const s of campioni.v) {
    if (errore) throw errore;
    dec.decode(new EncodedVideoChunk({ type: s.is_sync ? "key" : "delta", timestamp: (1e6 * s.cts) / s.timescale, duration: (1e6 * s.duration) / s.timescale, data: s.data }));
    while (dec.decodeQueueSize > 8 || enc.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 5));
  }
  await dec.flush(); await enc.flush();
  if (errore) throw errore;
  if (audio) {
    let primo = true;
    for (const s of campioni.a) {
      muxer.addAudioChunkRaw(s.data, "key", (1e6 * s.cts) / s.timescale, (1e6 * s.duration) / s.timescale,
        primo ? { decoderConfig: { codec: at.codec, numberOfChannels: audio.numberOfChannels, sampleRate: audio.sampleRate, description: audioDesc } } : undefined);
      primo = false;
    }
  }
  muxer.finalize();
  dec.close(); enc.close();
  avanza(1);
  return new File([target.buffer], file.name.replace(/\.[^.]+$/, "") + ".mp4", { type: "video/mp4", lastModified: file.lastModified });
}

/** Per i punti di caricamento: mostra "Preparo il video…" con la percentuale e restituisce il file pronto,
 *  oppure null (con un avviso) se anche compresso supera il limite. */
export async function videoPronto(file) {
  if (!file?.type?.startsWith("video")) return file;
  let toast = null;
  if (file.size >= 18 * 1024 * 1024 && sipuoComprimere()) {
    toast = document.createElement("div");
    toast.style.cssText = "position:fixed;left:50%;bottom:calc(110px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:90;background:#12302C;color:#FBF3E2;padding:12px 18px;border-radius:16px;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,.25)";
    toast.textContent = "🎬 Preparo il video…";
    document.body.appendChild(toast);
  }
  const pronto = await preparaVideo(file, (p) => { if (toast) toast.textContent = `🎬 Preparo il video… ${Math.round(p * 100)}%`; });
  toast?.remove();
  if (pronto.size > LIMITE_MB * 1024 * 1024) {
    alert(`Il video "${file.name}" è troppo lungo: anche alleggerito supera i ${LIMITE_MB} MB. Taglialo in pezzi più corti (circa 2 minuti) e riprova.`);
    return null;
  }
  return pronto;
}
