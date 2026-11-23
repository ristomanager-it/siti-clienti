// Pagina di vendita (pubblica). Versione di Natale: toni caldi delle feste, sempre con i colori del brand.
// Perché, come, cosa; più di una chat di gruppo; prezzi; modulo d'acquisto. Toni leggeri e vivi: si racconta adesso, insieme.
// Foto: Unsplash (licenza Unsplash, uso libero).
import { $app, traccia } from "../app.js";
import { NEL_REGALO, montaModulo } from "./regala.js";
import { testataPubblica, collegaMenu, piePubblico, collegaPie } from "./info.js";

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
  ["Una domanda a settimana, per tutti", "ognuno la sua, dai nonni ai nipoti; e la famiglia può fartene di sue"],
  ["La domanda della settimana", "per tutta la famiglia: ognuno risponde, ci si scopre"],
  ["Il cloud dei ricordi", "2 GB gratis a testa, 200 GB per tutta la famiglia con il piano: non solo foto e video"],
  ["Gli alberi di famiglia", "la tua, dei tuoi genitori, dei suoceri: uniti"],
  ["Il ricettario di casa", "con la voce di chi cucina"],
  ["L'album di famiglia", "foto, vocali, cuori, risposte a voce"],
  ["Famiglie e cerchie", "parenti, fratelli, amici: ognuno decide chi vede cosa"],
  ["L'agenda", "vacanze insieme, compiti, esami: solo se volete"],
  ["Il diario", "privato, con «accadeva oggi»"],
  ["Il libro della famiglia", "l'anno di tutti, mese per mese, con i QR per sentire le voci: in PDF e stampato"],
  ["Il film dell'anno", "le foto e i video di tutti, montati con la musica, da mandare a tutti"],
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
  ["Le domande arrivano solo ai nonni?", "No, a tutti: ognuno ha la sua domanda della settimana, dai nonni ai ragazzi. E chiunque può farne una a un familiare dal suo profilo."],
  ["È facile per i nonni?", "Sì: si usa come le app di messaggi che conoscono già. Di solito sono i nipoti a fargliela vedere la prima volta. E chi proprio non vuole l'app può rispondere anche da un messaggio sul telefono."],
  ["Chi può entrare?", "Tutta la famiglia, senza pagare: figli, nipoti, cugini, anche chi vive all'estero. Chi riceve il regalo crea la sua famiglia e invita chi vuole: basta uno, e Ancora+ ce l'hanno tutti."],
  ["Posso stare in più famiglie?", "Sì: la tua, quella dei tuoi genitori, quella di tua moglie o di tuo marito, gli amici. Gli alberi si collegano tra loro."],
  ["Cosa succede dopo 12 mesi?", "Si continua solo se volete, a 99 € l'anno o 9,99 € al mese. I ricordi restano gratis per sempre."],
  ["Chi vede i miei ricordi?", "Solo chi scegli tu. Ogni ricordo può essere per tutti, per una famiglia o solo per te. Noi non li leggiamo."],
  ["Come arriva il regalo?", "Subito dopo il pagamento ricevi il biglietto con il codice: lo mandi su WhatsApp il giorno che vuoi, oppure lo stampi e lo metti sotto l'albero. Chi lo riceve crea la sua famiglia e attiva il codice."],
  ["Quando arriva il libro?", "A fine anno, a casa: a colori, con copertina rigida, con le storie, le foto e i QR per ascoltare le voci. Il PDF si scarica quando volete. Copie in più: 35 € l'una."],
  ["E il film?", "Si crea nell'app con un tocco: le foto e i video dell'anno, montati con la musica. Lo salvate e lo mandate a tutti."],
  ["E se il codice non viene usato?", "Se non viene attivato entro 30 giorni dalla data scelta, ti rimborsiamo per intero."],
];

const titolo = (t, colore = C.notte) => `<h2 style="font-family:Fraunces,serif;font-size:30px;line-height:1.1;text-transform:none;letter-spacing:0;color:${colore};margin:0 0 12px;padding:0">${t}</h2>`;
const etichetta = (t, colore = C.rossoVivo) => `<div style="font-weight:800;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:${colore};margin-bottom:8px">${t}</div>`;
const sezione = (html, sfondo = "transparent", colore = "inherit", id = "") => `<section ${id ? `id="${id}"` : ""} style="background:${sfondo};color:${colore};padding:36px 20px;scroll-margin-top:70px">${html}</section>`;
const foto = (src, alt, alta = 300, posizione = "center") =>
  `<div role="img" aria-label="${alt}" style="height:${alta}px;background:url('img/${src}') ${posizione}/cover"></div>`;

