// Regala Ancora: "La storia della tua famiglia". Chi compra riceve un biglietto con un codice; la famiglia la crea chi riceve.
import { $app, esc, utm, state, sb } from "../app.js";
import { traccia } from "../app.js";
import { lingua, traduciSempre } from "../lingua.js";
import { SUPABASE_URL } from "../config.js";

export default async function ({ params }) {
  if (params.ok && params.ok.length > 10) { location.replace(`#/biglietto?r=${params.ok}`); return; }
  $app().innerHTML = `
    <header class="testa"><span><span class="logo" style="font-size:22px">Regala Ancora</span><div class="tenue" style="font-size:12px;font-weight:700">La storia della tua famiglia</div></span><span></span></header>
    <div id="modulo-regalo"></div>`;
  montaModulo(document.getElementById("modulo-regalo"), params);
  traduciSempre($app());
}

export const PREZZO = 99, PREZZO_PIENO = 129;
export const NEL_REGALO = [
  ["Un anno di Ancora+ per tutta la famiglia", "le domande ogni settimana a tutti, l'albero senza limiti, le famiglie collegate, le storie e i consigli di ognuno sempre lì quando servono"],
  ["Il libro della vostra famiglia", "a colori, copertina rigida, spedito a casa a fine anno; con i QR per ascoltare le voci e il PDF da condividere"],
  ["Il film dell'anno", "le foto e i video di tutti, montati con la musica, da guardare insieme"],
  ["Il biglietto regalo", "da mandare il giorno che vuoi o stampare e mettere sotto l'albero"],
];

