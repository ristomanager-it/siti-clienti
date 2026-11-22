// Agenda di famiglia: vacanze, compiti dei figli, esami.
// Ogni parte si accende o si spegne: per famiglia (chi l'ha creata) e per persona (ognuno per sé, in "Le mie impostazioni").
import { sb, state, $app, esc, nomeDi, avatar, ICONE } from "../app.js";

const TIPI = {
  vacanza: { modulo: "vacanze", titolo: "Vacanze", uno: "vacanza", ph: "Estate in Puglia", vuoto: "Nessuna vacanza in programma. Proponine una: date, posto, chi viene, chi porta cosa." },
  compito: { modulo: "compiti", titolo: "Compiti", uno: "compito", ph: "Matematica, pag. 52 es. 1-10", vuoto: "Nessun compito. Qui genitori e nonni vedono cosa c'è da fare e per quando." },
  esame:   { modulo: "esami", titolo: "Esami", uno: "esame", ph: "Verifica di storia", vuoto: "Nessun esame in calendario. Chi vuole, li segna qui: la famiglia manda un in bocca al lupo." },
};
const quando = (d) => (d ? new Date(d + "T12:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" }) : "");
const giorniA = (d) => (d ? Math.round((new Date(d + "T12:00") - new Date(new Date().toDateString() + " 12:00")) / 864e5) : null);