export default async function ({ params } = {}) {
  $app().innerHTML = `
    <a href="#acquista" class="vai-acquista" style="display:block;background:${C.rosso};color:${C.panna};text-align:center;font-weight:800;font-size:14px;padding:10px 14px;text-decoration:none;letter-spacing:.02em">
      🎄 La storia della tua famiglia · 99 € · <b>3x2</b> fino a Natale · <u>Regala</u></a>
    <div style="position:relative">
    ${testataPubblica({ trasparente: true })}

    <section style="position:relative;min-height:640px;display:flex;align-items:flex-end;color:${C.panna};
      background:linear-gradient(180deg,rgba(18,48,44,.15) 0%,rgba(18,10,8,.25) 40%,rgba(60,14,10,.92) 100%),url('img/nonna-nipote.jpg') 42% center/cover">
      <div style="padding:0 20px 34px">
        <span style="display:inline-block;background:${C.oro};color:${C.notte};font-weight:800;font-size:13px;padding:6px 12px;border-radius:999px;margin-bottom:14px">Natale 2026 · il regalo che resta</span>
        <h1 style="font-family:Fraunces,serif;font-size:44px;line-height:1.02;margin:0 0 12px;color:${C.panna}">La storia della tua famiglia.</h1>
        <p style="font-size:18px;line-height:1.45;margin:0 0 20px;color:#F3E6D2">Un posto solo vostro per raccontarla insieme: foto, voci, storie e l'albero. E a fine anno, un libro da tenere in mano.</p>
        <a class="btn vai-acquista" href="#acquista" style="background:${C.oro};color:${C.notte}">Regalala · 99 € <s style="opacity:.6;font-weight:600">129 €</s></a>
        <a class="btn" href="#/iscriviti" style="margin-top:10px;background:transparent;color:${C.panna};border:2px solid rgba(251,243,226,.6)">Inizia gratis</a>
        <a href="#come" id="vai-come" style="display:block;text-align:center;margin-top:12px;color:#F3E6D2;font-weight:700">Scopri come funziona ↓</a>
      </div>
    </section>
    </div>

    <div style="background:${C.panna};padding:14px 16px;display:flex;gap:8px;overflow-x:auto;font-size:13px;font-weight:700;color:${C.notte}">
      ${["🔒 Privato, niente pubblicità", "🇮🇹 Fatto in Italia", "↩︎ Rimborso se non accetta", "✓ I ricordi restano vostri"]
        .map((t) => `<span style="flex-shrink:0;background:#fff;border:1px solid #EAD9BF;border-radius:999px;padding:7px 12px">${t}</span>`).join("")}
    </div>

    <section style="background:linear-gradient(180deg,${C.panna},#F3E3C8);padding:30px 20px 34px;overflow:hidden">
      ${etichetta("Ecco Ancora")}
      ${titolo("Sul telefono di tutti. E a fine anno, il libro.")}
      <div style="position:relative;height:440px;margin-top:10px">
        <!-- il libro aperto, dietro -->
        <div style="position:absolute;right:-4px;top:56px;width:196px;height:300px;transform:rotate(5deg);background:#FFFDF8;border-radius:6px 14px 14px 6px;box-shadow:0 18px 40px rgba(60,30,10,.25);padding:20px 14px 20px 52px;border-left:10px solid ${C.rosso}">
          <div style="font-family:Fraunces,serif;font-size:12px;color:${C.oro};letter-spacing:.1em;text-transform:uppercase">Le storie di casa</div>
          <div style="font-family:Fraunces,serif;font-size:19px;line-height:1.2;margin:8px 0 10px;color:${C.notte}">La casa dove sono cresciuta</div>
          <div style="font-size:11px;line-height:1.55;color:#5D635F">Avevamo un cortile con il fico, e la domenica arrivavano tutti i cugini. La nonna faceva le tagliatelle sul tavolo di marmo…</div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:16px">
            <div style="width:46px;height:46px;background:repeating-conic-gradient(${C.notte} 0 25%,#fff 0 50%) 0 0/9px 9px;border:3px solid #fff;outline:1px solid #ddd"></div>
            <span style="font-size:10px;color:#5D635F;line-height:1.3">Inquadra e<br>ascolta la sua voce</span></div>
        </div>
        <!-- il telefono, davanti -->
        <div style="position:absolute;left:0;top:0;width:190px;height:410px;border-radius:34px;background:#111;padding:9px;box-shadow:0 20px 44px rgba(18,48,44,.35)">
          <div style="width:100%;height:100%;border-radius:26px;background:#FBF8F2;overflow:hidden;font-size:11px">
            <div style="padding:14px 12px 8px;display:flex;align-items:center"><span class="logo" style="font-size:17px;flex:1">Ancora</span>
              <span style="width:22px;height:22px;border-radius:11px;background:${C.salvia}"></span></div>
            <div style="margin:0 8px 8px;background:${C.notte};color:${C.panna};border-radius:16px;padding:11px">
              <div style="font-size:8.5px;font-weight:800;letter-spacing:.08em;color:#F4D39B;text-transform:uppercase">Giulia ti chiede</div>
              <div style="font-family:Fraunces,serif;font-size:14px;line-height:1.2;margin:4px 0 9px">Nonna, com'era il tuo primo Natale da sposata?</div>
              <div style="background:${C.oro};color:${C.notte};font-weight:800;text-align:center;border-radius:999px;padding:7px">🎙 Rispondi a voce</div></div>
            <div style="margin:0 8px 8px;background:#fff;border:1px solid #EFE6D8;border-radius:16px;overflow:hidden">
              <div style="height:86px;background:url('img/panettone.jpg') center/cover"></div>
              <div style="padding:8px 10px"><b>Nonna Lucia</b> · la ricetta del panettone
                <div style="display:flex;align-items:center;gap:6px;margin-top:6px"><span style="width:20px;height:20px;border-radius:10px;background:${C.oro};display:grid;place-items:center;color:#fff;font-size:9px">▶</span>
                  <span style="flex:1;height:3px;background:#EAD9BF;border-radius:2px"><i style="display:block;width:40%;height:3px;background:${C.oro}"></i></span><span style="color:#5D635F">2:14</span></div></div></div>
            <div style="margin:0 8px;background:#fff;border:1px solid #EFE6D8;border-radius:16px;padding:9px 10px;display:flex;gap:6px;align-items:center">
              <span style="font-size:15px">🌳</span><span><b>L'albero</b> · 31 persone, 3 famiglie</span></div>
          </div>
        </div>
      </div>
      <p class="tenue" style="margin:6px 0 0;text-align:center">L'app è vera; i nomi sono di esempio.</p>
    </section>

    <section style="background:#F3E3C8;padding:0 16px 34px">
      <div style="background:#fff;border-radius:26px;overflow:hidden;box-shadow:0 14px 34px rgba(60,30,10,.14);border:2px solid ${C.oro}">
        <div style="background:${C.rosso};color:${C.panna};padding:18px 20px;display:flex;align-items:center;gap:12px">
          <span style="font-size:34px" aria-hidden="true">🎁</span>
          <div style="flex:1"><div style="font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#F4D39B">Il regalo di Natale</div>
            <b style="font-family:Fraunces,serif;font-size:22px;line-height:1.15">La storia della tua famiglia</b></div>
          <div style="text-align:right"><small style="display:block;font-size:13px;color:#F4D39B"><s>129 €</s></small><b style="font-family:Fraunces,serif;font-size:32px">99 €</b></div></div>
        <ul style="list-style:none;margin:0;padding:16px 20px 6px">
          ${NEL_REGALO.map(([t, d]) => `<li style="display:flex;gap:10px;padding:9px 0;border-bottom:1px solid #F1E7D6">
              <span style="flex-shrink:0;width:22px;height:22px;border-radius:11px;background:${C.salvia};color:#fff;display:grid;place-items:center;font-size:13px;font-weight:800">✓</span>
              <span><b>${t}</b><br><span class="tenue" style="font-size:14px">${d}</span></span></li>`).join("")}
        </ul>
        <div style="padding:10px 20px 20px">
          <a href="#acquista" class="btn vai-acquista" style="background:${C.oro};color:${C.notte}">Regalala · 99 €</a>
          <p class="tenue" style="margin:10px 0 0;text-align:center;font-size:13px"><b style="color:#B3402F">3x2: ne regali 3, ne paghi 2 (198 €).</b> Chi la riceve crea la sua famiglia e la costruisce come vuole. Arriva il giorno che scegli. Prezzo di lancio fino al 25 dicembre, poi 129 €.</p>
        </div>
      </div>
    </section>

    ${sezione(`${etichetta("Perché", C.oro)}
      ${titolo("Ogni famiglia ha una storia. Raccontatela insieme.", C.panna)}
      <p style="font-size:17px;line-height:1.55;margin:0 0 14px;color:#F1E4CF">Le storie di casa vivono nei pranzi della domenica, nelle foto sparse su dieci telefoni, nelle ricette che nessuno ha mai scritto. Ancora le mette insieme, in un posto solo, vostro.</p>
      <p style="font-family:Fraunces,serif;font-size:20px;line-height:1.45;margin:0;color:${C.panna}">L'<b>ancora</b> tiene ferma la barca nel porto sicuro: le radici, la famiglia. <b>Ancora</b> vuol dire anche di più, un'altra volta: «raccontamela ancora».</p>`,
      C.notte, "", "perche")}

    ${sezione(`${etichetta("Ognuno il suo motivo")}
      ${MOTIVI.map(([t, d]) => `<div style="padding:14px 0;border-bottom:1px solid #EAD9BF">
        <b style="font-family:Fraunces,serif;font-size:21px;color:${C.rosso}">${t}</b>
        <div class="tenue" style="margin-top:2px">${d}</div></div>`).join("")}`, C.panna)}

    ${sezione(`${etichetta("Come funziona")}
      <span id="come" style="display:block;scroll-margin-top:80px"></span>${titolo("Una domanda. Una risposta a voce. Un ricordo in più.")}
      ${[["Regali la storia della famiglia", "Ricevi subito il biglietto con il codice: lo mandi su WhatsApp il giorno che vuoi o lo metti sotto l'albero. Chi lo riceve crea la sua famiglia e invita chi vuole."],
         ["Arriva la domanda", "Ogni settimana, a ognuno, una domanda nuova: «Qual è il tuo primo ricordo?». E una per tutta la famiglia. Si risponde a voce, con calma."],
         ["La famiglia si scopre", "Le risposte finiscono nell'album di famiglia. Si ascolta, si commenta, si chiede ancora: anche i nonni scoprono i nipoti."]]
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
      ${COSA.map(([t, d]) => `<div style="padding:11px 0;border-bottom:1px solid var(--bordo)"><b>${t}</b> <span class="tenue">· ${d}</span></div>`).join("")}`, "transparent", "inherit", "cosa")}

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

    ${sezione(`${etichetta("Per chi conta davvero")}
      <h2 style="font-family:Fraunces,serif;font-size:30px;line-height:1.15;margin:6px 0 14px;color:${C.panna}">«Papà, tu che avresti fatto al posto mio?»</h2>
      <p style="font-size:17px;line-height:1.55;color:#E6EFEC;margin:0 0 12px">Un giorno qualcuno te lo chiederà. Ancora ti aiuta a lasciare la risposta, un poco alla volta: domande sul lavoro, sui soldi, sull'amicizia, sulle scelte difficili. Non cosa hai fatto, ma <b style="color:${C.panna}">come ragioni e come decidi</b>.</p>
      <p style="font-size:17px;line-height:1.55;color:#E6EFEC;margin:0 0 12px">Le domande imparano da quello che racconti, e ogni risposta resta a chi scegli tu. Puoi anche scrivere <b style="color:${C.panna}">una lettera da aprire più avanti</b>: per i 18 anni di tua figlia, o tra dieci anni. Fino a quel giorno resta chiusa.</p>
      <p style="font-size:15px;color:#B9CCC7;margin:0">Ai ragazzi basta usarla come un social. Ai grandi dà qualcosa in più: un posto per quello che sanno e per quello che sono.</p>`, C.notte, C.panna, "per-chi-conta")}
    <section id="eredita" style="padding:34px 20px">
      <p style="margin:0 0 6px;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:${C.oro}">Lo scrigno della famiglia</p>
      ${titolo("I tuoi ricordi, all'infinito. E ancora.")}
      <div style="display:grid;gap:14px">
        ${[["panettone", "Le tue ricette, in eredità.", "Le dosi giuste, i trucchi, la tua voce mentre le spieghi."],
           ["compiti", "La tua storia, in eredità ai nipoti.", "Le scelte, le avventure, il tuo modo di vedere le cose. Raccontate da te."],
           ["letto", "Le storie dei nonni, ascoltate dai nipoti dei nipoti.", "Registrate una volta, restano lì. Con la voce di chi le racconta."],
           ["colazione", "Non perdere più un ricordo tra mille chat.", "Ogni foto, ogni vocale, ogni storia ha il suo posto, solo per voi."]]
          .map(([f, t, d]) => `<div style="border-radius:20px;overflow:hidden;background:#fff;border:1px solid var(--bordo)">
            <div style="aspect-ratio:900/480;background:url('img/promo/${f}.jpg') center/cover"></div>
            <div style="padding:14px 16px 16px"><b style="font-family:Fraunces,serif;font-size:21px;line-height:1.2;color:${C.notte}">${t}</b>
              <p class="tenue" style="margin:6px 0 0;font-size:15px;line-height:1.45">${d}</p></div></div>`).join("")}
      </div></section>

    ${sezione(`${etichetta("Pacchetti")}
      <div style="border-radius:22px;padding:20px;background:${C.rosso};color:${C.panna};margin-bottom:12px">
        <div class="riga"><b style="flex:1;font-size:19px">La storia della tua famiglia</b><b style="font-family:Fraunces,serif;font-size:36px">99 €</b></div>
        <div style="color:#F1DCCB;margin-top:4px;line-height:1.45">Un anno di Ancora+ per tutti, <b>il libro a colori</b> con i QR delle voci e il PDF, <b>il film dell'anno</b> e il biglietto regalo. Prezzo di lancio fino a Natale, poi 129 €.</div></div>
      <div style="border-radius:22px;padding:20px;background:#fff;border:1px solid var(--bordo);margin-bottom:12px">
        <div class="riga"><b style="flex:1;font-size:18px">Ancora<span style="color:${C.oro}">+</span></b><b style="font-family:Fraunces,serif;font-size:26px;color:${C.salvia}">99 € <small style="font-size:14px">l'anno</small></b></div>
        <div class="tenue" style="margin-top:4px">Oppure 9,99 € al mese. Basta che paghi uno e lo ha tutta la famiglia: <b>albero senza limiti</b> e <b>alberi uniti</b> tra famiglie, <b>album degli eventi</b> con il QR, <b>il libro delle storie</b>, le domande sul telefono per i nonni, <b>200 GB</b>. Le storie e i consigli di ognuno, sempre lì quando servono.</div></div>
      <div style="border-radius:22px;padding:20px;background:${C.panna};border:1px solid #EAD9BF;margin-bottom:12px">
        <div class="riga"><b style="flex:1;font-size:18px">Gratis</b><b style="font-family:Fraunces,serif;font-size:26px;color:${C.notte}">0 €</b></div>
        <div class="tenue" style="margin-top:4px">L'account, tutte le famiglie e i gruppi che vuoi, chat, storie, calendario, liste, spese, ricettario, diario, l'albero fino a 15 persone. 2 GB a testa, +1 GB per ogni amico che porti (fino a +10 GB).</div>
        <a class="btn chiaro" href="#/iscriviti" style="margin-top:12px">Crea il tuo account gratis</a></div>
      <div style="padding:4px 4px 0;line-height:1.7">
        <b>Servizi in più, quando servono</b><br>
        <span class="tenue">Libro stampato 49 € in bianco e nero, 69 € a colori · Un narratore in più 1,99 € al mese · Spazio +100 GB 2,99 € al mese</span></div>
      <p style="margin:14px 0 0;color:${C.salvia};font-weight:700">I ricordi già salvati restano tuoi e gratis, anche se smetti di pagare.</p>`, "transparent", "inherit", "pacchetti")}

    <section id="acquista" style="background:${C.panna};padding-top:30px;scroll-margin-top:60px">
      <div style="padding:0 20px">${etichetta("Regala Ancora")}</div>
      <div id="modulo-regalo"></div>
    </section>

    ${sezione(`${etichetta("Domande")}
      ${DOMANDE.map(([q, r]) => `<details style="border-bottom:1px solid var(--bordo);padding:14px 0"><summary style="font-weight:800;cursor:pointer">${q}</summary>
        <p style="margin:8px 0 0;line-height:1.5">${r}</p></details>`).join("")}
      <p style="margin-top:16px">Altre domande? <a href="#/contatti">Scrivici</a>.</p>`, "transparent", "inherit", "faq")}
    <section id="contatti" style="padding:34px 20px;background:#F3E9D8">
      ${titolo("Parliamone")}
      <p style="margin:0 0 16px;font-size:17px;line-height:1.5">Un dubbio sul regalo, una domanda, un'idea? Rispondiamo noi, di persona, di solito in giornata.</p>
      <div style="display:grid;gap:10px;max-width:520px">
        <a class="btn ambra" href="#/contatti">✉️ Scrivici un messaggio</a>
        <a class="btn chiaro" href="#/assistenza">💬 Sei già su Ancora? Scrivici in chat</a>
      </div></section>

    ${piePubblico()}
    <div id="barra-acquisto" style="position:fixed;left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));max-width:540px;margin:0 auto;z-index:20;
      display:none;align-items:center;gap:10px;background:${C.notte};color:${C.panna};border-radius:999px;padding:8px 8px 8px 18px;box-shadow:0 10px 30px rgba(0,0,0,.3)">
      <span style="flex:1;font-weight:700;font-size:14px;line-height:1.2">Regalo di Natale<br><span style="color:#F4D39B">99 € · la storia della famiglia</span></span>
      <a href="#acquista" class="vai-acquista btn" style="width:auto;margin:0;min-height:44px;padding:0 20px;background:${C.oro};color:${C.notte}">Regala</a></div>`;

  montaModulo(document.getElementById("modulo-regalo"));
  collegaMenu(); collegaPie();
  // dal menu: #/scopri?s=faq porta direttamente alla sezione
  if (params?.s) setTimeout(() => document.getElementById(params.s)?.scrollIntoView({ behavior: "smooth" }), 120);
  else scrollTo(0, 0);
  document.getElementById("vai-come").onclick = (e) => { e.preventDefault(); document.getElementById("come").scrollIntoView({ behavior: "smooth" }); };
  // il bottone in alto scorre al modulo senza cambiare pagina
  document.querySelectorAll(".vai-acquista").forEach((a) => a.onclick = (e) => {
    e.preventDefault();
    document.getElementById("acquista").scrollIntoView({ behavior: "smooth" });
  });
  // la barra "Regala" in basso: compare dopo la copertina, sparisce sul modulo e se c'è il banner cookie
  const barra = document.getElementById("barra-acquisto"), modulo = document.getElementById("acquista");
  const aggiornaBarra = () => {
    if (!document.body.contains(barra)) { removeEventListener("scroll", aggiornaBarra); return; }
    const r = modulo.getBoundingClientRect();
    const sulModulo = r.top < innerHeight && r.bottom > 0;
    barra.style.display = scrollY > 560 && !sulModulo && !document.getElementById("banner-cookie") ? "flex" : "none";
  };
  addEventListener("scroll", aggiornaBarra, { passive: true });
  misuraLanding();
}

// Cosa fanno le persone qui (per campagna, con il consenso): sezioni viste, quanto scorrono, clic, tempo
function misuraLanding() {
  traccia("vista");
  const radice = $app();
  const os = new IntersectionObserver((voci) => voci.forEach((v) => { if (v.isIntersecting) { traccia("sezione:" + v.target.id); os.unobserve(v.target); } }), { threshold: 0.35 });
  radice.querySelectorAll("section[id], [id=acquista]").forEach((el) => os.observe(el));
  let massimo = 0;
  const scorri = () => {
    if (!location.hash.startsWith("#/scopri") && location.hash !== "" && location.hash !== "#/") { removeEventListener("scroll", scorri); return; }
    const p = Math.round((scrollY + innerHeight) / document.documentElement.scrollHeight * 100);
    for (const soglia of [25, 50, 75, 100]) if (p >= soglia - 2 && massimo < soglia) { massimo = soglia; traccia("scroll", soglia); }
  };
  addEventListener("scroll", scorri, { passive: true });
  radice.addEventListener("click", (e) => {
    const b = e.target.closest("a, button"); if (!b) return;
    const h = b.getAttribute("href") ?? "";
    const testo = b.classList.contains("vai-acquista") ? "regala" : h.includes("iscriviti") ? "inizia gratis" : h.includes("contatti") ? "contatti"
      : (b.textContent || b.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim().toLowerCase().slice(0, 40);
    if (testo) traccia("clic:" + testo);
  }, true);
  const inizio = Date.now();
  const fine = () => { if (document.visibilityState === "hidden") traccia("tempo", Math.min(3600, Math.round((Date.now() - inizio) / 1000))); };
  document.addEventListener("visibilitychange", fine, { once: true });
}
