// Crea una storia come su Instagram: foto o video a tutto schermo, testo (Aa), emoji, musica da un file del telefono.
// Le foto escono "cotte" con testo ed emoji dentro; sui video testo ed emoji stanno in ricordi.dettagli.sopra.
import { sb, state, esc } from "../app.js";

const EMOJI = "❤️ 😂 😍 🥰 😘 😎 🤩 🥳 😮 😢 😭 🙏 👏 💪 🔥 ✨ 🎉 🎂 🎁 🎄 ⭐ 🌞 🌙 🌈 🌸 🌻 🍕 🍝 🍷 🍰 ☕ 🐶 🐱 ⚽ 🏖️ ✈️ 🏠 👶 👵 👴 💕 😴 🤔 👍 👌 🙌 🫶 💯".split(" ");
const COLORI = ["#FFFFFF", "#000000", "#C9832E", "#E0533F", "#F2C14E", "#4D7356", "#3B82F6", "#EC4899"];

export function apriEditor(file, cerchie, cerchiaIniziale) {
  const video = file.type.startsWith("video");
  const src = URL.createObjectURL(file);
  let musica = null;       // File audio scelto
  const sopra = [];        // {tipo:"testo"|"emoji", t, x, y, s, c, sfondo}
  let scelto = null;

  const v = document.createElement("div");
  v.style.cssText = "position:fixed;inset:0;z-index:80;background:#000;color:#fff;display:flex;flex-direction:column;touch-action:none;user-select:none;-webkit-user-select:none";
  const bt = "background:rgba(0,0,0,.45);color:#fff;border:0;border-radius:22px;min-width:44px;height:44px;font-size:20px;font-weight:800;padding:0 12px";
  v.innerHTML = `
    <div style="display:flex;gap:8px;align-items:center;padding:calc(10px + env(safe-area-inset-top)) 12px 8px;position:relative;z-index:5">
      <button data-x style="${bt}" aria-label="Annulla">✕</button><span style="flex:1"></span>
      <button data-aa style="${bt};font-family:Fraunces,serif" aria-label="Aggiungi testo">Aa</button>
      <button data-em style="${bt}" aria-label="Aggiungi emoji">😊</button>
      <button data-mu style="${bt}" aria-label="Aggiungi musica">♪</button></div>
    <div data-zona style="flex:1;display:grid;place-items:center;overflow:hidden;position:relative">
      <div data-palco style="position:relative;max-width:100%;max-height:100%">
        ${video ? `<video data-media src="${src}" autoplay loop muted playsinline style="display:block;max-width:100vw;max-height:calc(100vh - 190px)"></video>`
                : `<img data-media src="${src}" alt="" style="display:block;max-width:100vw;max-height:calc(100vh - 190px)">`}
        <div data-sopra style="position:absolute;inset:0"></div></div></div>
    <div data-strumenti style="min-height:52px;display:flex;justify-content:center;align-items:center;gap:10px;padding:6px 12px"></div>
    <div style="display:flex;gap:10px;align-items:center;padding:8px 12px calc(14px + env(safe-area-inset-bottom))">
      <select data-chi style="flex:1;min-height:46px;border-radius:23px;background:#222;color:#fff;border:1px solid #444;padding:0 14px">
        ${cerchie.map((c) => `<option value="${c.id}" ${c.id === cerchiaIniziale ? "selected" : ""}>${esc(c.nome)}</option>`).join("")}</select>
      <button data-ok class="btn ambra" style="width:auto;min-height:46px;padding:0 20px">Condividi</button></div>
    <input type="file" data-file-mu accept="audio/*,video/*,.mp3,.m4a,.aac,.wav" hidden>`;
  document.body.appendChild(v);
  const $ = (q) => v.querySelector(q);
  const strati = $("[data-sopra]"), strumenti = $("[data-strumenti]");

  // --- disegna gli elementi sopra, trascinabili ---
  function disegna() {
    strati.innerHTML = sopra.map((o, k) => `<div data-k="${k}" style="position:absolute;left:${o.x * 100}%;top:${o.y * 100}%;transform:translate(-50%,-50%);
      font-size:${o.s}px;line-height:1.15;text-align:center;white-space:pre-wrap;max-width:90%;cursor:grab;touch-action:none;
      ${o.tipo === "testo" ? `font-family:Manrope,sans-serif;font-weight:800;color:${o.c};${o.sfondo ? `background:${o.c === "#FFFFFF" ? "rgba(0,0,0,.55)" : "rgba(255,255,255,.85)"};padding:4px 10px;border-radius:10px;` : "text-shadow:0 1px 4px rgba(0,0,0,.5);"}` : ""}
      ${scelto === k ? "outline:2px dashed rgba(255,255,255,.8);outline-offset:6px;border-radius:6px;" : ""}">${esc(o.t)}</div>`).join("");
    strati.querySelectorAll("[data-k]").forEach((el) => trascina(el, Number(el.dataset.k)));
    barra();
  }
  function trascina(el, k) {
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault(); scelto = k; el.setPointerCapture(e.pointerId);
      const r = strati.getBoundingClientRect(); let mosso = false;
      const muovi = (ev) => { mosso = true; sopra[k].x = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)); sopra[k].y = Math.min(1, Math.max(0, (ev.clientY - r.top) / r.height));
        el.style.left = sopra[k].x * 100 + "%"; el.style.top = sopra[k].y * 100 + "%"; };
      const fine = () => { el.removeEventListener("pointermove", muovi); el.removeEventListener("pointerup", fine); if (!mosso) disegna(); else barra(); };
      el.addEventListener("pointermove", muovi); el.addEventListener("pointerup", fine);
    });
  }
  function barra() {
    const b = "background:rgba(255,255,255,.15);color:#fff;border:0;border-radius:20px;min-width:44px;height:40px;font-size:18px;font-weight:800";
    let h = "";
    if (scelto != null && sopra[scelto]) {
      h += `<button data-meno style="${b}">A−</button><button data-piu style="${b}">A+</button>`;
      if (sopra[scelto].tipo === "testo") h += `<button data-modifica style="${b};padding:0 12px">Modifica</button>`;
      h += `<button data-via style="${b}">🗑</button>`;
    }
    if (musica) h += `<span style="background:rgba(255,255,255,.15);border-radius:20px;padding:9px 14px;font-weight:700;max-width:50vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">♪ ${esc(String(musica.name).replace(/\.[^.]+$/, ""))}</span><button data-togli-mu style="${b}">✕</button>`;
    strumenti.innerHTML = h;
    strumenti.querySelector("[data-meno]")?.addEventListener("click", () => { sopra[scelto].s = Math.max(14, sopra[scelto].s * .85); disegna(); });
    strumenti.querySelector("[data-piu]")?.addEventListener("click", () => { sopra[scelto].s = Math.min(160, sopra[scelto].s * 1.18); disegna(); });
    strumenti.querySelector("[data-via]")?.addEventListener("click", () => { sopra.splice(scelto, 1); scelto = null; disegna(); });
    strumenti.querySelector("[data-modifica]")?.addEventListener("click", () => scriviTesto(scelto));
    strumenti.querySelector("[data-togli-mu]")?.addEventListener("click", () => { musica = null; barra(); });
  }
  $("[data-zona]").addEventListener("pointerdown", (e) => { if (e.target.closest("[data-k]")) return; if (scelto != null) { scelto = null; disegna(); } });

  // --- testo ---
  function scriviTesto(k = null) {
    const o = k != null ? sopra[k] : { tipo: "testo", t: "", x: .5, y: .45, s: 30, c: "#FFFFFF", sfondo: false };
    const p = document.createElement("div");
    p.style.cssText = "position:absolute;inset:0;z-index:10;background:rgba(0,0,0,.75);display:flex;flex-direction:column;padding:calc(14px + env(safe-area-inset-top)) 14px 14px";
    p.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><button data-sf style="${bt}">A▢</button><button data-fatto style="${bt};padding:0 18px">Fatto</button></div>
      <div style="flex:1;display:grid;place-items:center"><textarea rows="3" style="width:100%;background:none;border:0;color:${o.c};font:800 30px Manrope,sans-serif;text-align:center;resize:none;outline:none" placeholder="Scrivi…">${esc(o.t)}</textarea></div>
      <div style="display:flex;gap:10px;justify-content:center;padding-bottom:env(safe-area-inset-bottom)">${COLORI.map((c) => `<button data-c="${c}" aria-label="Colore" style="width:32px;height:32px;border-radius:50%;background:${c};border:3px solid ${c === o.c ? "#fff" : "rgba(255,255,255,.3)"}"></button>`).join("")}</div>`;
    v.appendChild(p);
    const ta = p.querySelector("textarea"); ta.focus();
    p.querySelectorAll("[data-c]").forEach((b) => b.onclick = () => { o.c = b.dataset.c; ta.style.color = o.c; p.querySelectorAll("[data-c]").forEach((x) => x.style.borderColor = x === b ? "#fff" : "rgba(255,255,255,.3)"); });
    p.querySelector("[data-sf]").onclick = () => { o.sfondo = !o.sfondo; };
    p.querySelector("[data-fatto]").onclick = () => {
      o.t = ta.value.trim(); p.remove();
      if (k == null && o.t) { sopra.push(o); scelto = sopra.length - 1; }
      if (k != null && !o.t) { sopra.splice(k, 1); scelto = null; }
      disegna();
    };
  }
  $("[data-aa]").onclick = () => scriviTesto();

  // --- emoji ---
  $("[data-em]").onclick = () => {
    const p = document.createElement("div");
    p.style.cssText = "position:absolute;left:0;right:0;bottom:0;z-index:10;background:rgba(20,20,20,.97);border-radius:22px 22px 0 0;padding:14px 10px calc(14px + env(safe-area-inset-bottom));display:grid;grid-template-columns:repeat(8,1fr);gap:4px;max-height:50vh;overflow:auto";
    p.innerHTML = EMOJI.map((e) => `<button data-e="${e}" style="background:none;border:0;font-size:32px;height:52px">${e}</button>`).join("");
    v.appendChild(p);
    p.onclick = (e) => { const x = e.target.closest("[data-e]"); if (!x) return; sopra.push({ tipo: "emoji", t: x.dataset.e, x: .5 + (Math.random() - .5) * .3, y: .62 + (Math.random() - .5) * .2, s: 72 }); scelto = sopra.length - 1; p.remove(); disegna(); };
  };

  // --- musica: un file audio del telefono ---
  const fm = $("[data-file-mu]");
  // musica: la libreria di Ancora (brani nostri, senza diritti) oppure un file del telefono
  let anteprima = null;
  $("[data-mu]").onclick = async () => {
    const elenco = await (await fetch("musica/elenco.json")).json().catch(() => []);
    const umori = [...new Set(elenco.map((b) => b.umore))];
    const p = document.createElement("div");
    p.style.cssText = "position:absolute;left:0;right:0;bottom:0;z-index:10;background:rgba(20,20,20,.98);border-radius:22px 22px 0 0;padding:16px 14px calc(16px + env(safe-area-inset-bottom));max-height:70vh;overflow:auto";
    p.innerHTML = `<div style="display:flex;align-items:center;margin-bottom:6px"><b style="flex:1;font-size:18px">♪ Musica</b><button data-no style="${bt}">✕</button></div>
      ${umori.map((u) => `<div style="font-size:12px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;opacity:.6;margin:12px 0 4px">${esc(u)}</div>
        ${elenco.filter((b) => b.umore === u).map((b) => `<div style="display:flex;align-items:center;gap:10px;padding:6px 0">
          <button data-prova="${b.id}" aria-label="Ascolta" style="width:42px;height:42px;border-radius:21px;border:0;background:rgba(255,255,255,.15);color:#fff;font-size:16px">▶</button>
          <span style="flex:1"><b>${esc(b.nome)}</b></span>
          <button data-usa="${b.id}" style="border:0;border-radius:18px;background:var(--ambra);color:#fff;font-weight:800;padding:9px 14px">Usa</button></div>`).join("")}`).join("")}
      <button class="btn chiaro" data-tel style="margin-top:14px;background:transparent;color:#fff">Dal mio telefono (un video o un file audio)</button>`;
    v.appendChild(p);
    const ferma = () => { anteprima?.pause(); anteprima = null; p.querySelectorAll("[data-prova]").forEach((x) => x.textContent = "▶"); };
    p.querySelector("[data-no]").onclick = () => { ferma(); p.remove(); };
    p.querySelectorAll("[data-prova]").forEach((x) => x.onclick = () => {
      const era = x.textContent === "■"; ferma(); if (era) return;
      anteprima = new Audio(`musica/${x.dataset.prova}.m4a`); anteprima.play().catch(() => {}); x.textContent = "■";
    });
    p.querySelectorAll("[data-usa]").forEach((x) => x.onclick = () => {
      const b = elenco.find((y) => y.id === x.dataset.usa); ferma(); p.remove();
      musica = { libreria: true, id: b.id, name: b.nome }; barra();
      const a = new Audio(`musica/${b.id}.m4a`); a.play().then(() => setTimeout(() => a.pause(), 3000)).catch(() => {});
    });
    p.querySelector("[data-tel]").onclick = () => { ferma(); p.remove(); fm.click(); };
  };
  fm.onchange = () => {
    const f = fm.files?.[0]; fm.value = ""; if (!f) return;
    if (f.size > 50 * 1024 * 1024) { alert("Il file supera i 50 MB: scegline uno più corto."); return; }
    const a = new Audio(URL.createObjectURL(f));
    a.onerror = () => alert("Questo file non si riesce a leggere come musica. Prova con un altro.");
    a.oncanplay = () => { musica = f; barra(); };
    a.play().then(() => setTimeout(() => a.pause(), 4000)).catch(() => { musica = f; barra(); });
  };

  const chiudi = () => { URL.revokeObjectURL(src); v.remove(); };
  $("[data-x]").onclick = () => { if (!sopra.length && !musica || confirm("Annullare la storia?")) chiudi(); };

  // --- pubblica ---
  $("[data-ok]").onclick = async () => {
    const ok = $("[data-ok]"); ok.disabled = true; ok.textContent = "Invio…";
    try {
      const media = $("[data-media]");
      let blob = file, tipoMedia = video ? "video" : "foto", ext = (file.name.split(".").pop() || (video ? "mp4" : "jpg")).toLowerCase().slice(0, 5);
      if (!video) { blob = await cuoci(media, sopra, strati.getBoundingClientRect()); ext = "jpg"; }
      const dettagli = (video && sopra.length) || musica?.libreria ? { ...(video && sopra.length ? { sopra } : {}), ...(musica?.libreria ? { musica: { id: musica.id, nome: musica.name } } : {}) } : null;
      const { data: r, error } = await sb.from("ricordi").insert({ autore_id: state.io.id, tipo: "storia", visibilita: "cerchia", cerchia_id: $("[data-chi]").value, in_memoria: true, dettagli }).select("id").single();
      if (error) throw error;
      const path = `${state.io.id}/${r.id}/${tipoMedia}.${ext}`;
      const up = await sb.storage.from("ricordi").upload(path, blob, { contentType: video ? file.type || undefined : "image/jpeg" });
      if (up.error) { await sb.from("ricordi").delete().eq("id", r.id); throw up.error; }
      await sb.from("ricordi_media").insert({ ricordo_id: r.id, path, tipo: tipoMedia, byte: blob.size, mime: video ? file.type || null : "image/jpeg", ordine: 0 });
      if (musica && !musica.libreria) {
        const mp = `${state.io.id}/${r.id}/musica.${(musica.name.split(".").pop() || "m4a").toLowerCase().slice(0, 5)}`;
        const um = await sb.storage.from("ricordi").upload(mp, musica, { contentType: musica.type || undefined });
        if (!um.error) await sb.from("ricordi_media").insert({ ricordo_id: r.id, path: mp, tipo: "audio", byte: musica.size, mime: musica.type || null, ordine: 1, descrizione: musica.name.replace(/\.[^.]+$/, "").slice(0, 80) });
      }
      chiudi(); location.reload();
    } catch (e) { alert("Non pubblicata: " + (e.message ?? e)); ok.disabled = false; ok.textContent = "Condividi"; }
  };
  disegna();
}

// la foto con testo ed emoji "dentro", alla risoluzione originale (lato lungo max 1920)
function cuoci(img, sopra, box) {
  return new Promise((ok) => {
    const k = Math.min(1, 1920 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas"); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    const g = c.getContext("2d"); g.drawImage(img, 0, 0, c.width, c.height);
    const scala = c.width / box.width;
    for (const o of sopra) {
      const px = o.s * scala, x = o.x * c.width, y = o.y * c.height;
      g.textAlign = "center"; g.textBaseline = "middle";
      g.font = o.tipo === "testo" ? `800 ${px}px Manrope, sans-serif` : `${px}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
      const righe = o.t.split("\n"), alto = px * 1.15;
      righe.forEach((riga, i) => {
        const yy = y + (i - (righe.length - 1) / 2) * alto;
        if (o.tipo === "testo" && o.sfondo) {
          const w = g.measureText(riga).width + px * .6;
          g.fillStyle = o.c === "#FFFFFF" ? "rgba(0,0,0,.55)" : "rgba(255,255,255,.85)";
          g.beginPath(); (g.roundRect ? g.roundRect(x - w / 2, yy - alto / 2, w, alto, px * .3) : g.rect(x - w / 2, yy - alto / 2, w, alto)); g.fill();
        }
        if (o.tipo === "testo" && !o.sfondo) { g.shadowColor = "rgba(0,0,0,.5)"; g.shadowBlur = 4 * scala; } else g.shadowBlur = 0;
        g.fillStyle = o.tipo === "testo" ? o.c : "#000";
        g.fillText(riga, x, yy);
      });
    }
    c.toBlob((b) => ok(b), "image/jpeg", .9);
  });
}
