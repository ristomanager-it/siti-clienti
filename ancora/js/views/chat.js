// Chat di famiglia: #/chat = elenco (gruppi delle famiglie + messaggi a due); #/chat/c-<cerchia> o #/chat/d-<persona> = conversazione.
// Si aggiorna da sola ogni pochi secondi mentre è aperta. Foto, video e vocali come in ogni chat.
import { sb, state, $app, esc, avatar, nomeDi, urlMediaMolti, quando } from "../app.js";

export default async function ({ id }) {
  if (id) return conversazione(id);
  const [{ data: lista }, persone] = await Promise.all([sb.rpc("mie_chat"), personeConosciute()]);
  const chats = lista ?? [];
  const conChat = new Set(chats.map((c) => c.persona_id).filter(Boolean));
  const altre = persone.filter((p) => !conChat.has(p.id));
  const url = await urlMediaMolti([...chats.map((c) => c.foto_path), ...altre.map((p) => p.foto_path)].filter(Boolean));
  const anteprima = (u) => !u ? "Scrivi il primo messaggio" : `${u.autore ? `${esc(u.autore)}: ` : ""}${u.testo ? esc(u.testo.slice(0, 60)) : u.media_tipo === "audio" ? "🎙 Vocale" : u.media_tipo === "video" ? "🎬 Video" : "📷 Foto"}`;
  const riga = (href, chiave, ava, nome, sotto, destra = "", grassetto = false) => `<a href="${href}" data-cerca="${esc(chiave.toLowerCase())}" style="display:flex;gap:12px;align-items:center;padding:9px 18px;text-decoration:none;color:inherit">
      ${ava}<span style="flex:1;min-width:0"><b style="display:block;font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(nome)}</b>
      <span class="tenue" style="display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${grassetto ? "color:var(--testo);font-weight:700" : ""}">${sotto}</span></span>${destra}</a>`;
  $app().innerHTML = `
    <header class="testa"><b style="font-family:Fraunces,serif;font-size:24px;flex:1">Chat</b></header>
    <div style="padding:0 16px 8px;position:sticky;top:64px;z-index:4;background:var(--carta)">
      <input id="cerca" type="search" placeholder="🔍  Cerca una persona o una famiglia" aria-label="Cerca" style="border-radius:999px;padding:11px 16px;min-height:44px"></div>
    <div id="elenco">
      ${chats.map((c) => riga(`#/chat/${c.cerchia_id ? "c-" + c.cerchia_id : "d-" + c.persona_id}`, c.nome,
        avatar({ id: c.cerchia_id ?? c.persona_id, nome: c.nome }, 52, c.foto_path ? url[c.foto_path] : null), c.nome, anteprima(c.ultimo),
        `<span style="text-align:right;flex-shrink:0"><span class="tenue" style="font-size:12px">${c.ultimo ? quando(c.ultimo.creato_il) : ""}</span>
          ${c.non_letti ? `<span style="display:grid;place-items:center;margin:4px 0 0 auto;min-width:22px;height:22px;border-radius:11px;background:var(--ambra);color:#fff;font-size:12px;font-weight:800;padding:0 6px">${c.non_letti}</span>` : ""}</span>`,
        !!c.non_letti)).join("")}
      ${altre.length ? `<h2 data-titolo>Scrivi a</h2>${altre.map((p) => riga(`#/chat/d-${p.id}`, nomeDi(p), avatar(p, 44, p.foto_path ? url[p.foto_path] : null), nomeDi(p), esc(p.dove ?? ""))).join("")}` : ""}
      ${!chats.length && !altre.length ? `<p class="pad tenue">Ancora nessuno qui: <a href="#/cerchie">invita la famiglia</a>.</p>` : ""}
    </div>`;
  document.getElementById("cerca").oninput = (e) => {
    const q = e.target.value.trim().toLowerCase();
    document.querySelectorAll("#elenco [data-cerca]").forEach((a) => { a.style.display = !q || a.dataset.cerca.includes(q) ? "" : "none"; });
    document.querySelector("#elenco [data-titolo]")?.style.setProperty("display", q ? "none" : "");
  };
}

// tutte le persone delle mie famiglie e cerchie (con il nome della prima famiglia in comune)
async function personeConosciute() {
  const ids = state.cerchie.map((c) => c.id);
  if (!ids.length) return [];
  const [{ data: m }, { data: prop }] = await Promise.all([
    sb.from("cerchia_membri").select("cerchia_id, persone(id, nome, cognome, soprannome, foto_path)").in("cerchia_id", ids).eq("stato", "attivo"),
    sb.from("cerchie").select("id, persone:proprietario_id(id, nome, cognome, soprannome, foto_path)").in("id", ids)]);
  const nomeCerchia = (id) => state.cerchie.find((c) => c.id === id)?.nome ?? "";
  const tutte = [...(m ?? []).map((x) => ({ ...x.persone, dove: nomeCerchia(x.cerchia_id) })), ...(prop ?? []).map((x) => ({ ...x.persone, dove: nomeCerchia(x.id) }))];
  return [...new Map(tutte.filter((p) => p?.id && p.id !== state.io.id).map((p) => [p.id, p])).values()].sort((a, b) => nomeDi(a).localeCompare(nomeDi(b)));
}

let timer = null;
async function conversazione(id) {
  clearInterval(timer);
  const gruppo = id.startsWith("c-"), altro = id.slice(2);
  const chiave = (gruppo ? "c:" : "d:") + altro;
  let titolo = "", foto = null;
  if (gruppo) { const c = state.cerchie.find((x) => x.id === altro); titolo = c?.nome ?? "Famiglia"; foto = c?.foto_path; }
  else { const { data: p } = await sb.from("persone").select("id, nome, cognome, soprannome, foto_path").eq("id", altro).maybeSingle(); titolo = nomeDi(p ?? {}); foto = p?.foto_path; }
  const urlFoto = foto ? (await urlMediaMolti([foto]))[foto] : null;

  $app().innerHTML = `
    <header class="testa" style="gap:10px"><a class="icona" href="#/chat" aria-label="Indietro" style="font-size:24px;text-decoration:none;color:inherit">‹</a>
      ${avatar({ id: altro, nome: titolo }, 36, urlFoto)}<b style="flex:1;font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(titolo)}</b></header>
    <div id="msg" style="padding:8px 12px 150px;display:flex;flex-direction:column;gap:6px"></div>
    <form id="scrivi" style="position:fixed;left:0;right:0;bottom:calc(84px + env(safe-area-inset-bottom));z-index:15;display:flex;gap:8px;align-items:flex-end;padding:8px 10px;background:rgba(251,248,242,.97);border-top:1px solid var(--bordo)">
      <label aria-label="Foto o video" style="width:44px;height:44px;border-radius:22px;display:grid;place-items:center;font-size:20px;cursor:pointer;flex-shrink:0">📷<input type="file" id="file" accept="image/*,video/*" hidden></label>
      <textarea id="testo" rows="1" placeholder="Scrivi…" style="flex:1;resize:none;max-height:120px;border-radius:22px;padding:11px 14px;min-height:44px"></textarea>
      <button type="button" id="vocale" aria-label="Tieni premuto per un vocale" style="width:44px;height:44px;border-radius:22px;border:0;background:var(--ambra);color:#fff;font-size:18px;flex-shrink:0">🎙</button>
      <button id="invia" aria-label="Invia" style="width:44px;height:44px;border-radius:22px;border:0;background:var(--notte);color:#fff;font-size:18px;flex-shrink:0;display:none">➤</button>
    </form>`;

  const box = document.getElementById("msg"), testo = document.getElementById("testo");
  let ultimo = null; const visti = new Set(); const nomi = new Map();

  async function carica(primo = false) {
    let q = sb.from("messaggi").select("id, autore_id, testo, media_path, media_tipo, durata_sec, creato_il, persone:autore_id(id, nome, soprannome, foto_path)");
    q = gruppo ? q.eq("cerchia_id", altro) : q.not("a_id", "is", null).or(`and(autore_id.eq.${state.io.id},a_id.eq.${altro}),and(autore_id.eq.${altro},a_id.eq.${state.io.id})`);
    if (ultimo) q = q.gt("creato_il", ultimo);
    const { data } = await q.order("creato_il", { ascending: !!ultimo }).limit(primo ? 60 : 50);
    const nuovi = (ultimo ? data : (data ?? []).reverse()) ?? [];
    if (!nuovi.length) return;
    const url = await urlMediaMolti(nuovi.flatMap((m) => [m.media_path, m.persone?.foto_path]).filter(Boolean));
    const giu = innerHeight + scrollY >= document.body.scrollHeight - 80;
    for (const m of nuovi) {
      if (visti.has(m.id)) continue; visti.add(m.id);
      const mio = m.autore_id === state.io.id;
      nomi.set(m.autore_id, nomeDi(m.persone ?? {}));
      const media = !m.media_path ? "" : m.media_tipo === "foto" ? `<img src="${url[m.media_path]}" alt="" style="display:block;max-width:100%;border-radius:14px;margin-bottom:${m.testo ? 6 : 0}px">`
        : m.media_tipo === "video" ? `<video src="${url[m.media_path]}" controls playsinline style="display:block;max-width:100%;border-radius:14px"></video>`
        : `<audio src="${url[m.media_path]}" controls style="width:220px;max-width:100%"></audio>`;
      box.insertAdjacentHTML("beforeend", `<div style="display:flex;gap:6px;align-items:flex-end;${mio ? "flex-direction:row-reverse" : ""}">
        ${gruppo && !mio ? avatar(m.persone ?? {}, 28, m.persone?.foto_path ? url[m.persone.foto_path] : null) : ""}
        <div style="max-width:78%;padding:${m.media_tipo === "foto" && !m.testo ? "4px" : "9px 12px"};border-radius:18px;${mio ? "background:var(--notte);color:#FBF3E2;border-bottom-right-radius:6px" : "background:#fff;border:1px solid var(--bordo);border-bottom-left-radius:6px"}">
          ${gruppo && !mio ? `<div style="font-size:12px;font-weight:800;color:var(--ambra);margin-bottom:2px">${esc(nomeDi(m.persone ?? {}))}</div>` : ""}
          ${media}${m.testo ? `<div style="white-space:pre-wrap;word-wrap:break-word;font-size:16px;line-height:1.35">${esc(m.testo)}</div>` : ""}
          <div style="font-size:11px;opacity:.6;text-align:right;margin-top:2px">${new Date(m.creato_il).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}</div></div></div>`);
      ultimo = m.creato_il;
    }
    if (primo || giu) scrollTo(0, document.body.scrollHeight);
    sb.from("chat_letture").upsert({ persona_id: state.io.id, conversazione: chiave, letto_il: new Date().toISOString() }).then(() => {});
  }
  await carica(true);
  timer = setInterval(() => { if (!document.getElementById("msg")) return clearInterval(timer); if (!document.hidden) carica(); }, 3000);

  const invia = async ({ t = null, file = null, tipo = null, durata = null } = {}) => {
    const { data: m, error } = await sb.from("messaggi").insert({ ...(gruppo ? { cerchia_id: altro } : { a_id: altro }), autore_id: state.io.id,
      testo: t, media_tipo: tipo, durata_sec: durata, media_path: file ? "in-caricamento" : null }).select("id").single();
    if (error) { alert("Non inviato: " + error.message); return; }
    if (file) {
      const ext = (file.name?.split(".").pop() || (tipo === "audio" ? "webm" : "jpg")).toLowerCase().slice(0, 5);
      const path = `${state.io.id}/chat/${m.id}/${tipo}.${ext}`;
      const up = await sb.storage.from("ricordi").upload(path, file, { contentType: file.type || undefined });
      if (up.error) { await sb.from("messaggi").delete().eq("id", m.id); alert("File non inviato: " + up.error.message); return; }
      await sb.rpc("messaggio_media", { p_id: m.id, p_path: path });
    }
    carica();
  };

  const aggiornaTasti = () => { const c = !!testo.value.trim(); document.getElementById("invia").style.display = c ? "" : "none"; document.getElementById("vocale").style.display = c ? "none" : ""; };
  testo.oninput = () => { testo.style.height = "auto"; testo.style.height = Math.min(120, testo.scrollHeight) + "px"; aggiornaTasti(); };
  document.getElementById("scrivi").onsubmit = (e) => { e.preventDefault(); const t = testo.value.trim(); if (!t) return; testo.value = ""; testo.oninput(); invia({ t }); };
  testo.onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey && matchMedia("(pointer:fine)").matches) { e.preventDefault(); document.getElementById("scrivi").requestSubmit(); } };
  document.getElementById("file").onchange = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 50 * 1024 * 1024) { alert("Il file supera i 50 MB."); return; }
    invia({ file: f, tipo: f.type.startsWith("video") ? "video" : "foto" }); e.target.value = "";
  };

  // vocale: tieni premuto e parla, lascia per inviare
  const bv = document.getElementById("vocale"); let rec = null, pezzi = [], inizio = 0;
  const parti = async (e) => {
    e.preventDefault();
    try {
      const flusso = await navigator.mediaDevices.getUserMedia({ audio: true });
      rec = new MediaRecorder(flusso); pezzi = []; inizio = Date.now();
      rec.ondataavailable = (x) => pezzi.push(x.data);
      rec.onstop = () => {
        flusso.getTracks().forEach((t) => t.stop());
        const sec = Math.round((Date.now() - inizio) / 1000);
        if (sec < 1) return;
        const blob = new Blob(pezzi, { type: rec.mimeType || "audio/webm" });
        invia({ file: new File([blob], `vocale.${blob.type.includes("mp4") ? "m4a" : "webm"}`, { type: blob.type }), tipo: "audio", durata: sec });
      };
      rec.start(); bv.style.transform = "scale(1.3)"; bv.style.background = "#B3402F";
    } catch { alert("Serve il permesso del microfono."); }
  };
  const ferma = () => { if (rec?.state === "recording") rec.stop(); bv.style.transform = ""; bv.style.background = ""; };
  bv.addEventListener("pointerdown", parti); bv.addEventListener("pointerup", ferma); bv.addEventListener("pointerleave", ferma);
  addEventListener("hashchange", () => clearInterval(timer), { once: true });
}
