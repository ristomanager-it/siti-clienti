// Pagine informative pubbliche: chi siamo, contatti, privacy, cookie, condizioni di vendita.
// + il menu "hamburger" condiviso con la pagina di vendita.
// I testi legali sono una BOZZA: vanno completati con i dati societari e rivisti da un professionista.
import { sb, $app, esc, utm, consensoCookie } from "../app.js";

// dati del titolare: da completare prima della vendita
export const AZIENDA = {
  nome: "[Ragione sociale da completare]",
  piva: "[P.IVA da completare]",
  sede: "[Sede legale da completare]",
  email: "[email di contatto da completare]",
  aggiornato: "21 novembre 2026",
};

const VOCI = [
  ["#/scopri?s=perche", "Perché"],
  ["#/scopri?s=come", "Come funziona"],
  ["#/scopri?s=cosa", "Cosa c'è dentro"],
  ["#/scopri?s=pacchetti", "Pacchetti e prezzi"],
  ["#/scopri?s=acquista", "Regala Ancora"],
  ["#/scopri?s=faq", "Domande frequenti"],
  ["#/chisiamo", "Chi siamo"],
  ["#/contatti", "Contatti"],
  ["#/accesso", "Entra"],
  ["#/omaggio", "Ho un codice omaggio"],
];

/** Testata con logo e menu: chiaro su sfondo foto (trasparente) o su panna. */
export function testataPubblica({ trasparente = false } = {}) {
  const colore = trasparente ? "#FBF3E2" : "#12302C";
  return `
    <header style="position:${trasparente ? "absolute" : "sticky"};top:0;left:0;right:0;z-index:5;display:flex;align-items:center;gap:10px;padding:12px 16px;
      background:${trasparente ? "transparent" : "rgba(251,243,226,.96)"};${trasparente ? "" : "border-bottom:1px solid #EAD9BF;backdrop-filter:blur(8px)"}">
      <a href="#/scopri" class="logo" style="font-size:26px;color:${colore};text-decoration:none">Ancora</a><span style="flex:1"></span>
      <a class="chip" href="#/accesso" style="margin:0;text-decoration:none;background:rgba(251,243,226,.92)">Entra</a>
      <button id="apri-menu" aria-label="Apri il menu" aria-expanded="false" style="width:44px;height:44px;border-radius:22px;border:0;display:grid;place-items:center;
        background:${trasparente ? "rgba(251,243,226,.92)" : "#12302C"};color:${trasparente ? "#12302C" : "#FBF3E2"};cursor:pointer">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
    </header>
    <nav id="menu" hidden style="position:fixed;inset:0;z-index:30;background:#12302C;color:#FBF3E2;padding:18px 24px;overflow:auto">
      <div style="display:flex;align-items:center"><span class="logo" style="font-size:26px;color:#FBF3E2;flex:1">Ancora</span>
        <button id="chiudi-menu" aria-label="Chiudi il menu" style="width:44px;height:44px;border-radius:22px;border:0;background:#FBF3E2;color:#12302C;font-size:22px;cursor:pointer">✕</button></div>
      <div style="margin-top:22px">${VOCI.map(([h, t]) =>
        `<a href="${h}" style="display:block;padding:13px 0;border-bottom:1px solid rgba(251,243,226,.15);color:#FBF3E2;text-decoration:none;font-family:Fraunces,serif;font-size:24px">${t}</a>`).join("")}</div>
      <p style="margin-top:22px;font-size:14px"><a href="#/privacy" style="color:#C9D8D4">Privacy</a> · <a href="#/cookie" style="color:#C9D8D4">Cookie</a> · <a href="#/condizioni" style="color:#C9D8D4">Condizioni di vendita</a></p>
    </nav>`;
}

export function collegaMenu() {
  const m = document.getElementById("menu"), b = document.getElementById("apri-menu");
  if (!m || !b) return;
  b.onclick = () => { m.hidden = false; b.setAttribute("aria-expanded", "true"); };
  document.getElementById("chiudi-menu").onclick = () => { m.hidden = true; b.setAttribute("aria-expanded", "false"); };
  m.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => { m.hidden = true; }));
}

