// "Porta Ancora in parrocchia o a scuola": una locandina A4 da stampare, col QR personale (codice amico).
// Chi si iscrive dal QR conta per i premi di chi l'ha attaccata.
import { sb, $app, esc, ICONE } from "../app.js";
import qrcode from "https://esm.sh/qrcode-generator@1.4.4";

const DOVE = {
  parrocchia: { nome: "Parrocchia e oratorio", titolo: "Le voci dei nonni non si perdono più.", sotto: "Le famiglie della parrocchia custodiscono foto, storie e ricette in un posto privato. E a Natale: la tombola tutti insieme, anche da lontano." },
  scuola: { nome: "Scuola", titolo: "Nonni e nipoti, una storia alla settimana.", sotto: "Ogni settimana una domanda ai nonni: rispondono a voce, i nipoti ascoltano e conservano. Un progetto di famiglia, senza pubblicità e senza estranei." },
  anziani: { nome: "Centro anziani", titolo: "Racconta la tua storia ai nipoti.", sotto: "Una domanda alla settimana, si risponde a voce anche su WhatsApp. I nipoti ascoltano, la famiglia conserva per sempre." },
  negozio: { nome: "Negozio, bar, ristorante", titolo: "La casa privata della tua famiglia.", sotto: "Foto, storie, vocali, chat, ricette e giochi solo per voi: niente pubblicità, niente estranei. Si comincia gratis." },
};

export default async function ({ params } = {}) {
  const dove = DOVE[params?.dove] ? params.dove : "parrocchia";
  const d = DOVE[dove];
  const { data: codice } = await sb.rpc("mio_codice_amico");
  const link = `${location.origin}${location.pathname}#/iscriviti?amico=${codice ?? ""}&utm_source=locandina&utm_medium=${dove}`;
  const qr = qrcode(0, "M"); qr.addData(link); qr.make();
  const svg = qr.createSvgTag({ cellSize: 6, margin: 0, scalable: true }).replace("<svg", '<svg style="width:100%;height:100%;display:block"');
  const foglio = `
    <div class="loc">
      <div class="loc-marchio">Ancora</div>
      <h1>${esc(d.titolo)}</h1>
      <p class="loc-sotto">${esc(d.sotto)}</p>
      <ul>
        <li>🎙️ Le voci dei nonni, per sempre</li>
        <li>📸 Foto e storie solo per la famiglia</li>
        <li>🍝 Il ricettario di casa</li>
        <li>🎄 Tombola e carte napoletane insieme</li>
      </ul>
      <div class="loc-qr"><div class="loc-codice">${svg}</div>
        <div><b>Inquadra con la fotocamera</b><br>e crea la tua famiglia.<br><span>È gratis, senza carta di credito.</span></div></div>
    </div>`;
  const stile = `
    .loc{background:#FBF3E2;color:#12302C;font-family:Nunito,system-ui,sans-serif;padding:14mm 14mm 12mm;border-radius:6px;aspect-ratio:210/297;box-sizing:border-box;display:flex;flex-direction:column}
    .loc-marchio{font-family:Fraunces,Georgia,serif;font-weight:700;font-size:26px;color:#B5652E}
    .loc h1{font-family:Fraunces,Georgia,serif;font-size:40px;line-height:1.1;margin:8mm 0 4mm}
    .loc-sotto{font-size:17px;line-height:1.45;margin:0}
    .loc ul{list-style:none;padding:0;margin:8mm 0;font-size:18px;line-height:1.9;font-weight:700}
    .loc-qr{margin-top:auto;display:flex;gap:6mm;align-items:center;background:#fff;border-radius:4mm;padding:5mm;font-size:17px;line-height:1.4}
    .loc-qr span{color:#5b6b66;font-size:14px}.loc-codice{width:42mm;height:42mm;flex-shrink:0}`;

  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/" aria-label="Indietro">${ICONE.indietro}</a><b style="flex:1">Porta Ancora fuori casa</b></header>
    <div class="pad" style="padding-top:0">
      <p class="tenue" style="margin-top:0">Una locandina da stampare e attaccare in parrocchia, a scuola, al centro anziani o nel tuo locale. Il codice è il tuo: chi si iscrive da qui conta per i tuoi premi.</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">${Object.entries(DOVE).map(([k, v]) =>
        `<a class="chip ${k === dove ? "on" : ""}" href="#/locandina?dove=${k}" style="margin:0;text-decoration:none">${esc(v.nome)}</a>`).join("")}</div>
      <style>${stile}</style>${foglio}
      <button class="btn ambra" id="stampa" style="margin-top:14px">🖨️ Stampa la locandina</button>
      <a class="btn chiaro" href="#/invita" style="margin-top:10px">Vedi i tuoi premi</a>
    </div>`;
  document.getElementById("stampa").onclick = () => {
    const w = open("", "_blank");
    w.document.write(`<html><head><title>Ancora</title><link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@700&family=Nunito:wght@500;700&display=swap" rel="stylesheet">
      <style>@page{size:A4;margin:0}body{margin:0}${stile}.loc{width:210mm;height:297mm;border-radius:0;aspect-ratio:auto}.loc h1{font-size:56px}.loc-sotto{font-size:22px}.loc ul{font-size:24px}.loc-qr{font-size:22px}.loc-codice{width:60mm;height:60mm}</style></head>
      <body>${foglio}<script>setTimeout(()=>print(),900)<\/script></body></html>`);
    w.document.close();
  };
}
