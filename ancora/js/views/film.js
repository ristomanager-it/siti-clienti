// Il film dell'anno: le foto e i video della famiglia montati con la musica, fatto sul telefono.
// Canvas + MediaRecorder: si guarda mentre si crea, poi si salva o si condivide.
// Con Ancora+ il film intero; senza, un'anteprima breve con la scritta "Anteprima".
import { sb, state, $app, esc, urlMediaMolti, passaPiu } from "../app.js";

const W = 720, H = 1280, FPS = 30;
const FOTO_SEC = 3.2, VIDEO_SEC = 5, DISSOLVENZA = 0.7, TITOLO_SEC = 3.5, FINE_SEC = 3;
const MAX_PIU = 60, MAX_ANTEPRIMA = 8;

export default async function ({ params }) {
  const fam = state.cerchie.filter((c) => c.tipo === "famiglia");
  const cerchie = fam.length ? fam : state.cerchie;
  const anno = new Date().getFullYear();
  const brani = await fetch("musica/elenco.json").then((r) => r.json()).catch(() => []);
  $app().innerHTML = `
    <header class="testa"><a href="#/" aria-label="Indietro" style="font-size:22px;text-decoration:none">←</a><span class="logo" style="font-size:22px">Il film dell'anno</span><span></span></header>
    <div class="pad">
      <p class="tenue" style="margin-top:0">Le foto e i video della famiglia, montati con la musica. Si crea qui sul telefono: lo guardi mentre nasce, poi lo salvi o lo mandi a tutti.</p>
      ${!state.piu ? `<div class="card" style="background:var(--ambra-chiaro);border-color:#EAD2AA;margin:0 0 12px">Senza Ancora+ puoi creare un'anteprima di ${MAX_ANTEPRIMA} momenti. <a href="#" id="vai-piu">Il film intero è con Ancora+</a>.</div>` : ""}
      <label for="cer">Di quale gruppo</label>
      <select id="cer">${cerchie.map((c) => `<option value="${c.id}" ${c.id === params?.c ? "selected" : ""}>${esc(c.nome)}</option>`).join("")}</select>
      <label for="per">Quale periodo</label>
      <select id="per">
        <option value="${anno}">Tutto il ${anno}</option>
        <option value="12m">Gli ultimi 12 mesi</option>
        <option value="3m">Gli ultimi 3 mesi</option>
        <option value="${anno - 1}">Tutto il ${anno - 1}</option>
        <option value="tutto">Da sempre</option></select>
      <label for="mus">La musica</label>
      <select id="mus">${brani.map((b) => `<option value="${esc(b.id)}">${esc(b.nome)} · ${esc(b.umore ?? "")}</option>`).join("")}</select>
      <label for="tit">Il titolo</label>
      <input id="tit" maxlength="40" value="${esc((cerchie[0]?.nome ?? "La nostra famiglia"))} · ${anno}">
      <p id="conta" class="tenue" role="status"></p>
      <button class="btn ambra" id="crea">Crea il film</button>
    </div>
    <div id="sala" hidden style="padding:0 16px 24px;text-align:center">
      <canvas id="tela" width="${W}" height="${H}" style="width:min(100%,360px);aspect-ratio:9/16;border-radius:18px;background:#12302C;box-shadow:0 10px 30px rgba(0,0,0,.2)"></canvas>
      <p id="stato" class="tenue" role="status"></p>
      <div id="azioni" hidden style="display:grid;gap:8px;max-width:420px;margin:0 auto">
        <button class="btn ambra" id="condividi">Mandalo alla famiglia</button>
        <a class="btn chiaro" id="salva" download>Salva sul telefono</a>
        <button class="btn chiaro" id="rifai">Rifallo</button></div>
    </div>`;

  // musica di Natale a dicembre, emozionante il resto dell'anno
  const preferito = brani.find((b) => b.umore === (new Date().getMonth() === 11 ? "Natale" : "Emozionante"));
  if (preferito) document.getElementById("mus").value = preferito.id;
  document.getElementById("vai-piu")?.addEventListener("click", (e) => { e.preventDefault(); passaPiu("Il film dell'anno intero, con tutte le foto e i video."); });

  const cer = document.getElementById("cer"), per = document.getElementById("per"), conta = document.getElementById("conta"), crea = document.getElementById("crea");
  let momenti = [];
  const carica = async () => {
    conta.textContent = "Cerco foto e video…";
    momenti = await cercaMomenti(cer.value, per.value);
    conta.textContent = momenti.length ? `${momenti.length} tra foto e video${momenti.length > (state.piu ? MAX_PIU : MAX_ANTEPRIMA) ? `: nel film ne entrano ${state.piu ? MAX_PIU : MAX_ANTEPRIMA}, scelti lungo tutto il periodo` : ""}.` : "Ancora niente in questo periodo: caricate qualche foto e riprovate.";
    crea.disabled = !momenti.length;
  };
  cer.onchange = () => { document.getElementById("tit").value = `${cer.selectedOptions[0].text} · ${per.value.match(/^\d{4}$/) ? per.value : anno}`; carica(); };
  per.onchange = cer.onchange;
  await carica();

  crea.onclick = async () => {
    const max = state.piu ? MAX_PIU : MAX_ANTEPRIMA;
    const scelti = distribuisci(momenti, max);
    document.querySelector(".pad").hidden = true;
    document.getElementById("sala").hidden = false;
    await gira(scelti, { titolo: document.getElementById("tit").value.trim(), musica: document.getElementById("mus").value, anteprima: !state.piu });
  };
}

function intervallo(per) {
  const ora = new Date();
  if (/^\d{4}$/.test(per)) return [`${per}-01-01`, `${Number(per) + 1}-01-01`];
  if (per === "12m" || per === "3m") { const d = new Date(ora); d.setMonth(d.getMonth() - (per === "12m" ? 12 : 3)); return [d.toISOString(), null]; }
  return [null, null];
}

async function cercaMomenti(cerchiaId, per) {
  const [da, a] = intervallo(per);
  let q = sb.from("ricordi").select("id, creato_il, ricordi_media(path, tipo, scattato_il, ordine)").eq("cerchia_id", cerchiaId).order("creato_il").limit(1000);
  if (da) q = q.gte("creato_il", da);
  if (a) q = q.lt("creato_il", a);
  const { data } = await q;
  const out = [];
  for (const r of data ?? []) for (const m of (r.ricordi_media ?? []).sort((x, y) => (x.ordine ?? 0) - (y.ordine ?? 0)))
    if (m.tipo === "foto" || m.tipo === "video") out.push({ path: m.path, tipo: m.tipo, quando: m.scattato_il ?? r.creato_il });
  return out.sort((x, y) => String(x.quando).localeCompare(String(y.quando)));
}

// se sono troppe, si prendono a intervalli regolari: così c'è tutto l'anno, non solo gennaio
function distribuisci(lista, max) {
  if (lista.length <= max) return lista;
  return Array.from({ length: max }, (_, i) => lista[Math.floor(i * lista.length / max)]);
}

const carica = (tipo, url) => new Promise((ok) => {
  if (tipo === "video") {
    const v = document.createElement("video");
    v.crossOrigin = "anonymous"; v.muted = true; v.playsInline = true; v.preload = "auto"; v.src = url;
    v.onloadeddata = () => ok(v); v.onerror = () => ok(null); setTimeout(() => ok(v.readyState >= 2 ? v : null), 15000);
  } else {
    const i = new Image(); i.crossOrigin = "anonymous"; i.decoding = "async";
    i.onload = () => ok(i); i.onerror = () => ok(null); i.src = url;
  }
});

function formatoVideo() {
  for (const t of ["video/mp4;codecs=avc1,mp4a.40.2", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"])
    if (window.MediaRecorder?.isTypeSupported?.(t)) return t;
  return "";
}

async function gira(scelti, { titolo, musica, anteprima }) {
  const tela = document.getElementById("tela"), ctx = tela.getContext("2d"), stato = document.getElementById("stato");
  stato.textContent = "Preparo foto e video…";
  const url = await urlMediaMolti(scelti.map((m) => m.path));
  const media = [];
  for (const [i, m] of scelti.entries()) {
    stato.textContent = `Preparo foto e video… ${i + 1}/${scelti.length}`;
    const el = await carica(m.tipo, url[m.path]);
    if (el) media.push({ ...m, el, dur: m.tipo === "video" ? Math.min(VIDEO_SEC, el.duration || VIDEO_SEC) : FOTO_SEC });
  }
  if (!media.length) { stato.textContent = "Non riesco ad aprire le foto. Riprova tra poco."; return; }

  // musica: si mixa dentro il video
  const ac = new (window.AudioContext || window.webkitAudioContext)();
  const dest = ac.createMediaStreamDestination(), vol = ac.createGain(); vol.connect(dest); vol.connect(ac.destination);
  let sorgente = null;
  try {
    const buf = await ac.decodeAudioData(await fetch(`musica/${musica}.m4a`).then((r) => r.arrayBuffer()));
    sorgente = ac.createBufferSource(); sorgente.buffer = buf; sorgente.loop = true; sorgente.connect(vol);
  } catch { /* senza musica va bene lo stesso */ }

  const totale = TITOLO_SEC + media.reduce((s, m) => s + m.dur, 0) + FINE_SEC;
  const flusso = tela.captureStream(FPS);
  dest.stream.getAudioTracks().forEach((t) => flusso.addTrack(t));
  const tipo = formatoVideo();
  const rec = new MediaRecorder(flusso, { ...(tipo ? { mimeType: tipo } : {}), videoBitsPerSecond: 4_000_000 });
  const pezzi = []; rec.ondataavailable = (e) => e.data.size && pezzi.push(e.data);
  const finito = new Promise((ok) => rec.onstop = ok);

  let sveglia = null; try { sveglia = await navigator.wakeLock?.request("screen"); } catch { /* facoltativo */ }
  await ac.resume();
  rec.start(1000);
  const t0 = ac.currentTime;
  if (sorgente) { vol.gain.setValueAtTime(0, t0); vol.gain.linearRampToValueAtTime(0.9, t0 + 1.5); vol.gain.setValueAtTime(0.9, t0 + totale - 2.5); vol.gain.linearRampToValueAtTime(0, t0 + totale); sorgente.start(); }

  // tempi di inizio di ogni momento
  let t = TITOLO_SEC; const inizi = media.map((m) => { const x = t; t += m.dur; return x; });
  let videoAcceso = null;
  await new Promise((fine) => {
    const disegna = () => {
      const s = ac.currentTime - t0;
      if (s >= totale) return fine();
      stato.textContent = `Sto creando il film… ${Math.min(99, Math.round(s / totale * 100))}%`;
      ctx.fillStyle = "#12302C"; ctx.fillRect(0, 0, W, H);
      const i = inizi.findLastIndex((x) => s >= x);
      if (i >= 0 && s < TITOLO_SEC + media.reduce((a, m) => a + m.dur, 0)) {
        const m = media[i], loc = s - inizi[i];
        if (m.tipo === "video" && videoAcceso !== m.el) { videoAcceso?.pause(); videoAcceso = m.el; m.el.currentTime = 0; m.el.play().catch(() => {}); }
        quadro(ctx, m, loc, 1);
        if (loc < DISSOLVENZA && i > 0) quadro(ctx, media[i - 1], media[i - 1].dur + loc, 1 - loc / DISSOLVENZA);   // dissolvenza dal precedente
        else if (loc < DISSOLVENZA && i === 0) { ctx.globalAlpha = 1 - loc / DISSOLVENZA; copertina(ctx, titolo, media[0]); ctx.globalAlpha = 1; }
        data(ctx, m.quando, Math.min(1, loc / 0.6, (m.dur - loc) / 0.6));
      } else if (s < TITOLO_SEC) copertina(ctx, titolo, media[0], s);
      else { videoAcceso?.pause(); fineFilm(ctx, Math.min(1, (s - (totale - FINE_SEC)) / 0.8)); }
      if (anteprima) filigrana(ctx);
      requestAnimationFrame(disegna);
    };
    disegna();
  });
  videoAcceso?.pause();
  rec.stop(); await finito; sorgente?.stop(); ac.close(); sveglia?.release?.();

  const est = (tipo || "video/webm").includes("mp4") ? "mp4" : "webm";
  const blob = new Blob(pezzi, { type: (tipo || "video/webm").split(";")[0] });
  const nome = `${titolo.replace(/[^\p{L}\p{N} ·-]/gu, "").trim() || "Il film dell'anno"}.${est}`;
  const link = URL.createObjectURL(blob);
  tela.hidden = true;
  const v = document.createElement("video");
  v.src = link; v.controls = true; v.playsInline = true;
  v.style.cssText = "width:min(100%,360px);aspect-ratio:9/16;border-radius:18px;background:#000";
  tela.after(v);
  stato.textContent = anteprima ? "Ecco l'anteprima. Il film intero, con tutte le foto e i video, è con Ancora+." : `Ecco il vostro film: ${Math.round(totale)} secondi.`;
  const az = document.getElementById("azioni"); az.hidden = false;
  const salva = document.getElementById("salva"); salva.href = link; salva.download = nome;
  const file = new File([blob], nome, { type: blob.type });
  const cond = document.getElementById("condividi");
  if (navigator.canShare?.({ files: [file] })) cond.onclick = () => navigator.share({ files: [file], title: titolo }).catch(() => {});
  else cond.hidden = true;
  if (anteprima) { const b = document.createElement("button"); b.className = "btn"; b.textContent = "Il film intero con Ancora+"; b.onclick = () => passaPiu("Il film dell'anno intero, con tutte le foto e i video."); az.prepend(b); }
  document.getElementById("rifai").onclick = () => location.reload();
}

// foto o video a tutto schermo, con un lento avvicinamento (effetto Ken Burns)
function quadro(ctx, m, loc, alfa) {
  const el = m.el, w = el.videoWidth || el.naturalWidth, h = el.videoHeight || el.naturalHeight;
  if (!w || !h) return;
  ctx.save(); ctx.globalAlpha = alfa;
  const verticale = h >= w;
  if (verticale) {
    const k = Math.max(W / w, H / h) * (m.tipo === "foto" ? 1 + 0.08 * (loc / m.dur) : 1);
    ctx.drawImage(el, (W - w * k) / 2, (H - h * k) / 2, w * k, h * k);
  } else {
    // orizzontale: sfondo sfocato e foto intera al centro
    const kb = Math.max(W / w, H / h);
    ctx.filter = "blur(28px) brightness(.6)"; ctx.drawImage(el, (W - w * kb) / 2, (H - h * kb) / 2, w * kb, h * kb); ctx.filter = "none";
    const k = (W / w) * (m.tipo === "foto" ? 1 + 0.06 * (loc / m.dur) : 1);
    ctx.drawImage(el, (W - w * k) / 2, (H - h * k) / 2, w * k, h * k);
  }
  ctx.restore();
}

function data(ctx, quando, alfa) {
  if (!quando || alfa <= 0) return;
  const t = new Date(quando).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  ctx.save(); ctx.globalAlpha = Math.max(0, alfa) * 0.95;
  ctx.font = "600 30px Manrope, system-ui, sans-serif"; ctx.textAlign = "left";
  ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = 14; ctx.fillStyle = "#FBF3E2";
  ctx.fillText(t, 44, H - 70); ctx.restore();
}

function copertina(ctx, titolo, primo, s = 0) {
  if (primo) { ctx.save(); ctx.globalAlpha = 0.45; quadro(ctx, primo, 0, 1); ctx.restore(); }
  ctx.fillStyle = "rgba(18,48,44,.55)"; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = Math.min(1, s / 0.8 + (s === 0 ? 1 : 0)); ctx.textAlign = "center"; ctx.fillStyle = "#FBF3E2";
  ctx.font = "700 34px Manrope, system-ui, sans-serif"; ctx.fillText("IL FILM DELL'ANNO", W / 2, H / 2 - 90);
  ctx.font = "700 68px Fraunces, Georgia, serif";
  righe(ctx, titolo, W - 120).forEach((r, i, a) => ctx.fillText(r, W / 2, H / 2 + 10 + (i - (a.length - 1) / 2) * 80));
  ctx.restore();
}

function fineFilm(ctx, alfa) {
  ctx.fillStyle = "#12302C"; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = Math.max(0, alfa); ctx.textAlign = "center"; ctx.fillStyle = "#FBF3E2";
  ctx.font = "700 60px Fraunces, Georgia, serif"; ctx.fillText("La storia continua.", W / 2, H / 2);
  ctx.font = "600 30px Manrope, system-ui, sans-serif"; ctx.fillStyle = "#E7C48A"; ctx.fillText("Ancora", W / 2, H / 2 + 70);
  ctx.restore();
}

function filigrana(ctx) {
  ctx.save(); ctx.font = "800 28px Manrope, system-ui, sans-serif"; ctx.textAlign = "right";
  ctx.fillStyle = "rgba(251,243,226,.85)"; ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 10;
  ctx.fillText("ANTEPRIMA · Ancora+", W - 36, 64); ctx.restore();
}

function righe(ctx, testo, max) {
  const parole = String(testo).split(" "), out = []; let r = "";
  for (const p of parole) { const prova = r ? r + " " + p : p; if (ctx.measureText(prova).width > max && r) { out.push(r); r = p; } else r = prova; }
  if (r) out.push(r); return out.slice(0, 3);
}
