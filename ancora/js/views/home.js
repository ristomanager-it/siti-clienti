// Il feed della famiglia: storie della settimana in alto, poi i ricordi con foto grande e voce.
import { sb, state, $app, esc, quando, nomeDi, avatar, pulsanteVoce, urlMediaMolti, ICONE, settimana, testata, aggiorna, cambiaImmagine, invitaInCerchia } from "../app.js";

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
    .neq("visibilita", "solo_io").neq("tipo", "storia")
    .or(`sblocco.eq.subito,sblocco.eq.dopo_scomparsa,and(sblocco.eq.da_data,sblocco_data.lte.${new Date().toISOString().slice(0, 10)})`);   // le lettere chiuse non stanno nel feed
  if (filtro === "diretti") q = q.in("visibilita", ["diretto", "segreto"]);
  else if (filtro) q = q.eq("cerchia_id", filtro);
  const { data: ricordi } = await q.order("creato_il", { ascending: false }).limit(30);
  const lista = ricordi ?? [];
  let qs = sb.from("ricordi").select("id, testo, creato_il, autore_id, cerchia_id, dettagli, persone:autore_id(id, nome, soprannome, foto_path), ricordi_media(path, tipo, ordine, descrizione)")
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
  if (state.io.aiutante_foto_path) paths.push(state.io.aiutante_foto_path);
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
      cardSettimana = `<div class="card" style="margin:6px 16px 22px;background:#F4E6CF">
        <span style="display:block;font-size:12px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:#8A5A17">La domanda della settimana</span>
        <b style="display:block;font-family:Fraunces,serif;font-size:19px;line-height:1.3;margin:6px 0 10px">${esc(d.testo)}</b>
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
        const ultima = visivo(g.storie.at(-1)); const sf = g.persona?.foto_path ? url[g.persona.foto_path] : (ultima.tipo === "foto" ? url[ultima.path] : "");
        return `<button class="storia" type="button" data-storie="${g.autore}"><span class="anello ${g.nuove ? "" : "visto"}"><span style="background-image:url('${sf}')"></span></span>
          <small>${esc(nomeDi(g.persona).replace(/^Nonn[oa] /, ""))}</small></button>`;
      }).join("")}
    </div>
    <input type="file" id="file-storia" accept="image/*,video/*" hidden>
    ${scelta ? testata({ nome: scelta.nome, persona: { id: scelta.id, nome: scelta.nome }, foto: url[scelta.foto_path], copertina: url[scelta.copertina_path], alta: 130, tondo: 72, modifica: scelta.proprietario_id === state.io.id, chiave: scelta.id })
      .replace(`<div style="flex:1;padding-bottom:6px" data-testata-dx></div>`, `<div style="flex:1;padding-bottom:6px">${scelta.proprietario_id === state.io.id ? `<button class="chip" data-invita="${scelta.id}" style="margin:0">+ Invita</button>` : ""}</div>`) : ""}
    ${scelta && params?.nuova && scelta.proprietario_id === state.io.id ? `<div class="card" style="margin:0 16px 16px;border:2px solid var(--ambra)">
      <b style="font-family:Fraunces,serif;font-size:21px">«${esc(scelta.nome)}» è pronta</b>
      <p class="tenue" style="margin:4px 0 10px">Preparala prima di invitare: chi arriva vede subito cos'è.</p>
      <div style="padding:6px 0">${scelta.foto_path && scelta.copertina_path ? "✅" : "①"} <b>Foto e copertina</b> · tocca 📷 qui sopra</div>
      <div style="padding:6px 0">② <a href="#/racconta?c=${scelta.id}"><b>Scrivi il benvenuto</b></a> o metti una prima foto</div>
      <button class="btn ambra" data-invita="${scelta.id}" style="margin-top:10px">③ Invita la famiglia</button></div>` : ""}
    ${fam ? (() => {
      // l'aiutante di casa sempre a vista: nome della famiglia, foto scelta da ognuno
      const chiedi = fam.aiutante_nome ? `Chiedi a ${esc(fam.aiutante_nome)}` : "Chiedi all'aiutante";
      const fa = state.io.aiutante_foto_path ? url[state.io.aiutante_foto_path] : "";
      return `<a href="#/aiutante?c=${fam.id}" class="card" style="margin:0 16px 16px;display:flex;align-items:center;gap:12px;text-decoration:none;color:inherit;background:#E1F5EE;border-color:#9FE1CB">
        <span style="width:48px;height:48px;border-radius:24px;flex-shrink:0;display:grid;place-items:center;font-size:24px;background:#fff center/cover${fa ? ` url('${fa}')` : ""}">${fa ? "" : "✨"}</span>
        <span style="flex:1;min-width:0"><b style="display:block;font-size:17px">${chiedi}</b>
          <small style="color:#085041">Cosa cucino col frigo · com'è la pianta · la spesa · gli impegni</small></span>
        <span aria-hidden="true" style="font-size:22px;color:#085041">›</span></a>`;
    })() : ""}
    ${(() => {
      // prima i post; la domanda della settimana e gli inviti a raccontare arrivano dopo i primi due
      const extra = `<div id="mia-domanda" hidden></div><div id="per-chi-conta"></div>`;
      const posts = lista.map((r, i) => post(r, url, i));
      if (!posts.length) return extra + `<div class="pad"><h1>Ancora vuoto</h1><p class="tenue">Invita la famiglia dalle cerchie, o racconta tu per primo.</p></div>`;
      return posts.slice(0, 2).join("") + extra + posts.slice(2).join("");
    })()}`;
  perChiConta();
  collegaStorie(perPersona, url, filtro);
  document.querySelectorAll("[data-invita]").forEach((b) => b.onclick = () => invitaInCerchia(b.dataset.invita));
  document.querySelectorAll("input[data-img]").forEach((i) => i.onchange = async () => {
    const f = i.files?.[0]; if (!f) return;
    const c = state.cerchie.find((x) => x.id === i.dataset.k);
    i.closest("label").style.opacity = .5;
    if (await cambiaImmagine({ file: f, tabella: "cerchie", id: c.id, campo: i.dataset.img, cartella: `cerchia/${c.id}`, vecchia: c[i.dataset.img + "_path"] })) location.reload();
  });
  controllaNovita(lista[0]?.creato_il ?? new Date(0).toISOString(), filtro);

  document.querySelectorAll(".carosello-box").forEach((box) => {
    const car = box.querySelector(".carosello"), pal = box.querySelectorAll(".pallini i"), conta = box.querySelector(".conta");
    car.addEventListener("scroll", () => {
      const k = Math.round(car.scrollLeft / car.clientWidth);
      pal.forEach((p, j) => p.classList.toggle("on", j === k));
      if (conta) conta.textContent = `${k + 1}/${pal.length}`;
    }, { passive: true });
    let ultimo = 0;
    car.addEventListener("click", () => {   // doppio tocco: mi piace, come su Instagram
      const ora = Date.now();
      if (ora - ultimo < 320) {
        const b = document.querySelector(`[data-cuore="${box.dataset.post}"]`);
        if (b && !b.classList.contains("on")) b.click();
        const c = box.querySelector(".cuore-grande"); c.classList.remove("vai"); void c.offsetWidth; c.classList.add("vai");
      }
      ultimo = ora;
    });
  });

  // ⋯ sui propri post: modifica il testo o elimina
  document.querySelectorAll("[data-menu-post]").forEach((b) => b.onclick = () => {
    const id = b.dataset.menuPost, r = lista.find((x) => x.id === id);
    const f = document.createElement("div");
    f.style.cssText = "position:fixed;inset:0;z-index:70;background:rgba(0,0,0,.4);display:flex;align-items:flex-end";
    f.innerHTML = `<div style="background:var(--carta);width:100%;border-radius:22px 22px 0 0;padding:10px 16px calc(18px + env(safe-area-inset-bottom));display:grid;gap:8px">
      <span style="width:40px;height:5px;border-radius:3px;background:var(--bordo);margin:0 auto 6px"></span>
      <button class="btn chiaro" data-a="modifica">Modifica il testo</button>
      <button class="btn chiaro" data-a="elimina" style="color:#B3402F">Elimina</button>
      <button class="btn chiaro" data-a="annulla" style="border:0">Annulla</button></div>`;
    document.body.appendChild(f);
    f.onclick = async (e) => {
      const a = e.target.dataset?.a;
      if (e.target === f || a === "annulla") return f.remove();
      if (a === "modifica") {
        f.remove();
        // si modifica direttamente lì, sul testo del post
        const el = document.querySelector(`[data-testo="${id}"]`);
        if (!el) return;
        const prima = r?.testo ?? "";
        el.innerHTML = `<textarea rows="3" style="width:100%;font:inherit;font-size:17px;line-height:1.4;border:2px solid var(--ambra);border-radius:14px;padding:10px 12px;background:#fff;color:var(--testo);resize:none">${esc(prima)}</textarea>
          <span class="riga" style="gap:8px;margin-top:8px;font-family:Manrope,sans-serif"><button class="btn ambra" data-salva style="flex:1;min-height:44px">Salva</button><button class="btn chiaro" data-annulla style="flex:1;min-height:44px">Annulla</button></span>`;
        el.style.display = "block";
        const ta = el.querySelector("textarea");
        const alto = () => { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; };
        ta.oninput = alto; alto(); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
        const ripristina = (t) => { el.style.display = ""; el.textContent = t; };
        el.querySelector("[data-annulla]").onclick = (ev) => { ev.preventDefault(); ripristina(prima); };
        el.querySelector("[data-salva]").onclick = async (ev) => {
          ev.preventDefault();
          const t = ta.value.trim();
          const { error } = await sb.from("ricordi").update({ testo: t || null }).eq("id", id);
          if (error) return alert("Non salvato: " + error.message);
          if (r) r.testo = t; ripristina(t);
        };
      }
      if (a === "elimina") {
        f.remove();
        if (!confirm("Eliminare questo post? Spariscono anche foto, vocale, cuori e commenti.")) return;
        const paths = (r?.ricordi_media ?? []).map((m) => m.path);
        const { error } = await sb.from("ricordi").delete().eq("id", id);
        if (error) return alert("Non eliminato: " + error.message);
        if (paths.length) sb.storage.from("ricordi").remove(paths);
        b.closest("article")?.remove();
      }
    };
  });

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
    ? `<div class="foto carosello-box" data-post="${r.id}">
        <div class="carosello">${foto.map((f, k) => `<img src="${esc(url[f.path] ?? "")}" alt="" ${k ? 'loading="lazy"' : ""} draggable="false">`).join("")}</div>
        ${foto.length > 1 ? `<span class="conta">1/${foto.length}</span><div class="pallini">${foto.map((_, k) => `<i class="${k ? "" : "on"}"></i>`).join("")}</div>` : ""}
        ${voce}<span class="cuore-grande" aria-hidden="true">${ICONE.cuore}</span></div>`
    : `<div class="lettera"><span data-testo="${r.id}">${esc(r.testo ?? "")}</span>${voce ? `<div style="margin-top:14px">${voce.replace('class="voce"', 'class="voce" style="margin:0;background:rgba(18,48,44,.9)"')}</div>` : ""}</div>`;
  return `<article class="post" style="position:relative">
    <a class="post-testa" href="#/profilo/${r.autore_id}">${avatar(r.persone, 38, r.persone?.foto_path ? url[r.persone.foto_path] : null)}
      <div><b>${esc(nomeDi(r.persone))}</b><small>${quando(r.creato_il)}</small></div></a>
    ${r.dettagli?.luogo?.nome ? `<a class="post-luogo" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.dettagli.luogo.lat != null ? `${r.dettagli.luogo.lat},${r.dettagli.luogo.lon}` : r.dettagli.luogo.nome)}"
      style="display:block;margin:-6px 0 8px 62px;font-size:13px;font-weight:700;color:var(--salvia,#2F5A55);text-decoration:none">📍 ${esc(r.dettagli.luogo.nome)}</a>` : ""}
    ${r.autore_id === state.io.id ? `<button class="icona" data-menu-post="${r.id}" aria-label="Modifica o elimina" style="position:absolute;top:4px;right:8px;width:44px;height:44px;font-size:22px;font-weight:800;letter-spacing:1px">⋯</button>` : ""}
    ${media}
    <div class="azioni">
      <button class="icona ${mio ? "on" : ""}" data-cuore="${r.id}" aria-label="Mi piace">${ICONE.cuore}</button>
      <a class="icona" href="#/ricordo/${r.id}" aria-label="Commenta">${ICONE.commento}</a>
      <a class="icona" href="#/racconta?risposta=${r.id}" aria-label="Rispondi con un vocale">${ICONE.mic}</a>
    </div>
    <div class="didascalia"><b style="font-size:14px" id="n-${r.id}" data-n="${cuori.length}" data-mio="${mio ? 1 : 0}">${cuori.length} cuori</b>
      ${r.titolo ? `<span class="q">${esc(r.titolo)}</span>` : ""}
      ${foto.length || video ? `<span data-testo="${r.id}">${esc(r.testo ?? "")}</span>` : ""}
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
    ${state.adulto && !state.io.domande_su_misura ? `<a href="#/profilo?s=su-misura" class="tenue" style="display:block;margin-top:10px;font-size:14px">Vuoi domande su misura, che partono da quello che racconti?</a>` : ""}
  </div>`;
  el.querySelector("#altra").onclick = () => miaDomanda(true);
}

