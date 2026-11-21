// Il ricettario di famiglia: tutte le ricette che posso vedere, con la voce di chi le fa.
import { sb, state, $app, esc, nomeDi, urlMediaMolti, ICONE } from "../app.js";

export default async function ({ params }) {
  const { data: ricette } = await sb.from("ricordi")
    .select("id, titolo, dettagli, creato_il, autore_id, persone:autore_id(id, nome, soprannome), ricordi_media(path, tipo)")
    .eq("tipo", "ricetta").order("creato_il", { ascending: false }).limit(200);
  const lista = ricette ?? [];
  const url = await urlMediaMolti(lista.flatMap((r) => (r.ricordi_media ?? []).filter((m) => m.tipo === "foto").slice(0, 1).map((m) => m.path)));
  const cerca = (params.q ?? "").toLowerCase();
  const filtrate = lista.filter((r) => !cerca || `${r.titolo} ${(r.dettagli?.ingredienti ?? []).join(" ")} ${nomeDi(r.persone)}`.toLowerCase().includes(cerca));

  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/profilo" aria-label="Indietro">${ICONE.indietro}</a>
      <span class="logo" style="font-size:22px">Ricettario</span><span style="width:44px"></span></header>
    <div class="pad"><p class="tenue" style="margin-top:0">Le ricette della famiglia, con la voce di chi le fa. ${lista.length} in tutto.</p>
      <input id="q" type="search" placeholder="Cerca: ragù, nonna, melanzane…" value="${esc(params.q ?? "")}">
      <a class="btn ambra" style="margin-top:10px" href="#/racconta?ricetta=1">Aggiungi una ricetta</a></div>
    <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:0 12px">
      ${filtrate.map((r) => {
        const f = (r.ricordi_media ?? []).find((m) => m.tipo === "foto");
        const voce = (r.ricordi_media ?? []).some((m) => m.tipo === "audio");
        return `<a href="#/ricordo/${r.id}" class="card" style="margin:0;padding:0;overflow:hidden;text-decoration:none;color:inherit">
          <div style="aspect-ratio:4/3;background:${f ? `#D8D1C4 url('${url[f.path]}') center/cover` : "linear-gradient(160deg,#F4E6CF,#EAD2AA)"};display:flex;align-items:flex-end;padding:8px">
            ${voce ? `<span class="chip on" style="margin:0;min-height:26px;padding:4px 10px">▶ voce</span>` : ""}</div>
          <div style="padding:10px 12px"><b style="font-family:Fraunces,serif;font-size:16px;display:block;line-height:1.2">${esc(r.titolo ?? "Ricetta")}</b>
            <span class="tenue">di ${esc(nomeDi(r.persone))}</span></div></a>`;
      }).join("") || `<p class="tenue" style="grid-column:1/-1">${cerca ? "Nessuna ricetta trovata." : "Il ricettario è vuoto: comincia dalla ricetta che si fa sempre la domenica."}</p>`}
    </div>`;
  document.getElementById("q").onchange = (e) => { location.hash = `#/ricette?q=${encodeURIComponent(e.target.value)}`; };
}