export const piePubblico = () => `
  <footer style="background:#12302C;color:#FBF3E2;padding:34px 20px 44px;text-align:center">
    <p style="font-family:Fraunces,serif;font-size:26px;margin:0 0 14px">Le radici che restano.</p>
    <p style="margin:0 0 10px;line-height:1.9">
      <a href="#/chisiamo" style="color:#FBF3E2">Chi siamo</a> · <a href="#/contatti" style="color:#FBF3E2">Contatti</a> ·
      <a href="#/scopri?s=faq" style="color:#FBF3E2">Domande</a> · <a href="#/omaggio" style="color:#FBF3E2">Codice omaggio</a></p>
    <p style="margin:0 0 14px;font-size:14px;line-height:1.9">
      <a href="#/privacy" style="color:#C9D8D4">Privacy</a> · <a href="#/cookie" style="color:#C9D8D4">Cookie</a> ·
      <a href="#/condizioni" style="color:#C9D8D4">Condizioni di vendita</a> · <a href="#" id="pref-cookie" style="color:#C9D8D4">Preferenze cookie</a></p>
    <p style="font-size:11px;color:#9FB3AC;margin:0">${esc(AZIENDA.nome)} · ${esc(AZIENDA.piva)} · Foto: Unsplash</p>
  </footer>`;

export function collegaPie() {
  document.getElementById("pref-cookie")?.addEventListener("click", (e) => { e.preventDefault(); consensoCookie(true); });
}

const pagina = (titolo, corpo) => {
  $app().innerHTML = `${testataPubblica()}
    <article style="padding:24px 20px 40px;line-height:1.6">
      <h1 style="font-family:Fraunces,serif;font-size:34px;line-height:1.1;margin:0 0 16px">${titolo}</h1>${corpo}</article>
    ${piePubblico()}`;
  collegaMenu(); collegaPie(); scrollTo(0, 0);
};
const h = (t) => `<h2 style="font-size:18px;text-transform:none;letter-spacing:0;margin:22px 0 6px;padding:0;color:#12302C">${t}</h2>`;

export async function chisiamo() {
  pagina("Chi siamo", `
    <p style="font-size:18px">Ancora nasce in Italia, da una famiglia grande: una mamma, tanti fratelli, i suoceri, i cugini, gli amici di sempre. E dieci chat diverse dove le foto si perdono e le storie non si raccontano mai.</p>
    <p>Volevamo un posto solo, nostro, dove le storie di casa si raccontano a voce, le ricette restano con le dosi giuste, l'albero lo completa tutta la famiglia e le foto non finiscono sparse su dieci telefoni. Non l'abbiamo trovato, e l'abbiamo costruito.</p>
    ${h("In cosa crediamo")}
    <p><b>Le famiglie si tengono insieme raccontandosi.</b> Ancora fa una domanda a settimana: il resto lo fanno le persone.</p>
    <p><b>Privato per davvero.</b> Niente pubblicità, niente estranei. Chi lavora ad Ancora non vede i vostri ricordi.</p>
    <p><b>I ricordi sono vostri.</b> Restano gratis, per sempre: si paga per farli crescere, mai per non perderli.</p>
    ${h("Chi c'è dietro")}
    <p>Ancora è un progetto di ${esc(AZIENDA.nome)}, ${esc(AZIENDA.sede)}.</p>
    <p><a class="btn ambra" href="#/contatti" style="margin-top:8px">Scrivici</a></p>`);
}

