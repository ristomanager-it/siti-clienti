// La sala giochi di famiglia: tombola, carte, biliardo, calciobalilla, il gioco della famiglia.
import { state, $app, esc, ICONE } from "../app.js";

const GIOCHI = [
  { icona: "🎄", nome: "Tombola", testo: "Uno fa il banco e scrive i premi, tutti con le cartelle sul telefono. Si segnano da sole, e l'app tiene la cassa.", link: "#/tombola", pronto: true },
  { icona: "🃏", nome: "Briscola", testo: "A 2, a 4 a coppie e a 5 chiamata, con le carte napoletane. Segni al compagno e chat al tavolo; se manca qualcuno gioca il telefono.", link: "#/briscola", pronto: true },
  { icona: "🂡", nome: "Tressette", testo: "A 4 a coppie o a 2, con le napoletane. Busso, striscio e volo al compagno; se manca qualcuno gioca il telefono.", link: "#/tressette", pronto: true },
  { icona: "🎱", nome: "Biliardo", testo: "Palla 8 con le buche: piene contro spezzate, vince chi imbuca la nera. Contro il telefono o sfidando un parente, anche da casa sua.", link: "#/biliardo", pronto: true },
  { icona: "⚽", nome: "Calciobalilla", testo: "Uno contro uno o due contro due. Il campo sul televisore e i telefoni come manopole, oppure ognuno da casa sua.", link: "#/calcio", pronto: true },
  { icona: "♟️", nome: "Dama e scacchi", testo: "Una mossa la mattina, una la sera: il nonno contro il nipote.", pronto: false },
  { icona: "🏠", piu: true, nome: "Il gioco della famiglia", testo: "Compra la casa della nonna e il mare del 2019: il tabellone lo rinominate voi, con i vostri posti e le vostre carte.", link: "#/tabellone", pronto: true },
];

export default async function ({ params } = {}) {
  // si gioca con la famiglia o con un gruppo di amici: si sceglie qui
  const fam = (params?.c && state.cerchie.find((c) => c.id === params.c)) ?? state.cerchie.find((c) => c.tipo === "famiglia") ?? state.cerchie[0];
  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/" aria-label="Indietro">${ICONE.indietro}</a><b>🎲 Giochi</b><span style="width:44px"></span></header>
    <div class="pad" style="padding-bottom:120px">
      <p class="tenue" style="margin-top:0">Si gioca tra voi, anche da case diverse. Con chi giochi?</p>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin:0 0 16px">${state.cerchie.map((c) => `<a href="#/giochi?c=${c.id}" class="chip ${c.id === fam?.id ? "on" : ""}" style="margin:0;text-decoration:none">${esc(c.nome)}</a>`).join("")}</div>
      ${GIOCHI.map((g) => `<${g.pronto ? `a href="${g.link}${fam ? `?c=${fam.id}` : ""}"` : "div"} class="card" style="display:flex;gap:14px;align-items:center;margin:0 0 12px;text-decoration:none;color:inherit;${g.pronto ? "" : "opacity:.6"}">
        <span style="font-size:36px" aria-hidden="true">${g.icona}</span>
        <span style="flex:1"><b style="display:block;font-size:18px">${g.nome}${g.piu ? ` <small style="font-size:12px;background:#E8B56B;color:#fff;border-radius:8px;padding:1px 6px;vertical-align:middle">Ancora+</small>` : ` <small style="font-size:12px;background:#E1F5EE;color:#085041;border-radius:8px;padding:1px 6px;vertical-align:middle">gratis</small>`}</b><span class="tenue">${g.testo}</span></span>
        ${g.pronto ? `<span style="font-size:22px" aria-hidden="true">›</span>` : `<small class="chip" style="margin:0">presto</small>`}</${g.pronto ? "a" : "div"}>`).join("")}
    </div>`;
}
