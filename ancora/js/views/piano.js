// Il piano di famiglia: chi c'è, chi racconta, l'abbonamento. I ricordi restano gratis: il piano fa crescere la famiglia.
import { sb, state, $app, esc, ICONE } from "../app.js";
import { SUPABASE_URL } from "../config.js";

const RITMI = [["settimanale", "Una a settimana"], ["tre_settimana", "Tre a settimana"], ["giornaliero", "Una al giorno"]];
const data = (d) => (d ? new Date(d + "T12:00").toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : "");

export default async function ({ params }) {
  const { data: p } = await sb.rpc("piano_mio");
  const testa = `<header class="testa"><a class="icona" href="#/profilo" aria-label="Indietro">${ICONE.indietro}</a>
    <span class="logo" style="font-size:22px">Piano di famiglia</span><span style="width:44px"></span></header>`;

  if (!p) {
    $app().innerHTML = `${testa}
      <div class="pad"><div class="lettera" style="margin:0;font-size:19px">Il piano è la tua famiglia su Ancora: le domande ai nonni su WhatsApp, il libro, fino a 6 persone e 4 narratori.</div></div>
      <form id="crea" class="card"><label for="nf" style="margin-top:0">Come si chiama la tua famiglia?</label>
        <input id="nf" placeholder="Famiglia Rossi" required>
        <button class="btn ambra" style="margin-top:10px">Crea il piano</button>
        <p id="es" role="status"></p></form>
      <p class="pad tenue">Ti hanno regalato Ancora o ti hanno invitato? Allora sei già in un piano: apri il link dell'invito.</p>`;
    document.getElementById("crea").onsubmit = async (e) => {
      e.preventDefault();
      const { error } = await sb.rpc("crea_famiglia", { p_nome: document.getElementById("nf").value });
      if (error) { document.getElementById("es").innerHTML = `<span class="errore">${esc(error.message)}</span>`; return; }
      location.reload();
    };
    return;
  }

  const a = p.abbonamento;
  const paga = p.mio_ruolo === "pagante";
  const membri = p.membri ?? [];
  const narratori = membri.filter((m) => m.narratore).length;
  const limite = (a?.narratori_inclusi ?? 4) + (a?.narratori_extra ?? 0);
  const { data: pref } = await sb.from("preferenze_narratore").select("*").eq("persona_id", state.io.id).maybeSingle();

  const stato = p.attivo
    ? `<b style="color:#2F7A4F">Attivo</b>${a?.fine ? ` fino al ${data(a.fine)}` : ""} · ${a?.tipo === "regalo" ? "regalo" : a?.tipo === "annuale" ? "99 € all'anno" : "9,99 € al mese"}`
    : `<b style="color:var(--rosso)">Non attivo</b> · i ricordi restano tutti, si fermano solo le domande su WhatsApp`;

  $app().innerHTML = `${testa}
    <div class="pad"><h1 style="font-size:26px">${esc(p.nome)}</h1><p style="margin:6px 0 0">${stato}</p></div>
    ${params.abbonato ? `<div class="card" style="background:#E2F0E7;border-color:#BFDCC9">Grazie! L'abbonamento è attivo: tra pochi secondi lo vedi qui.</div>` : ""}
    ${!p.attivo || a?.tipo === "regalo" ? `<div class="card">
      <b>${p.attivo ? "Quando finisce il regalo, continua così" : "Riattiva le domande"}</b>
      <div class="scelta" style="margin-top:10px">
        <button type="button" data-periodo="mensile">9,99 € al mese<small>disdici quando vuoi</small></button>
        <button type="button" data-periodo="annuale">99 € all'anno<small>2 mesi gratis</small></button>
      </div><p id="esp" role="status"></p></div>` : ""}

    <h2>Nel piano · ${membri.length} su 6</h2>
    ${membri.map((m) => `<div class="card riga" style="margin-bottom:6px">
      <span style="flex:1"><b>${esc(m.nome)}</b>${m.ruolo === "pagante" ? ` <span class="tenue">· paga il piano</span>` : ""}</span>
      ${paga ? `<button class="chip ${m.narratore ? "on" : ""}" data-narr="${m.id}" data-v="${m.narratore ? 0 : 1}">${m.narratore ? "✓ Racconta" : "Racconta"}</button>`
        : m.narratore ? `<span class="chip on">Racconta</span>` : ""}
    </div>`).join("")}
    <p class="pad tenue" style="margin-top:0">"Racconta" = riceve le domande. ${narratori} su ${limite} narratori.${paga ? ` Ti serve un narratore in più? <a href="#/servizi">Servizi</a>.` : ""}</p>
    ${paga && membri.length < 6 ? `<div class="pad"><button class="btn chiaro" id="invita">Invita nel piano</button></div>` : ""}

    ${p.io_narratore ? `<h2>Le mie domande</h2><div class="card">
      <label style="margin-top:0">Quante domande vuoi ricevere</label>
      <div>${RITMI.map(([k, t]) => `<button class="chip ${(pref?.ritmo ?? "settimanale") === k ? "on" : ""}" data-ritmo="${k}">${t}</button>`).join("")}</div>
      <label for="ora">A che ora</label><input id="ora" type="time" value="${esc(String(pref?.ora ?? "10:00").slice(0, 5))}" style="width:auto">
      <label class="riga" style="font-weight:700;color:var(--testo)"><input id="att" type="checkbox" ${pref?.attivo === false ? "" : "checked"} style="width:22px;height:22px"> Ricevo le domande</label>
    </div>` : ""}`;

  // abbonamento: checkout Stripe
  document.querySelectorAll("[data-periodo]").forEach((b) => b.onclick = async () => {
    const esp = document.getElementById("esp");
    esp.textContent = "Apro il pagamento…";
    const res = await fetch(`${SUPABASE_URL}/functions/v1/crea-checkout`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "abbonamento", periodo: b.dataset.periodo, famiglia_id: p.famiglia_id }),
    });
    const j = await res.json().catch(() => ({}));
    if (j.url) location.href = j.url;
    else esp.innerHTML = `<span class="errore">${esc(j.errore ?? "Pagamento non disponibile")}</span>`;
  });

  document.querySelectorAll("[data-narr]").forEach((b) => b.onclick = async () => {
    const { data: msg } = await sb.rpc("imposta_narratore", { p_persona: b.dataset.narr, p_narratore: b.dataset.v === "1" });
    if (msg !== "ok") { alert(msg); return; }
    location.reload();
  });

  document.getElementById("invita")?.addEventListener("click", async () => {
    const { data: inv, error } = await sb.from("inviti")
      .insert({ invitato_da: state.io.id, famiglia_id: p.famiglia_id, cerchia_id: p.cerchia_id }).select("codice").single();
    if (error) { alert("Invito non creato: " + error.message); return; }
    const link = `${location.origin}${location.pathname}#/accesso?invito=${inv.codice}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(`Ti ho aggiunto al piano "${p.nome}" su Ancora, i ricordi della nostra famiglia: ${link}`)}`, "_blank");
  });

  const salvaPref = (extra) => sb.from("preferenze_narratore").upsert({ persona_id: state.io.id, ...extra });
  document.querySelectorAll("[data-ritmo]").forEach((b) => b.onclick = async () => {
    await salvaPref({ ritmo: b.dataset.ritmo });
    document.querySelectorAll("[data-ritmo]").forEach((x) => x.classList.toggle("on", x === b));
  });
  document.getElementById("ora")?.addEventListener("change", (e) => salvaPref({ ora: e.target.value }));
  document.getElementById("att")?.addEventListener("change", (e) => salvaPref({ attivo: e.target.checked }));
}
