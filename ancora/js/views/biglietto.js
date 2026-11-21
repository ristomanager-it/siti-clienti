// Biglietto regalo da stampare (A5): da mettere sotto l'albero o dentro un biglietto d'auguri.
// #/biglietto/<id regalo>   (si apre dalla pagina di conferma dopo il pagamento)
import { sb, $app, esc } from "../app.js";
import qrcode from "https://esm.sh/qrcode-generator@1.4.4";

const COME = {
  genitori: (b) => [`Il ${b.data} ti arriva un messaggio su WhatsApp, da Ancora.`, "Ogni settimana una domanda sulla tua vita.", "Rispondi con un vocale, come fai sempre. La famiglia ascolta."],
  altri: (b) => [`Dal ${b.data} siete su Ancora, tutta la famiglia.`, "Foto, vocali, ricordi: in uno spazio solo vostro.", "Ti arriva il link su WhatsApp: toccalo ed entri."],
};

export default async function ({ id }) {
  const { data: b } = await sb.rpc("biglietto", { p_id: id });
  if (!b) {
    $app().innerHTML = `<div class="pad" style="padding-top:60px"><h1>Un attimo…</h1>
      <p>Stiamo confermando il pagamento. Il biglietto compare qui da solo tra pochi secondi.</p></div>`;
    setTimeout(() => { if (location.hash.includes(id)) location.reload(); }, 8000);
    return;
  }
  const data = new Date(b.data + "T12:00").toLocaleDateString("it-IT", { day: "numeric", month: "long" });
  const righe = (b.tipo === "genitori" ? COME.genitori : COME.altri)({ ...b, data });
  const link = `${location.origin}${location.pathname}#/perche`;
  const qr = qrcode(0, "M"); qr.addData(link); qr.make();

  document.getElementById("barra").hidden = true;
  $app().innerHTML = `
    <style>
      .bg{width:148mm;min-height:210mm;margin:12px auto;background:linear-gradient(170deg,#7FA37E,#4D7356);color:#FBF3E2;border-radius:6mm;padding:14mm 12mm;display:flex;flex-direction:column;box-shadow:0 10px 30px rgba(0,0,0,.18);position:relative;overflow:hidden}
      .bg .marchio{display:flex;align-items:center;gap:10px}
      .bg .marchio img{width:16mm;height:16mm;border-radius:3.5mm}
      .bg .marchio b{font-family:Fraunces,serif;font-size:26px}
      .bg h1{font-family:Fraunces,serif;color:#fff;font-size:40px;line-height:1.05;margin:16mm 0 4mm}
      .bg .sotto{font-size:18px;line-height:1.4;margin:0;opacity:.95}
      .bg .msg{font-family:Fraunces,serif;font-size:19px;line-height:1.4;background:rgba(255,255,255,.12);border-radius:4mm;padding:5mm;margin-top:8mm;white-space:pre-line}
      .bg ol{margin:9mm 0 0;padding-left:6mm;font-size:16px;line-height:1.5}
      .bg .piede{margin-top:auto;display:flex;align-items:flex-end;gap:6mm;padding-top:10mm}
      .bg .qr{background:#fff;border-radius:3mm;padding:2.5mm;width:30mm;height:30mm;flex-shrink:0}
      .bg .qr svg{width:100%;height:100%;display:block}
      .bg .firma{font-size:15px;line-height:1.4}
      .bg .firma b{font-family:Fraunces,serif;font-size:20px;display:block}
      .bg .codice{position:absolute;right:12mm;top:16mm;font-size:11px;letter-spacing:1px;opacity:.75}
      @media print{ @page{size:A5;margin:0} body{background:#fff} .noprint{display:none!important}
        .bg{margin:0;border-radius:0;box-shadow:none;width:148mm;height:210mm;-webkit-print-color-adjust:exact;print-color-adjust:exact} main{padding:0} }
    </style>
    <div class="pad noprint" style="display:flex;gap:8px">
      <button class="btn ambra" id="stampa">Stampa o salva PDF</button>
      <a class="btn chiaro" href="#/regala?ok=1">Fatto</a>
    </div>
    <div class="bg">
      <div class="marchio"><img src="icons/apple-touch-icon.png" alt=""><b>Ancora</b></div>
      <span class="codice">REGALO ${esc(b.codice)}</span>
      <h1>Per ${esc(b.per)}</h1>
      <p class="sotto">Un anno di ricordi, con la tua voce.<br>Le radici che restano.</p>
      ${b.messaggio ? `<div class="msg">${esc(b.messaggio)}</div>` : ""}
      <ol>${righe.map((r) => `<li>${esc(r)}</li>`).join("")}</ol>
      <div class="piede">
        <div class="qr">${qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true })}</div>
        <div class="firma">Con amore,<b>${esc(b.da)}</b><span style="opacity:.8">Inquadra il codice per scoprire come funziona.</span></div>
      </div>
    </div>`;
  document.getElementById("stampa").onclick = () => window.print();
}
