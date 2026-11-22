// Istruzioni: tutte le spiegazioni in un posto solo (le pagine dell'app restano pulite).
// Si aggiornano a ogni novità: aggiungere una voce in NOVITA e, se serve, una sezione.
import { istruzioniSchermataHome } from "../app.js";
import { $app, esc } from "../app.js";

const AGGIORNATE = "22 novembre 2026";

const NOVITA = [
  ["22 novembre 2026 · sera tardi", "Storie: in basso «👁 Vista da…» con chi l'ha vista e come ha reagito; ⋯ in alto per eliminarle (le storie non si modificano: si rifanno). Il numerino rosso sull'icona di Ancora segna i messaggi non letti."],
  ["22 novembre 2026 · sera tardi", "Libreria musicale per le storie: 25 brani, anche rock e rap (allegri, di Natale, compleanno, dolci, emozionanti, viaggio). Si ascoltano prima di sceglierli."],
  ["22 novembre 2026 · sera", "Storie come su Instagram: testo (Aa) con colori, emoji da spostare e ingrandire, musica da un file del telefono. Guardando una storia: reazioni con le emoji e risposte, che arrivano anche in chat."],
  ["22 novembre 2026 · sera", "Foto dei post a scorrimento con doppio tocco per il cuore; ⋯ sui tuoi post per modificarli o eliminarli; le domande ora arrivano come notifica e stanno in Chat → Domande per te."],
  ["22 novembre 2026 · sera tardi", "Come mettere Ancora sulla schermata Home, con i passi giusti per il tuo telefono."],
  ["22 novembre 2026 · sera", "Risposte in automatico, con le parole e la voce di chi non può rispondere. Domande sul carattere: come ragioni, come decidi. Domande su misura (dal Profilo). Lettere da aprire più avanti. Il tuo filo nel Profilo."],
  ["22 novembre 2026", "Menu laterale ☰ con tutte le voci. La domanda della settimana arriva a tutti, non solo ai nonni. Gli alberi di più famiglie si uniscono. Foto profilo e copertina per persone e famiglie."],
];

