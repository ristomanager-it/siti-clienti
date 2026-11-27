// Un ricordo: foto grandi, la sua voce, il testo, le risposte a voce e i commenti.
import { sb, state, $app, esc, quando, nomeDi, avatar, pulsanteVoce, urlMediaMolti, ICONE, ANCORA_UNA_RIGA, conLink } from "../app.js";

export default async function ({ id }) {
  const { data: r } = await sb.from("ricordi")
    .select("id, tipo, titolo, testo, dettagli, creato_il, autore_id, link_pubblico, condiviso_da, sblocco, destinatario_id, domanda_settimana, visibilita, cerchia_id, persone:autore_id(id, nome, soprannome, foto_path), ricordi_media(path, tipo, durata_sec, ordine)")
    .eq("id", id).maybeSingle();
  if (!r) { $app().innerHTML = `<p class="pad">Ricordo non trovato.</p>`; return; }

  const [{ data: reazioni }, { data: risposte }] = await Promise.all([
    sb.from("reazioni").select("tipo, testo, creata_il, persone:persona_id(id, nome, soprannome)").eq("ricordo_id", id).order("creata_il"),
    sb.from("ricordi").select("id, testo, creato_il, persone:autore_id(id, nome, soprannome), ricordi_media(path, tipo, durata_sec)")
      .eq("in_risposta_a", id).order("creato_il"),
  ]);
  const media = (r.ricordi_media ?? []).sort((a, b) => a.ordine - b.ordine);
  const url = await urlMediaMolti([...media.map((m) => m.path), ...(risposte ?? []).flatMap((x) => (x.ricordi_media ?? []).map((m) => m.path))]);
  const audio = media.find((m) => m.tipo === "audio");
  const foto = media.filter((m) => m.tipo === "foto");
  const video = media.filter((m) => m.tipo === "video");
  const cuori = (reazioni ?? []).filter((x) => x.tipo === "cuore");
  const commenti = (reazioni ?? []).filter((x) => x.tipo !== "cuore");

  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/" aria-label="Indietro">${ICONE.indietro}</a>
      <a class="post-testa" style="padding:0" href="#/profilo/${r.autore_id}">${avatar(r.persone, 34)}<div><b>${esc(nomeDi(r.persone))}</b><small>${quando(r.creato_il)}</small></div></a>
      <span style="width:44px"></span></header>
    ${r.titolo ? `<div class="pad"><h1 style="font-size:24px">${esc(r.titolo)}</h1></div>` : ""}
    ${video.map((v) => `<div class="foto" style="aspect-ratio:auto;background:#000;margin-bottom:8px"><video src="${esc(url[v.path])}" controls playsinline preload="metadata" style="width:100%;max-height:75vh;display:block"></video></div>`).join("")}
    ${!foto.length && video.length && !r.testo && !audio ? "" : foto.length
      ? foto.map((f, i) => `<div class="foto" style="background-image:url('${url[f.path]}');margin-bottom:8px">${i === 0 && audio ? pulsanteVoce(url[audio.path], audio.durata_sec) : ""}</div>`).join("")
        + (r.testo ? `<div class="didascalia" style="margin-top:6px;white-space:pre-line">${conLink(r.testo)}</div>` : "")
      : video.length && !r.testo && !audio ? ""
      : `<div class="lettera">${conLink(r.testo ?? "")}${audio ? `<div style="margin-top:14px">${pulsanteVoce(url[audio.path], audio.durata_sec, 1, "margin:0;background:rgba(18,48,44,.9)")}</div>` : ""}</div>`}
    ${r.tipo === "ricetta" ? `<div class="card" style="margin-top:12px">
      <span class="tenue" style="text-transform:uppercase;font-weight:800;letter-spacing:.5px">Ingredienti${r.dettagli?.porzioni ? ` · per ${r.dettagli.porzioni} persone` : ""}</span>
      <ul style="padding-left:20px;margin:8px 0 0;line-height:1.7">${(r.dettagli?.ingredienti ?? []).map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
      ${r.dettagli?.procedimento ? `<span class="tenue" style="text-transform:uppercase;font-weight:800;letter-spacing:.5px;display:block;margin-top:14px">Come si fa</span>
        <p style="white-space:pre-line;margin:6px 0 0;line-height:1.6">${esc(r.dettagli.procedimento)}</p>` : ""}
    </div>
    ${r.autore_id === state.io.id ? `<div class="card" id="condivisione" style="background:#FFF6E8;border-color:#F0D5A8">
      <b style="display:block">🔗 Condividi questa ricetta</b>
      <p class="tenue" style="margin:4px 0 10px">Solo questa, con chi vuoi tu. Chi la riceve vede foto e titolo e, per leggerla tutta, si iscrive gratis ad Ancora. Il resto della famiglia resta privato.</p>
      <div id="cond-azioni"></div></div>` : ""}` : ""}
    ${cartolinaPossibile(r) ? `<div class="card" style="background:#FFF6E8;border-color:#F0D5A8;margin-top:12px">
      <b style="display:block">💌 Fanne una cartolina</b>
      <p class="tenue" style="margin:4px 0 10px">Da mandare su WhatsApp o mettere negli stati. Chi la riceve vede la foto e le prime righe${audio ? " e, per sentire la voce," : "; per leggerlo tutto"} si iscrive gratis. Il resto della famiglia resta privato.</p>
      <div id="cart-azioni"></div></div>` : ""}
    ${r.autore_id === state.io.id && (foto.length || video.length) ? `<div class="card" style="margin-top:12px">
      <b style="display:block">📲 Mettilo sui social</b>
      <p class="tenue" style="margin:4px 0 10px">Le tue ${foto.length ? "foto" : ""}${foto.length && video.length ? " e i tuoi " : ""}${video.length ? "video" : ""} su Instagram, Facebook, TikTok o negli stati. Qui su Ancora resta tutto privato.</p>
      <button class="btn chiaro" id="social" style="margin:0">📲 Condividi fuori da Ancora</button></div>` : ""}
    <div class="pad tenue">${cuori.length ? `♥ ${cuori.map((c) => esc(nomeDi(c.persone))).join(", ")}` : ""}</div>

    ${(risposte ?? []).length ? `<h2>Risposte</h2>` + risposte.map((x) => {
      const a = (x.ricordi_media ?? []).find((m) => m.tipo === "audio");
      return `<div class="card"><div class="riga">${avatar(x.persone, 32)}<b>${esc(nomeDi(x.persone))}</b></div>
        ${x.testo ? `<p style="margin:10px 0 0">${esc(x.testo)}</p>` : ""}
        ${a ? pulsanteVoce(url[a.path], a.durata_sec, 2, "margin:10px 0 0;background:var(--notte)") : ""}</div>`;
    }).join("") : ""}

    ${commenti.length ? `<h2>Commenti</h2>` + commenti.map((c) =>
      `<div class="card"><b>${esc(nomeDi(c.persone))}</b> ${conLink(c.testo)}</div>`).join("") : ""}

    <div class="pad" style="margin-top:12px">
      ${r.autore_id !== state.io.id ? `<a class="btn ambra" href="#/racconta?risposta=${r.id}">Rispondi con la tua voce</a>
          <button class="chip" id="segnala" style="margin-top:10px">🚩 Segnala</button>`
        : `<div class="card" style="margin:0 0 10px"><label style="margin-top:0">Chi lo vede</label>
            <div>${[{ id: "solo_io", nome: "Solo io" }, ...state.cerchie].map((c) => {
              const on = c.id === "solo_io" ? r.visibilita === "solo_io" : r.cerchia_id === c.id && r.visibilita === "cerchia";
              return `<button class="chip ${on ? "on" : ""}" data-vedo="${c.id}">${esc(c.nome)}</button>`;
            }).join("")}</div>
            <button class="chip" data-elimina style="margin-top:8px;color:var(--rosso)">Elimina</button></div>`}
      <form id="rx" style="margin-top:10px">
        <label class="visually-hidden" for="msg">Scrivi un commento</label>
        <div class="riga"><input id="msg" placeholder="Scrivi a ${esc(nomeDi(r.persone))}…">
          <button class="icona" aria-label="Invia" style="background:var(--notte);color:#fff;flex-shrink:0">${ICONE.commento.replace('width="26" height="26"', 'width="20" height="20"')}</button></div>
      </form>
    </div>`;

  document.querySelectorAll("[data-vedo]").forEach((b) => b.onclick = async () => {
    const c = b.dataset.vedo;
    await sb.from("ricordi").update(c === "solo_io" ? { visibilita: "solo_io", cerchia_id: null } : { visibilita: "cerchia", cerchia_id: c }).eq("id", id);
    location.reload();
  });
  document.getElementById("segnala")?.addEventListener("click", async () => {
    const motivo = prompt("Perché lo segnali? Lo leggerà solo chi gestisce Ancora.");
    if (motivo === null) return;
    const { error } = await sb.rpc("segnala", { p_ricordo: r.id, p_messaggio: null, p_motivo: motivo });
    alert(error ? "Non riuscito: " + error.message : "Grazie, segnalazione inviata.");
  });
  document.querySelector("[data-elimina]")?.addEventListener("click", async () => {
    if (!confirm("Eliminare questo ricordo per sempre?")) return;
    const file = (r.ricordi_media ?? []).map((m) => m.path);
    if (file.length) await sb.storage.from("ricordi").remove(file);
    await sb.from("ricordi").delete().eq("id", id);
    history.back();
  });

  document.getElementById("rx").onsubmit = async (e) => {
    e.preventDefault();
    const t = document.getElementById("msg").value.trim();
    if (!t) return;
    await sb.from("reazioni").insert({ ricordo_id: id, persona_id: state.io.id, tipo: "commento", testo: t });
    location.reload();
  };
  if (r.tipo === "ricetta" && r.autore_id === state.io.id) condivisioneRicetta(r);
  document.getElementById("social")?.addEventListener("click", (e) => sulSocial(e.target, r, [...foto, ...video], url));
  if (cartolinaPossibile(r)) cartolina(r, { foto: foto[0] ? url[foto[0].path] : null, voce: !!audio });
}

// --- Cartolina: un ricordo (non le ricette, non il diario, non le lettere chiuse) condiviso con un link + immagine ---
const cartolinaPossibile = (r) => r.tipo !== "ricetta" && r.tipo !== "diario" && r.visibilita === "cerchia" && !r.destinatario_id && (r.sblocco ?? "subito") === "subito";

async function cartolina(r, { foto, voce }) {
  const box = document.getElementById("cart-azioni"); if (!box) return;
  const base = location.href.split("#")[0];
  const posso = r.autore_id === state.io.id || r.condiviso_da === state.io.id;
  const disegna = async (token) => {
    if (!token) {
      box.innerHTML = `<button class="btn ambra" id="cart-crea" style="margin:0">Crea la cartolina</button>`;
      box.querySelector("#cart-crea").onclick = async (e) => {
        e.target.disabled = true; e.target.textContent = "Un attimo…";
        const { data, error } = await sb.rpc("ricordo_condividi", { p_ricordo: r.id, p_attiva: true });
        if (error) { alert(error.message); e.target.disabled = false; return; }
        r.link_pubblico = data; if (!r.condiviso_da) r.condiviso_da = state.io.id;
        await disegna(data); manda(data);
      };
      return;
    }
    const { data: letture } = await sb.rpc("ricordo_letture", { p_ricordo: r.id });
    box.innerHTML = `<button class="btn ambra" id="cart-manda" style="margin:0">Manda la cartolina</button>
      <p class="tenue" style="margin:10px 0 0;font-size:14px">Link attivo${letture ? ` · aperta da ${letture} ${letture === 1 ? "persona" : "persone"}` : ""}${posso || r.autore_id === state.io.id ? ` · <a href="#" id="cart-stop" style="color:var(--rosso)">smetti di condividere</a>` : ""}</p>`;
    box.querySelector("#cart-manda").onclick = () => manda(token);
    box.querySelector("#cart-stop")?.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!confirm("Il link smette di funzionare per tutti. Continuare?")) return;
      const { error } = await sb.rpc("ricordo_condividi", { p_ricordo: r.id, p_attiva: false });
      if (error) { alert(error.message); return; }
      r.link_pubblico = null; disegna(null);
    });
  };
  const manda = async (token) => {
    const link = `${base}#/cartolina?t=${token}`;
    const chi = nomeDi(r.persone);
    const testo = (voce ? `${chi} racconta${r.titolo ? `: "${r.titolo}"` : ""} 💌 Ascolta la sua voce qui 👇
${link}` : `${chi} racconta${r.titolo ? `: "${r.titolo}"` : ""} 💌 Leggilo qui 👇
${link}`) + `\n\n${ANCORA_UNA_RIGA}`;
    try {
      const png = await immagineCartolina(r, { foto, voce, link });
      const file = new File([png], "cartolina-ancora.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], text: testo }); return; }
    } catch (e) { if (e?.name === "AbortError") return; }
    if (navigator.share) { try { await navigator.share({ title: r.titolo ?? "Un ricordo", text: testo }); return; } catch { return; } }
    window.open(`https://wa.me/?text=${encodeURIComponent(testo)}`, "_blank");
  };
  await disegna(r.link_pubblico);
}

