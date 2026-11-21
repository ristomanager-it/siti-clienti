// Regala Ancora: si sceglie prima CHI lo riceve, poi i dati. Stesso prodotto, più acquirenti.
import { $app, esc } from "../app.js";
import { SUPABASE_URL } from "../config.js";

// tipo → chi racconta, chi riceve, testi del modulo
const TIPI = [
  { id: "genitori", t: "Ai miei genitori", s: "raccontano loro, la famiglia ascolta", chi: "A chi lo regali", ph: "Papà Franco", tel: "Il suo WhatsApp" },
  { id: "famiglia", t: "Alla mia famiglia", s: "lo attivo io e invito figli e nipoti", chi: "Il primo da invitare", ph: "Marco", tel: "Il suo WhatsApp" },
  { id: "figli", t: "Ai miei figli", s: "per far conoscere chi siamo", chi: "Il figlio da invitare per primo", ph: "Sofia", tel: "Il suo WhatsApp" },
  { id: "fratelli", t: "Ai miei fratelli", s: "i ricordi di casa, insieme", chi: "Tuo fratello o tua sorella", ph: "Luca", tel: "Il suo WhatsApp" },
  { id: "amici", t: "Ai miei amici", s: "una cerchia solo per noi", chi: "Il primo amico da invitare", ph: "Paolo", tel: "Il suo WhatsApp" },
  { id: "me_stesso", t: "A me stesso", s: "comincio a raccontare io", chi: null, ph: null, tel: null },
];

export default async function ({ params }) {
  if (params.ok) {
    $app().innerHTML = `<header class="testa"><span class="logo">Ancora</span><span></span></header>
      <div class="pad"><h1>Grazie!</h1><p style="font-size:17px">Il regalo è confermato. Il giorno scelto arriverà il primo messaggio su WhatsApp.
      Ti abbiamo mandato per email il biglietto da stampare.</p><a class="btn" href="#/accesso">Entra in Ancora</a></div>`;
    return;
  }
  let tipo = TIPI[0];
  const natale = `${new Date().getFullYear()}-12-25`;
  $app().innerHTML = `
    <header class="testa"><span class="logo" style="font-size:22px">Regala Ancora</span><span></span></header>
    <form id="f" class="pad">
      <h1>Un anno di ricordi, per chi vuoi tu</h1>
      <p class="tenue" style="font-size:15px">Domande ogni settimana su WhatsApp, racconti a voce, foto e il libro digitale. Per tutta la famiglia, fino a 6 persone.</p>
      <label>Chi lo riceve?</label>
      <div class="scelta" id="tipi">${TIPI.map((x, i) => `<button type="button" class="${i === 0 ? "on" : ""}" data-t="${x.id}">${x.t}<small>${x.s}</small></button>`).join("")}</div>
      <div id="dest">
        <label for="dn" id="ldn">${tipo.chi}</label><input id="dn" placeholder="${tipo.ph}">
        <label for="dt" id="ldt">${tipo.tel}</label><input id="dt" type="tel" inputmode="tel" placeholder="+39 333 123 4567">
      </div>
      <label for="dd">Quando parte il primo messaggio</label><input id="dd" type="date" value="${natale}" required>
      <label for="an">Il tuo nome</label><input id="an" required>
      <label for="ae">La tua email</label><input id="ae" type="email" required>
      <label for="at">Il tuo WhatsApp</label><input id="at" type="tel" inputmode="tel" placeholder="+39 …" required>
      <div style="display:flex;align-items:baseline;justify-content:space-between;margin:18px 0 8px">
        <span class="tenue">12 mesi, tutta la famiglia</span><span style="font-family:Fraunces,serif;font-size:34px;font-weight:700">129 €</span></div>
      <button class="btn ambra">Regala</button>
      <p class="tenue" style="text-align:center" id="nota">Se non accetta, ti rimborsiamo.</p>
      <p id="esito" role="status"></p>
    </form>`;

  const aggiorna = () => {
    const d = document.getElementById("dest");
    d.hidden = !tipo.chi;
    document.getElementById("dn").required = document.getElementById("dt").required = !!tipo.chi;
    if (tipo.chi) {
      document.getElementById("ldn").textContent = tipo.chi;
      document.getElementById("dn").placeholder = tipo.ph;
    }
    document.getElementById("nota").textContent = tipo.id === "genitori" ? "Se non accetta, ti rimborsiamo." : "Potrai invitare gli altri dall'app.";
  };
  document.querySelectorAll("#tipi button").forEach((b) => b.onclick = () => {
    tipo = TIPI.find((x) => x.id === b.dataset.t);
    document.querySelectorAll("#tipi button").forEach((x) => x.classList.toggle("on", x === b));
    aggiorna();
  });

  const norm = (t) => { t = t.replace(/[\s.-]/g, ""); return t && !t.startsWith("+") ? "+39" + t : t; };
  document.getElementById("f").onsubmit = async (e) => {
    e.preventDefault();
    const v = (id) => document.getElementById(id).value.trim();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/crea-checkout`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "regalo", destinatario_tipo: tipo.id,
        destinatario_nome: tipo.chi ? v("dn") : v("an"), destinatario_telefono: tipo.chi ? norm(v("dt")) : norm(v("at")),
        data_invio: v("dd"), acquirente_nome: v("an"), acquirente_email: v("ae"), acquirente_telefono: norm(v("at")),
      }),
    });
    const j = await res.json();
    if (j.url) location.href = j.url;
    else document.getElementById("esito").innerHTML = `<span class="errore">${esc(j.errore ?? "Pagamento non avviato")}</span>`;
  };
}
