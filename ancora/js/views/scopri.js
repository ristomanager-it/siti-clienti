// Pagina di vendita (pubblica): cos'è Ancora, come funziona, perché non basta il gruppo WhatsApp, prezzi e modulo d'acquisto.
import { $app } from "../app.js";
import { montaModulo } from "./regala.js";

const MOTIVI = [
  "La voce dei nonni, per sempre",
  "Scoprire da dove vieni",
  "Le ricette di casa, con la loro voce",
  "Vicini anche da lontano",
  "L'albero di tutta la famiglia",
  "Un regalo che dura una vita",
];

const DENTRO = [
  ["🎙️", "Racconti a voce", "Una domanda a settimana su WhatsApp. Si risponde con un vocale, come sempre."],
  ["☁️", "Il cloud dei ricordi", "50 GB per foto, video, vocali e documenti. Scatti o carichi dal telefono."],
  ["🌳", "Alberi di famiglia", "La tua, quella dei tuoi genitori, quella dei suoceri: alberi uniti."],
  ["❓", "La domanda della settimana", "Per tutti: da dove viene il nostro cognome? Ognuno risponde, ci si scopre."],
  ["🍝", "Il ricettario", "Le ricette di casa con la voce di chi le fa, e le dosi giuste."],
  ["📖", "Il libro delle storie", "Digitale incluso, con il QR per ascoltare la voce. Stampato su richiesta."],
  ["🗓️", "L'agenda di famiglia", "Vacanze insieme, compiti, esami. Ognuno sceglie cosa condividere."],
  ["🔒", "Privato per davvero", "Niente pubblicità, niente estranei. Noi non leggiamo i vostri ricordi."],
];

const CONTRO = [
  ["I ricordi spariscono tra mille messaggi, buongiorno e catene", "Ogni ricordo ha il suo posto: per persona, per anno, per albero"],
  ["Cambi telefono e perdi foto e vocali", "Tutto al sicuro nel cloud, per sempre"],
  ["Foto e video compressi", "Qualità originale"],
  ["Nessuno fa le domande giuste, e le storie non escono", "Una domanda a settimana, scelta per voi"],
  ["Niente albero, niente ricettario, niente libro", "Tutto dentro, e cresce con voi"],
  ["Un gruppo per tutti, o dieci gruppi", "Più famiglie e cerchie, ognuno decide chi vede cosa"],
];

const DOMANDE = [
  ["Devono scaricare un'app i nonni?", "No. Ricevono la domanda su WhatsApp e rispondono con un vocale. Tutto il resto lo fa Ancora."],
  ["Chi può entrare?", "Tutta la famiglia, senza limiti e senza pagare: figli, nipoti, cugini, anche chi vive all'estero."],
  ["Posso stare in più famiglie?", "Sì: la tua, quella dei tuoi genitori, quella di tua moglie o di tuo marito, gli amici. Gli alberi si collegano tra loro."],
  ["Cosa succede dopo 12 mesi?", "Si continua solo se volete, a 99 € l'anno o 9,99 € al mese. I ricordi restano gratis per sempre."],
  ["Chi vede i miei ricordi?", "Solo chi scegli tu. Ogni ricordo può essere per tutti, per una famiglia o solo per te. Noi non li leggiamo."],
  ["E se chi lo riceve non accetta?", "Ti rimborsiamo."],
];

