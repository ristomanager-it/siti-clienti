// Istruzioni: tutte le spiegazioni in un posto solo (le pagine dell'app restano pulite).
// Si aggiornano a ogni novità: aggiungere una voce in NOVITA e, se serve, una sezione.
import { istruzioniSchermataHome } from "../app.js";
import { $app, esc } from "../app.js";

const AGGIORNATE = "24 novembre 2026";

const NOVITA = [
  ["24 novembre 2026 · sera", "Le corse in 3D (tre visuali, giro veloce con classifica, gara dal vivo fino a 6), i campionati e i tornei del gruppo, il calciobalilla con due pollici e il biliardo a schermo intero."],
  ["24 novembre 2026", "Biliardo e calciobalilla (anche col campo sul televisore). Ai tavoli ci si parla dal vivo con 🎙️ Parla. Gli inviti a giocare compaiono anche in home. Cartoline dei ricordi da mandare su WhatsApp, l'album della festa per gli invitati, la locandina col tuo codice e i premi per chi porta famiglie su Ancora."],
  ["22 novembre 2026 · sera tardi", "Storie: in basso «👁 Vista da…» con chi l'ha vista e come ha reagito; ⋯ in alto per eliminarle (le storie non si modificano: si rifanno). Il numerino rosso sull'icona di Ancora segna i messaggi non letti."],
  ["23 novembre 2026", "L'aiutante della famiglia: il nome lo scegliete voi. L'albero in 2 minuti (mamma, papà, nonni, figli in una pagina) e le famiglie che si collegano con un tocco. Il film dell'anno e il libro della famiglia. La chat Assistenza nel menu. Regala Ancora anche a un'altra famiglia, con il 3x2. La pagina di vendita nella lingua del telefono."],
  ["22 novembre 2026 · sera tardi", "Libreria musicale per le storie: 25 brani, anche rock e rap (allegri, di Natale, compleanno, dolci, emozionanti, viaggio). Si ascoltano prima di sceglierli."],
  ["22 novembre 2026 · sera", "Storie come su Instagram: testo (Aa) con colori, emoji da spostare e ingrandire, musica da un file del telefono. Guardando una storia: reazioni con le emoji e risposte, che arrivano anche in chat."],
  ["22 novembre 2026 · sera", "Foto dei post a scorrimento con doppio tocco per il cuore; ⋯ sui tuoi post per modificarli o eliminarli; le domande ora arrivano come notifica e stanno in Chat → Domande per te."],
  ["22 novembre 2026 · sera tardi", "Come mettere Ancora sulla schermata Home, con i passi giusti per il tuo telefono."],
  ["22 novembre 2026 · sera", "Domande sul carattere: come ragioni, come decidi. Domande su misura (dal Profilo). Lettere da aprire più avanti. Il tuo filo nel Profilo."],
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
  ["famiglie", "Famiglie e gruppi", `
    <p>Puoi stare in più famiglie: la tua, quella dei tuoi genitori, quella di tua moglie o di tuo marito, e in gruppi di amici. Ognuna vede solo quello che condividi con lei.</p>
    <p>Da <b>Famiglie e gruppi</b>: <b>Apri</b> per vedere la bacheca, <b>Invita</b> per mandare il link a qualcuno, <b>Rinomina</b> per cambiare nome. Chi ha creato la famiglia può mettere foto e copertina.</p>
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
    <p>Si accende per famiglia: chi l'ha creata va in <b>Famiglie e gruppi → Agenda di questo gruppo</b> e spunta le voci. Le voci accese compaiono nel menu ☰ di tutti.</p>
    <p>Ognuno può spegnerle per sé dal <b>Profilo → Le mie impostazioni</b>: se spegni una voce, non la vedi tu e nessuno vede la tua.</p>
    <p><b>Vacanze:</b> date, posto, chi viene, chi porta cosa. <b>Compiti</b> ed <b>esami</b>: l'esito è facoltativo e puoi tenerlo privato.</p>`],
  ["libro", "Il libro delle storie", `
    <p>Dal profilo di una persona: <b>Il libro</b>. Dal menu: <b>Il libro della famiglia</b>, l'anno di tutti mese per mese. Ogni pagina con una voce ha il codice QR: chi lo inquadra con il telefono la sente.</p>
    <p>Senza Ancora+ vedi le prime pagine; con Ancora+ il libro intero, il PDF e la stampa. Quello stampato si ordina anche dai <b>Servizi</b>.</p>`],
  ["aiutante", "L'aiutante della famiglia", `
    <p>Dal menu, sotto <b>La famiglia</b>: la prima volta gli date un nome (si cambia con «rinomina»). Poi gli scrivi o gli parli col 🎙: «domenica pranzo dalla zia alle 13», «aggiungi latte alla spesa», «quando è il compleanno del nonno?», «cosa è successo questa settimana?».</p>
    <p>È anche cuoco e giardiniere: col 📷 fotografi il frigo e ti propone la cena, una pianta e ti dice come curarla, una ricetta scritta a mano e la ricopia nel ricettario. Puoi chiedergli anche di casa, gite, regali e compiti. Ti fa il menu della settimana con la spesa completa, ti aiuta a scrivere un ricordo (glielo racconti, lui lo sistema e lo pubblica nel feed o nel diario), ti legge le risposte con 🔊 e alle 8 ti manda il buongiorno con compleanni e impegni (si spegne in alto nella chat). Quello che fa compare in un riquadro con <b>Apri</b> e <b>Annulla</b>. Vede solo quello che vedi tu e la tua chat con lui è solo tua. È incluso in Ancora+ (basta una persona per tutta la famiglia).</p>
    <p>È incluso in Ancora+: <b>300 domande al mese</b> per tutta la famiglia, che bastano largamente. Se finiscono prima, con <b>2,99 €</b> ne aggiungi 100 che non scadono, oppure aspetti il mese nuovo.</p>`],
  ["giochi", "I giochi", `
    <p>Dal menu, <b>🎲 Giochi</b>: scegli con chi giocare (la famiglia o un gruppo di amici). Chi apre il tavolo sceglie: <b>avvisa tutto il gruppo</b> (arriva la notifica a tutti) oppure <b>invita un amico su WhatsApp</b>, anche se non è su Ancora. L'amico entra solo a quel tavolo: non vede la famiglia né il gruppo. Se manca qualcuno, gioca il telefono.</p>
    <p><b>Gratis per tutti:</b> la tombola (chi fa il banco scrive i premi, può mettere il prezzo della cartella e l'app tiene la cassa; si può fissare giorno e ora), la briscola a 2, a 4 a coppie (con i segni al compagno) e a 5 chiamata, il tressette a 2 e a 4 (busso, striscio e volo). Le carte sono le napoletane, e al tavolo si può scrivere, e con <b>🎙️ Parla</b> ci si parla dal vivo. E poi il biliardo (palla 8) e il calciobalilla a 2 o a 4: il campo si può mettere sul televisore e i telefoni fanno da manopole.</p>
    <p><b>Con Ancora+:</b> il gioco della famiglia. Prima rinominate il tabellone con i vostri posti e scrivete le vostre carte Ricordo, poi si compra, si costruisce e si incassa.</p>`],
  ["notifiche", "Le notifiche (e la schermata Home)", `
    <p>Prima metti Ancora sulla schermata Home (vedi sopra): su iPhone le notifiche arrivano solo così. Poi apri Ancora dall'icona e, dal <b>Profilo</b>, alla voce <b>Notifiche</b> tocca <b>Attiva</b> (o dal riquadro di benvenuto).</p>
    <p>Ti arrivano gli inviti ai tavoli, i messaggi, le foto e le domande della famiglia. Gli inviti a giocare li trovi anche in home, nella fascia «Ti aspettano al tavolo».</p>`],
  ["tornei", "Campionati e tornei", `
    <p>Da <b>🎲 Giochi</b> → <b>🏆 Campionati e tornei</b>: scegli il gioco (briscola, tressette, biliardo, calciobalilla, corse), chi partecipa e la formula. <b>Campionato</b>: tutti contro tutti, 3 punti a chi vince e 1 a testa se si pareggia; nelle corse si fanno più gare con i punti della Formula 1. <b>Torneo</b>: tabellone a sorteggio, chi perde esce fino alla finale.</p>
    <p>Quando tocca a te trovi la sfida in home: premi <b>Gioca ora</b> e la partita si apre con l'avversario già seduto (gli arriva la notifica). A fine partita il risultato entra da solo nella classifica o nel tabellone, e il gruppo riceve l'avviso.</p>`],
  ["voce", "Parlarsi ai tavoli", `
    <p>In ogni gioco, in basso, c'è <b>🎙️ Parla</b>: chi lo preme entra nella voce del tavolo e si sente con gli altri, come in una chiamata. 🔇 per il muto, ✕ per uscire. La prima volta il telefono chiede il permesso del microfono. L'audio va diretto da telefono a telefono.</p>`],
  ["premi", "Invita e guadagna Ancora+", `
    <p>Dal menu: <b>Invita e guadagna</b>. Per chi entra col tuo link (o dai tuoi inviti ai giochi, alle ricette, alle cartoline) Ancora è gratis. Quando una famiglia che hai portato si abbona ad Ancora+, il <b>20% del suo primo pagamento</b> è tuo; alla quinta famiglia abbonata, <b>1 anno di Ancora+</b>.</p>
    <p>Quando una famiglia che hai portato passa ad Ancora+, il <b>20%</b> del suo primo pagamento è tuo: se paghi Ancora+ te lo rimborsiamo sulla carta, se no diventa giorni di Ancora+ gratis.</p>`],
  ["cartoline", "Le cartoline dei ricordi", `
    <p>Apri un ricordo della famiglia e tocca <b>💌 Fanne una cartolina</b>: ti prepara un'immagine da mandare su WhatsApp o mettere negli stati. Chi la riceve vede l'inizio; per leggerlo tutto e sentire la voce si iscrive. Il diario, le lettere chiuse e i ricordi privati non si condividono.</p>`],
  ["festa", "L'album della festa", `
    <p>Dal menu, <b>Album degli eventi</b>: crei l'album di un matrimonio, un compleanno, una comunione e stampi il QR per i tavoli. Gli invitati caricano le foto senza iscriversi; se lo permetti, chi si iscrive le vede tutte.</p>`],
  ["locandina", "La locandina col tuo codice", `
    <p>Dal menu, <b>Porta Ancora in parrocchia o a scuola</b>: una locandina A4 da stampare (parrocchia, scuola, centro anziani, negozio) col tuo QR. Chi si iscrive da lì conta per i tuoi premi.</p>`],
  ["inviti", "Invitare tanti con un link", `
    <p>Su una famiglia o un gruppo tocca <b>Invita</b> e scegli per quante persone vale il link (1, 2, 5, 10, 20 o 30). Lo mandi una volta, anche nella chat WhatsApp della famiglia, e ognuno entra col suo telefono. Sotto vedi quanti sono già entrati, e puoi rimandarlo o chiuderlo.</p>`],
  ["film", "Il film dell'anno", `
    <p>Dal menu: <b>Il film dell'anno</b>. Scegli il gruppo, il periodo e la musica: il telefono monta foto e video e lo vedi nascere. Poi lo salvi o lo mandi a tutti. Tieni l'app aperta mentre si crea.</p>
    <p>Senza Ancora+ un'anteprima di 5 momenti; con Ancora+ il film intero.</p>`],
  ["piano", "Il piano e i servizi", `
    <p><b>Gratis, senza limiti:</b> chat, gruppi, foto, storie, inviti, calendario, liste, spese, diario e domanda della settimana.</p>
    <p><b>Gratis, per provare:</b> 3 ricette per famiglia, l'albero fino a 10 persone, una lettera da aprire più avanti, un album degli eventi, le prime pagine del libro e 5 momenti del film. Quello che hai già fatto resta sempre: si ferma solo l'aggiunta oltre il limite.</p>
    <p><b>Ancora+</b> (99 € l'anno o 9,99 € al mese): tutto senza limiti, gli alberi uniti tra famiglie, il libro intero e il film, le domande su misura, 200 GB per la famiglia. Basta che lo prenda uno e ce l'hanno tutti. Se ti hanno regalato Ancora, attiva il codice da <b>Il mio account → Codice omaggio</b>.</p>
    <p>I ricordi restano gratis per sempre. I servizi (libro stampato, una persona in più con le domande sul telefono, spazio in più) li prendi solo se ti servono.</p>`],
  ["privacy", "Chi vede cosa", `
    <p>Ogni ricordo lo vedono solo le persone e le famiglie che scegli. Chi gestisce Ancora non vede i vostri contenuti. Il diario è solo tuo.</p>
    <p>Le notifiche le accendi e spegni dal Profilo. <a href="#/privacy">Informativa privacy</a> · <a href="#/condizioni">Condizioni</a></p>`],
];

export default async function ({ params } = {}) {
  $app().innerHTML = `
    <header class="testa"><span class="logo" style="font-size:22px">📖 Libretto di istruzioni</span><span style="flex:1"></span></header>
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