// l'immagine della cartolina (1080×1350, va bene per gli stati): foto, chi racconta, le prime parole, il QR
async function immagineCartolina(r, { foto, voce, link }) {
  const { default: qrcode } = await import("https://esm.sh/qrcode-generator@1.4.4");
  await document.fonts?.ready;
  const W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d");
  g.fillStyle = "#FBF3E2"; g.fillRect(0, 0, W, H);
  const altoFoto = foto ? 720 : 0;
  if (foto) {
    const img = await new Promise((ok, ko) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => ok(i); i.onerror = ko; i.src = foto; }).catch(() => null);
    if (img) { const s = Math.max(W / img.width, altoFoto / img.height); g.drawImage(img, (W - img.width * s) / 2, (altoFoto - img.height * s) / 2, img.width * s, img.height * s); }
    else { g.fillStyle = "#7FA37E"; g.fillRect(0, 0, W, altoFoto); }
  }
  const y0 = foto ? altoFoto + 70 : 160;
  g.fillStyle = "#B5652E"; g.font = "800 34px Nunito, system-ui, sans-serif";
  g.fillText(`${nomeDi(r.persone).toUpperCase()} RACCONTA`, 70, y0);
  g.fillStyle = "#12302C"; g.font = "600 58px Fraunces, Georgia, serif";
  const parole = (r.titolo || r.domanda_settimana || (r.testo ?? "").split(/[.!?\n]/)[0] || "Un ricordo di famiglia").split(/\s+/);
  let riga = "", y = y0 + 80, righe = 0;
  for (const p of parole) {
    const prova = riga ? riga + " " + p : p;
    if (g.measureText(prova).width > W - 140 - (foto ? 0 : 0)) { g.fillText(riga, 70, y); y += 70; riga = p; if (++righe >= (foto ? 3 : 6)) { riga += "…"; break; } }
    else riga = prova;
  }
  if (riga) g.fillText(riga, 70, y);
  // QR e invito in basso
  const q = qrcode(0, "M"); q.addData(link); q.make();
  const n = q.getModuleCount(), lato = 210, cella = lato / n, qx = W - 70 - lato, qy = H - 70 - lato;
  g.fillStyle = "#fff"; g.fillRect(qx - 14, qy - 14, lato + 28, lato + 28); g.fillStyle = "#12302C";
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (q.isDark(i, j)) g.fillRect(qx + j * cella, qy + i * cella, Math.ceil(cella), Math.ceil(cella));
  g.fillStyle = "#12302C"; g.font = "700 40px Nunito, system-ui, sans-serif";
  g.fillText(voce ? "🔊 Ascolta la sua voce" : "📖 Leggilo tutto", 70, H - 190);
  g.font = "500 30px Nunito, system-ui, sans-serif"; g.fillStyle = "#5b6b66";
  g.fillText("inquadra il codice o apri il link", 70, H - 140);
  g.font = "700 44px Fraunces, Georgia, serif"; g.fillStyle = "#B5652E"; g.fillText("Ancora", 70, H - 78);
  return await new Promise((ok) => c.toBlob(ok, "image/png"));
}

