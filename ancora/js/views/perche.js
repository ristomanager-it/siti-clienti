// Il perché, il come e il cosa di Ancora (pagina pubblica)
import { $app } from "../app.js";

export default async function () {
  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/accesso" aria-label="Indietro"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></a><span class="logo" style="font-size:22px">Ancora</span><span style="width:44px"></span></header>
    <div class="pad">
      <h1 style="margin:8px 0 6px">Le radici che restano.</h1>
      <p class="tenue" style="font-size:15px;margin-top:0">Perché Ancora, come funziona, cosa trovi.</p>
    </div>
    <div class="lettera" style="font-size:18px">L'<b>ancora</b> tiene ferma la barca nel porto sicuro: le radici, la famiglia, la voce di chi ci ha cresciuti.
<b>Ancora</b> vuol dire anche di più, un'altra volta, senza fine: "nonno, raccontamela ancora".
Ciò che ci tiene saldi resta con noi, ancora e ancora.</div>
    <h2>Perché</h2>
    <div class="pad" style="padding-top:0">
      <p><b>Crediamo che nessuno debba perdere la voce di chi ama.</b> Le storie di una famiglia si perdono in silenzio: nessuno le scrive, e quando vogliamo sentirle è tardi.</p>
      <ol style="padding-left:20px">
        <li><b>Tenere ferme le radici.</b> I ricordi e la voce di chi ci ha cresciuti, al sicuro e privati, per sempre.</li>
        <li><b>Avvicinare chi è lontano adesso.</b> Il nonno racconta, il nipote risponde con un vocale.</li>
        <li><b>Continuare dopo.</b> Chi verrà potrà ascoltare quella voce.</li>
      </ol>
    </div>
    <h2>Come</h2>
    <div class="pad" style="padding-top:0"><ul style="padding-left:20px">
      <li><b>La voce prima di tutto:</b> il tono, le pause, il dialetto, la risata.</li>
      <li><b>WhatsApp è il campanello, l'app è la casa:</b> una domanda alla volta, si risponde con un vocale.</li>
      <li><b>Privato per davvero:</b> ogni ricordo ha i suoi destinatari, anche segreto per qualcuno. Noi non leggiamo i contenuti.</li>
      <li><b>Semplice a 80 anni e a 15.</b></li>
      <li><b>I ricordi restano gratis, per sempre.</b> Si paga per farli crescere, mai per non perderli.</li>
    </ul></div>
    <h2>Cosa</h2>
    <div class="pad" style="padding-top:0"><ul style="padding-left:20px">
      <li><b>Domande su WhatsApp</b> per chi racconta.</li>
      <li><b>Album di famiglia</b> con foto, vocali, cuori e risposte a voce.</li>
      <li><b>Cerchie:</b> famiglia, fratelli, amici. Ognuno decide chi vede cosa.</li>
      <li><b>Diario</b> privato con promemoria e "accadeva oggi".</li>
      <li><b>Il libro</b> delle storie: digitale incluso, stampato su richiesta.</li>
    </ul></div>
    <div class="pad"><a class="btn ambra" href="#/prova">Prova gratis con una domanda</a>
      <a class="btn chiaro" style="margin-top:10px" href="#/regala">Regala Ancora · 129 €</a></div>`;
}