const SEZIONI = [
  ["musica", "La musica delle storie", `
    <p>Quando crei una storia tocca <b>♪</b>: puoi scegliere un brano della libreria di Ancora (tocca ▶ per ascoltarlo, poi <b>Usa</b>) oppure, con <b>Dal mio telefono</b>, l'audio di un video o un file audio salvato nell'app File.</p>
    <p class="tenue">Le musiche della libreria sono brani originali di Ancora e melodie tradizionali e classiche di pubblico dominio (Jingle Bells, Tu scendi dalle stelle, Astro del ciel, Tanti auguri, la Ninna nanna di Brahms, l'Inno alla gioia, Per Elisa, il Canone di Pachelbel, il Bel Danubio blu, la Marcia nuziale, la Tarantella), suonate per Ancora. Le canzoni di Apple Music e Spotify non si possono usare: sono protette.</p>`],
  ["schermata-home", "Metti Ancora sulla schermata Home", `
    <p>Così si apre con un tocco, a tutto schermo, come le altre app. Sul tuo telefono:</p>
    ${istruzioniSchermataHome()}`],
  ["primi-passi", "Primi passi", `
    <p>Apri il menu <b>☰</b> in alto a destra: lì trovi tutto. In alto vedi il nome della famiglia che stai guardando; per cambiarla, scegline un'altra dal menu.</p>
    <p>Il tasto arancione in basso serve a <b>raccontare</b>: tienilo premuto e parla.</p>
    <p>Metti la tua foto e una copertina dal <b>Profilo</b>, e scrivi come ti chiamano in famiglia.</p>`],
  ["famiglie", "Famiglie e cerchie", `
    <p>Puoi stare in più famiglie: la tua, quella dei tuoi genitori, quella di tua moglie o di tuo marito, e in gruppi di amici. Ognuna vede solo quello che condividi con lei.</p>
    <p>Da <b>Famiglie e cerchie</b>: <b>Apri</b> per vedere la bacheca, <b>Invita</b> per mandare il link a qualcuno, <b>Rinomina</b> per cambiare nome. Chi ha creato la famiglia può mettere foto e copertina.</p>
    <p>Quando racconti o carichi un ricordo, scegli con chi condividerlo: una famiglia, più famiglie, o solo te.</p>`],
  ["domande", "Le domande", `
    <p><b>La domanda di famiglia:</b> una a settimana, uguale per tutti. Rispondete come volete: a voce, con una foto, scrivendo. Le risposte restano nella pagina "La domanda della settimana".</p>
    <p><b>La tua domanda:</b> in bacheca, ognuno ha la sua, dai nonni ai ragazzi. Premi <b>Rispondi a voce</b>; se non ti va, <b>Cambia</b>.</p>
    <p><b>Fare una domanda a qualcuno:</b> apri il suo profilo e premi <b>Chiedi</b>. Gli arriva come prossima domanda, con il tuo nome.</p>
    <p>Chi non usa l'app (per esempio un nonno) può ricevere le domande con un messaggio sul telefono e rispondere a voce: si imposta dal <b>Piano</b>.</p>`],
  ["perche", "Perché raccontare", `
    <p>Un giorno qualcuno che ami potrebbe chiedersi: <i>"Lui, al posto mio, cosa avrebbe fatto?"</i>. Ogni cosa che racconti è una risposta in più: non solo cosa è successo, ma come la pensi e come decidi.</p>
    <p>Per questo le domande per i grandi parlano di scelte: il lavoro, i soldi, gli amici, i litigi, i figli. Ai ragazzi arrivano domande più leggere.</p>
    <p><b>Domande su misura:</b> se le attivi dal <b>Profilo</b>, le prossime domande partono da quello che hai raccontato. I testi li legge solo un programma, in automatico; nessuna persona li vede. Puoi toglierle quando vuoi.</p>
    <p><b>Una lettera per più avanti:</b> dal menu, scrivi a una persona o alla famiglia e scegli quando si apre (tra un anno, ai suoi 18 anni, un giorno preciso). Fino ad allora chi la riceve vede solo che c'è.</p>
    <p><b>Quando qualcuno non può rispondere (Ancora+):</b> di solito risponde la persona, in chat. Se non può (si è segnata <i>"non posso rispondere"</i> dal Profilo, o non c'è più), puoi scriverle lo stesso: <i>"mi racconti di quella volta a…"</i>, <i>"tu che faresti al posto mio?"</i>. Risponde in automatico come risponderebbe lei, da tutto quello che ha raccontato (mai il diario privato), e con la sua voce se l'ha creata. Lo trovi sul suo profilo e nella chat: <b>Risponde in automatico</b>. Se Ancora+ è scaduto, chiunque della famiglia può riattivarlo.</p>
    <p><b>Il tuo filo:</b> nel Profilo vedi quante cose hai raccontato, con la tua voce, le ricette e le lettere.</p>`],
  ["racconta", "Raccontare", `
    <p>Tieni premuto il tasto arancione e parla: quando lasci, il racconto è registrato. Puoi riascoltarlo prima di condividerlo, aggiungere un titolo e una foto.</p>
    <p>Puoi anche partire da una foto: "Chi c'è in questa foto? Dove eravate?".</p>`],
  ["cloud", "Il cloud dei ricordi", `
    <p>In <b>I miei ricordi</b> scatti o carichi foto, video e vocali. Li vedi solo tu finché non li condividi: selezionali e scegli con quale famiglia.</p>
    <p>Lo spazio: 2 GB gratis, 200 GB per la famiglia con Ancora+, e se serve +100 GB dai Servizi. Quando sei vicino al limite te lo diciamo.</p>`],
  ["albero", "L'albero", `
    <p>Tocca una persona per aggiungere genitori, figli o coniuge. L'albero lo completa tutta la famiglia, anche con chi non c'è più.</p>
    <p><b>Alberi uniti:</b> se una persona è in due alberi (per esempio tua moglie nel tuo e in quello dei suoceri), toccala e scegli <b>È anche in un altro albero? → Collega</b>. Con <b>🔗 Tutti uniti</b> vedi tutti gli alberi insieme.</p>
    <p>Con tante persone usa <b>−</b>, <b>Tutto</b> e <b>+</b> per vedere l'albero intero.</p>`],
  ["ricette", "Il ricettario", `
    <p>Le ricette di casa, con la voce di chi le fa: ingredienti, dosi, passaggi, e il vocale. Si cercano per nome.</p>`],
  ["diario", "Il diario", `
    <p>È solo tuo: nessun altro lo vede. Ogni giorno una riga, a voce o scritta. Se salti un giorno, niente sensi di colpa. Ogni tanto ti ricorda cosa scrivevi lo stesso giorno di un anno fa.</p>`],
  ["agenda", "L'agenda: vacanze, compiti, esami", `
    <p>Si accende per famiglia: chi l'ha creata va in <b>Famiglie e cerchie → Agenda di questa cerchia</b> e spunta le voci. Le voci accese compaiono nel menu ☰ di tutti.</p>
    <p>Ognuno può spegnerle per sé dal <b>Profilo → Le mie impostazioni</b>: se spegni una voce, non la vedi tu e nessuno vede la tua.</p>
    <p><b>Vacanze:</b> date, posto, chi viene, chi porta cosa. <b>Compiti</b> ed <b>esami</b>: l'esito è facoltativo e puoi tenerlo privato.</p>`],
  ["libro", "Il libro delle storie", `
    <p>Dal profilo di una persona: <b>Il libro</b>. Ogni pagina ha il codice QR: chi lo inquadra con il telefono sente la voce del racconto.</p>
    <p>Il libro digitale è incluso. Quello stampato si ordina dai <b>Servizi</b>.</p>`],
  ["piano", "Il piano e i servizi", `
    <p>Ancora+ dà lo spazio grande e le domande sul telefono per chi non usa l'app. Se ti hanno regalato Ancora o ti hanno invitato, sei già in un piano: apri il link dell'invito.</p>
    <p>I ricordi restano gratis per sempre. I servizi (libro stampato, una persona in più con le domande sul telefono, spazio in più) li prendi solo se ti servono.</p>`],
  ["privacy", "Chi vede cosa", `
    <p>Ogni ricordo lo vedono solo le persone e le famiglie che scegli. Chi gestisce Ancora non vede i vostri contenuti. Il diario è solo tuo.</p>
    <p>Le notifiche le accendi e spegni dal Profilo. <a href="#/privacy">Informativa privacy</a> · <a href="#/condizioni">Condizioni</a></p>`],
];

