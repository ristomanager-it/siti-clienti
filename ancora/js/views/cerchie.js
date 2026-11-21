// Cerchie: chi vede cosa. Pausa e rimozione senza avvisi all'interessato. Inviti via WhatsApp.
import { sb, state, $app, esc, iniziali } from "../app.js";

export default async function () {
  const mie = state.cerchie.filter((c) => c.proprietario_id === state.io.id);
  const altre = state.cerchie.filter((c) => c.proprietario_id !== state.io.id);
  const { data: membri } = await sb.from("cerchia_membri")
    .select("cerchia_id, stato, persone(id, nome)").in("cerchia_id", mie.map((c) => c.id));

  $app().innerHTML = `
    <header class="testa"><span class="logo" style="font-size:22px">Le mie cerchie</span><span></span></header>
    <p class="pad tenue" style="margin:0">Ogni cerchia vede solo quello che condividi con lei.</p>
    ${mie.map((c) => `
      <div class="card">
        <b>${esc(c.nome)}</b>
        ${(membri ?? []).filter((m) => m.cerchia_id === c.id).map((m) => `
          <div class="riga" style="margin-top:10px">
            <div class="avatar">${iniziali(m.persone.nome)}</div>
            <span style="flex:1">${esc(m.persone.nome)} ${m.stato === "pausa" ? `<span class="tenue">· in pausa</span>` : ""}</span>
            <button class="chip" data-az="${m.stato === "pausa" ? "riattiva" : "pausa"}" data-c="${c.id}" data-p="${m.persone.id}">${m.stato === "pausa" ? "Riattiva" : "Pausa"}</button>
            <button class="chip" data-az="rimuovi" data-c="${c.id}" data-p="${m.persone.id}">Rimuovi</button>
          </div>`).join("")}
        <button class="btn chiaro invita" data-c="${c.id}" style="margin-top:12px">Invita qualcuno qui</button>
      </div>`).join("")}
    ${altre.length ? `<h2>Cerchie di altri in cui sei</h2>` + altre.map((c) => `<div class="card">${esc(c.nome)}</div>`).join("") : ""}
    <form id="nuova" class="card">
      <label for="nome">Nuova cerchia</label>
      <input id="nome" placeholder="Amici di sempre" required>
      <button class="btn" style="margin-top:8px">Crea</button>
    </form>`;

  document.querySelectorAll("[data-az]").forEach((b) => b.onclick = async () => {
    const { az, c, p } = b.dataset;
    const q = sb.from("cerchia_membri");
    if (az === "rimuovi") {
      if (!confirm("Rimuovere questa persona dalla cerchia? Non vedrà più nulla di questa cerchia.")) return;
      await q.delete().eq("cerchia_id", c).eq("persona_id", p);
    } else {
      await q.update(az === "pausa" ? { stato: "pausa", pausa_dal: new Date().toISOString() } : { stato: "attivo", pausa_dal: null })
        .eq("cerchia_id", c).eq("persona_id", p);
    }
    location.reload();
  });

  document.querySelectorAll(".invita").forEach((b) => b.onclick = async () => {
    const { data: inv } = await sb.from("inviti").insert({ invitato_da: state.io.id, cerchia_id: b.dataset.c }).select("codice").single();
    const link = `${location.origin}${location.pathname}#/accesso?invito=${inv.codice}`;
    const testo = encodeURIComponent(`Ti invito su Ancora, il nostro spazio privato per i ricordi: ${link}`);
    window.open(`https://wa.me/?text=${testo}`, "_blank");
  });

  document.getElementById("nuova").onsubmit = async (e) => {
    e.preventDefault();
    await sb.from("cerchie").insert({ proprietario_id: state.io.id, nome: document.getElementById("nome").value, tipo: "gruppo" });
    location.reload();
  };
}
