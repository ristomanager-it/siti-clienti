// Famiglie e cerchie. Si può stare in più famiglie: la propria, quella del coniuge, più gli amici.
// Il piano (chi paga) non decide chi vede cosa: lo decidono le cerchie.
// Pausa e rimozione senza avvisi all'interessato. Inviti via WhatsApp.
import { sb, state, $app, esc, avatar, nomeDi } from "../app.js";

const TIPI = [
  { id: "famiglia", t: "Famiglia", ph: "Famiglia Rossi" },
  { id: "amici", t: "Amici", ph: "Amici di sempre" },
  { id: "gruppo", t: "Gruppo", ph: "Calcetto del giovedì" },
  { id: "coppia", t: "Coppia", ph: "Noi due" },
];

export default async function () {
  const mie = state.cerchie.filter((c) => c.proprietario_id === state.io.id);
  const altre = state.cerchie.filter((c) => c.proprietario_id !== state.io.id);
  const { data: membri } = await sb.from("cerchia_membri")
    .select("cerchia_id, stato, persone(id, nome, soprannome, foto_path)").in("cerchia_id", state.cerchie.map((c) => c.id));
  const { data: proprietari } = altre.length
    ? await sb.from("persone").select("id, nome, soprannome").in("id", [...new Set(altre.map((c) => c.proprietario_id))])
    : { data: [] };
  const diChi = new Map((proprietari ?? []).map((p) => [p.id, nomeDi(p)]));
  const di = (id) => (membri ?? []).filter((m) => m.cerchia_id === id);

  const famiglie = state.cerchie.filter((c) => c.tipo === "famiglia");
  const gruppi = state.cerchie.filter((c) => c.tipo !== "famiglia");

  const scheda = (c) => {
    const mia = c.proprietario_id === state.io.id;
    const lista = di(c.id);
    return `<div class="card">
      <div class="riga"><b style="flex:1;font-size:17px">${esc(c.nome)}</b>
        <span class="tenue">${lista.length + 1} persone</span></div>
      ${mia ? "" : `<div class="tenue">di ${esc(diChi.get(c.proprietario_id) ?? "")}</div>`}
      ${mia ? lista.map((m) => `
        <div class="riga" style="margin-top:10px">
          ${avatar(m.persone, 32)}
          <span style="flex:1">${esc(nomeDi(m.persone))} ${m.stato === "pausa" ? `<span class="tenue">· in pausa</span>` : ""}</span>
          <button class="chip" data-az="${m.stato === "pausa" ? "riattiva" : "pausa"}" data-c="${c.id}" data-p="${m.persone.id}">${m.stato === "pausa" ? "Riattiva" : "Pausa"}</button>
          <button class="chip" data-az="rimuovi" data-c="${c.id}" data-p="${m.persone.id}">Rimuovi</button>
        </div>`).join("")
        : `<div style="display:flex;gap:4px;margin-top:10px;flex-wrap:wrap">${lista.slice(0, 8).map((m) => avatar(m.persone, 28)).join("")}</div>`}
      <div class="riga" style="margin-top:12px;gap:8px">
        <a class="btn chiaro" style="flex:1;min-height:44px" href="#/?c=${c.id}">Apri</a>
        ${c.tipo === "famiglia" ? `<a class="btn chiaro" style="flex:1;min-height:44px" href="#/albero?c=${c.id}">Albero</a>` : ""}
        ${mia ? `<button class="btn chiaro invita" data-c="${c.id}" style="flex:1;min-height:44px">Invita</button>
                 <button class="chip" data-rinomina="${c.id}">Rinomina</button>`
              : `<button class="chip" data-esci="${c.id}">Esci</button>`}
      </div></div>`;
  };

  $app().innerHTML = `
    <header class="testa"><span class="logo" style="font-size:22px">Famiglie e cerchie</span><span></span></header>
    <p class="pad tenue" style="margin:0">Puoi stare in più famiglie: la tua, quella di tua moglie o di tuo marito, e con gli amici. Ognuna vede solo quello che condividi con lei.</p>
    <h2>Le famiglie</h2>
    ${famiglie.map(scheda).join("") || `<p class="pad tenue">Ancora nessuna famiglia. Creane una qui sotto.</p>`}
    ${gruppi.length ? `<h2>Amici e gruppi</h2>` + gruppi.map(scheda).join("") : ""}
    <form id="nuova" class="card">
      <label style="margin-top:0">Crea una nuova cerchia</label>
      <div class="scelta" id="tipo">${TIPI.map((x, i) => `<button type="button" class="${i === 0 ? "on" : ""}" data-t="${x.id}">${x.t}</button>`).join("")}</div>
      <label for="nome">Nome</label>
      <input id="nome" placeholder="${TIPI[0].ph}" required>
      <button class="btn" style="margin-top:10px">Crea e invita</button>
    </form>`;

  // --- gestione membri (solo nelle cerchie mie) ---
  document.querySelectorAll("[data-az]").forEach((b) => b.onclick = async () => {
    const { az, c, p } = b.dataset;
    const q = sb.from("cerchia_membri");
    if (az === "rimuovi") {
      if (!confirm("Rimuovere questa persona? Non vedrà più nulla di questa cerchia e non riceverà avvisi.")) return;
      await q.delete().eq("cerchia_id", c).eq("persona_id", p);
    } else {
      await q.update(az === "pausa" ? { stato: "pausa", pausa_dal: new Date().toISOString() } : { stato: "attivo", pausa_dal: null })
        .eq("cerchia_id", c).eq("persona_id", p);
    }
    location.reload();
  });

  document.querySelectorAll("[data-esci]").forEach((b) => b.onclick = async () => {
    if (!confirm("Uscire da questa cerchia? Non vedrai più i suoi ricordi.")) return;
    await sb.from("cerchia_membri").delete().eq("cerchia_id", b.dataset.esci).eq("persona_id", state.io.id);
    location.reload();
  });

  document.querySelectorAll("[data-rinomina]").forEach((b) => b.onclick = async () => {
    const c = state.cerchie.find((x) => x.id === b.dataset.rinomina);
    const nome = prompt("Nuovo nome", c?.nome ?? "");
    if (!nome?.trim()) return;
    await sb.from("cerchie").update({ nome: nome.trim() }).eq("id", b.dataset.rinomina);
    location.reload();
  });

  document.querySelectorAll(".invita").forEach((b) => b.onclick = () => invita(b.dataset.c));

  // --- nuova cerchia: tipo + nome, poi subito l'invito ---
  let tipo = TIPI[0];
  document.querySelectorAll("#tipo button").forEach((b) => b.onclick = () => {
    tipo = TIPI.find((x) => x.id === b.dataset.t);
    document.querySelectorAll("#tipo button").forEach((x) => x.classList.toggle("on", x === b));
    document.getElementById("nome").placeholder = tipo.ph;
  });
  document.getElementById("nuova").onsubmit = async (e) => {
    e.preventDefault();
    const { data: c, error } = await sb.from("cerchie")
      .insert({ proprietario_id: state.io.id, nome: document.getElementById("nome").value.trim(), tipo: tipo.id })
      .select("id").single();
    if (error) { alert("Non sono riuscito a crearla: " + error.message); return; }
    await invita(c.id);
    location.reload();
  };
}

async function invita(cerchiaId) {
  const c = state.cerchie.find((x) => x.id === cerchiaId);
  const { data: inv, error } = await sb.from("inviti").insert({ invitato_da: state.io.id, cerchia_id: cerchiaId }).select("codice").single();
  if (error) { alert("Invito non creato: " + error.message); return; }
  const link = `${location.origin}${location.pathname}#/accesso?invito=${inv.codice}`;
  const testo = encodeURIComponent(`Ti invito in "${c?.nome ?? "Ancora"}", il nostro spazio privato per i ricordi: ${link}`);
  window.open(`https://wa.me/?text=${testo}`, "_blank");
}
