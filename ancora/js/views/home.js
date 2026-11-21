// Il feed della famiglia: storie della settimana in alto, poi i ricordi con foto grande e voce.
import { sb, state, $app, esc, quando, nomeDi, avatar, pulsanteVoce, urlMediaMolti, ICONE, settimana, testata } from "../app.js";

export default async function ({ params }) {
  // arrivo dal link di invito: entra nella cerchia/famiglia e ricarica i dati
  if (params?.invito) {
    await sb.rpc("accetta_invito", { p_codice: params.invito });
    location.replace("#/"); location.reload(); return;
  }
  if (state.io.modalita === "semplice") return semplice();

  // filtro per famiglia/cerchia: chi sta in più famiglie (la sua, quella della moglie, gli amici) sceglie quale guardare
  const filtro = params?.c ?? null;
  let q = sb.from("ricordi")
    .select("id, tipo, titolo, testo, dettagli, creato_il, autore_id, cerchia_id, persone:autore_id(id, nome, soprannome, foto_path), ricordi_media(path, tipo, durata_sec, ordine), reazioni(persona_id, tipo)")
    .neq("visibilita", "solo_io");
  if (filtro === "diretti") q = q.in("visibilita", ["diretto", "segreto"]);
  else if (filtro) q = q.eq("cerchia_id", filtro);
  const { data: ricordi } = await q.order("creato_il", { ascending: false }).limit(30);
  const lista = ricordi ?? [];

  const paths = lista.flatMap((r) => (r.ricordi_media ?? []).map((m) => m.path))
    .concat(lista.map((r) => r.persone?.foto_path).filter(Boolean));
  const scelta = state.cerchie.find((c) => c.id === filtro);   // la pagina della famiglia scelta
  if (scelta) paths.push(...[scelta.foto_path, scelta.copertina_path].filter(Boolean));
  if (state.io.foto_path) paths.push(state.io.foto_path);
  const url = await urlMediaMolti([...new Set(paths)]);

  // storie: chi ha raccontato negli ultimi 7 giorni
  const settimana = Date.now() - 7 * 86400_000;
  const storie = [...new Map(lista.filter((r) => new Date(r.creato_il).getTime() > settimana && r.autore_id !== state.io.id)
    .map((r) => [r.autore_id, r])).values()];

  // la domanda della settimana: per la famiglia scelta, o la prima famiglia
  const fam = state.cerchie.find((c) => c.id === filtro && c.tipo === "famiglia") ?? state.cerchie.find((c) => c.tipo === "famiglia");
  let cardSettimana = "";
  if (fam) {
    const sett = settimana();
    const { data: domande } = await sb.from("domande_famiglia").select("id, testo, tema").order("id");
    if (domande?.length) {
      const d = domande[sett.numero % domande.length];   // la stessa per tutti, come nella notifica
      const { data: risposte } = await sb.from("ricordi").select("id, autore_id, persone:autore_id(id, nome, soprannome)")
        .eq("cerchia_id", fam.id).eq("domanda_settimana", sett.codice);
      const io = (risposte ?? []).some((r) => r.autore_id === state.io.id);
      cardSettimana = `<div class="lettera" style="margin-bottom:22px;font-size:18px">
        <span style="display:block;font-family:Manrope,sans-serif;font-size:12px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:#8A5A17">La domanda della settimana · ${esc(fam.nome)}</span>
        <b style="display:block;font-size:22px;line-height:1.25;margin:6px 0 10px">${esc(d.testo)}</b>
        <div style="display:flex;align-items:center;gap:6px;font-family:Manrope,sans-serif;font-size:13px">
          ${(risposte ?? []).slice(0, 6).map((r) => avatar(r.persone, 26)).join("")}
          <span>${risposte?.length ? `${risposte.length} ${risposte.length === 1 ? "ha risposto" : "hanno risposto"}` : "Nessuno ha ancora risposto: comincia tu"}</span></div>
        <div class="riga" style="gap:8px;margin-top:12px;font-family:Manrope,sans-serif">
          ${io ? "" : `<a class="btn ambra" style="flex:1;min-height:46px" href="#/racconta?settimana=${sett.codice}&c=${fam.id}&q=${d.id}">Rispondi a voce</a>`}
          ${risposte?.length ? `<a class="btn chiaro" style="flex:1;min-height:46px" href="#/settimana?c=${fam.id}&s=${sett.codice}&q=${d.id}">Ascolta le risposte</a>` : ""}
        </div></div>`;
    }
  }

  $app().innerHTML = `
    <header class="testa"><span class="logo">Ancora</span><span style="flex:1"></span>
      <a class="icona" href="#/agenda" aria-label="Agenda: vacanze, compiti, esami">${ICONE.agenda}</a>
      <a class="icona" href="#/profilo" aria-label="Il mio profilo">${avatar(state.io, 30, url[state.io.foto_path])}</a>
      <a class="icona" href="#/cerchie" aria-label="Cerchie e inviti"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></a></header>
    ${state.cerchie.length > 1 ? `<div class="storie" style="gap:6px;padding-bottom:8px" aria-label="Scegli la famiglia">${[["", "Tutti"], ...ordinaCerchie(state.cerchie).map((c) => [c.id, c.nome]), ["diretti", "Messaggi per me"]]
      .map(([id, n]) => `<a class="chip ${(filtro ?? "") === id ? "on" : ""}" style="flex-shrink:0;text-decoration:none" href="#/${id ? `?c=${id}` : ""}">${esc(n)}</a>`).join("")}</div>` : ""}
    ${scelta ? testata({ nome: scelta.nome, persona: { id: scelta.id, nome: scelta.nome }, foto: url[scelta.foto_path], copertina: url[scelta.copertina_path], alta: 130, tondo: 72 })
      .replace(`<div style="flex:1;padding-bottom:6px" data-testata-dx></div>`, `<div style="flex:1;padding-bottom:6px"><b style="font-size:19px">${esc(scelta.nome)}</b>${scelta.proprietario_id === state.io.id ? `<div><a class="tenue" href="#/cerchie">Cambia foto e copertina</a></div>` : ""}</div>`) : ""}
    ${cardSettimana}
    <div id="mia-domanda"></div>
    ${storie.length ? `<div class="storie" aria-label="Racconti della settimana">${storie.map((r) => {
      const fotoR = (r.ricordi_media ?? []).find((m) => m.tipo === "foto");
      const sfondo = fotoR ? url[fotoR.path] : (r.persone?.foto_path ? url[r.persone.foto_path] : null);
      return `<a class="storia" href="#/profilo/${r.autore_id}"><span class="anello"><span style="${sfondo ? `background-image:url('${sfondo}')` : ""}">${sfondo ? "" : esc(nomeDi(r.persone)[0] ?? "")}</span></span>
        <small>${esc(nomeDi(r.persone).replace(/^Nonn[oa] /, ""))}</small></a>`;
    }).join("")}</div>` : ""}
    ${lista.map((r, i) => post(r, url, i)).join("") || `<div class="pad"><h1>Ancora vuoto</h1><p class="tenue">Invita la famiglia dalle cerchie, o racconta tu per primo.</p></div>`}`;
  miaDomanda();

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

// prima le famiglie, poi gli amici e i gruppi
function ordinaCerchie(c) {
  const peso = { famiglia: 0, casa: 1, coppia: 2, amici: 3, gruppo: 4 };
  return [...c].sort((a, b) => (peso[a.tipo] ?? 9) - (peso[b.tipo] ?? 9));
}

function post(r, url, i) {
  const foto = (r.ricordi_media ?? []).filter((m) => m.tipo === "foto").sort((a, b) => a.ordine - b.ordine);
  const video = (r.ricordi_media ?? []).find((m) => m.tipo === "video");
  const audio = (r.ricordi_media ?? []).find((m) => m.tipo === "audio");
  const cuori = (r.reazioni ?? []).filter((x) => x.tipo === "cuore");
  const mio = cuori.some((x) => x.persona_id === state.io.id);
  const voce = audio ? pulsanteVoce(url[audio.path], audio.durata_sec, i) : "";
  const ric = r.tipo === "ricetta" ? r.dettagli ?? {} : null;
  const schedaRicetta = ric ? `<div class="lettera" style="font-family:Manrope,sans-serif;font-size:15px;white-space:normal">
      <span class="tenue" style="text-transform:uppercase;font-weight:800;letter-spacing:.5px;color:#8A5A17">Ricetta di famiglia${ric.porzioni ? ` · per ${ric.porzioni}` : ""}</span>
      <b style="display:block;font-family:Fraunces,serif;font-size:24px;margin:4px 0 8px">${esc(r.titolo ?? "")}</b>
      ${(ric.ingredienti ?? []).slice(0, 5).map((i) => `<div>· ${esc(i)}</div>`).join("")}${(ric.ingredienti ?? []).length > 5 ? `<div class="tenue">e altri ${(ric.ingredienti.length - 5)}…</div>` : ""}
      ${voce ? `<div style="margin-top:14px">${voce.replace('class="voce"', 'class="voce" style="margin:0;background:rgba(18,48,44,.9)"')}</div>` : ""}</div>` : "";
  const media = video && !foto.length ? `<div class="foto" style="aspect-ratio:auto;background:#000"><video src="${esc(url[video.path])}" controls playsinline preload="metadata" style="width:100%;max-height:70vh;display:block"></video></div>`
    : ric && !foto.length ? `<a href="#/ricordo/${r.id}" style="text-decoration:none;color:inherit;display:block">${schedaRicetta}</a>` : foto.length
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

// "La tua domanda": a tutti, non solo ai nonni. Prima quelle che ti fa la famiglia, poi la libreria.
async function miaDomanda(altra = false) {
  const el = document.getElementById("mia-domanda");
  if (!el) return;
  const { data: d } = await sb.rpc("mia_domanda", { p_altra: altra });
  if (!d) { el.innerHTML = ""; return; }
  el.innerHTML = `<div class="card" style="margin-bottom:18px;border-left:4px solid var(--ambra)">
    <span style="font-size:12px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:#8A5A17">${d.chiesta_da ? `${esc(d.chiesta_da)} ti chiede` : "La tua domanda"}</span>
    <b style="display:block;font-family:Fraunces,serif;font-size:20px;line-height:1.25;margin:6px 0 12px">${esc(d.testo)}</b>
    ${d.fatta
      ? `<div class="riga" style="gap:8px"><span class="tenue" style="flex:1">✓ Hai risposto. La prossima arriva la settimana prossima.</span><button class="chip" id="altra" style="margin:0">Un'altra</button></div>`
      : `<div class="riga" style="gap:8px"><a class="btn ambra" style="flex:1;min-height:46px" href="#/racconta?domanda=${d.id}">Rispondi a voce</a>
         <button class="chip" id="altra" style="margin:0">Cambia</button></div>`}
  </div>`;
  document.getElementById("altra").onclick = () => miaDomanda(true);
}