export default async function () {
  $app().innerHTML = `
    <header class="testa"><span class="logo" style="font-size:24px">Ancora</span><span style="flex:1"></span>
      <a class="chip" href="#/accesso" style="margin:0;text-decoration:none">Entra</a></header>

    <section class="pad" style="padding-top:8px">
      <span class="chip on" style="background:#B3402F;margin:0 0 12px">🎄 Promo Natale</span>
      <h1 style="font-size:38px;line-height:1.08;margin:0 0 12px">Il cloud dei tuoi ricordi.</h1>
      <p style="font-size:18px;line-height:1.45;margin:0 0 6px">Non solo foto e video: <b>le voci, le storie, le ricette e l'albero</b> della tua famiglia. Al sicuro, solo per voi.</p>
      <p class="tenue" style="font-size:15px;margin:0 0 18px">I nonni rispondono con un vocale su WhatsApp. Tutta la famiglia ascolta, risponde e conserva.</p>
      <a class="btn ambra" href="#acquista" id="vai">Regala Ancora · 129 €</a>
      <a class="btn chiaro" style="margin-top:10px" href="#/prova">Prova gratis: fai una domanda al nonno</a>
    </section>

    <div class="storie" style="gap:6px;padding:4px 16px 8px" aria-label="Ognuno il suo motivo">
      ${MOTIVI.map((m) => `<span class="chip" style="flex-shrink:0;margin:0">${m}</span>`).join("")}</div>

    <h2>Come funziona</h2>
    <div class="pad" style="padding-top:0;display:grid;gap:10px">
      ${[["1", "Regali Ancora", "A Natale, a un compleanno, o a te stesso. Scegli il giorno in cui parte."],
         ["2", "Arriva la domanda", "Ogni settimana, su WhatsApp: «Com'era la casa dove sei cresciuto?». Si risponde con un vocale."],
         ["3", "La famiglia ascolta", "La voce finisce nell'album di famiglia. Figli e nipoti ascoltano, commentano, chiedono ancora."]]
        .map(([n, t, d]) => `<div class="card" style="margin:0;display:flex;gap:14px;align-items:flex-start">
          <b style="font-family:Fraunces,serif;font-size:30px;color:var(--ambra);line-height:1">${n}</b>
          <div><b style="font-size:17px">${t}</b><div class="tenue" style="margin-top:2px">${d}</div></div></div>`).join("")}
    </div>

    <h2>Cosa c'è dentro</h2>
    <div class="pad" style="padding-top:0;display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${DENTRO.map(([i, t, d]) => `<div class="card" style="margin:0;padding:14px">
        <div style="font-size:26px">${i}</div><b style="display:block;margin:6px 0 2px">${t}</b>
        <div class="tenue" style="font-size:13px;line-height:1.35">${d}</div></div>`).join("")}
    </div>

    <h2>Perché non basta il gruppo WhatsApp</h2>
    <p class="pad tenue" style="margin:0;padding-top:0">WhatsApp è perfetto per dirsi «a che ora arrivate?». Non per conservare la storia di una famiglia. Ancora non lo sostituisce: lo usa come campanello.</p>
    <div class="pad" style="display:grid;grid-template-columns:1fr 1fr;gap:0;font-size:14px">
      <div style="padding:10px;font-weight:800;border-bottom:2px solid var(--bordo)">Gruppo WhatsApp</div>
      <div style="padding:10px;font-weight:800;border-bottom:2px solid var(--ambra);color:var(--notte)">Ancora</div>
      ${CONTRO.map(([w, a]) => `<div style="padding:10px;border-bottom:1px solid var(--bordo);color:#8A5A4F">✕ ${w}</div>
        <div style="padding:10px;border-bottom:1px solid var(--bordo);background:#fff"><b style="color:#2F6B4F">✓</b> ${a}</div>`).join("")}
    </div>

    <h2>Una famiglia, tante famiglie</h2>
    <div class="lettera" style="font-size:17px">La tua famiglia, quella dei tuoi genitori e dei tuoi fratelli, quella dei suoceri. Gli amici di sempre. Stai in tutte, e <b>gli alberi si uniscono</b> dove c'è la stessa persona. Ognuno vede solo ciò che condividi con lui.</div>

    <h2>Prezzi</h2>
    <div class="pad" style="padding-top:0;display:grid;gap:10px">
      <div class="card" style="margin:0;border:2px solid var(--ambra)">
        <div class="riga"><b style="flex:1;font-size:18px">Regalo di Natale</b><b style="font-family:Fraunces,serif;font-size:30px">129 €</b></div>
        <div class="tenue">12 mesi di Piano Famiglia, il biglietto da mettere sotto l'albero, parte il giorno che scegli.</div></div>
      <div class="card" style="margin:0">
        <div class="riga"><b style="flex:1;font-size:18px">Piano Famiglia</b><b style="font-family:Fraunces,serif;font-size:24px">99 €<small style="font-size:14px">/anno</small></b></div>
        <div class="tenue">Oppure 9,99 € al mese. Dopo il regalo si continua solo se volete.</div></div>
      <div class="card" style="margin:0">
        <b style="font-size:16px">Servizi in più, quando servono</b>
        <ul class="tenue" style="margin:8px 0 0;padding-left:18px;line-height:1.6">
          <li>Libro stampato: 49 € in bianco e nero, 69 € a colori</li>
          <li>Un narratore in più: 1,99 € al mese</li>
          <li>Spazio +100 GB: 2,99 € al mese</li></ul></div>
      <p class="tenue" style="margin:0;text-align:center"><b>Gratis per sempre:</b> entrare in famiglia, i ricordi già salvati, l'albero.</p>
    </div>

    <h2 id="acquista">Regala Ancora</h2>
    <div id="modulo-regalo"></div>

    <h2>Domande</h2>
    <div class="pad" style="padding-top:0">
      ${DOMANDE.map(([q, r]) => `<details class="card" style="margin:0 0 8px"><summary style="font-weight:800;cursor:pointer;min-height:28px">${q}</summary>
        <p style="margin:8px 0 0">${r}</p></details>`).join("")}
    </div>

    <div class="pad" style="text-align:center;padding-bottom:40px">
      <p style="font-family:Fraunces,serif;font-size:22px;margin:10px 0">Le radici che restano.</p>
      <a href="#/perche">Perché Ancora</a> · <a href="#/accesso">Entra</a> · <a href="#/omaggio">Ho un codice omaggio</a>
    </div>`;

  montaModulo(document.getElementById("modulo-regalo"));
  // l'ancora #acquista non deve cambiare pagina: scorre al modulo
  document.getElementById("vai").onclick = (e) => {
    e.preventDefault();
    document.getElementById("acquista").scrollIntoView({ behavior: "smooth" });
  };
}