// la ricetta condivisa con un link: crea, manda su WhatsApp, smetti di condividere
export async function condivisioneRicetta(r) {
  const box = document.getElementById("cond-azioni"); if (!box) return;
  const base = location.href.split("#")[0];
  const disegna = async (token) => {
    if (!token) {
      box.innerHTML = `<button class="btn ambra" id="cond-crea" style="margin:0">Crea il link e condividi</button>`;
      box.querySelector("#cond-crea").onclick = async () => {
        const { data, error } = await sb.rpc("ricetta_condividi", { p_ricordo: r.id, p_attiva: true });
        if (error) { alert("Non riuscito. Riprova."); return; }
        r.link_pubblico = data; await disegna(data); manda(data);
      };
      return;
    }
    const { data: letture } = await sb.rpc("ricetta_letture", { p_ricordo: r.id });
    box.innerHTML = `<button class="btn ambra" id="cond-manda" style="margin:0">Manda il link</button>
      <p class="tenue" style="margin:10px 0 0;font-size:14px">Link attivo${letture ? ` · letta da ${letture} ${letture === 1 ? "persona" : "persone"}` : ""} · <a href="#" id="cond-stop" style="color:var(--rosso)">smetti di condividere</a></p>`;
    box.querySelector("#cond-manda").onclick = () => manda(token);
    box.querySelector("#cond-stop").onclick = async (e) => {
      e.preventDefault();
      if (!confirm("Il link smette di funzionare per tutti. Continuare?")) return;
      await sb.rpc("ricetta_condividi", { p_ricordo: r.id, p_attiva: false });
      r.link_pubblico = null; disegna(null);
    };
  };
  const manda = async (token) => {
    const link = `${base}#/ricetta?t=${token}&utm_source=ricetta&utm_medium=condivisione`;
    const testo = `Ti mando la ricetta di ${r.titolo ?? "famiglia"}: la trovi qui 👇\n\n${ANCORA_UNA_RIGA}`;
    if (navigator.share) { try { await navigator.share({ title: r.titolo ?? "Ricetta", text: testo, url: link }); return; } catch { /* annullato */ } }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${testo}\n${link}`)}`, "_blank");
  };
  await disegna(r.link_pubblico);
}