// Il modulo d'acquisto: usato qui e nella pagina di vendita (#/scopri). La famiglia la crea chi riceve il regalo.
export function montaModulo(el, params = {}) {
  const natale = `${new Date().getFullYear()}-12-25`;
  el.innerHTML = `
    <form id="f" class="pad">
      <span class="chip on" style="background:#B3402F;margin:0 0 10px">Prezzo di lancio fino a Natale</span>
      <h1 style="line-height:1.15">La storia della tua famiglia</h1>
      <p class="tenue" style="font-size:16px;margin-top:-4px">Un anno per raccontarla insieme. E alla fine la tenete in mano.</p>
      <div class="card" style="margin:6px 0 16px;background:var(--ambra-chiaro);border-color:#EAD2AA;color:#4A3410">
        ${NEL_REGALO.map(([t, d]) => `<div style="display:flex;gap:10px;margin:8px 0"><span aria-hidden="true">✓</span><span><b>${t}</b><br><span style="font-size:15px">${d}</span></span></div>`).join("")}
        <div style="display:flex;align-items:baseline;gap:10px;margin-top:12px"><s style="opacity:.6;font-size:20px">${PREZZO_PIENO} €</s>
          <b style="font-family:Fraunces,serif;font-size:38px">${PREZZO} €</b><span style="font-size:14px">una volta sola</span></div>
        <p style="margin:6px 0 0;font-size:13px">Dopo il primo anno si continua solo se volete, a 99 € l'anno. Tutto quello che avete caricato resta vostro. Copie del libro in più: 35 € l'una.</p>
      </div>
      <label>Quanti regali?</label>
      <div class="riga" style="gap:6px;flex-wrap:wrap" id="quanti">
        <button type="button" class="chip on" data-q="1">1 regalo · ${PREZZO} €</button>
        <button type="button" class="chip" data-q="3">3 regali · ${PREZZO * 2} € <b style="color:#B3402F">· 3x2</b></button></div>
      <p class="tenue" id="nota-3x2" hidden style="font-size:14px;margin:6px 0 0">Uno per la tua famiglia, uno per i fratelli, uno per gli amici: ne regali 3, ne paghi 2. Ogni regalo ha il suo biglietto e il suo codice.</p>
      <label for="dest">A chi lo regali?</label><input id="dest" required placeholder="Mamma e papà, Giulia, i nonni…" value="${esc(params.per ?? "")}" maxlength="80">
      <div id="altri-dest" hidden>
        <label for="dest2">Il secondo regalo</label><input id="dest2" placeholder="Mio fratello e famiglia (puoi decidere dopo)" maxlength="80">
        <label for="dest3">Il terzo regalo</label><input id="dest3" placeholder="I miei suoceri (puoi decidere dopo)" maxlength="80"></div>
      <label for="mg">Il tuo messaggio sul biglietto</label>
      <textarea id="mg" rows="3" maxlength="400" placeholder="Raccontiamo la nostra storia, insieme. Buon Natale!"></textarea>
      <label>Quando lo ricevono</label>
      <div class="riga" style="gap:6px;flex-wrap:wrap" id="quando">
        <button type="button" class="chip on" data-d="${natale}">Il 25 dicembre</button>
        <button type="button" class="chip" data-d="${new Date().toISOString().slice(0, 10)}">Subito</button>
        <button type="button" class="chip" data-d="">Scelgo il giorno</button></div>
      <input id="dd" type="date" value="${natale}" hidden>
      <label for="an">Il tuo nome</label><input id="an" required autocomplete="name">
      <label for="ae">La tua email</label><input id="ae" type="email" required autocomplete="email">
      <p class="tenue" style="font-size:14px;margin:4px 0 12px">Dopo il pagamento ricevi subito il biglietto con il codice: lo mandi su WhatsApp il giorno scelto o lo stampi. Chi lo riceve crea la sua famiglia e la costruisce come vuole.</p>
      <label style="display:flex;gap:10px;align-items:flex-start;font-weight:600;margin:0 0 12px"><input type="checkbox" id="termini" required style="width:22px;height:22px;flex-shrink:0">
        <span>Ho letto e accetto le <a href="#/condizioni" target="_blank">condizioni di vendita</a> e l'<a href="#/privacy" target="_blank">informativa privacy</a>.</span></label>
      <button class="btn ambra" id="paga">Regala · ${PREZZO} €</button>
      <p class="tenue" style="text-align:center;font-size:14px">Se il codice non viene usato entro 30 giorni dal giorno scelto, ti rimborsiamo.</p>
      <p id="esito" role="status"></p>
    </form>`;
  const dd = el.querySelector("#dd");
  let quanti = Number(params.q) === 3 ? 3 : 1;
  const segnaQuanti = () => {
    el.querySelectorAll("#quanti .chip").forEach((x) => x.classList.toggle("on", Number(x.dataset.q) === quanti));
    el.querySelector("#altri-dest").hidden = el.querySelector("#nota-3x2").hidden = quanti !== 3;
    el.querySelector("#paga").textContent = quanti === 3 ? `Regala 3 · ${PREZZO * 2} € invece di ${PREZZO * 3} €` : `Regala · ${PREZZO} €`;
    el.querySelector('label[for="dest"]').textContent = quanti === 3 ? "Il primo regalo" : "A chi lo regali?";
  };
  el.querySelectorAll("#quanti .chip").forEach((b) => b.onclick = () => { quanti = Number(b.dataset.q); segnaQuanti(); });
  segnaQuanti();
  // chi è già su Ancora non riscrive nome ed email
  if (state.io) {
    el.querySelector("#an").value = [state.io.nome, state.io.cognome].filter(Boolean).join(" ");
    sb.auth.getUser().then(({ data }) => { if (data?.user?.email && !el.querySelector("#ae").value) el.querySelector("#ae").value = data.user.email; });
  }
  el.querySelectorAll("#quando .chip").forEach((b) => b.onclick = () => {
    el.querySelectorAll("#quando .chip").forEach((x) => x.classList.toggle("on", x === b));
    dd.hidden = !!b.dataset.d; if (b.dataset.d) dd.value = b.dataset.d; else dd.focus();
  });
  el.querySelector("#f").addEventListener("focusin", () => traccia("modulo_regalo"), { once: true });
  el.querySelector("#f").onsubmit = async (e) => {
    e.preventDefault();
    traccia("checkout");
    const v = (id) => el.querySelector("#" + id).value.trim();
    const esito = el.querySelector("#esito"), btn = e.target.querySelector("button.btn");
    btn.disabled = true; esito.textContent = "Ti porto al pagamento…";
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/crea-checkout`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "regalo", utm: utm(), lingua: lingua(), termini: el.querySelector("#termini").checked,
          quantita: quanti, destinatari: quanti === 3 ? [v("dest2"), v("dest3")] : [],
          destinatario_nome: v("dest"), messaggio: v("mg") || null, data_invio: dd.value, acquirente_nome: v("an"), acquirente_email: v("ae") }),
      });
      const j = await res.json();
      if (j.url) { location.href = j.url; return; }
      esito.innerHTML = `<span class="errore">${esc(j.errore ?? "Pagamento non avviato")}</span>`;
    } catch { esito.innerHTML = `<span class="errore">Connessione assente. Riprova.</span>`; }
    btn.disabled = false;
  };
}
