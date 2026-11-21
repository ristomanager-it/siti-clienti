// Pagina di vendita (pubblica). Versione di Natale: toni caldi delle feste, sempre con i colori del brand.
// Perché, come, cosa; più di una chat di gruppo; prezzi; modulo d'acquisto. Toni leggeri e vivi: si racconta adesso, insieme.
// Foto: Unsplash (licenza Unsplash, uso libero).
import { $app } from "../app.js";
import { montaModulo } from "./regala.js";

// palette di Natale: rosso, oro, panna + verde salvia e verde notte del brand
const C = { rosso: "#8E2B22", rossoVivo: "#B3402F", oro: "#C9832E", panna: "#FBF3E2", salvia: "#4D7356", notte: "#12302C" };

const MOTIVI = [
  ["Le storie di casa, raccontate da chi le ha vissute.", "Con il loro tono, le loro parole, il loro dialetto."],
  ["La famiglia che si mette insieme.", "Ognuno aggiunge un pezzo: una foto, un ricordo, un nome nell'albero."],
  ["Le ricette di casa.", "Con la voce di chi le fa, e le dosi giuste."],
  ["Vicini anche da lontano.", "Chi vive all'estero, i nipoti fuori sede, i nonni soli."],
  ["Ritrovarsi.", "Se in famiglia ci si è persi di vista."],
  ["Un regalo che dura una vita.", "E un libro da sfogliare."],
];

const COME = [
  ["La voce prima di tutto", "Il tono, le pause, il dialetto, la risata. Si racconta parlando, non scrivendo."],
  ["Facile come una chat", "Si usa come le app di messaggi che tutti conoscono. Spesso sono i nipoti a farla vedere ai nonni, e poi vanno da soli."],
  ["Privato per davvero", "Ogni ricordo ha i suoi destinatari. Niente pubblicità, niente estranei: noi non leggiamo i contenuti."],
  ["Semplice a 80 anni e a 15", "Un tasto per parlare, uno per la foto. Tutto qui."],
  ["I ricordi restano gratis, per sempre", "Si paga per farli crescere, mai per non perderli."],
];

const COSA = [
  ["Una domanda a settimana", "per chi racconta: si risponde a voce, quando si vuole"],
  ["La domanda della settimana", "per tutta la famiglia: ognuno risponde, ci si scopre"],
  ["Il cloud dei ricordi", "50 GB per foto, video, vocali, documenti: non solo foto e video"],
  ["Gli alberi di famiglia", "la tua, dei tuoi genitori, dei suoceri: uniti"],
  ["Il ricettario di casa", "con la voce di chi cucina"],
  ["L'album di famiglia", "foto, vocali, cuori, risposte a voce"],
  ["Famiglie e cerchie", "parenti, fratelli, amici: ognuno decide chi vede cosa"],
  ["L'agenda", "vacanze insieme, compiti, esami: solo se volete"],
  ["Il diario", "privato, con «accadeva oggi»"],
  ["Il libro delle storie", "digitale incluso, stampato su richiesta"],
];

const CONTRO = [
  ["I ricordi spariscono tra mille messaggi, buongiorno e catene", "Ogni ricordo ha il suo posto: per persona, per anno, per albero"],
  ["Cambi telefono e perdi foto e vocali", "Tutto al sicuro nel cloud"],
  ["Foto e video compressi", "Qualità originale"],
  ["Nessuno fa le domande giuste, e le storie non escono", "Una domanda a settimana, scelta per voi"],
  ["Niente albero, niente ricettario, niente libro", "Tutto dentro, e cresce con voi"],
  ["Un gruppo per tutti, o dieci gruppi", "Più famiglie e cerchie, ognuno decide chi vede cosa"],
];

const DOMANDE = [
  ["È facile per i nonni?", "Sì: si usa come le app di messaggi che conoscono già. Di solito sono i nipoti a fargliela vedere la prima volta. E chi proprio non vuole l'app può rispondere anche da un messaggio sul telefono."],
  ["Chi può entrare?", "Tutta la famiglia, senza pagare: figli, nipoti, cugini, anche chi vive all'estero. Nel regalo scrivi i nomi e i numeri di tutti, e ognuno riceve il suo invito."],
  ["Posso stare in più famiglie?", "Sì: la tua, quella dei tuoi genitori, quella di tua moglie o di tuo marito, gli amici. Gli alberi si collegano tra loro."],
  ["Cosa succede dopo 12 mesi?", "Si continua solo se volete, a 99 € l'anno o 9,99 € al mese. I ricordi restano gratis per sempre."],
  ["Chi vede i miei ricordi?", "Solo chi scegli tu. Ogni ricordo può essere per tutti, per una famiglia o solo per te. Noi non li leggiamo."],
  ["E se chi lo riceve non accetta?", "Ti rimborsiamo."],
];

