// Liste: della spesa, chi porta cosa, lista dei desideri (chi la riceve non vede chi gli fa il regalo).
// #/liste = tutte · #/liste/<id> = una lista
import { sb, state, $app, esc, nomeDi } from "../app.js";

const TIPI = { lista: ["📝", "Lista"], spesa: ["🛒", "Spesa"], porta: ["🍽", "Chi porta cosa"], desideri: ["🎁", "Lista dei desideri"] };

export default async function ({ id } = {}) {
  if (id) return lista(id);
  const { data: liste } = await sb.from("liste").select("id, titolo, tipo, cerchia_id, per_persona, persone:per_persona(nome, soprannome)").order("creata_il", { ascending: false });
  const nomeCerchia = (c) => c ? (state.cerchie.find((x) => x.id === c)?.nome ?? "Famiglia") : "Solo tu";
  $app().innerHTML = `
    <header class="testa"><b style="font-family:Fraunces,serif;font-size:24px;flex:1">Liste</b></header>
    <div class="pad" style="padding-top:0">
      <button class="btn ambra" id="nuova">+ Nuova lista</button>
      <div style="margin-top:10px">${(liste ?? []).map((l) => `<a href="#/liste/${l.id}" style="display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid var(--bordo);text-decoration:none;color:inherit">
        <span style="font-size:26px">${TIPI[l.tipo][0]}</span><span style="flex:1"><b>${esc(l.titolo)}</b><br><span class="tenue" style="font-size:14px">${TIPI[l.tipo][1]}${l.persone ? ` di ${esc(nomeDi(l.persone))}` : ""} · ${esc(nomeCerchia(l.cerchia_id))}</span></span>›</a>`).join("")
        || `<p class="tenue">Nessuna lista. La spesa, chi porta cosa al pranzo, i desideri per Natale: comincia da qui.</p>`}</div>
    </div>`;
  document.getElementById("nuova").onclick = nuova;
}

function nuova() {
  const f = document.createElement("div");
  f.innerHTML = `<div data-chiudi style="position:fixed;inset:0;background:rgba(18,48,44,.45);z-index:40"></div>
    <form style="position:fixed;left:0;right:0;bottom:0;z-index:41;max-height:90vh;overflow:auto;background:#FBF8F2;border-radius:24px 24px 0 0;padding:20px 18px calc(20px + env(safe-area-inset-bottom))">
      <div class="riga"><b style="flex:1;font-size:20px">Nuova lista</b><button type="button" data-chiudi class="chip" style="margin:0">Chiudi</button></div>
      <label for="l-tipo">Che lista</label>
      <select id="l-tipo">${Object.entries(TIPI).map(([k, [ic, t]]) => `<option value="${k}">${ic} ${t}</option>`).join("")}</select>
      <label for="l-t">Nome</label><input id="l-t" required maxlength="80" placeholder="Pranzo di Natale, I desideri di Giulia">
      <label for="l-c">Con chi</label>
      <select id="l-c">${state.cerchie.map((c) => `<option value="${c.id}">${esc(c.nome)}</option>`).join("")}<option value="">Solo io</option></select>
      <button class="btn ambra" style="margin-top:14px">Crea</button>
    </form>`;
  document.body.appendChild(f);
  f.querySelectorAll("[data-chiudi]").forEach((x) => x.onclick = () => f.remove());
  f.querySelector("form").onsubmit = async (e) => {
    e.preventDefault();
    const tipo = f.querySelector("#l-tipo").value;
    const { data, error } = await sb.from("liste").insert({ titolo: f.querySelector("#l-t").value.trim(), tipo, cerchia_id: f.querySelector("#l-c").value || null,
      per_persona: tipo === "desideri" ? state.io.id : null, autore_id: state.io.id }).select("id").single();
    if (error) { alert("Non creata: " + error.message); return; }
    f.remove(); location.hash = `#/liste/${data.id}`;
  };
}

