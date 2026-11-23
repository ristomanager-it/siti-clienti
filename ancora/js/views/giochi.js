// La sala giochi di famiglia. Per ora la tombola; poi briscola, dama e scacchi, il gioco della famiglia.
import { state, $app, esc, ICONE } from "../app.js";

const GIOCHI = [
  { icona: "🎄", nome: "Tombola di famiglia", testo: "Uno fa il banco, tutti con le cartelle sul telefono. Si segnano da sole, anche a distanza.", link: "#/tombola", pronto: true },
  { icona: "🃏", nome: "Briscola", testo: "A 2, a 4 e a 5 chiamata, col mazzo napoletano. Se manca qualcuno gioca il telefono.", pronto: false },
  { icona: "♟️", nome: "Dama e scacchi", testo: "Una mossa la mattina, una la sera: il nonno contro il nipote.", pronto: false },
  { icona: "🏠", nome: "Il gioco della famiglia", testo: "Compra la casa della nonna e il mare del 2019: il tabellone lo fanno i vostri ricordi.", pronto: false },
];

export default async function () {
  const fam = state.cerchie.find((c) => c.tipo === "famiglia");
  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/" aria-label="Indietro">${ICONE.indietro}</a><b>🎲 Giochi di famiglia</b><span style="width:44px"></span></header>
    <div class="pad" style="padding-bottom:120px">
      <p class="tenue" style="margin-top:0">Si gioca tra voi${fam ? `, in ${esc(fam.nome)}` : ""}: nonni, figli e nipoti, anche da case diverse.</p>
      ${GIOCHI.map((g) => `<${g.pronto ? `a href="${g.link}${fam ? `?c=${fam.id}` : ""}"` : "div"} class="card" style="display:flex;gap:14px;align-items:center;margin:0 0 12px;text-decoration:none;color:inherit;${g.pronto ? "" : "opacity:.6"}">
        <span style="font-size:36px" aria-hidden="true">${g.icona}</span>
        <span style="flex:1"><b style="display:block;font-size:18px">${g.nome}</b><span class="tenue">${g.testo}</span></span>
        ${g.pronto ? `<span style="font-size:22px" aria-hidden="true">›</span>` : `<small class="chip" style="margin:0">presto</small>`}</${g.pronto ? "a" : "div"}>`).join("")}
    </div>`;
}
