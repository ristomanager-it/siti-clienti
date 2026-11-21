// Il feed della famiglia: storie della settimana in alto, poi i ricordi con foto grande e voce.
import { sb, state, $app, esc, quando, nomeDi, avatar, pulsanteVoce, urlMediaMolti, ICONE } from "../app.js";

export default async function ({ params }) {
  // arrivo dal link di invito: entra nella cerchia/famiglia e ricarica i dati
  if (params?.invito) {
    await sb.rpc("accetta_invito", { p_codice: params.invito });
    location.replace("#/"); location.reload(); return;
  }
  if (state.io.modalita === "semplice") return semplice();

  const { data: ricordi } = await sb.from("ricordi")
    .select("id, tipo, titolo, testo, creato_il, autore_id, persone:autore_id(id, nome, soprannome, foto_path), ricordi_media(path, tipo, durata_sec, ordine), reazioni(persona_id, tipo)")
    .neq("visibilita", "solo_io")
    .order("creato_il", { ascending: false }).limit(30);
  const lista = ricordi ?? [];

  const paths = lista.flatMap((r) => (r.ricordi_media ?? []).map((m) => m.path))
    .concat(lista.map((r) => r.persone?.foto_path).filter(Boolean));
  const url = await urlMediaMolti([...new Set(paths)]);

  // storie: chi ha raccontato negli ultimi 7 giorni
  const settimana = Date.now() - 7 * 86400_000;
  const storie = [...new Map(lista.filter((r) => new Date(r.creato_il).getTime() > settimana && r.autore_id !== state.io.id)
    .map((r) => [r.autore_id, r])).values()];

  $app().innerHTML = `
    <header class="testa"><span class="logo">Ancora</span>
      <a class="icona" href="#/cerchie" aria-label="Cerchie e inviti"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></a></header>
    ${storie.length ? `<div class="storie" aria-label="Racconti della settimana">${storie.map((r) => {
      const fotoR = (r.ricordi_media ?? []).find((m) => m.tipo === "foto");
      const sfondo = fotoR ? url[fotoR.path] : (r.persone?.foto_path ? url[r.persone.foto_path] : null);
      return `<a class="storia" href="#/profilo/${r.autore_id}"><span class="anello"><span style="${sfondo ? `background-image:url('${sfondo}')` : ""}">${sfondo ? "" : esc(nomeDi(r.persone)[0] ?? "")}</span></span>
        <small>${esc(nomeDi(r.persone).replace(/^Nonn[oa] /, ""))}</small></a>`;
    }).join("")}</div>` : ""}
    ${lista.map((r, i) => post(r, url, i)).join("") || `<div class="pad"><h1>Ancora vuoto</h1><p class="tenue">Invita la famiglia dalle cerchie, o racconta tu per primo.</p></div>`}`;

  document.querySelectorAll("[data-cuore]").forEach((b) => b.onclick = async () => {
    const id = b.dataset.cuore;
    if (b.classList.contains("on")) {
      await sb.from("reazioni").delete().eq("ricordo_id", id).eq("persona_id", state.io.id).eq("tipo", "cuore");
    } else {
      await sb.from("reazioni").insert({ ricordo_id: id, persona_id: state.io.id, tipo: "cuore" });
    }
    b.classList.toggle("on");
    const n = document.getElementById(`n-${id}`);
    n.textContent = `${Number(n.dataset.n) + (b.classList.contains("on") ? 1 : 0) - (n.dataset.mio === "1" ? 1 : 0)} cuori`;
  });
}

function post(r, url, i) {
  const foto = (r.ricordi_media ?? []).filter((m) => m.tipo === "foto").sort((a, b) => a.ordine - b.ordine);
  const audio = (r.ricordi_media ?? []).find((m) => m.tipo === "audio");
  const cuori = (r.reazioni ?? []).filter((x) => x.tipo === "cuore");
  const mio = cuori.some((x) => x.persona_id === state.io.id);
  const voce = audio ? pulsanteVoce(url[audio.path], audio.durata_sec, i) : "";
  const media = foto.length
    ? `<a class="foto" href="#/ricordo/${r.id}" style="background-image:url('${url[foto[0].path]}')" aria-label="Apri il ricordo">${voce}</a>`
    : `<div class="lettera">${esc(r.testo ?? "")}${voce ? `<div style="margin-top:14px">${voce.replace('class="voce"', 'class="voce" style="margin:0;background:rgba(18,48,44,.9)"')}</div>` : ""}</div>`;
  return `<article class="post">
    <a class="post-testa" href="#/profilo/${r.autore_id}">${avatar(r.persone, 38, r.persone?.foto_path ? url[r.persone.foto_path] : null)}
      <div><b>${esc(nomeDi(r.persone))}</b><small>${quando(r.creato_il)}</small></div></a>
    ${media}
    <div class="azioni">
      <button class="icona ${mio ? "on" : ""}" data-cuore="${r.id}" aria-label="Mi piace">${ICONE.cuore}</button>
      <a class="icona" href="#/ricordo/${r.id}" aria-label="Commenta">${ICONE.commento}</a>
      <a class="icona" href="#/racconta?risposta=${r.id}" aria-label="Rispondi con un vocale">${ICONE.mic}</a>
    </div>
    <div class="didascalia"><b style="font-size:14px" id="n-${r.id}" data-n="${cuori.length}" data-mio="${mio ? 1 : 0}">${cuori.length} cuori</b>
      ${r.titolo ? `<span class="q">${esc(r.titolo)}</span>` : ""}
      ${foto.length && r.testo ? `<span>${esc(r.testo)}</span>` : ""}
    </div></article>`;
}

function semplice() {
  $app().classList.add("semplice");
  $app().innerHTML = `<div class="pad">
    <h1 style="margin:24px 0 18px">Ciao ${esc(nomeDi(state.io))}</h1>
    <a class="btn grande ambra" href="#/racconta">Racconta<span style="font-size:15px;font-weight:600">tieni premuto e parla</span></a>
    <a class="btn grande chiaro" href="#/racconta?foto=1">Foto</a>
    <a class="btn grande chiaro" href="#/racconti">La famiglia</a></div>`;
}
