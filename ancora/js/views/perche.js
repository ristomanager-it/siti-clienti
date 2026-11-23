// Il perché, il come e il cosa di Ancora (pagina pubblica)
import { $app } from "../app.js";

export default async function () {
  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/accesso" aria-label="Indietro"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></a><span class="logo" style="font-size:22px">Ancora</span><span style="width:44px"></span></header>
    <div class="pad">
      <h1 style="margin:8px 0 6px">Le radici che restano.</h1>
      <p class="tenue" style="font-size:15px;margin-top:0">Ognuno ci trova il suo motivo. Ecco i nostri.</p>
    </div>
    <div class="lettera" style="font-size:18px">L'<b>ancora</b> tiene ferma la barca nel porto sicuro: le radici, la famiglia, la voce di chi ci ha cresciuti.
<b>Ancora</b> vuol dire anche di più, un'altra volta, senza fine: "raccontamela ancora".
Ciò che ci tiene saldi resta con noi, ancora e ancora.</div>
    <h2>Ognuno il suo motivo</h2>
    <div class="pad" style="padding-top:0"><ul style="padding-left:20px;line-height:1.6">
      <li><b>Le storie di casa, raccontate da chi le ha vissute.</b> Con il loro tono e il loro dialetto.</li>
      <li><b>La famiglia che si mette insieme.</b> Ognuno aggiunge un pezzo: una foto, un ricordo, un nome nell'albero.</li>
      <li><b>Il cloud dei tuoi ricordi.</b> Non solo foto e video: le storie, le voci, le ricette, il diario, l'albero. Al sicuro, senza pubblicità e senza estranei.</li>
      <li><b>Le ricette di casa,</b> con la voce di chi le fa.</li>
      <li><b>Sentirsi vicini quando si è lontani:</b> chi vive all'estero, i nipoti fuori sede, i nonni soli.</li>
      <li><b>Ritrovarsi,</b> se in famiglia ci si è persi di vista.</li>
      <li><b>Un regalo che dura tutta la vita</b>, e un libro da sfogliare.</li>
    </ul></div>
    <h2>Perché</h2>
    <div class="pad" style="padding-top:0">
      <p><b>Ogni famiglia ha una storia: raccontatela insieme.</b> Le storie di casa vivono nei pranzi della domenica, nelle foto sparse su dieci telefoni, nelle ricette mai scritte. Ancora le mette insieme, in un posto solo, vostro.</p>
      <ol style="padding-left:20px">
        <li><b>Tenere ferme le radici.</b> I ricordi e la voce di chi ci ha cresciuti, al sicuro e privati.</li>
        <li><b>Riavvicinare chi è lontano adesso.</b> Il nonno racconta, il nipote risponde con un vocale, i cugini si scoprono. Si torna a parlarsi.</li>
        <li><b>Continuare dopo.</b> Chi verrà potrà ascoltare quella voce.</li>
      </ol>
    </div>
    <h2>Come</h2>
    <div class="pad" style="padding-top:0"><ul style="padding-left:20px">
      <li><b>La voce prima di tutto:</b> il tono, le pause, il dialetto, la risata.</li>
      <li><b>Facile come una chat:</b> una domanda alla volta, si risponde a voce. Spesso sono i nipoti a farla vedere ai nonni.</li>
      <li><b>Privato per davvero:</b> ogni ricordo ha i suoi destinatari, anche segreto per qualcuno. Noi non leggiamo i contenuti.</li>
      <li><b>Semplice a 80 anni e a 15.</b></li>
      <li><b>I ricordi restano gratis, per sempre.</b> Si paga per farli crescere, mai per non perderli.</li>
    </ul></div>
    <h2>Cosa</h2>
    <div class="pad" style="padding-top:0"><ul style="padding-left:20px">
      <li><b>La domanda della settimana</b> per tutta la famiglia: da dove viene il nostro cognome? Chi è partito, e per dove? Tutti rispondono, e ci si scopre.</li>
      <li><b>L'albero genealogico</b> che la famiglia completa insieme, anche con chi non c'è più.</li>
      <li><b>Il tuo cloud dei ricordi:</b> foto, video e vocali scattati o caricati dal telefono, privati finché non li condividi.</li>
      <li><b>Una domanda a settimana</b> per chi racconta.</li>
      <li><b>Album di famiglia</b> con foto, vocali, cuori e risposte a voce.</li>
      <li><b>Cerchie:</b> famiglia, fratelli, amici. Ognuno decide chi vede cosa.</li>
      <li><b>Diario</b> privato con promemoria e "accadeva oggi".</li>
      <li><b>Il libro</b> delle storie: digitale incluso, stampato su richiesta.</li>
    </ul></div>
    <div class="pad"><a class="btn ambra" href="#/scopri">Scopri Ancora</a>
      <a class="btn chiaro" style="margin-top:10px" href="#/regala">Regala «La storia della tua famiglia» · 99 €</a></div>`;
}