// Lettere chiuse per me (si vede chi e quando, mai cosa) e, per gli adulti, un invito gentile a raccontare
async function perChiConta() {
  const el = document.getElementById("per-chi-conta");
  if (!el) return;
  const [{ data: lettere }, { data: filo }] = [await sb.rpc("lettere_chiuse"), { data: null }];   // l'invito a raccontare arriva come notifica
  const data = (d) => new Date(d + "T12:00").toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  let html = (lettere ?? []).slice(0, 3).map((l) => `<div class="card" style="margin-bottom:14px;display:flex;gap:14px;align-items:center;background:#FBF4E6">
      <span style="font-size:34px" aria-hidden="true">✉️</span>
      <div><b>${esc(l.da)} ti ha scritto una lettera</b><div class="tenue">Si apre il ${data(l.si_apre)}</div></div></div>`).join("");
  const mese = new Date().toISOString().slice(0, 7);
  let chiuso = null; try { chiuso = localStorage.getItem("ancora_invito_mese"); } catch { /* niente */ }
  if (filo && filo.mese < 2 && chiuso !== mese) {
    html += `<div class="card" style="margin-bottom:18px;position:relative">
      <button class="icona" id="chiudi-invito" aria-label="Chiudi" style="position:absolute;top:6px;right:6px;width:36px;height:36px">✕</button>
      <span style="font-size:12px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:#8A5A17">Per chi conta davvero</span>
      <p style="font-family:Fraunces,serif;font-size:19px;line-height:1.35;margin:6px 0 8px">Un giorno qualcuno ti chiederà: «Tu che avresti fatto al posto mio?». Ogni cosa che racconti è una risposta in più.</p>
      <p class="tenue" style="margin:0 0 12px">${filo.mese ? `Questo mese hai raccontato ${filo.mese === 1 ? "una cosa" : filo.mese + " cose"}.` : "Questo mese non hai ancora raccontato niente."}</p>
      <div class="riga" style="gap:8px"><a class="btn ambra" style="flex:1;min-height:46px" href="#/racconta">Racconta</a>
        <a class="btn chiaro" style="flex:1;min-height:46px" href="#/racconta?lettera=1">Scrivi una lettera</a></div></div>`;
  }
  el.innerHTML = html;
  const x = el.querySelector("#chiudi-invito");
  if (x) x.onclick = () => { try { localStorage.setItem("ancora_invito_mese", mese); } catch { /* niente */ } x.closest(".card").remove(); };
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
    input.value = "";
    const { apriEditor } = await import("./storia-editor.js");
    return apriEditor(f, ordinaCerchie(state.cerchie), cerchia);
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
  let musica = null;
  const chiudi = () => { clearTimeout(timer); musica?.pause(); v.remove(); removeEventListener("hashchange", chiudi); document.querySelectorAll("[data-storie]").forEach((b) => {
    const gr = gruppi.find((x) => x.autore === b.dataset.storie); if (gr && gr.storie.every((r) => segnata(r.id))) b.querySelector(".anello").classList.add("visto"); }); };
  addEventListener("hashchange", chiudi);
  const avanti = () => { const gr = gruppi[g]; if (i < gr.storie.length - 1) i++; else if (g < gruppi.length - 1 && !conAggiungi) { g++; i = 0; } else return chiudi(); mostra(); };
  const indietro = () => { if (i > 0) i--; else if (g > 0 && !conAggiungi) { g--; i = gruppi[g].storie.length - 1; } mostra(); };
  function mostra() {
    clearTimeout(timer);
    const gr = gruppi[g], r = gr.storie[i], m = visivo(r);
    const lib = r.dettagli?.musica;   // brano della libreria di Ancora
    const mus = lib ? { descrizione: lib.nome } : r.ricordi_media.find((x) => x.tipo === "audio");
    musica?.pause(); musica = lib ? new Audio(`musica/${lib.id}.m4a`) : mus && url[mus.path] ? new Audio(url[mus.path]) : null;
    segna(r.id);
    if (gr.autore !== state.io.id) sb.from("storie_viste").upsert({ ricordo_id: r.id, persona_id: state.io.id }, { onConflict: "ricordo_id,persona_id", ignoreDuplicates: true }).then(() => {});
    const min = Math.floor((Date.now() - new Date(r.creato_il)) / 60_000);
    const fa = min < 1 ? "adesso" : min < 60 ? `${min} min` : `${Math.floor(min / 60)} h`;
    v.innerHTML = `
      <div style="display:flex;gap:4px;padding:calc(10px + env(safe-area-inset-top)) 10px 8px">${gr.storie.map((_, k) =>
        `<span style="flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.35);overflow:hidden"><i style="display:block;height:100%;background:#fff;width:${k < i ? 100 : 0}%" ${k === i ? 'id="barra-ora"' : ""}></i></span>`).join("")}</div>
      <div style="display:flex;align-items:center;gap:10px;padding:0 12px 10px">${avatar(gr.persona ?? {}, 34, gr.persona?.foto_path ? url[gr.persona.foto_path] : null)}
        <b style="flex:1">${esc(nomeDi(gr.persona))} <span style="opacity:.7;font-weight:500">· ${fa}</span></b>
        ${gr.autore === state.io.id ? `<button id="st-agg" style="background:rgba(255,255,255,.15);color:#fff;border:0;border-radius:999px;padding:8px 12px;font-weight:700">+ Aggiungi</button>
          <button id="st-menu" aria-label="Altre azioni" style="background:none;border:0;color:#fff;font-size:24px;font-weight:800;width:40px;height:44px">⋯</button>` : ""}
        <button id="st-x" aria-label="Chiudi" style="background:none;border:0;color:#fff;font-size:26px;width:44px;height:44px">✕</button></div>
      <div style="flex:1;position:relative;display:grid;place-items:center;overflow:hidden">
        <div style="position:relative;max-width:100%;max-height:100%">
        ${m.tipo === "video" ? `<video id="st-media" src="${url[m.path]}" autoplay playsinline ${mus ? "muted" : ""} style="display:block;max-width:100vw;max-height:calc(100vh - 190px)"></video>`
                             : `<img id="st-media" src="${url[m.path]}" alt="" style="display:block;max-width:100vw;max-height:calc(100vh - 190px)">`}
        ${(r.dettagli?.sopra ?? []).map((o) => `<div style="position:absolute;left:${o.x * 100}%;top:${o.y * 100}%;transform:translate(-50%,-50%);font-size:${o.s}px;line-height:1.15;text-align:center;white-space:pre-wrap;max-width:90%;pointer-events:none;
          ${o.tipo === "testo" ? `font-family:Manrope,sans-serif;font-weight:800;color:${o.c};${o.sfondo ? `background:${o.c === "#FFFFFF" ? "rgba(0,0,0,.55)" : "rgba(255,255,255,.85)"};padding:4px 10px;border-radius:10px;` : "text-shadow:0 1px 4px rgba(0,0,0,.5);"}` : ""}">${esc(o.t)}</div>`).join("")}
        </div>
        ${mus ? `<span style="position:absolute;top:8px;left:12px;z-index:2;background:rgba(0,0,0,.45);border-radius:14px;padding:5px 10px;font-size:13px;font-weight:700;max-width:70%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">♪ ${esc(mus.descrizione ?? "Musica")}</span>` : ""}
        <div id="st-volo" style="position:absolute;inset:0;pointer-events:none;overflow:hidden"></div>
        <button id="st-ind" aria-label="Indietro" style="position:absolute;left:0;top:0;bottom:0;width:35%;background:none;border:0"></button>
        <button id="st-av" aria-label="Avanti" style="position:absolute;right:0;top:0;bottom:0;width:65%;background:none;border:0"></button>
      </div>
      ${r.testo ? `<p style="margin:0;padding:8px 16px 0;font-size:17px">${esc(r.testo)}</p>` : ""}
      ${gr.autore === state.io.id ? `<div id="st-reazioni" style="padding:8px 16px 0;font-size:15px;opacity:.9"></div>`
        : `<div style="display:flex;justify-content:space-around;padding:8px 10px 0">${["❤️", "😂", "😍", "😮", "😢", "👏", "🔥"].map((e) => `<button data-emo="${e}" aria-label="Reagisci ${e}" style="background:none;border:0;font-size:30px;width:46px;height:46px">${e}</button>`).join("")}</div>`}
      <div style="display:flex;align-items:center;gap:12px;padding:6px 16px calc(14px + env(safe-area-inset-bottom))">
        ${gr.autore === state.io.id ? `<button id="st-viste" style="flex:1;text-align:left;background:none;border:0;color:#fff;font-weight:700;font-size:16px;min-height:44px">👁 …</button>` : `<input id="st-risp" placeholder="Rispondi a ${esc(nomeDi(gr.persona))}…" style="flex:1;min-height:44px;border-radius:22px;background:transparent;color:#fff;border:1px solid rgba(255,255,255,.5);padding:0 16px">`}
        <button id="st-cuore" aria-label="Mi piace" aria-pressed="false" style="background:none;border:0;color:#fff;display:flex;align-items:center;gap:6px;font-weight:800;font-size:16px;min-width:48px;min-height:48px;justify-content:center">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg><span id="st-n"></span></button></div>`;
    // reazioni con emoji e risposte: arrivano anche in chat a chi ha pubblicato
    const vola = (e) => { const z = v.querySelector("#st-volo"); for (let n = 0; n < 6; n++) { const s = document.createElement("span"); s.textContent = e;
      s.style.cssText = `position:absolute;bottom:0;left:${15 + Math.random() * 70}%;font-size:${34 + Math.random() * 20}px;transition:transform 1.4s ease-out,opacity 1.4s`; z.appendChild(s);
      requestAnimationFrame(() => { s.style.transform = `translateY(-${55 + Math.random() * 30}vh)`; s.style.opacity = "0"; }); setTimeout(() => s.remove(), 1500); } };
    const alChat = (testo) => sb.from("messaggi").insert({ a_id: gr.autore, autore_id: state.io.id, testo });
    v.querySelectorAll("[data-emo]").forEach((b) => b.onclick = async (e) => {
      e.stopPropagation(); vola(b.dataset.emo);
      await sb.from("reazioni").insert({ ricordo_id: r.id, persona_id: state.io.id, tipo: "emoji", testo: b.dataset.emo });
      alChat(`${b.dataset.emo} alla tua storia`);
    });
    const risp = v.querySelector("#st-risp");
    if (risp) {
      risp.onfocus = () => { clearTimeout(timer); musica?.pause(); v.querySelector("#st-media")?.pause?.(); };
      risp.onkeydown = async (e) => { if (e.key !== "Enter" || !risp.value.trim()) return;
        const t = risp.value.trim(); risp.value = ""; risp.blur();
        await sb.from("reazioni").insert({ ricordo_id: r.id, persona_id: state.io.id, tipo: "commento", testo: t });
        await alChat(`Ha risposto alla tua storia: ${t}`); risp.placeholder = "Inviato ✓"; };
    }
    if (gr.autore === state.io.id) {
      const pausa = () => { clearTimeout(timer); musica?.pause(); v.querySelector("#st-media")?.pause?.(); };
      sb.from("storie_viste").select("vista_il, persone:persona_id(id, nome, soprannome, foto_path)").eq("ricordo_id", r.id).order("vista_il", { ascending: false }).then(({ data: viste }) => {
        const b = v.querySelector("#st-viste"); if (!b) return;
        b.textContent = `👁 ${viste?.length ? `Vista da ${viste.length}` : "Nessuno l'ha ancora vista"}`;
        b.onclick = async () => {
          if (!viste?.length) return;
          pausa();
          const { data: rz } = await sb.from("reazioni").select("persona_id, tipo, testo").eq("ricordo_id", r.id);
          const di = (id) => (rz ?? []).filter((x) => x.persona_id === id).map((x) => x.tipo === "cuore" ? "❤️" : x.tipo === "emoji" ? x.testo : `«${x.testo}»`).join(" ");
          const f = document.createElement("div");
          f.style.cssText = "position:absolute;left:0;right:0;bottom:0;z-index:5;background:#1b1b1b;border-radius:22px 22px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom));max-height:60vh;overflow:auto";
          f.innerHTML = `<div style="display:flex;align-items:center;margin-bottom:8px"><b style="flex:1;font-size:18px">Vista da ${viste.length}</b><button data-chiudi style="background:none;border:0;color:#fff;font-size:24px;width:44px;height:44px">✕</button></div>
            ${viste.map((x) => `<div style="display:flex;align-items:center;gap:12px;padding:8px 0">${avatar(x.persone, 40)}<span style="flex:1"><b>${esc(nomeDi(x.persone))}</b><br><small style="opacity:.6">${quando(x.vista_il)}</small></span><span style="font-size:20px">${esc(di(x.persone?.id))}</span></div>`).join("")}`;
          v.appendChild(f);
          f.querySelector("[data-chiudi]").onclick = () => { f.remove(); mostra(); };
        };
      });
      v.querySelector("#st-menu")?.addEventListener("click", async () => {
        pausa();
        if (!confirm("Eliminare questa storia? Spariscono anche le reazioni.")) { mostra(); return; }
        const paths = r.ricordi_media.map((x) => x.path);
        const { error } = await sb.from("ricordi").delete().eq("id", r.id);
        if (error) { alert("Non eliminata: " + error.message); mostra(); return; }
        if (paths.length) sb.storage.from("ricordi").remove(paths);
        gr.storie.splice(i, 1);
        if (!gr.storie.length) { chiudi(); location.reload(); return; }
        if (i >= gr.storie.length) i = gr.storie.length - 1;
        mostra();
      });
    }
    if (gr.autore === state.io.id) sb.from("reazioni").select("tipo, testo, persone:persona_id(nome, soprannome)").eq("ricordo_id", r.id).in("tipo", ["emoji", "commento"]).then(({ data }) => {
      const el = v.querySelector("#st-reazioni"); if (!el || !data?.length) return;
      el.innerHTML = data.slice(-6).map((x) => `<div><b>${esc(nomeDi(x.persone))}</b> ${esc(x.testo ?? "")}</div>`).join("");
    });
    v.querySelector("#st-x").onclick = chiudi;
    // ♥ anche sulle storie (chi l'ha pubblicata vede quanti)
    const cuore = v.querySelector("#st-cuore"), nCuori = v.querySelector("#st-n");
    const disegna = (on, n) => { cuore.setAttribute("aria-pressed", on); cuore.querySelector("svg").setAttribute("fill", on ? "#E0533F" : "none"); cuore.style.color = on ? "#E0533F" : "#fff"; nCuori.textContent = n ? n : ""; };
    sb.from("reazioni").select("persona_id").eq("ricordo_id", r.id).eq("tipo", "cuore").then(({ data }) => {
      const mio = (data ?? []).some((x) => x.persona_id === state.io.id);
      disegna(mio, gr.autore === state.io.id ? data?.length : 0);
    });
    cuore.onclick = async (e) => {
      e.stopPropagation();
      const on = cuore.getAttribute("aria-pressed") !== "true";
      disegna(on, 0);
      cuore.animate([{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }], { duration: 300 });
      if (on) await sb.from("reazioni").insert({ ricordo_id: r.id, persona_id: state.io.id, tipo: "cuore" });
      else await sb.from("reazioni").delete().eq("ricordo_id", r.id).eq("persona_id", state.io.id).eq("tipo", "cuore");
    };
    v.querySelector("#st-av").onclick = avanti;
    v.querySelector("#st-ind").onclick = indietro;
    v.querySelector("#st-agg")?.addEventListener("click", () => { chiudi(); document.getElementById("file-storia").click(); });
    const barra = v.querySelector("#barra-ora"), media = v.querySelector("#st-media");
    const parti = (ms) => { barra.style.transition = `width ${ms}ms linear`; requestAnimationFrame(() => { barra.style.width = "100%"; }); timer = setTimeout(avanti, ms); };
    if (musica) musica.play().catch(() => {});
    if (m.tipo === "video") media.onloadedmetadata = () => parti(Math.min(60, media.duration || 15) * 1000);
    else parti(musica ? 15000 : 5000);
  }
  mostra();
}
function segnata(id) { try { return !!JSON.parse(localStorage.getItem("ancora_storie_viste") ?? "{}")[id]; } catch { return false; } }
function segna(id) {
  try { const v = JSON.parse(localStorage.getItem("ancora_storie_viste") ?? "{}"); v[id] = Date.now();
    for (const k of Object.keys(v)) if (Date.now() - v[k] > 3 * 86400_000) delete v[k];
    localStorage.setItem("ancora_storie_viste", JSON.stringify(v)); } catch { /* niente */ }
}

// ogni 45 secondi: ci sono ricordi o storie nuove? compare "Nuovi ricordi ↑" (nessun salto improvviso della pagina)
let novitaTimer = null;
function controllaNovita(ultimo, filtro) {
  clearInterval(novitaTimer);
  const pagina = location.hash;
  novitaTimer = setInterval(async () => {
    if (location.hash !== pagina || !document.getElementById("mia-domanda")) { clearInterval(novitaTimer); return; }
    if (document.hidden || document.getElementById("avviso-novita")) return;
    let q = sb.from("ricordi").select("id", { count: "exact", head: true }).neq("visibilita", "solo_io")
      .neq("autore_id", state.io.id).gt("creato_il", ultimo);
    if (filtro && filtro !== "diretti") q = q.eq("cerchia_id", filtro);
    const { count } = await q;
    if (!count) return;
    const b = document.createElement("button");
    b.id = "avviso-novita";
    b.textContent = count === 1 ? "↑ 1 novità" : `↑ ${count} novità`;
    b.style.cssText = "position:fixed;top:calc(70px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);z-index:30;border:0;border-radius:999px;padding:10px 18px;background:#12302C;color:#FBF3E2;font-weight:800;box-shadow:0 6px 18px rgba(0,0,0,.25);cursor:pointer";
    b.onclick = async () => { b.remove(); scrollTo({ top: 0 }); await aggiorna(); };
    document.body.appendChild(b);
    addEventListener("hashchange", () => b.remove(), { once: true });
  }, 45_000);
}

// la parte da guardare di una storia (la musica è un media in più)
function visivo(r) { return (r.ricordi_media ?? []).find((m) => m.tipo === "foto" || m.tipo === "video") ?? r.ricordi_media?.[0]; }
