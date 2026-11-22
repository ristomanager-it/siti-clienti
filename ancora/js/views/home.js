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
  // senza scelta si apre l'ultima famiglia guardata (o la prima); "tutti" mostra tutte insieme
  let ricordata = null; try { ricordata = localStorage.getItem("ancora_cerchia"); } catch { /* niente */ }
  const valida = (id) => id === "tutti" || id === "diretti" || state.cerchie.some((c) => c.id === id);
  const filtroScelto = params?.c && valida(params.c) ? params.c
    : (ricordata && valida(ricordata) ? ricordata : (ordinaCerchie(state.cerchie)[0]?.id ?? "tutti"));
  try { localStorage.setItem("ancora_cerchia", filtroScelto); } catch { /* niente */ }
  const filtro = filtroScelto === "tutti" ? null : filtroScelto;
  let q = sb.from("ricordi")
    .select("id, tipo, titolo, testo, dettagli, creato_il, autore_id, cerchia_id, persone:autore_id(id, nome, soprannome, foto_path), ricordi_media(path, tipo, durata_sec, ordine), reazioni(persona_id, tipo)")
    .neq("visibilita", "solo_io").neq("tipo", "storia");
  if (filtro === "diretti") q = q.in("visibilita", ["diretto", "segreto"]);
  else if (filtro) q = q.eq("cerchia_id", filtro);
  const { data: ricordi } = await q.order("creato_il", { ascending: false }).limit(30);
  const lista = ricordi ?? [];
  let qs = sb.from("ricordi").select("id, testo, creato_il, autore_id, cerchia_id, persone:autore_id(id, nome, soprannome, foto_path), ricordi_media(path, tipo, ordine)")
    .eq("tipo", "storia").gt("creato_il", new Date(Date.now() - 86400_000).toISOString());
  if (filtro && filtro !== "diretti") qs = qs.eq("cerchia_id", filtro);
  const { data: storieDb } = await qs.order("creato_il", { ascending: true }).limit(100);
  const tutteStorie = (storieDb ?? []).filter((r) => r.ricordi_media?.length);

  const paths = [...lista, ...tutteStorie].flatMap((r) => (r.ricordi_media ?? []).map((m) => m.path))
    .concat(tutteStorie.map((r) => r.persone?.foto_path).filter(Boolean))
    .concat(lista.map((r) => r.persone?.foto_path).filter(Boolean));
  const scelta = state.cerchie.find((c) => c.id === filtro);   // la pagina della famiglia scelta
  if (scelta) paths.push(...[scelta.foto_path, scelta.copertina_path].filter(Boolean));
  if (state.io.foto_path) paths.push(state.io.foto_path);
  const url = await urlMediaMolti([...new Set(paths)]);

  // storie delle ultime 24 ore, raggruppate per persona (prima chi ha storie non ancora viste)
  let viste = {}; try { viste = JSON.parse(localStorage.getItem("ancora_storie_viste") ?? "{}"); } catch { /* niente */ }
  const perPersona = [...tutteStorie.reduce((m, r) => m.set(r.autore_id, [...(m.get(r.autore_id) ?? []), r]), new Map()).values()]
    .map((g) => ({ persona: g[0].persone, autore: g[0].autore_id, storie: g, nuove: g.some((r) => !viste[r.id]) }))
    .sort((x, y) => (x.autore === state.io.id ? -1 : y.autore === state.io.id ? 1 : (y.nuove - x.nuove)));
  const mie = perPersona.find((g) => g.autore === state.io.id);

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
    <header class="testa"><b style="font-family:Fraunces,serif;font-size:24px;line-height:1.1;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(
      scelta?.nome ?? (filtro === "diretti" ? "Messaggi per me" : state.cerchie.length ? "Tutte le famiglie" : "Ancora"))}</b></header>
    <div class="storie" aria-label="Storie">
      <button class="storia" id="nuova-storia" type="button"><span class="anello ${mie ? "" : "visto"}" style="position:relative"><span style="${state.io.foto_path ? `background-image:url('${url[state.io.foto_path]}')` : ""}">${state.io.foto_path ? "" : esc(nomeDi(state.io)[0] ?? "")}</span>
        <i style="position:absolute;right:-2px;bottom:-2px;width:24px;height:24px;border-radius:12px;background:var(--ambra);color:#fff;font-style:normal;font-weight:800;display:grid;place-items:center;border:2px solid var(--carta)">+</i></span>
        <small>La tua storia</small></button>
      ${perPersona.filter((g) => g.autore !== state.io.id).map((g) => {
        const ultima = g.storie.at(-1).ricordi_media[0]; const sf = g.persona?.foto_path ? url[g.persona.foto_path] : (ultima.tipo === "foto" ? url[ultima.path] : "");
        return `<button class="storia" type="button" data-storie="${g.autore}"><span class="anello ${g.nuove ? "" : "visto"}"><span style="background-image:url('${sf}')"></span></span>
          <small>${esc(nomeDi(g.persona).replace(/^Nonn[oa] /, ""))}</small></button>`;
      }).join("")}
    </div>
    <input type="file" id="file-storia" accept="image/*,video/*" hidden>
    ${scelta ? testata({ nome: scelta.nome, persona: { id: scelta.id, nome: scelta.nome }, foto: url[scelta.foto_path], copertina: url[scelta.copertina_path], alta: 130, tondo: 72 })
      .replace(`<div style="flex:1;padding-bottom:6px" data-testata-dx></div>`, `<div style="flex:1;padding-bottom:6px">${scelta.proprietario_id === state.io.id && !scelta.foto_path ? `<a class="tenue" href="#/cerchie">Aggiungi foto e copertina</a>` : ""}</div>`) : ""}
    ${cardSettimana}
    <div id="mia-domanda"></div>
    ${lista.map((r, i) => post(r, url, i)).join("") || `<div class="pad"><h1>Ancora vuoto</h1><p class="tenue">Invita la famiglia dalle cerchie, o racconta tu per primo.</p></div>`}`;
  miaDomanda();
  collegaStorie(perPersona, url, filtro);

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
  el.querySelector("#altra").onclick = () => miaDomanda(true);
}

// --- Storie: si pubblicano dal "+" e si guardano a tutto schermo; dopo 24 ore spariscono dalla bacheca ---
function collegaStorie(perPersona, url, filtro) {
  const mie = perPersona.find((g) => g.autore === state.io.id);
  const input = document.getElementById("file-storia");
  document.getElementById("nuova-storia").onclick = () => mie ? guardaStorie(perPersona, perPersona.indexOf(mie), url, true) : input.click();
  input.onchange = async () => {
    const f = input.files?.[0]; if (!f) return;
    const cerchia = filtro && filtro !== "diretti" ? filtro : ordinaCerchie(state.cerchie)[0]?.id;
    if (!cerchia) { alert("Prima crea o entra in una famiglia."); return; }
    if (f.size > 50 * 1024 * 1024) { alert("Il file supera i 50 MB."); return; }
    const anello = document.querySelector("#nuova-storia .anello"); anello.style.opacity = .5;
    const tipo = f.type.startsWith("video") ? "video" : "foto";
    const { data: r, error } = await sb.from("ricordi").insert({ autore_id: state.io.id, tipo: "storia", visibilita: "cerchia", cerchia_id: cerchia, in_memoria: true }).select("id").single();
    if (error) { alert("Non pubblicata: " + error.message); anello.style.opacity = 1; return; }
    const path = `${state.io.id}/${r.id}/${tipo}.${(f.name.split(".").pop() || (tipo === "foto" ? "jpg" : "mp4")).toLowerCase().slice(0, 5)}`;
    const up = await sb.storage.from("ricordi").upload(path, f, { contentType: f.type || undefined });
    if (up.error) { alert("Non caricata: " + up.error.message); await sb.from("ricordi").delete().eq("id", r.id); anello.style.opacity = 1; return; }
    await sb.from("ricordi_media").insert({ ricordo_id: r.id, path, tipo, byte: f.size, mime: f.type || null });
    location.reload();
  };
  document.querySelectorAll("[data-storie]").forEach((b) => b.onclick = () =>
    guardaStorie(perPersona, perPersona.findIndex((g) => g.autore === b.dataset.storie), url));
}

function guardaStorie(gruppi, gi, url, conAggiungi = false) {
  let g = gi, i = Math.max(0, gruppi[g].storie.findIndex((r) => !segnata(r.id)));
  let timer = null;
  const v = document.createElement("div");
  v.style.cssText = "position:fixed;inset:0;z-index:60;background:#000;color:#fff;display:flex;flex-direction:column;touch-action:manipulation";
  document.body.appendChild(v);
  const chiudi = () => { clearTimeout(timer); v.remove(); removeEventListener("hashchange", chiudi); document.querySelectorAll("[data-storie]").forEach((b) => {
    const gr = gruppi.find((x) => x.autore === b.dataset.storie); if (gr && gr.storie.every((r) => segnata(r.id))) b.querySelector(".anello").classList.add("visto"); }); };
  addEventListener("hashchange", chiudi);
  const avanti = () => { const gr = gruppi[g]; if (i < gr.storie.length - 1) i++; else if (g < gruppi.length - 1 && !conAggiungi) { g++; i = 0; } else return chiudi(); mostra(); };
  const indietro = () => { if (i > 0) i--; else if (g > 0 && !conAggiungi) { g--; i = gruppi[g].storie.length - 1; } mostra(); };
  function mostra() {
    clearTimeout(timer);
    const gr = gruppi[g], r = gr.storie[i], m = r.ricordi_media[0];
    segna(r.id);
    const ore = Math.max(1, Math.round((Date.now() - new Date(r.creato_il)) / 3600_000));
    v.innerHTML = `
      <div style="display:flex;gap:4px;padding:calc(10px + env(safe-area-inset-top)) 10px 8px">${gr.storie.map((_, k) =>
        `<span style="flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.35);overflow:hidden"><i style="display:block;height:100%;background:#fff;width:${k < i ? 100 : 0}%" ${k === i ? 'id="barra-ora"' : ""}></i></span>`).join("")}</div>
      <div style="display:flex;align-items:center;gap:10px;padding:0 12px 10px">${avatar(gr.persona ?? {}, 34, gr.persona?.foto_path ? url[gr.persona.foto_path] : null)}
        <b style="flex:1">${esc(nomeDi(gr.persona))} <span style="opacity:.7;font-weight:500">· ${ore} h</span></b>
        ${gr.autore === state.io.id ? `<button id="st-agg" style="background:rgba(255,255,255,.15);color:#fff;border:0;border-radius:999px;padding:8px 12px;font-weight:700">+ Aggiungi</button>` : ""}
        <button id="st-x" aria-label="Chiudi" style="background:none;border:0;color:#fff;font-size:26px;width:44px;height:44px">✕</button></div>
      <div style="flex:1;position:relative;display:grid;place-items:center;overflow:hidden">
        ${m.tipo === "video" ? `<video id="st-media" src="${url[m.path]}" autoplay playsinline style="max-width:100%;max-height:100%"></video>`
                             : `<img id="st-media" src="${url[m.path]}" alt="" style="max-width:100%;max-height:100%;object-fit:contain">`}
        <button id="st-ind" aria-label="Indietro" style="position:absolute;left:0;top:0;bottom:0;width:35%;background:none;border:0"></button>
        <button id="st-av" aria-label="Avanti" style="position:absolute;right:0;top:0;bottom:0;width:65%;background:none;border:0"></button>
      </div>
      ${r.testo ? `<p style="padding:12px 16px calc(16px + env(safe-area-inset-bottom));margin:0;font-size:17px">${esc(r.testo)}</p>` : `<div style="height:calc(14px + env(safe-area-inset-bottom))"></div>`}`;
    v.querySelector("#st-x").onclick = chiudi;
    v.querySelector("#st-av").onclick = avanti;
    v.querySelector("#st-ind").onclick = indietro;
    v.querySelector("#st-agg")?.addEventListener("click", () => { chiudi(); document.getElementById("file-storia").click(); });
    const barra = v.querySelector("#barra-ora"), media = v.querySelector("#st-media");
    const parti = (ms) => { barra.style.transition = `width ${ms}ms linear`; requestAnimationFrame(() => { barra.style.width = "100%"; }); timer = setTimeout(avanti, ms); };
    if (m.tipo === "video") media.onloadedmetadata = () => parti(Math.min(60, media.duration || 15) * 1000);
    else parti(5000);
  }
  mostra();
}
function segnata(id) { try { return !!JSON.parse(localStorage.getItem("ancora_storie_viste") ?? "{}")[id]; } catch { return false; } }
function segna(id) {
  try { const v = JSON.parse(localStorage.getItem("ancora_storie_viste") ?? "{}"); v[id] = Date.now();
    for (const k of Object.keys(v)) if (Date.now() - v[k] > 3 * 86400_000) delete v[k];
    localStorage.setItem("ancora_storie_viste", JSON.stringify(v)); } catch { /* niente */ }
}
