// Biglietto regalo da stampare (A5): da mettere sotto l'albero o dentro un biglietto d'auguri.
// #/biglietto?r=<id regalo>   (si apre dopo il pagamento) — dentro c'è il codice che chi riceve attiva su #/omaggio
import { sb, $app, esc } from "../app.js";
import qrcode from "https://esm.sh/qrcode-generator@1.4.4";

export default async function ({ id, params }) {
  const rid = id ?? params?.r;
  const { data: b } = rid ? await sb.rpc("regalo_biglietto", { p_id: rid }) : { data: null };
  if (!b || !b.codice) {
    // il pagamento si conferma in pochi secondi: il biglietto compare da solo
    $app().innerHTML = `<div class="pad" style="padding-top:60px"><h1>Un attimo…</h1>
      <p>Stiamo confermando il pagamento. Il biglietto compare qui da solo tra pochi secondi.</p></div>`;
    const giri = Number(sessionStorage.getItem("ancora_attesa_biglietto") ?? 0);
    if (giri < 20) { sessionStorage.setItem("ancora_attesa_biglietto", String(giri + 1)); setTimeout(() => { if (location.hash.includes(rid)) location.reload(); }, 3000); }
    return;
  }
  sessionStorage.removeItem("ancora_attesa_biglietto");
  // 3x2: più biglietti nello stesso acquisto → prima l'elenco, poi ogni biglietto
  if (!params?.uno) {
    const { data: gruppo } = await sb.rpc("regali_del_gruppo", { p_id: rid });
    if ((gruppo ?? []).length > 1) return elencoBiglietti(gruppo);
  }
  const quando = new Date(b.quando + "T12:00").toLocaleDateString("it-IT", { day: "numeric", month: "long" });
  const link = `${location.origin}${location.pathname}#/omaggio/${b.codice}`;
  const qr = qrcode(0, "M"); qr.addData(link); qr.make();
  const testoWa = `🎁 ${b.a}, questo è per te: *La storia della tua famiglia* su Ancora.${b.messaggio ? `\n\n«${b.messaggio}»` : ""}\n\nUn anno per raccontarla insieme, e alla fine il libro da tenere in mano. Apri qui, crea la tua famiglia e attiva il regalo:\n${link}\n\n${b.da}`;
  document.getElementById("barra").hidden = true;
  $app().innerHTML = `
    <style>
      .bg{width:min(148mm,calc(100% - 24px));min-height:210mm;margin:12px auto;background:linear-gradient(170deg,#7FA37E,#4D7356);color:#FBF3E2;border-radius:6mm;padding:14mm 12mm;display:flex;flex-direction:column;box-shadow:0 10px 30px rgba(0,0,0,.18);position:relative;overflow:hidden}
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
    <div class="pad noprint">
      <h1 style="margin-bottom:4px">Grazie! Ecco il regalo 🎁</h1>
      <p style="margin-top:0">Mandalo a ${esc(b.a)} ${b.quando > new Date().toISOString().slice(0, 10) ? `il <b>${quando}</b>` : "quando vuoi"}, oppure stampalo e mettilo sotto l'albero.${b.usato ? " <b>✓ Il regalo è già stato attivato.</b>" : ""}</p>
      <div style="display:grid;gap:8px">
        <a class="btn ambra" id="wa" href="https://wa.me/?text=${encodeURIComponent(testoWa)}" target="_blank" rel="noopener">Mandalo su WhatsApp</a>
        <div class="riga" style="gap:8px"><button class="btn chiaro" id="copia" style="flex:1">Copia il link</button><button class="btn chiaro" id="stampa" style="flex:1">Stampa o PDF</button></div>
        <a class="btn" href="#/regala" style="margin-top:4px">🎁 Regalane un altro, a un'altra famiglia</a></div>
    </div>
    <div class="bg">
      <div class="marchio"><img src="icons/apple-touch-icon.png" alt=""><b>Ancora</b></div>
      <span class="codice">REGALO</span>
      <h1>Per ${esc(b.a)}</h1>
      <p class="sotto"><b>La storia della tua famiglia.</b><br>Un anno per raccontarla insieme, e alla fine il libro da tenere in mano.</p>
      ${b.messaggio ? `<div class="msg">${esc(b.messaggio)}</div>` : ""}
      <ol><li>Inquadra il codice o apri il link.</li><li>Crea il tuo account e la tua famiglia, come vuoi tu.</li><li>Il regalo attiva un anno di Ancora+ per tutti e il libro di fine anno.</li></ol>
      <div class="piede">
        <div class="qr">${qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true })}</div>
        <div class="firma">Con amore,<b>${esc(b.da)}</b><span style="opacity:.8">Codice: ${esc(b.codice)}</span></div>
      </div>
    </div>`;
  document.getElementById("stampa").onclick = () => window.print();
  document.getElementById("copia").onclick = async (e) => { try { await navigator.clipboard.writeText(link); e.target.textContent = "Copiato ✓"; } catch { prompt("Copia il link", link); } };
}

function elencoBiglietti(gruppo) {
  const base = `${location.origin}${location.pathname}`;
  $app().innerHTML = `<div class="pad">
    <h1 style="margin-bottom:4px">Grazie! Ecco i tuoi ${gruppo.length} regali 🎁</h1>
    <p class="tenue" style="margin-top:0">Ognuno ha il suo codice. Mandali su WhatsApp, o apri il biglietto per stamparlo.</p>
    ${gruppo.map((b, i) => {
      const link = `${base}#/omaggio/${b.codice}`;
      const wa = `🎁 ${b.a}, questo è per te: *La storia della tua famiglia* su Ancora.${b.messaggio ? `\n\n«${b.messaggio}»` : ""}\n\nUn anno per raccontarla insieme, e alla fine il libro da tenere in mano. Apri qui, crea la tua famiglia e attiva il regalo:\n${link}\n\n${b.da}`;
      return `<div class="card" style="margin:10px 0">
        <div class="riga"><b style="flex:1;font-family:Fraunces,serif;font-size:20px">${i + 1}. Per ${esc(b.a)}</b>${b.usato ? `<span class="chip on" style="margin:0">✓ attivato</span>` : ""}</div>
        <p class="tenue" style="margin:2px 0 10px">Codice ${esc(b.codice ?? "in arrivo…")}</p>
        <div class="riga" style="gap:8px"><a class="btn ambra" style="flex:1" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(wa)}">WhatsApp</a>
          <a class="btn chiaro" style="flex:1" href="#/biglietto?r=${b.id}&uno=1">Biglietto</a></div></div>`;
    }).join("")}
    <a class="btn" href="#/regala" style="margin-top:6px">🎁 Regalane altri</a></div>`;
}
