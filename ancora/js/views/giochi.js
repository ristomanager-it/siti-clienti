// La sala giochi di famiglia: tombola, carte, biliardo, calciobalilla, il gioco della famiglia.
import { state, $app, esc, ICONE, sb, giochiPermessi } from "../app.js";

const GIOCHI = [
  { icona: "🎄", nome: "Tombola", testo: "Uno fa il banco e scrive i premi, tutti con le cartelle sul telefono. Si segnano da sole, e l'app tiene la cassa.", link: "#/tombola", chiave: "tombola", pronto: true },
  { icona: "🃏", nome: "Briscola", testo: "A 2, a 4 a coppie e a 5 chiamata, con le carte napoletane. Segni al compagno e chat al tavolo; se manca qualcuno gioca il telefono.", link: "#/briscola", chiave: "briscola", pronto: true },
  { icona: "🂡", nome: "Tressette", testo: "A 4 a coppie o a 2, con le napoletane. Busso, striscio e volo al compagno; se manca qualcuno gioca il telefono.", link: "#/tressette", chiave: "tressette", pronto: true },
  { icona: "🂱", nome: "Stoppa", testo: "Da 3 a 6, con le napoletane: punti piccoli, punto grosso e la stoppata. Si gioca a fiches; se manca qualcuno gioca il telefono.", link: "#/stoppa", chiave: "stoppa", pronto: true },
  { icona: "🎱", nome: "Biliardo", testo: "Palla 8 con le buche: piene contro spezzate, vince chi imbuca la nera. Contro il telefono o sfidando un parente, anche da casa sua.", link: "#/biliardo", chiave: "biliardo", pronto: true },
  { icona: "🏎️", nome: "Corse", testo: "In 3D, con tre visuali: da dietro, dal cofano, dall'alto. Contro il telefono, sul giro veloce con la classifica del gruppo, o in gara dal vivo fino a 6.", link: "#/auto", chiave: "auto", pronto: true },
  { icona: "⚽", nome: "Calciobalilla", testo: "Uno contro uno o due contro due. Il campo sul televisore e i telefoni come manopole, oppure ognuno da casa sua.", link: "#/calcio", chiave: "calcio", pronto: true },
  { icona: "♟️", nome: "Dama e scacchi", testo: "Una mossa la mattina, una la sera: il nonno contro il nipote.", pronto: false },
  { icona: "🏠", piu: true, nome: "Il gioco della famiglia", testo: "Compra la casa della nonna e il mare del 2019: il tabellone lo rinominate voi, con i vostri posti e le vostre carte.", link: "#/tabellone", chiave: "tabellone", pronto: true },
];

export default async function ({ params } = {}) {
  // si gioca con la famiglia o con un gruppo di amici: si sceglie qui
  const gp = await giochiPermessi(true);
  const vede = (k) => gp.admin || gp.aperti.has(k);
  // il superadmin vede tutto, con l'interruttore per aprire ogni gioco a tutti
  const interruttore = (k) => gp.admin ? `<button class="chip ${gp.aperti.has(k) ? "on" : ""}" data-apri="${k}" style="margin:6px 0 0;font-size:13px">${gp.aperti.has(k) ? "👥 Visibile a tutti" : "🔒 Solo tu"}</button>` : "";
  const giochi = GIOCHI.filter((g) => !g.chiave || vede(g.chiave)).filter((g) => g.pronto || gp.admin || GIOCHI.some((x) => x.chiave && vede(x.chiave)));
  const fam = (params?.c && state.cerchie.find((c) => c.id === params.c)) ?? state.cerchie.find((c) => c.tipo === "famiglia") ?? state.cerchie[0];
  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/" aria-label="Indietro">${ICONE.indietro}</a><b>🎲 Giochi</b><span style="width:44px"></span></header>
    <div class="pad" style="padding-bottom:120px">
      <p class="tenue" style="margin-top:0">Si gioca tra voi, anche da case diverse. Con chi giochi?</p>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin:0 0 16px">${state.cerchie.map((c) => `<a href="#/giochi?c=${c.id}" class="chip ${c.id === fam?.id ? "on" : ""}" style="margin:0;text-decoration:none">${esc(c.nome)}</a>`).join("")}</div>
      ${gp.admin ? `<p style="margin:0 0 14px;padding:10px 12px;border-radius:12px;background:#FFF4DF;font-size:14px">🔒 Vedi tutti i giochi perché sei il superadmin. Quando uno è provato, toccalo su <b>Visibile a tutti</b>.</p>` : ""}
      ${!gp.admin && !GIOCHI.some((g) => g.chiave && vede(g.chiave)) && !vede("tornei") ? `<div class="card" style="text-align:center"><div style="font-size:40px">🎲</div><b>I giochi arrivano presto</b><p class="tenue" style="margin:6px 0 0">Li stiamo provando uno per uno: appena sono pronti li trovi qui.</p></div>` : ""}
      ${fam && vede("tornei") ? `<a href="#/tornei?c=${fam.id}" class="card" style="display:flex;gap:14px;align-items:center;margin:0 0 16px;text-decoration:none;color:#FBF3E2;background:#12302C;border-color:#12302C">
        <span style="font-size:36px">🏆</span><span style="flex:1"><b style="display:block;font-size:18px">Campionati e tornei</b><span style="opacity:.85;font-size:14px">Fate il vostro campionato o torneo di ${esc(fam.nome)}: classifica e tabellone si aggiornano da soli.</span></span><span style="font-size:22px">›</span></a>${interruttore("tornei")}<div style="height:12px"></div>` : ""}
      ${(giochi.some((g) => g.chiave) ? giochi : []).map((g) => `<${g.pronto ? `a href="${g.link}${fam ? `?c=${fam.id}` : ""}"` : "div"} class="card" style="display:flex;gap:14px;align-items:center;margin:0 0 12px;text-decoration:none;color:inherit;${g.pronto ? "" : "opacity:.6"}">
        <span style="font-size:36px" aria-hidden="true">${g.icona}</span>
        <span style="flex:1"><b style="display:block;font-size:18px">${g.nome}${g.piu ? ` <small style="font-size:12px;background:#E8B56B;color:#fff;border-radius:8px;padding:1px 6px;vertical-align:middle">Ancora+</small>` : ` <small style="font-size:12px;background:#E1F5EE;color:#085041;border-radius:8px;padding:1px 6px;vertical-align:middle">gratis</small>`}</b><span class="tenue">${g.testo}</span></span>
        ${g.pronto ? `<span style="font-size:22px" aria-hidden="true">›</span>` : `<small class="chip" style="margin:0">presto</small>`}</${g.pronto ? "a" : "div"}>${g.chiave ? interruttore(g.chiave) : ""}${g.chiave && gp.admin ? `<div style="height:10px"></div>` : ""}`).join("")}
    </div>`;
  document.querySelectorAll("[data-apri]").forEach((b) => b.onclick = async () => {
    const k = b.dataset.apri, aperto = !gp.aperti.has(k);
    if (aperto && !confirm("Rendere questo gioco visibile a tutti?")) return;
    b.disabled = true;
    const { error } = await sb.rpc("gioco_apri", { p_gioco: k, p_aperto: aperto });
    if (error) { alert("Non riuscito: " + error.message); b.disabled = false; return; }
    await giochiPermessi(true);
    location.reload();
  });
}
