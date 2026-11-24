// Scopri Ancora+: cosa c'è in più rispetto alla versione gratis, riga per riga.
import { state, $app, ICONE } from "../app.js";

const SI = `<span style="display:inline-grid;place-items:center;width:24px;height:24px;border-radius:12px;background:#4D7356;color:#fff;font-weight:800;font-size:14px">✓</span>`;
const NO = `<span style="color:#B9AE9C;font-size:20px">–</span>`;

// [cosa, gratis, Ancora+]  (true = sì, false = no, testo = quanto)
const RIGHE = [
  ["Per tutti i giorni", null],
  ["Chat, foto, video, storie e vocali", true, true],
  ["Famiglie e gruppi, quanti ne vuoi", true, true],
  ["Calendario, liste, spese, diario", true, true],
  ["La domanda della settimana", true, true],
  ["Tombola, carte, biliardo e calciobalilla", true, true],
  ["Ricordi", null],
  ["Spazio per foto e video", "2 GB a testa", "200 GB per tutta la famiglia"],
  ["L'albero di famiglia", "fino a 10 persone", "senza limiti, e alberi uniti tra famiglie"],
  ["Il ricettario", "3 ricette", "senza limiti"],
  ["Lettere da aprire più avanti", "1", "senza limiti"],
  ["Album degli eventi con il QR", "1", "senza limiti"],
  ["Le domande su misura per ognuno", false, true],
  ["Da tenere", null],
  ["Il libro della famiglia (PDF, mese per mese, con le voci)", "anteprima", "intero"],
  ["Il film dell'anno", "anteprima", "completo"],
  ["In più", null],
  ["L'aiutante di casa: cuoco, giardiniere, segretario", false, true],
  ["Il gioco della famiglia, con i vostri posti", false, true],
];

export default async function () {
  const cella = (v) => (v === true ? SI : v === false ? NO : `<span style="font-size:13px;font-weight:700;line-height:1.25">${v}</span>`);
  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/" aria-label="Indietro">${ICONE.indietro}</a><b>Ancora<span style="color:#C9832E">+</span></b><span style="width:44px"></span></header>
    <div style="padding-bottom:130px">
      <div style="margin:4px 16px 0;padding:22px 18px;border-radius:22px;background:linear-gradient(135deg,#12302C,#2F5A55);color:#FBF3E2">
        <div style="font-family:Fraunces,serif;font-size:30px;line-height:1.1">Tutto Ancora,<br>per tutta la famiglia.</div>
        <p style="margin:10px 0 0;opacity:.92;line-height:1.45">Basta che <b>uno</b> lo prenda e ce l'hanno tutti: nonni, figli, nipoti, anche chi vive lontano.</p>
        <div style="margin-top:14px;font-size:15px"><b style="font-family:Fraunces,serif;font-size:28px">99 €</b> l'anno · oppure 9,99 € al mese</div>
        ${state.piu ? `<div style="margin-top:12px;display:inline-block;padding:6px 12px;border-radius:999px;background:#E3EDE2;color:#2F5A3A;font-weight:800">Ce l'hai già ✓</div>` : ""}
      </div>

      <div class="card" style="padding:0;overflow:hidden">
        <div style="display:grid;grid-template-columns:1fr 84px 108px;align-items:center;background:#F3EDE2;font-weight:800;font-size:14px">
          <span style="padding:10px 12px"></span><span style="text-align:center">Gratis</span><span style="text-align:center;color:#C9832E">Ancora+</span></div>
        ${RIGHE.map(([t, g, p]) => g === null
          ? `<div style="padding:12px 12px 4px;font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#8A5A17">${t}</div>`
          : `<div style="display:grid;grid-template-columns:1fr 84px 108px;align-items:center;border-top:1px solid #EFE6D8;min-height:48px">
              <span style="padding:8px 12px;line-height:1.3">${t}</span><span style="text-align:center;padding:4px">${cella(g)}</span><span style="text-align:center;padding:4px;background:#FFF8EC">${cella(p)}</span></div>`).join("")}
      </div>

      <div class="pad">
        <p style="font-weight:700;color:#4D7356;margin-top:0">I ricordi già salvati restano tuoi e gratis per sempre, anche se smetti di pagare.</p>
        ${state.piu ? `<a class="btn ambra" href="#/regala">🎁 Regalalo a un'altra famiglia · 99 €</a>`
          : `<a class="btn ambra" href="#/piano" style="font-size:18px">Passa ad Ancora+ · 99 € l'anno</a>
             <a class="btn chiaro" href="#/regala" style="margin-top:10px">🎁 Oppure regalalo · con il libro e il film</a>`}
        <p class="tenue" style="font-size:14px;text-align:center;margin-top:12px">Si disdice quando vuoi. Il pagamento è sicuro con Stripe.</p>
      </div>
    </div>`;
}