export async function contatti() {
  pagina("Contatti", `
    <p>Domande, un regalo particolare, un'idea? Scrivici: rispondiamo di persona.</p>
    <form id="fc">
      <label for="c-nome">Nome</label><input id="c-nome" required maxlength="80" autocomplete="name">
      <label for="c-email">Email</label><input id="c-email" type="email" required maxlength="120" autocomplete="email">
      <label for="c-tel">Telefono (se vuoi essere richiamato)</label><input id="c-tel" type="tel" maxlength="30" autocomplete="tel">
      <label for="c-msg">Messaggio</label><textarea id="c-msg" rows="5" required maxlength="2000"></textarea>
      <label style="display:flex;gap:10px;align-items:flex-start;font-weight:600;margin-top:12px"><input type="checkbox" id="c-ok" required style="width:22px;height:22px;flex-shrink:0">
        <span>Ho letto l'<a href="#/privacy">informativa privacy</a> e acconsento a essere ricontattato.</span></label>
      <button class="btn" style="margin-top:14px">Invia</button>
      <p id="c-esito" role="status"></p>
    </form>
    ${h("Altri recapiti")}
    <p>${esc(AZIENDA.email)}</p>`);
  document.getElementById("fc").onsubmit = async (e) => {
    e.preventDefault();
    const v = (id) => document.getElementById(id).value.trim();
    const { error } = await sb.from("contatti").insert({ nome: v("c-nome"), email: v("c-email"), telefono: v("c-tel") || null, messaggio: v("c-msg"), utm: utm() });
    document.getElementById("c-esito").innerHTML = error ? `<span class="errore">Messaggio non inviato, riprova.</span>` : "Grazie! Ti rispondiamo presto.";
    if (!error) e.target.reset();
  };
}

export async function privacy() {
  pagina("Informativa privacy", `
    <p class="tenue">Bozza aggiornata al ${AZIENDA.aggiornato}. Ai sensi degli artt. 13-14 del Regolamento (UE) 2016/679 (GDPR).</p>
    ${h("Titolare del trattamento")}
    <p>${esc(AZIENDA.nome)}, ${esc(AZIENDA.sede)}, P.IVA ${esc(AZIENDA.piva)}. Contatto: ${esc(AZIENDA.email)}.</p>
    ${h("Quali dati trattiamo")}
    <p><b>Dati dell'account:</b> nome, email, numero di cellulare, data di nascita se la inserisci, foto profilo.<br>
    <b>Contenuti che carichi:</b> racconti, registrazioni vocali, foto, video, ricette, diario, albero genealogico (anche di persone che non usano Ancora, inseriti dai familiari).<br>
    <b>Dati di acquisto:</b> nome e contatti di chi compra e di chi riceve il regalo; i dati di pagamento li gestisce Stripe, noi non vediamo la carta.<br>
    <b>Dati tecnici:</b> quelli necessari a farti entrare e a far funzionare il servizio. Con il tuo consenso, la campagna da cui arrivi (parametri UTM).</p>
    ${h("Perché e su quale base")}
    <p>Per fornirti il servizio che hai scelto (esecuzione del contratto); per gli obblighi fiscali e contabili (obbligo di legge); per rispondere ai messaggi che ci mandi (tua richiesta); per misurare le campagne, solo se acconsenti (consenso, revocabile quando vuoi dalle preferenze cookie).</p>
    ${h("I tuoi ricordi sono privati")}
    <p>Ogni contenuto è visibile solo alle persone e alle famiglie che scegli. Chi gestisce Ancora non vede i contenuti. L'unica eccezione è la stampa del libro che ordini tu: per impaginarlo apriamo le storie di quel libro, e ogni apertura resta registrata.</p>
    ${h("A chi li affidiamo")}
    <p>Fornitori che trattano i dati per nostro conto, con accordi conformi al GDPR: Supabase (database e archivio), Stripe (pagamenti), Meta Platforms (messaggi WhatsApp, se li usi), OpenAI (trascrizione dei vocali in testo), GitHub (pubblicazione del sito). Alcuni possono trattare dati fuori dall'UE, con le garanzie previste (clausole contrattuali standard o decisioni di adeguatezza).</p>
    ${h("Per quanto tempo")}
    <p>I contenuti restano finché non li cancelli tu o chiudi l'account. I dati di acquisto per il tempo richiesto dalla legge fiscale (10 anni). I messaggi del modulo contatti per 24 mesi. Le visite anonime per campagna per 24 mesi.</p>
    ${h("Minori")}
    <p>I minori di 14 anni possono usare Ancora solo dentro una famiglia, con l'account e il consenso di un genitore.</p>
    ${h("I tuoi diritti")}
    <p>Puoi chiedere accesso, rettifica, cancellazione, limitazione, portabilità dei tuoi dati e opporti al trattamento, scrivendo a ${esc(AZIENDA.email)}. Puoi revocare il consenso in ogni momento. Puoi reclamare al Garante per la protezione dei dati personali (garanteprivacy.it).</p>`);
}

