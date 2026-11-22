// Regala Ancora: si sceglie prima CHI lo riceve, poi i dati. Stesso prodotto, più acquirenti.
import { $app, esc, utm } from "../app.js";
import { SUPABASE_URL } from "../config.js";

// tipo → chi racconta, chi riceve, testi del modulo
const TIPI = [
  { id: "genitori", chi_tutti: "", t: "Ai miei genitori", s: "raccontano loro, la famiglia ascolta", chi: "A chi lo regali", ph: "Papà Franco", tel: "Il suo WhatsApp" },
  { id: "famiglia", chi_tutti: "Chi invitare: figli, nipoti, fratelli, cugini", t: "Alla mia famiglia", s: "lo attivo io e invito figli e nipoti", chi: "Il primo da invitare", ph: "Marco", tel: "Il suo WhatsApp" },
  { id: "figli", chi_tutti: "I tuoi figli", t: "Ai miei figli", s: "per far conoscere chi siamo", chi: "Il figlio da invitare per primo", ph: "Sofia", tel: "Il suo WhatsApp" },
  { id: "fratelli", chi_tutti: "I tuoi fratelli e sorelle", t: "Ai miei fratelli", s: "i ricordi di casa, insieme", chi: "Tuo fratello o tua sorella", ph: "Luca", tel: "Il suo WhatsApp" },
  { id: "amici", chi_tutti: "I tuoi amici", t: "Ai miei amici", s: "una cerchia solo per noi", chi: "Il primo amico da invitare", ph: "Paolo", tel: "Il suo WhatsApp" },
  { id: "me_stesso", chi_tutti: "", t: "A me stesso", s: "comincio a raccontare io", chi: null, ph: null, tel: null },
];

