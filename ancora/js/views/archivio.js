// Il mio cloud dei ricordi: foto, video e audio, scattati o caricati dal telefono.
// Tutto nasce privato ("solo io"); con un tocco si condivide con una famiglia o una cerchia.
import { sb, state, $app, esc, urlMediaMolti } from "../app.js";

const MAX_MB = 50;           // limite per file
const FILTRI = [["", "Tutto"], ["foto", "Foto"], ["video", "Video"], ["audio", "Audio"]];
const mese = (d) => new Date(d).toLocaleDateString("it-IT", { month: "long", year: "numeric" });
const peso = (b) => (b >= 1e9 ? `${(b / 1e9).toFixed(1)} GB` : `${Math.max(1, Math.round(b / 1e6))} MB`);
const tipoDi = (f) => (f.type.startsWith("video") ? "video" : f.type.startsWith("audio") ? "audio" : "foto");

export default async function ({ params }) {
  const filtro = params.f ?? "";
  const [{ data: spazio }, { data: miei }] = await Promise.all([
    sb.rpc("spazio_mio"),
    sb.from("ricordi").select("id, tipo, titolo, visibilita, cerchia_id, creato_il, ricordi_media(id, path, tipo, scattato_il, byte)")
      .eq("autore_id", state.io.id).in("tipo", ["foto", "video", "audio", "racconto", "ricetta", "risposta"])
      .order("creato_il", { ascending: false }).limit(600),
  ]);
  // un elemento per ogni file
  const file = (miei ?? []).flatMap((r) => (r.ricordi_media ?? []).map((m) => ({ ...m, r })))
    .filter((x) => !filtro || x.tipo === filtro)
    .sort((a, b) => new Date(b.scattato_il ?? b.r.creato_il) - new Date(a.scattato_il ?? a.r.creato_il));
  const url = await urlMediaMolti(file.filter((x) => x.tipo === "foto").slice(0, 300).map((x) => x.path));
  const gruppi = new Map();
  for (const x of file) {
    const k = mese(x.scattato_il ?? x.r.creato_il);
    gruppi.set(k, [...(gruppi.get(k) ?? []), x]);
  }

  $app().innerHTML = `
    <header class="testa"><span class="logo" style="font-size:22px">I miei ricordi</span>
      <button class="chip" id="scegli" style="margin:0">Seleziona</button></header>
    <div class="pad" style="padding-top:0">
      <div class="riga" style="gap:8px">
        <label class="btn ambra" style="flex:1;min-height:56px">Scatta<input id="scatta" type="file" accept="image/*,video/*" capture="environment" hidden></label>
        <label class="btn" style="flex:1;min-height:56px">Carica<input id="carica" type="file" accept="image/*,video/*,audio/*" multiple hidden></label>
        <a class="btn chiaro" style="flex:1;min-height:56px" href="#/racconta">Vocale</a>
      </div>
      <div id="coda"></div>
      ${spazio?.famiglia ? `<div style="margin-top:12px"><div class="tenue"><b>${esc(spazio.famiglia.nome)}</b> · ${peso(spazio.famiglia.byte)} su ${spazio.famiglia.quota_gb} GB della famiglia</div>
        <div class="barra-prog" style="background:#EFEAE0"><i style="width:${Math.min(100, Math.round(spazio.famiglia.byte / (spazio.famiglia.quota_gb * 1e9) * 100))}%"></i></div></div>` : ""}
      <div style="margin-top:12px"><div class="tenue">${spazio?.famiglia ? "Il mio spazio: " : ""}${peso(spazio?.byte ?? 0)} su ${spazio?.quota_gb ?? 2} GB · ${spazio?.foto ?? 0} foto · ${spazio?.video ?? 0} video · ${spazio?.audio ?? 0} audio${spazio?.amici < 10 ? ` · <a href="#/invita">+1 GB per amico</a>` : ""}</div>
        <div class="barra-prog" style="background:#EFEAE0"><i style="width:${Math.min(100, Math.round((spazio?.byte ?? 0) / ((spazio?.quota_gb ?? 2) * 1e9) * 100))}%"></i></div>
        ${(spazio?.byte ?? 0) > (spazio?.quota_gb ?? 2) * 0.8e9 ? `<p class="tenue" style="margin:6px 0 0">Stai finendo lo spazio. ${spazio?.piano ? `<a href="#/servizi">Aggiungi 100 GB</a>` : `<a href="#/invita">Invita amici: +1 GB ciascuno</a> · <a href="#/piano">Piano Famiglia: 200 GB</a>`}</p>` : ""}</div>
    </div>
    <div class="storie" style="gap:6px;padding-bottom:8px">${FILTRI.map(([k, t]) =>
      `<a class="chip ${filtro === k ? "on" : ""}" style="flex-shrink:0;text-decoration:none" href="#/archivio${k ? `?f=${k}` : ""}">${t}</a>`).join("")}</div>
    ${[...gruppi].map(([m, xs]) => `<h2>${esc(m)}</h2>
      <div class="griglia">${xs.map((x) => `<a href="#/ricordo/${x.r.id}" data-r="${x.r.id}" style="${x.tipo === "foto" ? `background-image:url('${url[x.path]}')` : `background:${x.tipo === "video" ? "#12302C" : "#C9832E"}`}">
        ${x.tipo !== "foto" ? `<span style="top:50%;left:50%;bottom:auto;transform:translate(-50%,-50%);font-size:13px">${x.tipo === "video" ? "▶ video" : "♪ audio"}</span>` : ""}
        ${x.r.visibilita !== "solo_io" ? `<span style="left:auto;right:6px">condiviso</span>` : ""}</a>`).join("")}</div>`).join("")
      || `<div class="pad"><div class="lettera" style="margin:0;font-size:18px">Qui finiscono le foto, i video e i vocali che contano. Caricali dalla galleria o scattali adesso: nessuno li vede finché non decidi tu.</div></div>`}
    <div id="barra-sel" class="card" style="position:fixed;left:12px;right:12px;bottom:calc(86px + env(safe-area-inset-bottom));z-index:11;max-width:536px;margin:0 auto;box-shadow:0 8px 24px rgba(0,0,0,.15)" hidden>
      <div class="riga"><b id="nsel" style="flex:1">0 selezionati</b>
        <select id="dove" style="width:auto;flex:0 0 auto"><option value="solo_io">Solo io</option>${state.cerchie.map((c) => `<option value="${c.id}">${esc(c.nome)}</option>`).join("")}</select>
        <button class="chip on" id="condividi" style="margin:0">Condividi</button></div>
      <button class="chip" id="elimina" style="margin-top:8px">Elimina</button>
    </div>`;

  // --- caricamento: uno alla volta, con avanzamento ---
  const coda = document.getElementById("coda");
  const carica = async (files) => {
    const lista = [...files];
    let fatti = 0;
    for (const f of lista) {
      coda.innerHTML = `<div class="card" style="margin:10px 0 0">Carico ${fatti + 1} di ${lista.length}: ${esc(f.name || "file")}…
        <div class="barra-prog" style="background:#EFEAE0"><i style="width:${Math.round(fatti / lista.length * 100)}%"></i></div></div>`;
      if ((spazio?.byte ?? 0) + f.size > (spazio?.quota_gb ?? 2) * 1e9) {
        alert(`Spazio finito (${spazio?.quota_gb ?? 2} GB). ${spazio?.piano ? "Aggiungi 100 GB da Servizi." : "Con il Piano Famiglia hai 50 GB."}`);
        break;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        alert(`"${f.name}" pesa ${peso(f.size)}: il massimo per un file è ${MAX_MB} MB. Per i video lunghi, taglialo prima sul telefono.`);
        continue;
      }
      const tipo = tipoDi(f);
      const { data: r, error } = await sb.from("ricordi").insert({
        autore_id: state.io.id, tipo, visibilita: "solo_io", in_memoria: true,
      }).select("id").single();
      if (error) { alert("Non caricato: " + error.message); continue; }
      const ext = (f.name.split(".").pop() || (tipo === "foto" ? "jpg" : tipo === "video" ? "mp4" : "m4a")).toLowerCase().slice(0, 5);
      const path = `${state.io.id}/${r.id}/${tipo}.${ext}`;
      const up = await sb.storage.from("ricordi").upload(path, f, { contentType: f.type || undefined });
      if (up.error) { await sb.from("ricordi").delete().eq("id", r.id); alert("Non caricato: " + up.error.message); continue; }
      await sb.from("ricordi_media").insert({
        ricordo_id: r.id, path, tipo, byte: f.size, mime: f.type || null,
        scattato_il: f.lastModified ? new Date(f.lastModified).toISOString() : null,
      });
      fatti++;
    }
    location.reload();
  };
  document.getElementById("scatta").onchange = (e) => carica(e.target.files);
  document.getElementById("carica").onchange = (e) => carica(e.target.files);

  // --- selezione multipla: condividi o elimina ---
  let selezione = null;
  const barra = document.getElementById("barra-sel");
  document.getElementById("scegli").onclick = () => {
    selezione = selezione ? null : new Set();
    barra.hidden = !selezione;
    document.getElementById("scegli").textContent = selezione ? "Annulla" : "Seleziona";
    document.querySelectorAll("[data-r]").forEach((a) => { a.style.outline = ""; });
  };
  document.querySelectorAll("[data-r]").forEach((a) => a.addEventListener("click", (e) => {
    if (!selezione) return;
    e.preventDefault();
    const id = a.dataset.r;
    selezione.has(id) ? selezione.delete(id) : selezione.add(id);
    document.querySelectorAll(`[data-r="${id}"]`).forEach((x) => { x.style.outline = selezione.has(id) ? "4px solid var(--ambra)" : ""; x.style.outlineOffset = "-4px"; });
    document.getElementById("nsel").textContent = `${selezione.size} selezionati`;
  }));
  document.getElementById("condividi").onclick = async () => {
    if (!selezione?.size) return;
    const dove = document.getElementById("dove").value;
    await sb.from("ricordi").update(dove === "solo_io" ? { visibilita: "solo_io", cerchia_id: null } : { visibilita: "cerchia", cerchia_id: dove })
      .in("id", [...selezione]);
    location.reload();
  };
  document.getElementById("elimina").onclick = async () => {
    if (!selezione?.size || !confirm(`Eliminare ${selezione.size} ricordi? Non si possono recuperare.`)) return;
    const ids = [...selezione];
    const paths = file.filter((x) => ids.includes(x.r.id)).map((x) => x.path);
    if (paths.length) await sb.storage.from("ricordi").remove(paths);
    await sb.from("ricordi").delete().in("id", ids);
    location.reload();
  };
}
