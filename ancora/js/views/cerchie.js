// Famiglie e cerchie. Si può stare in più famiglie: la propria, quella del coniuge, più gli amici.
// Il piano (chi paga) non decide chi vede cosa: lo decidono le cerchie.
// Pausa e rimozione senza avvisi all'interessato. Inviti via WhatsApp.
import { sb, state, $app, esc, avatar, nomeDi, urlMediaMolti, testata, cambiaImmagine } from "../app.js";

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
  const url = await urlMediaMolti(state.cerchie.flatMap((c) => [c.foto_path, c.copertina_path]).filter(Boolean));
  const diChi = new Map((proprietari ?? []).map((p) => [p.id, nomeDi(p)]));
  const di = (id) => (membri ?? []).filter((m) => m.cerchia_id === id);

  const famiglie = state.cerchie.filter((c) => c.tipo === "famiglia");
  const gruppi = state.cerchie.filter((c) => c.tipo !== "famiglia");

  const scheda = (c) => {
    const mia = c.proprietario_id === state.io.id;
    const lista = di(c.id);
    return `<div class="card" style="padding:0;overflow:hidden">
      ${testata({ nome: c.nome, persona: { id: c.id, nome: c.nome }, foto: url[c.foto_path], copertina: url[c.copertina_path], modifica: mia, chiave: c.id, alta: 110, tondo: 64 })
        .replace("<div style=\"flex:1;padding-bottom:6px\" data-testata-dx></div>", `<div style="flex:1;padding-bottom:6px"><b style="font-size:17px">${esc(c.nome)}</b><div class="tenue">${lista.length + 1} persone</div></div>`)}
      <div style="padding:0 16px 16px">
      ${mia ? "" : `<div class="tenue">di ${esc(diChi.get(c.proprietario_id) ?? "")}</div>`}
      ${mia ? lista.map((m) => `
        <div class="riga" style="margin-top:10px">
          ${avatar(m.persone, 32)}
          <span style="flex:1">${esc(nomeDi(m.persone))} ${m.stato === "pausa" ? `<span class="tenue">· in pausa</span>` : ""}</span>
          <button class="chip" data-az="${m.stato === "pausa" ? "riattiva" : "pausa"}" data-c="${c.id}" data-p="${m.persone.id}">${m.stato === "pausa" ? "Riattiva" : "Pausa"}</button>
          <button class="chip" data-az="rimuovi" data-c="${c.id}" data-p="${m.persone.id}">Rimuovi</button>
        </div>`).join("")
        : `<div style="display:flex;gap:4px;margin-top:10px;flex-wrap:wrap">${lista.slice(0, 8).map((m) => avatar(m.persone, 28)).join("")}</div>`}
      ${mia ? `<details style="margin-top:12px"><summary class="tenue" style="cursor:pointer;font-weight:700">Agenda di questa cerchia</summary>
        ${[["vacanze", "Vacanze insieme"], ["compiti", "Compiti dei ragazzi"], ["esami", "Esami"]].map(([k, t]) =>
          `<label class="riga" style="margin:10px 0;font-weight:700;color:var(--testo)"><input type="checkbox" data-modulo="${k}" data-c="${c.id}" ${c.moduli?.[k] ? "checked" : ""} style="width:22px;height:22px"> ${t}</label>`).join("")}</details>` : ""}
      <div class="riga" style="margin-top:14px;gap:8px">
        <a class="btn" style="flex:1;min-height:46px" href="#/?c=${c.id}">Apri</a>
        <button class="btn chiaro invita" data-c="${c.id}" style="flex:1;min-height:46px">Invita</button>
      </div>
      <div style="display:flex;gap:18px;margin-top:12px;font-size:14px;font-weight:700">
        ${c.tipo === "famiglia" ? `<a href="#/albero?c=${c.id}">L'albero</a>` : ""}
        ${mia ? `<a href="#" data-rinomina="${c.id}">Rinomina</a>` : `<a href="#" data-esci="${c.id}" style="color:#8A3B2E">Esci dalla cerchia</a>`}
      </div></div></div>`;
  };

  $app().innerHTML = `
    <header class="testa"><span class="logo" style="font-size:22px">Famiglie e cerchie</span><span></span></header>
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

  // --- foto e copertina della cerchia (solo chi l'ha creata) ---
  document.querySelectorAll("input[data-img]").forEach((i) => i.onchange = async () => {
    const f = i.files?.[0]; if (!f) return;
    const c = state.cerchie.find((x) => x.id === i.dataset.k);
    i.closest("label").style.opacity = .5;
    if (await cambiaImmagine({ file: f, tabella: "cerchie", id: c.id, campo: i.dataset.img, cartella: `cerchia/${c.id}`, vecchia: c[i.dataset.img + "_path"] })) location.reload();
  });

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

  document.querySelectorAll("[data-esci]").forEach((b) => b.onclick = async (e) => { e.preventDefault();
    if (!confirm("Uscire da questa cerchia? Non vedrai più i suoi ricordi.")) return;
    await sb.from("cerchia_membri").delete().eq("cerchia_id", b.dataset.esci).eq("persona_id", state.io.id);
    location.reload();
  });

  document.querySelectorAll("[data-rinomina]").forEach((b) => b.onclick = async (e) => { e.preventDefault();
    const c = state.cerchie.find((x) => x.id === b.dataset.rinomina);
    const nome = prompt("Nuovo nome", c?.nome ?? "");
    if (!nome?.trim()) return;
    await sb.from("cerchie").update({ nome: nome.trim() }).eq("id", b.dataset.rinomina);
    location.reload();
  });

  // accendi/spegni vacanze, compiti, esami per questa cerchia (solo chi l'ha creata)
  document.querySelectorAll("[data-modulo]").forEach((b) => b.onchange = async () => {
    const c = state.cerchie.find((x) => x.id === b.dataset.c);
    c.moduli = { ...(c.moduli ?? {}), [b.dataset.modulo]: b.checked };
    await sb.from("cerchie").update({ moduli: c.moduli }).eq("id", c.id);
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
  const link = `${location.origin}${location.pathname}#/iscriviti?invito=${inv.codice}`;
  const testo = encodeURIComponent(`Ti invito in "${c?.nome ?? "Ancora"}", il nostro spazio privato per i ricordi: ${link}`);
  window.open(`https://wa.me/?text=${testo}`, "_blank");
}