export default async function ({ params }) {
  if (params.ok) {
    $app().innerHTML = `<header class="testa"><span class="logo">Ancora</span><span></span></header>
      <div class="pad"><h1>Grazie!</h1><p style="font-size:17px">Il regalo è confermato. Il giorno scelto arriverà il primo messaggio.</p>
      ${params.ok.length > 10 ? `<a class="btn ambra" href="#/biglietto/${esc(params.ok)}">Stampa il biglietto da mettere sotto l'albero</a>` : ""}
      <a class="btn chiaro" style="margin-top:10px" href="#/accesso">Entra in Ancora</a></div>`;
    return;
  }
  $app().innerHTML = `
    <header class="testa"><span><span class="logo" style="font-size:22px">Regala Ancora</span><div class="tenue" style="font-size:12px;font-weight:700">Il cloud dei tuoi ricordi</div></span><span></span></header>
    <div id="modulo-regalo"></div>`;
  montaModulo(document.getElementById("modulo-regalo"), params);
}

// Il modulo d'acquisto: usato qui e nella pagina di vendita (#/scopri)
export function montaModulo(el, params = {}) {
  let tipo = TIPI[0];
  const natale = `${new Date().getFullYear()}-12-25`;
  el.innerHTML = `
    <form id="f" class="pad">
      <span class="chip on" style="background:#B3402F;margin:0 0 10px">Promo Natale</span>
      <h1>Un anno di ricordi, per chi vuoi tu</h1>
      <p class="tenue" style="font-size:15px">Una domanda a settimana, racconti a voce, foto, ricette, l'albero e il libro digitale. Per tutta la famiglia.</p>
      <label>Chi lo riceve?</label>
      <div class="scelta" id="tipi">${TIPI.map((x, i) => `<button type="button" class="${i === 0 ? "on" : ""}" data-t="${x.id}">${x.t}<small>${x.s}</small></button>`).join("")}</div>
      <div id="narr">
        <label>Chi racconta <span class="tenue" style="font-weight:600">· i festeggiati</span></label>
        <div id="lista-narr"></div>
        <button type="button" class="chip" id="piu-narr">+ Aggiungi chi racconta (es. la mamma)</button>
      </div>
      <div id="inv">
        <label id="l-inv">Chi invitare</label>
        <p class="tenue" style="margin:0 0 6px" id="t-inv">Scrivi tutti: ognuno riceve il suo invito sul telefono il giorno del regalo.</p>
        <div id="lista-inv"></div>
        <button type="button" class="chip" id="piu-inv">+ Aggiungi un'altra persona</button>
      </div>
      <label for="mg">Un messaggio sul biglietto (se vuoi)</label><textarea id="mg" rows="2" maxlength="240" placeholder="Papà, raccontaci tutto. Ti vogliamo bene."></textarea>
      <label for="dd">Quando parte il primo messaggio</label><input id="dd" type="date" value="${natale}" required>
      <label for="an">Il tuo nome</label><input id="an" required>
      <label for="ae">La tua email</label><input id="ae" type="email" required>
      <label for="at">Il tuo cellulare</label><input id="at" type="tel" inputmode="tel" placeholder="+39 …" required>
      <div style="display:flex;align-items:baseline;justify-content:space-between;margin:18px 0 8px">
        <span class="tenue">12 mesi + il libro stampato<br>valore 168 €</span><span style="font-family:Fraunces,serif;font-size:34px;font-weight:700">129 €</span></div>
      <div class="card" style="margin:0 0 14px;background:var(--ambra-chiaro);border-color:#EAD2AA">
        <b style="font-family:Fraunces,serif;font-size:19px;color:#4A3410">Cosa c'è nel regalo di Natale</b>
        <ul style="margin:10px 0 0;padding-left:20px;line-height:1.55;color:#4A3410">
          <li><b>12 mesi di Piano Famiglia</b> per tutta la famiglia, senza limiti di persone</li>
          <li><b>Il libro stampato a colori</b> delle vostre storie, a casa a fine anno, con il QR per ascoltare le voci</li>
          <li><b>L'album del pranzo di Natale</b>: i parenti caricano le foto con un QR</li>
          <li><b>Una domanda a settimana per tutti</b>, ognuno la sua, più la domanda di famiglia: si risponde a voce</li>
          <li><b>200 GB per tutta la famiglia</b>: foto, video, vocali, storie e ricette</li>
          <li><b>La domanda della settimana</b> per tutti, l'<b>albero genealogico</b>, il <b>ricettario</b>, l'<b>agenda</b> e il <b>diario</b></li>
          <li><b>Il biglietto da stampare</b> con il tuo messaggio, da mettere sotto l'albero</li>
          <li>Parte il giorno che scegli, per esempio il <b>25 dicembre</b></li>
        </ul>
        <p style="margin:10px 0 0;font-size:13px;color:#5A3E12">Dopo 12 mesi si continua solo se volete, a 99 € l'anno. I ricordi restano gratis per sempre. Copie in più del libro: 35 € l'una.</p>
      </div>
      <label style="display:flex;gap:10px;align-items:flex-start;font-weight:600;margin:0 0 12px"><input type="checkbox" id="termini" required style="width:22px;height:22px;flex-shrink:0">
        <span>Ho letto e accetto le <a href="#/condizioni" target="_blank">condizioni di vendita</a> e l'<a href="#/privacy" target="_blank">informativa privacy</a>.</span></label>
      <button class="btn ambra">Regala</button>
      <p class="tenue" style="text-align:center" id="nota">Se non accetta, ti rimborsiamo.</p>
      <p id="esito" role="status"></p>
    </form>`;

  // righe nome + WhatsApp, quante ne servono
  const riga = (lista, ph, valore = "") => {
    const d = document.createElement("div");
    d.className = "riga persona"; d.style.cssText = "gap:6px;margin-bottom:6px";
    d.innerHTML = `<input placeholder="${ph}" aria-label="Nome" style="flex:1" data-nome value="${esc(valore)}">
      <input type="tel" inputmode="tel" placeholder="Cellulare" aria-label="Cellulare" style="flex:1.2" data-tel>
      <button type="button" class="chip" style="margin:0" aria-label="Togli">✕</button>`;
    d.querySelector("button").onclick = () => d.remove();
    document.getElementById(lista).appendChild(d);
    return d;
  };
  document.getElementById("piu-narr").onclick = () => { if (document.querySelectorAll("#lista-narr .persona").length < 4) riga("lista-narr", "Mamma Lucia").querySelector("input").focus(); };
  document.getElementById("piu-inv").onclick = () => riga("lista-inv", "Nome").querySelector("input").focus();
  riga("lista-narr", "Papà Franco", params.per ?? "");   // arrivo dalla prova gratis: il nome è già scritto

  const aggiorna = () => {
    document.getElementById("narr").hidden = tipo.id !== "genitori";
    document.getElementById("inv").hidden = tipo.id === "me_stesso";
    document.getElementById("l-inv").textContent = tipo.id === "genitori" ? "Chi altro invitare (figli, nipoti, fratelli)" : tipo.chi_tutti;
    if (tipo.id !== "genitori" && tipo.id !== "me_stesso" && !document.querySelector("#lista-inv .persona")) riga("lista-inv", tipo.ph);
    document.getElementById("nota").textContent = tipo.id === "genitori" ? "Se non accetta, ti rimborsiamo." : "Potrai invitare altri anche dopo, dall'app.";
  };
  document.querySelectorAll("#tipi button").forEach((b) => b.onclick = () => {
    tipo = TIPI.find((x) => x.id === b.dataset.t);
    document.querySelectorAll("#tipi button").forEach((x) => x.classList.toggle("on", x === b));
    aggiorna();
  });
  aggiorna();

  const norm = (t) => { t = t.replace(/[\s.-]/g, ""); return t && !t.startsWith("+") ? "+39" + t : t; };
  document.getElementById("f").onsubmit = async (e) => {
    e.preventDefault();
    const v = (id) => document.getElementById(id).value.trim();
    const persone = (sel, narratore) => [...document.querySelectorAll(`${sel} .persona`)]
      .map((d) => ({ nome: d.querySelector("[data-nome]").value.trim(), telefono: norm(d.querySelector("[data-tel]").value.trim()), narratore }))
      .filter((p) => p.nome || p.telefono);
    const invitati = [...(tipo.id === "genitori" ? persone("#lista-narr", true) : []), ...(tipo.id === "me_stesso" ? [] : persone("#lista-inv", false))];
    const esito = document.getElementById("esito");
    const incompleto = invitati.find((p) => !p.nome || !/^\+\d{8,15}$/.test(p.telefono));
    if (incompleto) { esito.innerHTML = `<span class="errore">Controlla nome e numero di ${esc(incompleto.nome || "tutti")}.</span>`; return; }
    if (tipo.id === "genitori" && !invitati.some((p) => p.narratore)) { esito.innerHTML = `<span class="errore">Scrivi chi racconta.</span>`; return; }
    if (tipo.id !== "genitori" && tipo.id !== "me_stesso" && !invitati.length) { esito.innerHTML = `<span class="errore">Scrivi almeno una persona da invitare.</span>`; return; }
    const primo = invitati.find((p) => p.narratore) ?? invitati[0];
    const res = await fetch(`${SUPABASE_URL}/functions/v1/crea-checkout`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "regalo", destinatario_tipo: tipo.id, invitati, utm: utm(), termini: document.getElementById("termini").checked,
        destinatario_nome: primo?.nome ?? v("an"), destinatario_telefono: primo?.telefono ?? norm(v("at")),
        data_invio: v("dd"), messaggio: v("mg") || null, acquirente_nome: v("an"), acquirente_email: v("ae"), acquirente_telefono: norm(v("at")),
      }),
    });
    const j = await res.json();
    if (j.url) location.href = j.url;
    else document.getElementById("esito").innerHTML = `<span class="errore">${esc(j.errore ?? "Pagamento non avviato")}</span>`;
  };
}