async function lista(id) {
  const { data: l } = await sb.from("liste").select("*, persone:per_persona(nome, soprannome)").eq("id", id).maybeSingle();
  if (!l) { $app().innerHTML = `<p class="pad">Lista non trovata.</p>`; return; }
  const { data: voci } = await sb.rpc("voci_lista", { p_lista: id });
  const mia = l.per_persona === state.io.id, desideri = l.tipo === "desideri", porta = l.tipo === "porta";
  $app().innerHTML = `
    <header class="testa" style="gap:8px"><a href="#/liste" aria-label="Indietro" style="font-size:24px;text-decoration:none;color:inherit;width:30px">‹</a>
      <b style="font-family:Fraunces,serif;font-size:22px;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${TIPI[l.tipo][0]} ${esc(l.titolo)}</b></header>
    <div class="pad" style="padding-top:0">
      ${desideri && !mia ? `<p class="tenue" style="margin:0 0 10px">${esc(nomeDi(l.persone ?? {}))} non vede chi prende cosa: niente doppioni, sorpresa salva.</p>` : ""}
      <form id="agg" class="riga" style="gap:8px;margin-bottom:8px"><input id="voce" required maxlength="200" placeholder="${desideri ? "Un desiderio…" : porta ? "Cosa serve (es. il panettone)" : "Aggiungi…"}" style="flex:1">
        <button class="btn" style="width:auto;margin:0;padding:0 18px">+</button></form>
      ${(voci ?? []).map((v) => `<div style="display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--bordo)">
        ${desideri || porta ? "" : `<input type="checkbox" data-fatto="${v.id}" ${v.fatto ? "checked" : ""} style="width:24px;height:24px" aria-label="Fatto">`}
        <span style="flex:1;${v.fatto ? "text-decoration:line-through;opacity:.55" : ""}">${esc(v.testo)}
          ${(desideri || porta) && v.preso_da_nome ? `<br><span class="tenue" style="font-size:13px">${desideri ? "🎁 Lo regala" : "🙋 Lo porta"} ${esc(v.preso_da === state.io.id ? "tu" : v.preso_da_nome)}</span>` : ""}</span>
        ${(desideri && !mia) || porta ? (v.preso_da === state.io.id ? `<button class="chip" data-lascia="${v.id}" style="margin:0">Lascio</button>`
          : !v.preso_da && !(desideri && mia) ? `<button class="chip" data-prendo="${v.id}" style="margin:0">${desideri ? "Lo regalo io" : "Lo porto io"}</button>` : "") : ""}
        ${v.autore_id === state.io.id ? `<button class="chip" data-togli="${v.id}" style="margin:0" aria-label="Togli">✕</button>` : ""}</div>`).join("") || `<p class="tenue">Lista vuota.</p>`}
      ${l.autore_id === state.io.id ? `<button class="chip" id="elimina" style="margin-top:20px">Elimina la lista</button>` : ""}
    </div>`;
  document.getElementById("agg").onsubmit = async (e) => {
    e.preventDefault();
    await sb.from("liste_voci").insert({ lista_id: id, testo: document.getElementById("voce").value.trim(), autore_id: state.io.id }); lista(id);
  };
  document.querySelectorAll("[data-fatto]").forEach((c) => c.onchange = () => sb.from("liste_voci").update({ fatto: c.checked }).eq("id", c.dataset.fatto).then(() => lista(id)));
  document.querySelectorAll("[data-prendo]").forEach((b) => b.onclick = () => sb.from("liste_voci").update({ preso_da: state.io.id }).eq("id", b.dataset.prendo).then(() => lista(id)));
  document.querySelectorAll("[data-lascia]").forEach((b) => b.onclick = () => sb.from("liste_voci").update({ preso_da: null }).eq("id", b.dataset.lascia).then(() => lista(id)));
  document.querySelectorAll("[data-togli]").forEach((b) => b.onclick = () => sb.from("liste_voci").delete().eq("id", b.dataset.togli).then(() => lista(id)));
  document.getElementById("elimina")?.addEventListener("click", async () => { if (confirm("Eliminare la lista?")) { await sb.from("liste").delete().eq("id", id); location.hash = "#/liste"; } });
}
