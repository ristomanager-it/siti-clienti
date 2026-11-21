// Il mio diario: privato di default, promemoria all'orario scelto, "accadeva oggi".
import { sb, state, $app, esc, quando, urlMediaMolti } from "../app.js";

export default async function () {
  const { data: pref } = await sb.from("diario_promemoria").select("ora, attivo").eq("persona_id", state.io.id).maybeSingle();
  const unAnnoFa = new Date(); unAnnoFa.setFullYear(unAnnoFa.getFullYear() - 1);
  const giorno = unAnnoFa.toISOString().slice(0, 10);
  const [{ data: miei }, { data: accadeva }] = await Promise.all([
    sb.from("ricordi").select("id, testo, creato_il").eq("autore_id", state.io.id).eq("tipo", "diario")
      .order("creato_il", { ascending: false }).limit(10),
    sb.from("ricordi").select("id, titolo, testo, creato_il, ricordi_media(path, tipo)")
      .eq("autore_id", state.io.id).gte("creato_il", giorno).lt("creato_il", giorno + "T23:59:59").limit(3),
  ]);
  const url = await urlMediaMolti((accadeva ?? []).flatMap((r) => (r.ricordi_media ?? []).filter((m) => m.tipo === "foto").map((m) => m.path)));

  $app().innerHTML = `
    <header class="testa"><span class="logo" style="font-size:22px">Il mio diario</span><span class="tenue">solo io</span></header>
    <div class="pad"><p class="tenue" style="margin:0">${new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}</p>
      <h1>Com'è andata oggi?</h1></div>
    <form id="nuovo" class="pad">
      <label class="visually-hidden" for="oggi">Il diario di oggi</label>
      <textarea id="oggi" rows="4" placeholder="Scrivi qui, oppure usa il microfono in basso"></textarea>
      <button class="btn" style="margin-top:8px">Salva nel diario</button>
    </form>
    <div class="card"><label for="ora" style="margin-top:0">Il tuo momento per il diario</label>
      <div class="riga"><input id="ora" type="time" value="${esc(String(pref?.ora ?? "22:00").slice(0, 5))}" style="width:auto">
        <label class="riga" style="margin:0"><input id="attivo" type="checkbox" ${pref?.attivo === false ? "" : "checked"} style="width:auto"> Promemoria</label></div>
      <p class="tenue" style="margin-bottom:0">Se salti un giorno, niente sensi di colpa.</p></div>
    ${(accadeva ?? []).length ? `<h2>Accadeva oggi, un anno fa</h2>` + accadeva.map((r) => {
      const f = (r.ricordi_media ?? []).find((m) => m.tipo === "foto");
      return f ? `<a class="foto" href="#/ricordo/${r.id}" style="background-image:url('${url[f.path]}');aspect-ratio:1/1;margin-bottom:10px" aria-label="Apri"></a>`
        : `<a class="lettera" href="#/ricordo/${r.id}" style="display:block;text-decoration:none;font-size:17px;margin-bottom:10px">${esc(r.titolo ?? r.testo ?? "")}</a>`;
    }).join("") : ""}
    ${(miei ?? []).length ? `<h2>Le ultime pagine</h2>` + miei.map((r) =>
      `<a class="card" href="#/ricordo/${r.id}" style="display:block;text-decoration:none;color:inherit"><div class="tenue">${quando(r.creato_il)}</div>${esc((r.testo ?? "").slice(0, 140))}</a>`).join("") : ""}`;

  const salvaPref = () => sb.from("diario_promemoria").upsert({
    persona_id: state.io.id, ora: document.getElementById("ora").value, attivo: document.getElementById("attivo").checked,
  });
  document.getElementById("ora").onchange = salvaPref;
  document.getElementById("attivo").onchange = salvaPref;
  document.getElementById("nuovo").onsubmit = async (e) => {
    e.preventDefault();
    const t = document.getElementById("oggi").value.trim();
    if (!t) return;
    await sb.from("ricordi").insert({ autore_id: state.io.id, tipo: "diario", testo: t, visibilita: "solo_io" });
    location.reload();
  };
}
