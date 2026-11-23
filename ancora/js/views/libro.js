// Il libro delle storie di una persona, pronto da stampare (A5). Ogni storia ha il QR: lo inquadri e senti la sua voce.
// #/libro/<persona id>   (dal profilo). Il libro digitale è incluso; quello stampato si ordina a parte.
import { passaPiu, state, sb, $app, esc, nomeDi, urlMediaMolti, urlMedia } from "../app.js";
import qrcode from "https://esm.sh/qrcode-generator@1.4.4";

const qrSvg = (testo) => { const q = qrcode(0, "M"); q.addData(testo); q.make(); return q.createSvgTag({ cellSize: 3, margin: 0, scalable: true }); };
const data = (d) => new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });

export default async function ({ id, params }) {
  if (!id || params?.famiglia) return libroFamiglia(params ?? {});
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
      @media print{ @page{size:A5;margin:0} body{background:#fff} .noprint{display:none!important} body *{visibility:hidden} .pag,.pag *{visibility:visible} [role=dialog],[data-chiudi],#foglio-piu{display:none!important} body *{visibility:hidden} .pag,.pag *{visibility:visible} [role=dialog],[data-chiudi],#foglio-piu{display:none!important} main{padding:0;max-width:none}
        .pag{margin:0;box-shadow:none;width:148mm;height:210mm;-webkit-print-color-adjust:exact;print-color-adjust:exact} }
    </style>
    <div class="pad noprint">
      <h1 style="font-size:24px">${esc(titolo)}</h1>
      <p class="tenue">${lista.length} storie</p>
      <button class="btn chiaro" id="stampa">Stampalo tu o salva il PDF (gratis)</button>
      <a class="btn ambra" style="margin-top:8px" href="#/servizi">Ordina il libro stampato · da 49 €</a>
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
  if (!anteprima()) document.getElementById("stampa").onclick = () => window.print();
}

// --- Il libro della famiglia: l'anno raccontato da tutti, mese per mese. Con i QR per sentire le voci. ---
const MESI = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
const STILE = `
  .pag{width:148mm;min-height:210mm;margin:12px auto;background:#FFFDF8;color:#1D2422;padding:15mm 14mm;box-shadow:0 6px 24px rgba(0,0,0,.12);display:flex;flex-direction:column;page-break-after:always;break-after:page;box-sizing:border-box}
  .copertina{background:linear-gradient(170deg,#2F5A55,#12302C);color:#FBF3E2;justify-content:flex-end;padding:0;overflow:hidden;position:relative}
  .copertina .foto{position:absolute;inset:0;background:center/cover;opacity:.55}
  .copertina .dentro{position:relative;padding:16mm 14mm;background:linear-gradient(180deg,transparent,rgba(18,48,44,.92) 45%)}
  .copertina h1{font-family:Fraunces,serif;color:#fff;font-size:44px;line-height:1.02;margin:0 0 4mm}
  .capitolo{justify-content:center;text-align:center;background:#F3E9D8}
  .pag:last-child{page-break-after:auto;break-after:auto}
  .capitolo h2{font-family:Fraunces,serif;font-size:46px;color:#12302C;margin:0;text-transform:none;letter-spacing:0}
  .pag h3{font-family:Fraunces,serif;font-size:21px;line-height:1.25;color:#12302C;margin:0 0 2mm}
  .pag .quando{font-size:11px;color:#5D635F;text-transform:uppercase;letter-spacing:.6px;margin-bottom:4mm}
  .pag .testo{font-family:Fraunces,serif;font-size:14.5px;line-height:1.6;white-space:pre-line}
  .pag .foto1{width:100%;aspect-ratio:4/3;background:#EEE center/cover;border-radius:3mm;margin-bottom:4mm}
  .pag .griglia{display:grid;grid-template-columns:1fr 1fr;gap:2mm;margin-bottom:4mm}.pag .griglia div{aspect-ratio:1;background:#EEE center/cover;border-radius:2mm}
  .pag .piede{margin-top:auto;display:flex;align-items:center;gap:4mm;padding-top:5mm;font-size:11px;color:#5D635F}
  .pag .piede .qr{width:19mm;height:19mm;flex-shrink:0}.pag .piede .qr svg{width:100%;height:100%}
  .pag .chi{display:flex;align-items:center;gap:3mm;font-size:13px;font-weight:700;color:#2F5A55;margin-bottom:2mm}
  @media screen and (max-width:600px){ .pag{width:calc(100% - 16px);min-height:auto;aspect-ratio:148/210} }
  @media print{ @page{size:A5;margin:0} body{background:#fff} .noprint{display:none!important} body *{visibility:hidden} .pag,.pag *{visibility:visible} [role=dialog],[data-chiudi],#foglio-piu{display:none!important} main{padding:0;max-width:none}
    .pag{margin:0;box-shadow:none;width:148mm;height:210mm;aspect-ratio:auto;-webkit-print-color-adjust:exact;print-color-adjust:exact} }`;

async function libroFamiglia(params) {
  const fam = state.cerchie.filter((c) => c.tipo === "famiglia");
  const cerchie = fam.length ? fam : state.cerchie;
  const c = cerchie.find((x) => x.id === params.famiglia) ?? cerchie[0];
  if (!c) { $app().innerHTML = `<div class="pad"><p>Prima crea la tua famiglia: il libro si riempie con le storie di tutti.</p><a class="btn" href="#/cerchie">Crea la famiglia</a></div>`; return; }
  const anno = Number(params.anno) || new Date().getFullYear();
  const oggi = new Date().toISOString().slice(0, 10);
  const { data: righe } = await sb.from("ricordi")
    .select("id, tipo, titolo, testo, dettagli, creato_il, sblocco, sblocco_data, autore:autore_id(id, nome, soprannome), ricordi_media(path, tipo, ordine, scattato_il)")
    .eq("cerchia_id", c.id).in("tipo", ["racconto", "risposta", "foto", "ricetta"]).eq("in_memoria", true)
    .gte("creato_il", `${anno}-01-01`).lt("creato_il", `${anno + 1}-01-01`).order("creato_il").limit(1000);
  // le lettere da aprire più avanti non finiscono nel libro prima del tempo
  const lista = (righe ?? []).filter((r) => r.sblocco !== "da_data" || (r.sblocco_data ?? "") <= oggi)
    .filter((r) => r.testo || (r.ricordi_media ?? []).length);
  const fotoDi = (r) => (r.ricordi_media ?? []).filter((m) => m.tipo === "foto").sort((a, b) => (a.ordine ?? 0) - (b.ordine ?? 0)).slice(0, 4);
  const url = await urlMediaMolti(lista.flatMap((r) => fotoDi(r).map((m) => m.path)));
  const copertina = (c.copertina_path ?? c.foto_path) ? await urlMedia(c.copertina_path ?? c.foto_path).catch(() => null) : (lista.map((r) => fotoDi(r)[0]).find(Boolean) ? url[lista.map((r) => fotoDi(r)[0]).find(Boolean).path] : null);
  const autori = [...new Map(lista.map((r) => [r.autore?.id, nomeDi(r.autore)])).values()].filter(Boolean);
  const base = `${location.origin}${location.pathname}#/ricordo/`;
  const perMese = MESI.map((_, i) => lista.filter((r) => new Date(r.creato_il).getMonth() === i));
  const foto = lista.reduce((s, r) => s + fotoDi(r).length, 0), voci = lista.filter((r) => (r.ricordi_media ?? []).some((m) => m.tipo === "audio")).length;

  const pagina = (r) => {
    const f = fotoDi(r), voce = (r.ricordi_media ?? []).some((m) => m.tipo === "audio");
    const ric = r.tipo === "ricetta" ? r.dettagli ?? {} : null;
    const testo = r.testo && r.testo.length > 1400 ? r.testo.slice(0, 1400).replace(/\s\S*$/, "") + "… (continua su Ancora)" : r.testo;
    return `<section class="pag">
      <div class="chi">${esc(nomeDi(r.autore))}</div>
      ${r.titolo || ric ? `<h3>${esc(r.titolo ?? "Una ricetta")}</h3>` : ""}
      <div class="quando">${data(r.creato_il)}${ric ? " · ricetta di famiglia" : ""}</div>
      ${f.length === 1 ? `<div class="foto1" style="background-image:url('${url[f[0].path]}')"></div>` : f.length ? `<div class="griglia">${f.map((m) => `<div style="background-image:url('${url[m.path]}')"></div>`).join("")}</div>` : ""}
      ${ric ? `<div class="testo"><b>Ingredienti${ric.porzioni ? ` (per ${esc(ric.porzioni)})` : ""}</b>\n${(ric.ingredienti ?? []).map((i) => `· ${esc(i)}`).join("\n")}${ric.procedimento ? `\n\n<b>Come si fa</b>\n${esc(ric.procedimento)}` : ""}</div>` : ""}
      ${testo ? `<div class="testo">${esc(testo)}</div>` : voce ? `<div class="testo" style="color:#5D635F">Questo ricordo è a voce: inquadra il codice per ascoltarlo.</div>` : ""}
      ${voce || (r.testo ?? "").length > 1400 ? `<div class="piede"><div class="qr">${qrSvg(base + r.id)}</div><div>${voce ? `Inquadra e ascolta la voce di ${esc(nomeDi(r.autore))}` : "Inquadra per leggerlo tutto"}<br>su Ancora</div></div>` : ""}
    </section>`;
  };

  document.getElementById("barra").hidden = true;
  $app().innerHTML = `<style>${STILE}</style>
    <div class="pad noprint">
      <a href="#/" style="text-decoration:none;font-size:22px" aria-label="Indietro">←</a>
      <h1 style="font-size:26px;margin-bottom:4px">Il libro della famiglia</h1>
      <p class="tenue" style="margin-top:0">L'anno raccontato da tutti, mese per mese. Dove c'è una voce, c'è il QR per ascoltarla.</p>
      <div class="riga" style="gap:8px">
        <select id="lf-c" style="flex:2">${cerchie.map((x) => `<option value="${x.id}" ${x.id === c.id ? "selected" : ""}>${esc(x.nome)}</option>`).join("")}</select>
        <select id="lf-a" style="flex:1">${[0, 1, 2].map((k) => new Date().getFullYear() - k).map((a) => `<option ${a === anno ? "selected" : ""}>${a}</option>`).join("")}</select></div>
      <p class="tenue">${lista.length} ricordi · ${foto} foto · ${voci} con la voce · ${autori.length} ${autori.length === 1 ? "persona" : "persone"}</p>
      <button class="btn ambra" id="stampa">Salva il PDF o stampalo</button>
      <p class="tenue" style="font-size:13px">Sul telefono: «Salva il PDF» → Condividi → Salva su File. Il libro stampato con copertina rigida, se è compreso nel vostro regalo, arriva a casa a fine anno.</p>
    </div>
    <section class="pag copertina">${copertina ? `<div class="foto" style="background-image:url('${copertina}')"></div>` : ""}
      <div class="dentro"><p style="letter-spacing:2px;font-size:12px;opacity:.85;margin:0 0 6mm">LA STORIA DELLA NOSTRA FAMIGLIA</p>
        <h1>${esc(c.nome)}</h1><p style="font-family:Fraunces,serif;font-size:30px;margin:0">${anno}</p>
        ${autori.length ? `<p style="font-size:13px;margin:8mm 0 0;opacity:.9">Raccontato da ${esc(autori.join(", "))}</p>` : ""}</div></section>
    ${perMese.map((rr, i) => rr.length ? `<section class="pag capitolo"><p style="letter-spacing:2px;font-size:12px;color:#5D635F">${anno}</p><h2>${MESI[i]}</h2>
      <p class="tenue">${rr.length} ${rr.length === 1 ? "ricordo" : "ricordi"}</p></section>${rr.map(pagina).join("")}` : "").join("")
      || `<section class="pag"><p class="testo">Il libro si riempie con le foto, le storie e le voci di tutti. Comincia oggi: anche una foto con due righe è un ricordo.</p></section>`}
    <section class="pag capitolo"><h2 style="font-size:34px">La storia continua.</h2><p class="tenue">${esc(c.nome)} · Ancora</p></section>`;
  if (!anteprima()) document.getElementById("stampa").onclick = () => window.print();
  const vai = () => location.hash = `#/libro?famiglia=${document.getElementById("lf-c").value}&anno=${document.getElementById("lf-a").value}`;
  document.getElementById("lf-c").onchange = vai; document.getElementById("lf-a").onchange = vai;
}

// Senza Ancora+: si vedono le prime pagine; il libro intero, il PDF e la stampa sono di Ancora+
const PAGINE_ANTEPRIMA = 3;
function anteprima() {
  if (state.piu) return false;
  const pagine = [...document.querySelectorAll("section.pag")];
  const fine = pagine.at(-1);
  pagine.slice(PAGINE_ANTEPRIMA).forEach((p) => { if (p !== fine) p.remove(); });
  const resto = Math.max(0, pagine.length - PAGINE_ANTEPRIMA - 1);
  const ultima = document.createElement("section");
  ultima.className = "pag capitolo";
  ultima.innerHTML = `<h2 style="font-size:30px;line-height:1.15">${resto ? `Il libro continua per altre ${resto} pagine.` : "Il libro continua."}</h2>
    <p style="font-size:15px;max-width:90mm;margin:10px auto 18px">Il libro intero, con tutte le storie, le foto e i QR delle voci, in PDF e stampato: con Ancora+.</p>
    <button class="btn ambra noprint" style="width:auto;margin:0 auto" id="libro-piu">Scopri Ancora+</button>`;
  (fine ?? document.body).before(ultima);
  ultima.querySelector("#libro-piu").onclick = () => passaPiu("Il libro intero, in PDF e stampato, è di Ancora+.");
  const b = document.getElementById("stampa");
  if (b) { b.textContent = "Il libro intero e il PDF con Ancora+"; b.onclick = () => passaPiu("Il libro intero, in PDF e stampato, è di Ancora+."); }
  document.querySelectorAll("section.pag").forEach((p) => p.classList.add("anteprima"));
  return true;
}
