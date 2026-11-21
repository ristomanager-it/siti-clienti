// Il libro delle storie di una persona, pronto da stampare (A5). Ogni storia ha il QR: lo inquadri e senti la sua voce.
// #/libro/<persona id>   (dal profilo). Il libro digitale è incluso; quello stampato si ordina a parte.
import { sb, $app, esc, nomeDi, urlMediaMolti } from "../app.js";
import qrcode from "https://esm.sh/qrcode-generator@1.4.4";

const qrSvg = (testo) => { const q = qrcode(0, "M"); q.addData(testo); q.make(); return q.createSvgTag({ cellSize: 3, margin: 0, scalable: true }); };
const data = (d) => new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });

export default async function ({ id }) {
  const { data: p } = await sb.from("persone").select("id, nome, cognome, soprannome, data_nascita").eq("id", id).maybeSingle();
  if (!p) { $app().innerHTML = `<p class="pad">Libro non trovato.</p>`; return; }
  const { data: storie } = await sb.from("ricordi")
    .select("id, tipo, titolo, testo, dettagli, creato_il, ricordi_media(path, tipo, ordine)")
    .eq("autore_id", id).in("tipo", ["racconto", "risposta", "foto", "ricetta"]).eq("in_memoria", true)
    .order("creato_il", { ascending: true });
  const lista = storie ?? [];
  const url = await urlMediaMolti(lista.flatMap((r) => (r.ricordi_media ?? []).filter((m) => m.tipo === "foto").slice(0, 1).map((m) => m.path)));
  const base = `${location.origin}${location.pathname}#/ricordo/`;
  const titolo = `Le storie di ${nomeDi(p)}`;

  document.getElementById("barra").hidden = true;
  $app().innerHTML = `
    <style>
      .pag{width:148mm;min-height:210mm;margin:12px auto;background:#FFFDF8;color:#1D2422;padding:16mm 14mm;box-shadow:0 6px 24px rgba(0,0,0,.12);display:flex;flex-direction:column;page-break-after:always;break-after:page}
      .copertina{background:linear-gradient(170deg,#7FA37E,#4D7356);color:#FBF3E2;justify-content:center;text-align:center}
      .copertina h1{font-family:Fraunces,serif;color:#fff;font-size:42px;line-height:1.05;margin:0 0 6mm}
      .pag h2{font-family:Fraunces,serif;font-size:22px;line-height:1.25;color:#12302C;margin:0 0 2mm;text-transform:none;letter-spacing:0}
      .pag .quando{font-size:11px;color:#5D635F;text-transform:uppercase;letter-spacing:.6px;margin-bottom:5mm}
      .pag .testo{font-family:Fraunces,serif;font-size:15px;line-height:1.65;white-space:pre-line}
      .pag .img{width:100%;aspect-ratio:4/3;background:#EEE center/cover;border-radius:3mm;margin-bottom:5mm}
      .pag .piede{margin-top:auto;display:flex;align-items:center;gap:4mm;padding-top:6mm;font-size:11px;color:#5D635F}
      .pag .piede .qr{width:20mm;height:20mm;flex-shrink:0}.pag .piede .qr svg{width:100%;height:100%}
      @media print{ @page{size:A5;margin:0} body{background:#fff} .noprint{display:none!important} main{padding:0;max-width:none}
        .pag{margin:0;box-shadow:none;width:148mm;height:210mm;-webkit-print-color-adjust:exact;print-color-adjust:exact} }
    </style>
    <div class="pad noprint">
      <h1 style="font-size:24px">${esc(titolo)}</h1>
      <p class="tenue">${lista.length} storie. Ogni pagina ha il codice per ascoltare la voce: chi ha l'app lo inquadra e la sente.</p>
      <button class="btn ambra" id="stampa">Stampa o salva il PDF</button>
      <a class="btn chiaro" style="margin-top:8px" href="#/profilo/${esc(id)}">Torna al profilo</a>
    </div>
    <section class="pag copertina">
      <p style="letter-spacing:2px;font-size:12px;opacity:.85;margin:0 0 10mm">ANCORA</p>
      <h1>${esc(titolo)}</h1>
      <p style="font-size:16px;margin:0">${p.data_nascita ? `nato nel ${p.data_nascita.slice(0, 4)} · ` : ""}raccolte con la sua voce</p>
      <p style="font-family:Fraunces,serif;font-size:18px;margin-top:20mm;opacity:.9">Le radici che restano.</p>
    </section>
    ${lista.map((r) => {
      const f = (r.ricordi_media ?? []).find((m) => m.tipo === "foto");
      const voce = (r.ricordi_media ?? []).some((m) => m.tipo === "audio");
      const ric = r.tipo === "ricetta" ? r.dettagli ?? {} : null;
      return `<section class="pag">
        <h2>${esc(r.titolo ?? (ric ? "Una ricetta" : "Un ricordo"))}</h2>
        <div class="quando">${data(r.creato_il)}${ric ? " · ricetta di famiglia" : ""}</div>
        ${f ? `<div class="img" style="background-image:url('${url[f.path]}')"></div>` : ""}
        ${ric ? `<div class="testo"><b>Ingredienti${ric.porzioni ? ` (per ${ric.porzioni})` : ""}</b>\n${(ric.ingredienti ?? []).map((i) => `· ${esc(i)}`).join("\n")}${ric.procedimento ? `\n\n<b>Come si fa</b>\n${esc(ric.procedimento)}` : ""}</div>` : ""}
        ${r.testo ? `<div class="testo">${esc(r.testo)}</div>` : voce && !ric ? `<div class="testo" style="color:#5D635F">Questa storia è solo a voce: inquadra il codice per ascoltarla.</div>` : ""}
        <div class="piede"><div class="qr">${qrSvg(base + r.id)}</div><div>${voce ? "Inquadra e ascolta la sua voce" : "Inquadra per aprire il ricordo"}<br>su Ancora</div></div>
      </section>`;
    }).join("") || `<section class="pag"><p>Ancora nessuna storia: il libro si riempie con le risposte alle domande.</p></section>`}`;
  document.getElementById("stampa").onclick = () => window.print();
}