const titolo = (t, colore = C.notte) => `<h2 style="font-family:Fraunces,serif;font-size:30px;line-height:1.1;text-transform:none;letter-spacing:0;color:${colore};margin:0 0 12px;padding:0">${t}</h2>`;
const etichetta = (t, colore = C.rossoVivo) => `<div style="font-weight:800;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:${colore};margin-bottom:8px">${t}</div>`;
const sezione = (html, sfondo = "transparent", colore = "inherit") => `<section style="background:${sfondo};color:${colore};padding:36px 20px">${html}</section>`;
const foto = (src, alt, alta = 300, posizione = "center") =>
  `<div role="img" aria-label="${alt}" style="height:${alta}px;background:url('img/${src}') ${posizione}/cover"></div>`;

export default async function () {
  $app().innerHTML = `
    <header class="testa" style="position:absolute;left:0;right:0;z-index:2;background:transparent;border:0">
      <span class="logo" style="font-size:26px;color:${C.panna}">Ancora</span><span style="flex:1"></span>
      <a class="chip" href="#/accesso" style="margin:0;text-decoration:none;background:rgba(251,243,226,.92)">Entra</a></header>

    <section style="position:relative;min-height:640px;display:flex;align-items:flex-end;color:${C.panna};
      background:linear-gradient(180deg,rgba(18,48,44,.15) 0%,rgba(18,10,8,.25) 40%,rgba(60,14,10,.92) 100%),url('img/nonna-nipote.jpg') 42% center/cover">
      <div style="padding:0 20px 34px">
        <span style="display:inline-block;background:${C.oro};color:${C.notte};font-weight:800;font-size:13px;padding:6px 12px;border-radius:999px;margin-bottom:14px">Natale 2026 · il regalo che resta</span>
        <h1 style="font-family:Fraunces,serif;font-size:44px;line-height:1.02;margin:0 0 12px;color:${C.panna}">Il cloud dei tuoi ricordi.</h1>
        <p style="font-size:18px;line-height:1.45;margin:0 0 20px;color:#F3E6D2">Non solo foto e video: le voci, le storie, le ricette e l'albero della tua famiglia. Al sicuro, solo per voi.</p>
        <a class="btn" href="#acquista" id="vai" style="background:${C.oro};color:${C.notte}">Regala Ancora · 129 €</a>
        <a class="btn" href="#come" id="vai-come" style="margin-top:10px;background:transparent;color:${C.panna};border:2px solid rgba(251,243,226,.6)">Scopri come funziona</a>
      </div>
    </section>

    ${sezione(`${etichetta("Perché", C.oro)}
      ${titolo("Ogni famiglia ha una storia. Raccontatela insieme.", C.panna)}
      <p style="font-size:17px;line-height:1.55;margin:0 0 14px;color:#F1E4CF">Le storie di casa vivono nei pranzi della domenica, nelle foto sparse su dieci telefoni, nelle ricette che nessuno ha mai scritto. Ancora le mette insieme, in un posto solo, vostro.</p>
      <p style="font-family:Fraunces,serif;font-size:20px;line-height:1.45;margin:0;color:${C.panna}">L'<b>ancora</b> tiene ferma la barca nel porto sicuro: le radici, la famiglia. <b>Ancora</b> vuol dire anche di più, un'altra volta: «raccontamela ancora».</p>`,
      C.notte)}

    ${sezione(`${etichetta("Ognuno il suo motivo")}
      ${MOTIVI.map(([t, d]) => `<div style="padding:14px 0;border-bottom:1px solid #EAD9BF">
        <b style="font-family:Fraunces,serif;font-size:21px;color:${C.rosso}">${t}</b>
        <div class="tenue" style="margin-top:2px">${d}</div></div>`).join("")}`, C.panna)}

    ${sezione(`${etichetta("Come funziona")}
      <span id="come"></span>${titolo("Una domanda. Una risposta a voce. Un ricordo in più.")}
      ${[["Regali Ancora", "A Natale o quando vuoi. Scrivi i nomi e i numeri di tutti: chi racconta e chi invitare."],
         ["Arriva la domanda", "Ogni settimana una domanda nuova: «Com'era la casa dove sei cresciuto?». Si risponde a voce, con calma."],
         ["La famiglia ascolta", "La voce finisce nell'album di famiglia. Figli e nipoti ascoltano, commentano, chiedono ancora."]]
        .map(([t, d], i) => `<div style="display:flex;gap:16px;padding:12px 0">
          <b style="font-family:Fraunces,serif;font-size:40px;line-height:.9;color:${C.oro};width:30px">${i + 1}</b>
          <div><b style="font-size:18px">${t}</b><div class="tenue" style="margin-top:3px;line-height:1.45">${d}</div></div></div>`).join("")}
      <div style="margin-top:18px;border-left:4px solid ${C.salvia};padding-left:14px">
        ${COME.map(([t, d]) => `<p style="margin:0 0 10px;line-height:1.45"><b style="color:${C.salvia}">${t}.</b> ${d}</p>`).join("")}
      </div>`)}

    <div style="position:relative">${foto("panettone.jpg", "Mani che spezzano un panettone sulla tavola di Natale", 340)}
      <div style="position:absolute;left:0;right:0;bottom:0;padding:60px 20px 18px;background:linear-gradient(180deg,transparent,rgba(60,14,10,.85));color:${C.panna}">
        <b style="font-family:Fraunces,serif;font-size:24px;line-height:1.15">Le ricette di casa, con la voce di chi le fa.</b></div></div>

    ${sezione(`${etichetta("Cosa c'è dentro")}
      ${titolo("Tutto quello che una famiglia vuole tenere.")}
      ${COSA.map(([t, d]) => `<div style="padding:11px 0;border-bottom:1px solid var(--bordo)"><b>${t}</b> <span class="tenue">· ${d}</span></div>`).join("")}`)}

    ${sezione(`${etichetta("Più di una chat di gruppo")}
      ${titolo("La chat serve per «a che ora arrivate?». La storia della famiglia merita di più.")}
      <div style="display:grid;grid-template-columns:1fr 1fr;font-size:14px;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #EAD9BF">
        <div style="padding:12px;font-weight:800;background:#F3EEE6">Chat di gruppo</div>
        <div style="padding:12px;font-weight:800;background:${C.rosso};color:${C.panna}">Ancora</div>
        ${CONTRO.map(([w, a]) => `<div style="padding:12px;border-top:1px solid #EFE6D8;color:#7C6F66">${w}</div>
          <div style="padding:12px;border-top:1px solid #EFE6D8;color:${C.notte};font-weight:600">${a}</div>`).join("")}
      </div>`, C.panna)}

    <div style="position:relative">${foto("amici-brindisi.jpg", "Amici che brindano alla cena di Natale", 360, "center 35%")}
      <div style="position:absolute;left:0;right:0;bottom:0;padding:70px 20px 20px;background:linear-gradient(180deg,transparent,rgba(18,48,44,.92));color:${C.panna}">
        <b style="font-family:Fraunces,serif;font-size:26px;line-height:1.15">Una famiglia, tante famiglie.</b>
        <p style="margin:6px 0 0;color:#E8DCC8;line-height:1.45">La tua, quella dei tuoi genitori, quella dei suoceri. E gli amici di sempre. Stai in tutte, e gli alberi si uniscono dove c'è la stessa persona.</p></div></div>

    ${sezione(`${etichetta("Prezzi")}
      <div style="border-radius:22px;padding:20px;background:${C.rosso};color:${C.panna};margin-bottom:12px">
        <div class="riga"><b style="flex:1;font-size:19px">Regalo di Natale</b><b style="font-family:Fraunces,serif;font-size:36px">129 €</b></div>
        <div style="color:#F1DCCB;margin-top:4px;line-height:1.45">12 mesi di Piano Famiglia per tutta la famiglia, il biglietto da mettere sotto l'albero, parte il giorno che scegli.</div></div>
      <div style="border-radius:22px;padding:20px;background:#fff;border:1px solid var(--bordo);margin-bottom:12px">
        <div class="riga"><b style="flex:1;font-size:18px">Piano Famiglia</b><b style="font-family:Fraunces,serif;font-size:26px;color:${C.salvia}">99 € <small style="font-size:14px">l'anno</small></b></div>
        <div class="tenue" style="margin-top:4px">Oppure 9,99 € al mese. Dopo il regalo si continua solo se volete.</div></div>
      <div style="padding:4px 4px 0;line-height:1.7">
        <b>Servizi in più, quando servono</b><br>
        <span class="tenue">Libro stampato 49 € in bianco e nero, 69 € a colori · Un narratore in più 1,99 € al mese · Spazio +100 GB 2,99 € al mese</span></div>
      <p style="margin:14px 0 0;color:${C.salvia};font-weight:700">Gratis per sempre: entrare in famiglia, i ricordi già salvati, l'albero.</p>`)}

    <section id="acquista" style="background:${C.panna};padding-top:30px">
      <div style="padding:0 20px">${etichetta("Regala Ancora")}</div>
      <div id="modulo-regalo"></div>
    </section>

    ${sezione(`${etichetta("Domande")}
      ${DOMANDE.map(([q, r]) => `<details style="border-bottom:1px solid var(--bordo);padding:14px 0"><summary style="font-weight:800;cursor:pointer">${q}</summary>
        <p style="margin:8px 0 0;line-height:1.5">${r}</p></details>`).join("")}`)}

    <footer style="background:${C.notte};color:${C.panna};padding:34px 20px 44px;text-align:center">
      <p style="font-family:Fraunces,serif;font-size:26px;margin:0 0 12px">Le radici che restano.</p>
      <p style="margin:0 0 18px"><a href="#/accesso" style="color:${C.panna}">Entra</a> · <a href="#/omaggio" style="color:${C.panna}">Ho un codice omaggio</a></p>
      <p style="font-size:11px;color:#9FB3AC;margin:0">Foto: Unsplash</p>
    </footer>`;

  montaModulo(document.getElementById("modulo-regalo"));
  document.getElementById("vai-come").onclick = (e) => { e.preventDefault(); document.getElementById("come").scrollIntoView({ behavior: "smooth" }); };
  // il bottone in alto scorre al modulo senza cambiare pagina
  document.getElementById("vai").onclick = (e) => {
    e.preventDefault();
    document.getElementById("acquista").scrollIntoView({ behavior: "smooth" });
  };
}