export default async function ({ params } = {}) {
  $app().innerHTML = `
    <header class="testa"><span class="logo" style="font-size:22px">Istruzioni</span><span style="flex:1"></span></header>
    <div class="pad" style="padding-top:0">
      <p class="tenue" style="margin:0 0 14px">Aggiornate il ${AGGIORNATE}</p>
      <details class="card" style="margin:0 0 12px;border:2px solid var(--ambra)" ${params?.s ? "" : "open"}>
        <summary style="font-weight:800;cursor:pointer;min-height:28px">✨ Novità</summary>
        ${NOVITA.map(([d, t]) => `<p style="margin:10px 0 0"><b>${esc(d)}</b><br>${esc(t)}</p>`).join("")}
      </details>
      ${SEZIONI.map(([id, titolo, testo]) => `<details class="card" id="${id}" style="margin:0 0 10px" ${params?.s === id ? "open" : ""}>
        <summary style="font-weight:800;font-size:17px;cursor:pointer;min-height:28px">${titolo}</summary>
        <div style="line-height:1.55">${testo}</div></details>`).join("")}
      <p style="margin:18px 0 30px">Non trovi la risposta? <a href="#/contatti">Scrivici</a>.</p>
    </div>`;
  if (params?.s) setTimeout(() => document.getElementById(params.s)?.scrollIntoView({ behavior: "smooth" }), 100);
}
