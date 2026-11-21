// Servizi in più, da comprare quando servono: il libro stampato, un narratore in più, spazio extra nel cloud.
import { sb, state, $app, esc, nomeDi, ICONE } from "../app.js";
import { SUPABASE_URL } from "../config.js";

const SERVIZI = [
  { id: "libro_bn", t: "Il libro stampato", s: "bianco e nero, con il QR per ascoltare la voce. Spedizione inclusa.", p: "49 €", libro: true },
  { id: "libro_colori", t: "Il libro a colori", s: "con le foto a colori e il QR per la voce. Spedizione inclusa.", p: "69 €", libro: true },
  { id: "narratore", t: "Un narratore in più", s: "un'altra persona che riceve le domande (oltre le 4 incluse).", p: "1,99 € al mese", piano: true },
  { id: "spazio", t: "100 GB in più", s: "per foto e video di famiglia senza pensieri.", p: "2,99 € al mese", piano: true },
];
const FATTO = {
  libro_bn: "Ordine ricevuto! Impaginiamo il libro e lo spediamo all'indirizzo che hai indicato. Ti scriviamo quando parte.",
  libro_colori: "Ordine ricevuto! Impaginiamo il libro a colori e lo spediamo all'indirizzo che hai indicato.",
  narratore: "Fatto: ora nel piano puoi scegliere un narratore in più.",
  spazio: "Fatto: hai 100 GB in più nel cloud dei ricordi.",
};

export default async function ({ params }) {
  const { data: piano } = await sb.rpc("piano_mio");
  const narratori = (piano?.membri ?? []).filter((m) => m.narratore);
  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/profilo" aria-label="Indietro">${ICONE.indietro}</a>
      <span class="logo" style="font-size:22px">Servizi</span><span style="width:44px"></span></header>
    ${params.ok && FATTO[params.ok] ? `<div class="card" style="background:#E2F0E7;border-color:#BFDCC9">${FATTO[params.ok]}</div>` : ""}
    <p class="pad tenue" style="margin-top:0">L'app e i ricordi restano gratis per sempre. Questi servizi li prendi solo se ti servono.</p>
    ${SERVIZI.map((x) => `<div class="card">
      <div class="riga"><b style="flex:1;font-size:17px">${x.t}</b><b style="font-family:Fraunces,serif;font-size:20px">${x.p}</b></div>
      <p class="tenue" style="margin:4px 0 10px">${x.s}</p>
      ${x.libro ? (narratori.length || piano ? `<label for="n-${x.id}" style="margin-top:0">Le storie di</label>
          <select id="n-${x.id}">${(narratori.length ? narratori : [{ id: state.io.id, nome: nomeDi(state.io) }]).map((n) => `<option value="${n.id}">${esc(n.nome)}</option>`).join("")}</select>
          <a class="tenue" style="display:block;margin:6px 0 0" href="#/libro/${(narratori[0] ?? { id: state.io.id }).id}">Sfoglia l'anteprima gratis →</a>` : "") : ""}
      ${x.piano && !piano ? `<p class="tenue" style="margin:0">Serve il Piano Famiglia: <a href="#/piano">crealo qui</a>.</p>`
        : `<button class="btn ${x.libro ? "ambra" : ""}" style="margin-top:10px" data-s="${x.id}">${x.libro ? "Ordina" : "Aggiungi"}</button>`}
    </div>`).join("")}
    <p id="es" class="pad" role="status"></p>`;

  document.querySelectorAll("[data-s]").forEach((b) => b.onclick = async () => {
    const es = document.getElementById("es");
    es.textContent = "Apro il pagamento…";
    const s = b.dataset.s;
    const res = await fetch(`${SUPABASE_URL}/functions/v1/crea-checkout`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "servizio", servizio: s, famiglia_id: piano?.famiglia_id ?? null, persona_id: state.io.id,
        narratore_id: document.getElementById(`n-${s}`)?.value ?? null }),
    });
    const j = await res.json().catch(() => ({}));
    if (j.url) location.href = j.url;
    else es.innerHTML = `<span class="errore">${esc(j.errore ?? "Pagamento non disponibile")}</span>`;
  });
}