export default async function ({ params }) {
  const spenti = new Set(state.io.moduli_spenti ?? []);
  // cerchie dove almeno un modulo è acceso
  const accesi = (c, t) => c.moduli?.[TIPI[t].modulo] && !spenti.has(TIPI[t].modulo);
  const tipiVisibili = Object.keys(TIPI).filter((t) => state.cerchie.some((c) => accesi(c, t)));

  if (!tipiVisibili.length) {
    $app().innerHTML = `<header class="testa"><span class="logo" style="font-size:22px">Agenda</span><span></span></header>
      <div class="pad"><p>L'agenda è spenta.</p><a class="btn chiaro" href="#/istruzioni?s=agenda">Come si accende</a></div>`;
    return;
  }
  const tipo = tipiVisibili.includes(params.t) ? params.t : tipiVisibili[0];
  const T = TIPI[tipo];
  const cerchie = state.cerchie.filter((c) => accesi(c, tipo));

  const { data: voci } = await sb.from("agenda")
    .select("*, persone:per_chi(id, nome, soprannome, foto_path), agenda_voci(*), agenda_partecipanti(persona_id, risposta)")
    .eq("tipo", tipo).in("cerchia_id", cerchie.map((c) => c.id))
    .order("dal", { ascending: true, nullsFirst: false });
  const oggi = new Date().toISOString().slice(0, 10);
  const prossime = (voci ?? []).filter((v) => !v.fatto && (!(v.al ?? v.dal) || (v.al ?? v.dal) >= oggi));
  const passate = (voci ?? []).filter((v) => !prossime.includes(v));

  // persone delle mie cerchie (per "di chi è" e "chi porta cosa")
  const { data: membri } = await sb.from("cerchia_membri").select("cerchia_id, persone(id, nome, soprannome)")
    .in("cerchia_id", cerchie.map((c) => c.id));
  const persone = new Map([[state.io.id, state.io], ...(membri ?? []).map((m) => [m.persone.id, m.persone])]);
  const nomeCerchia = (id) => state.cerchie.find((c) => c.id === id)?.nome ?? "";

  $app().innerHTML = `
    <header class="testa"><span class="logo" style="font-size:22px">${TIPI[tipo].titolo}</span><span style="flex:1"></span></header>
    ${prossime.map((v) => scheda(v)).join("") || `<p class="pad tenue">${T.vuoto}</p>`}
    <form id="nuovo" class="card">
      <label style="margin-top:0" for="ti">Nuovo ${T.uno}</label>
      <input id="ti" placeholder="${T.ph}" required>
      ${tipo !== "vacanza" ? `<label for="pc">Di chi è</label><select id="pc">${[...persone.values()].map((p) =>
        `<option value="${p.id}" ${p.id === state.io.id ? "selected" : ""}>${esc(nomeDi(p))}</option>`).join("")}</select>` : ""}
      <div class="riga">
        <div style="flex:1"><label for="dal">${tipo === "vacanza" ? "Dal" : tipo === "compito" ? "Per quando" : "Quando"}</label><input id="dal" type="date" ${tipo === "vacanza" ? "" : "required"}></div>
        ${tipo === "vacanza" ? `<div style="flex:1"><label for="al">Al</label><input id="al" type="date"></div>` : ""}
      </div>
      ${tipo === "vacanza" ? `<label for="lu">Dove</label><input id="lu" placeholder="Polignano a Mare">` : ""}
      ${cerchie.length > 1 ? `<label for="ce">Con quale famiglia</label><select id="ce">${cerchie.map((c) => `<option value="${c.id}">${esc(c.nome)}</option>`).join("")}</select>` : ""}
      ${tipo !== "vacanza" ? `<label class="riga" style="font-weight:700"><input id="pr" type="checkbox" style="width:auto"> Solo per me e per chi è</label>` : ""}
      <button class="btn" style="margin-top:12px">Aggiungi</button>
    </form>
    ${passate.length ? `<h2>${tipo === "esame" ? "Già fatti" : "Passati e completati"}</h2>` + passate.slice(0, 20).map((v) => scheda(v, true)).join("") : ""}`;

  function scheda(v, vecchia = false) {
    const g = giorniA(v.dal);
    const tra = g === null ? "" : g === 0 ? "oggi" : g === 1 ? "domani" : g > 1 ? `tra ${g} giorni` : "";
    const chi = v.persone ? `${avatar(v.persone, 26)} <span>${esc(nomeDi(v.persone))}</span>` : "";
    const privato = v.visibilita === "privato" ? `<span class="tenue">· privato</span>` : "";
    if (tipo === "vacanza") {
      const vengo = v.agenda_partecipanti?.find((p) => p.persona_id === state.io.id)?.risposta;
      const si = (v.agenda_partecipanti ?? []).filter((p) => p.risposta === "si").map((p) => nomeDi(persone.get(p.persona_id)) || "qualcuno");
      return `<div class="card" style="${vecchia ? "opacity:.65" : ""}">
        <div class="riga"><b style="flex:1;font-size:17px">${esc(v.titolo)}</b><span class="tenue">${esc(tra)}</span></div>
        <div class="tenue">${[v.dal && `${quando(v.dal)}${v.al ? ` → ${quando(v.al)}` : ""}`, v.luogo, cerchie.length > 1 && nomeCerchia(v.cerchia_id)].filter(Boolean).map(esc).join(" · ")}</div>
        <div style="margin-top:10px" class="tenue">${si.length ? `Vengono: ${si.map(esc).join(", ")}` : "Nessuno ha ancora risposto"}</div>
        ${vecchia ? "" : `<div class="riga" style="margin-top:8px;gap:6px">${["si", "forse", "no"].map((r) =>
          `<button class="chip ${vengo === r ? "on" : ""}" data-vengo="${v.id}" data-r="${r}">${{ si: "Vengo", forse: "Forse", no: "Non vengo" }[r]}</button>`).join("")}</div>`}
        <div style="margin-top:12px">${(v.agenda_voci ?? []).map((x) => `
          <label class="riga" style="margin:6px 0;font-weight:600;color:var(--testo)"><input type="checkbox" data-voce="${x.id}" ${x.fatto ? "checked" : ""} style="width:auto">
            <span style="flex:1;${x.fatto ? "text-decoration:line-through;color:var(--tenue)" : ""}">${esc(x.testo)}</span>
            <span class="tenue">${esc(x.assegnato_a ? nomeDi(persone.get(x.assegnato_a)) : "")}</span></label>`).join("")}
          ${vecchia ? "" : `<form class="riga" data-aggvoce="${v.id}" style="margin-top:8px"><input placeholder="Chi porta cosa: es. ombrellone" style="flex:1">
            <select style="width:auto;flex:0 0 auto"><option value="">nessuno</option>${[...persone.values()].map((p) => `<option value="${p.id}">${esc(nomeDi(p))}</option>`).join("")}</select>
            <button class="icona" aria-label="Aggiungi" style="background:var(--notte);color:#fff;flex-shrink:0">+</button></form>`}
        </div>
        ${v.creato_da === state.io.id ? `<button class="chip" data-via="${v.id}" style="margin-top:10px">Elimina</button>` : ""}
      </div>`;
    }
    const mio = v.creato_da === state.io.id || v.per_chi === state.io.id;
    return `<div class="card" style="${vecchia ? "opacity:.7" : ""}">
      <div class="riga">
        ${tipo === "compito" ? `<input type="checkbox" data-fatto="${v.id}" ${v.fatto ? "checked" : ""} ${mio ? "" : "disabled"} style="width:24px;height:24px;flex-shrink:0" aria-label="Fatto">` : ""}
        <b style="flex:1;font-size:16px;${v.fatto ? "text-decoration:line-through;color:var(--tenue)" : ""}">${esc(v.titolo)}</b>
        <span class="tenue" style="${g !== null && g <= 1 && !v.fatto ? "color:var(--rosso);font-weight:800" : ""}">${esc(tra || quando(v.dal))}</span></div>
      <div class="riga tenue" style="margin-top:6px;gap:6px">${chi} ${privato} ${cerchie.length > 1 ? `· ${esc(nomeCerchia(v.cerchia_id))}` : ""}</div>
      ${tipo === "esame" ? (v.esito ? `<p style="margin:10px 0 0">Com'è andata: <b>${esc(v.esito)}</b></p>`
        : vecchia && mio ? `<form class="riga" data-esito="${v.id}" style="margin-top:10px"><input placeholder="Com'è andata? (se ti va)" style="flex:1"><button class="chip">Salva</button></form>`
        : !mio ? `<a class="btn chiaro" style="margin-top:10px;min-height:44px" href="#/racconta">Manda un in bocca al lupo</a>` : "") : ""}
      ${mio ? `<button class="chip" data-via="${v.id}" style="margin-top:10px">Elimina</button>` : ""}
    </div>`;
  }

  // --- azioni ---
  document.getElementById("nuovo").onsubmit = async (e) => {
    e.preventDefault();
    const val = (id) => document.getElementById(id)?.value || null;
    const { error } = await sb.from("agenda").insert({
      tipo, titolo: val("ti").trim(), dal: val("dal"), al: val("al"), luogo: val("lu"),
      per_chi: tipo === "vacanza" ? null : val("pc"),
      cerchia_id: val("ce") ?? cerchie[0].id, creato_da: state.io.id,
      visibilita: document.getElementById("pr")?.checked ? "privato" : "cerchia",
    });
    if (error) { alert("Non salvato: " + error.message); return; }
    location.reload();
  };
  document.querySelectorAll("[data-fatto]").forEach((c) => c.onchange = async () => {
    await sb.from("agenda").update({ fatto: c.checked }).eq("id", c.dataset.fatto);
    location.reload();
  });
  document.querySelectorAll("[data-voce]").forEach((c) => c.onchange = () =>
    sb.from("agenda_voci").update({ fatto: c.checked }).eq("id", c.dataset.voce).then(() => location.reload()));
  document.querySelectorAll("[data-aggvoce]").forEach((f) => f.onsubmit = async (e) => {
    e.preventDefault();
    const testo = f.querySelector("input").value.trim();
    if (!testo) return;
    await sb.from("agenda_voci").insert({ agenda_id: f.dataset.aggvoce, testo, assegnato_a: f.querySelector("select").value || null });
    location.reload();
  });
  document.querySelectorAll("[data-vengo]").forEach((b) => b.onclick = async () => {
    await sb.from("agenda_partecipanti").upsert({ agenda_id: b.dataset.vengo, persona_id: state.io.id, risposta: b.dataset.r });
    location.reload();
  });
  document.querySelectorAll("[data-esito]").forEach((f) => f.onsubmit = async (e) => {
    e.preventDefault();
    await sb.from("agenda").update({ esito: f.querySelector("input").value.trim() || null }).eq("id", f.dataset.esito);
    location.reload();
  });
  document.querySelectorAll("[data-via]").forEach((b) => b.onclick = async () => {
    if (!confirm("Eliminare?")) return;
    await sb.from("agenda").delete().eq("id", b.dataset.via);
    location.reload();
  });
}