// --- Sui social: le tue foto (con un piccolo "Ancora" nell'angolo) e i tuoi video, più due righe con il link ---
async function firmata(src) {
  const img = await new Promise((ok, ko) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => ok(i); i.onerror = ko; i.src = src; });
  const lato = 2048, k = Math.min(1, lato / Math.max(img.width, img.height));
  const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  const g = c.getContext("2d"); g.drawImage(img, 0, 0, c.width, c.height);
  const h = Math.max(22, Math.round(c.width * 0.032)), pad = Math.round(h * 0.55);
  try { await document.fonts.load(`700 ${h}px Fraunces`); } catch { /* niente */ }
  g.font = `700 ${h}px Fraunces, Georgia, serif`;
  const scritta = "Ancora", lw = g.measureText(scritta).width;
  const x = c.width - lw - pad * 2.2, y = c.height - h - pad * 2.2;
  g.fillStyle = "rgba(15,82,87,.78)"; g.beginPath(); g.roundRect?.(x - pad, y - pad * 0.6, lw + pad * 2, h + pad * 1.4, h); g.fill();
  g.fillStyle = "#fff"; g.textBaseline = "top"; g.fillText(scritta, x, y + h * 0.05);
  return new Promise((ok) => c.toBlob((b) => ok(b), "image/jpeg", 0.9));
}
async function sulSocial(btn, r, media, url) {
  const prima = btn.textContent; btn.disabled = true; btn.textContent = "Preparo…";
  const link = `${location.origin}${location.pathname}#/scopri?utm_source=social&utm_medium=condivisione`;
  const testo = `${r.titolo ? r.titolo + "\n\n" : ""}📲 Lo conservo su Ancora, il social privato per famiglie e gruppi: ${link}`;
  try {
    const files = [];
    for (const [i, m] of media.slice(0, 10).entries()) {
      if (m.tipo === "foto") { const b = await firmata(url[m.path]); files.push(new File([b], `ancora-${i + 1}.jpg`, { type: "image/jpeg" })); }
      else { const b = await (await fetch(url[m.path])).blob(); const est = (b.type.split("/")[1] || "mp4").replace("quicktime", "mov"); files.push(new File([b], `ancora-${i + 1}.${est}`, { type: b.type || "video/mp4" })); }
    }
    try { await navigator.clipboard?.writeText(testo); } catch { /* niente */ }
    if (navigator.canShare?.({ files })) { await navigator.share({ files, text: testo }); }
    else {
      // computer o browser senza condivisione dei file: si scaricano, e il testo è già copiato
      for (const f of files) { const a = document.createElement("a"); a.href = URL.createObjectURL(f); a.download = f.name; a.click(); }
      alert("Foto scaricate. Il testo con il link è copiato: incollalo nel post.");
    }
  } catch (e) { if (e?.name !== "AbortError") alert("Non sono riuscito a prepararle: " + (e?.message ?? e)); }
  btn.disabled = false; btn.textContent = prima;
}