export async function cookie() {
  pagina("Cookie e tecnologie simili", `
    <p class="tenue">Bozza aggiornata al ${AZIENDA.aggiornato}.</p>
    ${h("Necessari")}
    <p>Servono a farti entrare e a ricordare le tue scelte (accesso, preferenze, consenso). Non richiedono consenso. Sono salvati nella memoria del tuo browser (localStorage), non usiamo cookie di terze parti.</p>
    ${h("Statistiche delle campagne (solo con consenso)")}
    <p>Se acconsenti, ricordiamo per 30 giorni da quale campagna sei arrivato (parametri UTM nel link, ad esempio utm_source=facebook) e contiamo le visite in forma anonima per sorgente. Ci serve a capire quali campagne funzionano. Non usiamo questi dati per profilarti né li condividiamo.</p>
    ${h("Pubblicità")}
    <p>Oggi non usiamo pixel pubblicitari. Se in futuro li aggiungeremo, te lo chiederemo prima.</p>
    <p><button class="btn chiaro" id="cambia">Cambia le tue preferenze</button></p>`);
  document.getElementById("cambia").onclick = () => consensoCookie(true);
}

export async function condizioni() {
  pagina("Condizioni di vendita", `
    <p class="tenue">Bozza aggiornata al ${AZIENDA.aggiornato}.</p>
    ${h("1. Chi vende")}
    <p>${esc(AZIENDA.nome)}, ${esc(AZIENDA.sede)}, P.IVA ${esc(AZIENDA.piva)} («Ancora»).</p>
    ${h("2. Cosa compri")}
    <p><b>Regalo di Natale (129 €):</b> 12 mesi di Ancora+ per la famiglia di chi riceve il regalo, a partire dalla data scelta.<br>
    <b>Ancora+:</b> 99 € l'anno o 9,99 € al mese, con rinnovo automatico finché non lo disdici.<br>
    <b>Servizi:</b> libro stampato (49 € b/n, 69 € a colori), narratore in più (1,99 €/mese), spazio +100 GB (2,99 €/mese).<br>
    Prezzi IVA inclusa.</p>
    ${h("3. Pagamento")}
    <p>Con carta tramite Stripe. Il contratto si conclude quando il pagamento è confermato; ricevi la conferma per email.</p>
    ${h("4. Recesso")}
    <p>Hai 14 giorni dall'acquisto per recedere senza motivo, scrivendo a ${esc(AZIENDA.email)}. Se il servizio è già stato attivato su tua richiesta prima della fine dei 14 giorni, ti rimborsiamo la parte non goduta. Il libro stampato è personalizzato e non può essere reso, salvo difetti. Se chi riceve il regalo non lo accetta, ti rimborsiamo per intero.</p>
    ${h("5. Disdetta e rinnovi")}
    <p>Gli abbonamenti si disdicono quando vuoi, dall'app o scrivendoci: restano attivi fino alla fine del periodo pagato. Il regalo non si rinnova da solo.</p>
    ${h("6. Cosa succede ai ricordi")}
    <p>Se il piano finisce, i ricordi già salvati restano consultabili gratuitamente; si fermano le domande della settimana e lo spazio torna a quello gratuito. Foto, video e vocali puoi scaricarli quando vuoi.</p>
    ${h("7. Uso corretto")}
    <p>Carica solo contenuti di cui hai diritto e che non offendono nessuno. Inserendo nell'albero o nei ricordi altre persone, ti impegni a farlo con rispetto della loro riservatezza.</p>
    ${h("8. Assistenza e reclami")}
    <p>${esc(AZIENDA.email)}. Per le controversie con i consumatori è competente il foro del consumatore. Puoi usare anche la piattaforma europea ODR.</p>`);
}
