// Profilo di una persona: numeri, "Chiedi", il suo libro che cresce, l'album a griglia.
import { sb, state, $app, esc, nomeDi, avatar, urlMediaMolti, ICONE, attivaNotifiche, notificheAttive, cambiaImmagine, chiediSuMisura, personeConosciute, passaPiu } from "../app.js";
import { SUPABASE_URL } from "../config.js";

const STORIE_PER_VOLUME = 25;

export default async function ({ id, params }) {
  const pid = id ?? state.io.id;
  const io = pid === state.io.id;
  const { data: p } = await sb.from("persone").select("id, nome, soprannome, foto_path, copertina_path, bio, data_nascita").eq("id", pid).maybeSingle();
  if (!p) { $app().innerHTML = `<p class="pad">Profilo non trovato.</p>`; return; }

  const { data: ricordi } = await sb.from("ricordi")
    .select("id, tipo, creato_il, ricordi_media(path, tipo, durata_sec, ordine)")
    .eq("autore_id", pid).order("creato_il", { ascending: false }).limit(300);
  const lista = ricordi ?? [];
  const racconti = lista.filter((r) => r.tipo === "racconto").length;
  const secondi = lista.flatMap((r) => r.ricordi_media ?? []).filter((m) => m.tipo === "audio").reduce((s, m) => s + (m.durata_sec ?? 0), 0);
  const conFoto = lista.map((r) => ({ r, f: (r.ricordi_media ?? []).find((m) => m.tipo === "foto"), a: (r.ricordi_media ?? []).find((m) => m.tipo === "audio") }))
    .filter((x) => x.f);
  const url = await urlMediaMolti([...conFoto.map((x) => x.f.path), p.foto_path, p.copertina_path].filter(Boolean));
  const { data: fm } = await sb.from("famiglia_membri").select("narratore").eq("persona_id", pid).maybeSingle();

  const volume = Math.floor(racconti / STORIE_PER_VOLUME) + 1;
  const nelVolume = racconti % STORIE_PER_VOLUME;
  const anno = p.data_nascita ? `, classe ${p.data_nascita.slice(0, 4)}` : "";

  $app().innerHTML = `
    <header class="testa">${id ? `<a class="icona" href="#/" aria-label="Indietro">${ICONE.indietro}</a>` : `<span style="width:44px"></span>`}
      <b>${esc(nomeDi(p))}</b><span style="width:44px"></span></header>
    <div style="position:relative;aspect-ratio:16/9;max-height:320px;width:100%;background:${p.copertina_path ? `url('${url[p.copertina_path]}') center/cover` : "linear-gradient(135deg,#7FA37E,#4D7356)"}">
      ${io ? `<label class="chip" style="position:absolute;right:12px;bottom:10px;margin:0;background:rgba(251,248,242,.92)">📷 Copertina<input type="file" accept="image/*" id="f-copertina" hidden></label>` : ""}
    </div>
    <div class="pad" style="display:flex;align-items:flex-end;gap:18px;margin-top:-56px;position:relative">
      <label style="position:relative;flex-shrink:0;${io ? "cursor:pointer" : ""}">
        <span class="anello" style="width:104px;height:104px;border-radius:52px;display:inline-block">${avatar(p, 98, p.foto_path ? url[p.foto_path] : null).replace('class="av"', 'class="av" style="border:3px solid var(--carta);font-size:30px"')}</span>
        ${io ? `<span style="position:absolute;right:0;bottom:4px;width:32px;height:32px;border-radius:16px;background:var(--carta);display:grid;place-items:center;box-shadow:0 1px 4px rgba(0,0,0,.2)">📷</span><input type="file" accept="image/*" id="f-foto" hidden>` : ""}
      </label>
      <div style="display:grid;grid-template-columns:repeat(3,auto);gap:16px;text-align:center;padding-bottom:4px">
        <div><b style="font-size:20px">${racconti}</b><div class="tenue">racconti</div></div>
        <div><b style="font-size:20px">${secondi >= 3600 ? Math.round(secondi / 3600) + " h" : Math.round(secondi / 60) + " min"}</b><div class="tenue">di voce</div></div>
        <div><b style="font-size:20px">${conFoto.length}</b><div class="tenue">foto</div></div>
      </div>
    </div>
    <div class="pad"><h1 style="font-size:24px">${esc(p.nome)}${anno}</h1>
      ${p.bio ? `<p class="tenue" style="margin:4px 0 12px;font-size:15px">${esc(p.bio)}</p>` : ""}
      ${io ? `<div id="filo"></div><a class="btn chiaro" href="#/racconta" style="margin-top:10px">Racconta qualcosa</a>
             <div class="riga" style="margin-top:8px;gap:8px"><a class="btn chiaro" href="#/piano" style="flex:1">Il piano</a>
               <a class="btn chiaro" href="#/ricette" style="flex:1">Ricettario</a>
               <a class="btn chiaro" href="#/servizi" style="flex:1">Servizi</a></div>
             <p style="text-align:center;margin:10px 0 0"><a href="#/omaggio">Hai un codice omaggio?</a></p>`
        : `<div id="chiedi-a"></div><form id="chiedi" style="margin-top:10px">
            <label class="visually-hidden" for="q">Cosa vuoi chiedergli</label>
            <input id="q" placeholder="Cosa vuoi chiedere a ${esc(nomeDi(p))}?" required>
            <button class="btn ambra" style="margin-top:8px">Chiedi</button></form>`}
    </div>
    ${fm?.narratore ? `<div class="libro"><span class="copertina">Le storie di ${esc(p.nome)}</span>
      <div style="flex:1"><b>Il suo libro · volume ${volume}</b>
        <div style="font-size:13px;color:#C9D8D4">${nelVolume} storie su ${STORIE_PER_VOLUME} per completarlo</div>
        <div class="barra-prog"><i style="width:${Math.round(nelVolume / STORIE_PER_VOLUME * 100)}%"></i></div>
        <a href="#/libro/${p.id}" style="color:#F4E6CF;font-weight:800;font-size:13px;display:inline-block;margin-top:8px">Sfoglia e stampa il libro →</a></div></div>` : ""}
    ${conFoto.length ? `<div class="griglia">${conFoto.map((x) =>
      `<a href="#/ricordo/${x.r.id}" style="background-image:url('${url[x.f.path]}')" aria-label="Apri il ricordo">${x.a ? `<span>▶ voce</span>` : ""}</a>`).join("")}</div>`
      : `<p class="pad tenue">Ancora nessuna foto.</p>`}`;

  if (io) {
    // foto profilo e copertina: rimpicciolite sul telefono, poi caricate
    const carica = (campo) => async (e) => {
      const f = e.target.files?.[0]; if (!f) return;
      e.target.closest("label").style.opacity = .5;
      if (await cambiaImmagine({ file: f, tabella: "persone", id: state.io.id, campo, cartella: "profilo", vecchia: p[campo + "_path"] })) location.reload();
    };
    document.getElementById("f-foto").onchange = carica("foto");
    document.getElementById("f-copertina").onchange = carica("copertina");
    const spenti = new Set(state.io.moduli_spenti ?? []);
    $app().insertAdjacentHTML("beforeend", `<h2>Le mie impostazioni</h2><div class="card">
      <form id="mio-nome" style="margin-bottom:14px">
        <div class="riga" style="gap:8px"><div style="flex:1"><label for="n-nome" style="margin-top:0">Nome</label><input id="n-nome" value="${esc(state.io.nome ?? "")}" required maxlength="40"></div>
          <div style="flex:1"><label for="n-cogn" style="margin-top:0">Cognome</label><input id="n-cogn" value="${esc(state.io.cognome ?? "")}" maxlength="40"></div></div>
        <label for="n-sopr">Come ti chiamano in famiglia (se vuoi)</label><input id="n-sopr" value="${esc(state.io.soprannome ?? "")}" maxlength="30" placeholder="Nonno Peppe, zia Lella">
        <label for="n-nasc">Data di nascita</label><input id="n-nasc" type="date" value="${esc(state.io.data_nascita ?? "")}" style="width:auto">
        <button class="btn chiaro" style="margin-top:10px">Salva</button></form>
      <div id="su-misura" style="padding:12px 0;border-top:1px solid rgba(0,0,0,.08);border-bottom:1px solid rgba(0,0,0,.08);margin-bottom:12px">
        <label class="riga" style="font-weight:800;color:var(--testo);margin:0"><input type="checkbox" id="c-misura" ${state.io.domande_su_misura ? "checked" : ""} style="width:22px;height:22px"> Domande su misura</label>
        <p class="tenue" style="margin:6px 0 0;font-size:14px">Le prossime domande partono da quello che racconti, per far venire fuori come la pensi e come decidi. I tuoi testi li legge solo un programma, in automatico, per scrivere la domanda: nessuna persona li vede. Puoi toglierle quando vuoi.</p></div>
      <div class="riga" style="margin-bottom:12px"><b style="flex:1">Notifiche</b><button class="chip" id="notif" style="margin:0">…</button></div>
      ${[["vacanze", "Vacanze"], ["compiti", "Compiti"], ["esami", "Esami"]].map(([k, t]) =>
        `<label class="riga" style="margin:10px 0;font-weight:700;color:var(--testo)"><input type="checkbox" data-mio-modulo="${k}" ${spenti.has(k) ? "" : "checked"} style="width:22px;height:22px"> ${t}</label>`).join("")}
    </div>`);
    sezioneChiediAMe();
    document.getElementById("mio-nome").onsubmit = async (e) => {
      e.preventDefault();
      const v = (id) => document.getElementById(id).value.trim();
      const dati = { nome: v("n-nome"), cognome: v("n-cogn") || null, soprannome: v("n-sopr") || null, data_nascita: v("n-nasc") || null };
      const { error } = await sb.from("persone").update(dati).eq("id", state.io.id);
      if (error) { alert("Non salvato: " + error.message); return; }
      Object.assign(state.io, dati); location.reload();
    };
    document.getElementById("c-misura").onchange = async (e) => {
      const on = e.target.checked;
      const { error } = await sb.from("persone").update({ domande_su_misura: on }).eq("id", state.io.id);
      if (error) { e.target.checked = !on; alert("Non salvato: " + error.message); return; }
      state.io.domande_su_misura = on;
      if (on) chiediSuMisura();
    };
    if (params?.s) document.getElementById(params.s)?.scrollIntoView({ block: "center" });
    // il filo: quello che hai raccontato, per chi conta
    sb.rpc("il_mio_filo").then(({ data: f }) => {
      const el = document.getElementById("filo"); if (!el || !f) return;
      const voci = [[f.storie, "racconti"], [f.risposte, "risposte alle domande"], [f.voci, "con la tua voce"], [f.ricette, "ricette"], [f.lettere, "lettere per più avanti"]].filter(([n]) => n);
      el.innerHTML = `<div class="card" style="margin:10px 0 0;background:#FBF4E6">
        <span style="font-size:12px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:#8A5A17">Il tuo filo</span>
        <p style="margin:6px 0 8px;font-family:Fraunces,serif;font-size:18px;line-height:1.35">${voci.length ? "Quello che hai raccontato a chi conta davvero:" : "Ogni cosa che racconti aiuta chi ti vuole bene a capire come la pensi."}</p>
        ${voci.length ? `<div style="display:flex;flex-wrap:wrap;gap:8px 18px">${voci.map(([n, t]) => `<div><b style="font-size:20px">${n}</b> <span class="tenue">${t}</span></div>`).join("")}</div>` : ""}</div>`;
    });
    const bN = document.getElementById("notif");
    const aggiornaN = async () => { const on = await notificheAttive(); bN.textContent = on ? "✓ Attive" : "Attiva"; bN.classList.toggle("on", on); };
    aggiornaN();
    bN.onclick = async () => { if (!(await notificheAttive())) { await attivaNotifiche(); aggiornaN(); } };
    document.querySelectorAll("[data-mio-modulo]").forEach((c) => c.onchange = async () => {
      const s = new Set(state.io.moduli_spenti ?? []);
      c.checked ? s.delete(c.dataset.mioModulo) : s.add(c.dataset.mioModulo);
      state.io.moduli_spenti = [...s];
      await sb.from("persone").update({ moduli_spenti: [...s] }).eq("id", state.io.id);
    });
  }

  if (!io) sb.rpc("posso_chiedere", { p_persona: pid }).then(({ data: ok }) => {
    const el = document.getElementById("chiedi-a");
    if (ok && el) el.innerHTML = `<a class="btn ambra" href="#/chiedi/${pid}" style="margin-top:10px">Chiedi a ${esc(nomeDi(p))}</a>
      <p class="tenue" style="font-size:13px;margin:6px 0 0;text-align:center">Ti risponde con la sua voce e il suo modo di pensare</p>`;
  });

  document.getElementById("chiedi")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = document.getElementById("q");
    await sb.from("domande_suggerite").insert({ narratore_id: pid, chiesta_da: state.io.id, testo: q.value });
    q.value = "";
    e.target.querySelector("button").textContent = "Inviata! Gli arriva con la prossima domanda";
  });
}


// "Chiedi a me": la persona decide se la famiglia potrà chiederle consiglio, chi, e se ricreare la sua voce
async function sezioneChiediAMe() {
  const [{ data: v }, persone] = await Promise.all([sb.rpc("mia_voce"), personeConosciute()]);
  const scelti = new Set(v?.chi ?? []);
  const min = Math.floor((v?.secondi ?? 0) / 60);
  $app().insertAdjacentHTML("beforeend", `<h2 id="chiedi-a-me">Chiedi a me</h2><div class="card">
    <p style="margin:0 0 10px;line-height:1.5">Le persone che scegli potranno chiederti consiglio, anche tra tanti anni: <i>"tu che faresti al posto mio?"</i>. Ti rispondono le tue parole e il tuo modo di pensare, da tutto quello che racconti, con la tua voce.</p>
    ${state.piu ? `
    <label class="riga" style="font-weight:800;color:var(--testo)"><input type="checkbox" id="c-attivo" ${v?.attivo ? "checked" : ""} style="width:22px;height:22px"> Permetti di chiedermi consiglio</label>
    <div id="c-chi" ${v?.attivo ? "" : "hidden"} style="margin:8px 0 4px">
      <b style="font-size:14px">Chi può chiedere</b>
      ${persone.map((x) => `<label class="riga" style="margin:8px 0;color:var(--testo)"><input type="checkbox" data-chi="${x.id}" ${scelti.has(x.id) ? "checked" : ""} style="width:22px;height:22px"> ${esc(nomeDi(x))}</label>`).join("") || `<p class="tenue">Invita prima qualcuno nella tua famiglia.</p>`}</div>
    <div style="border-top:1px solid rgba(0,0,0,.08);margin-top:12px;padding-top:12px">
      <b>La mia voce</b>
      ${v?.pronta ? `<p class="tenue" style="margin:4px 0 8px">✓ Pronta. Più racconti a voce, più ti somiglia: puoi rifarla quando vuoi.</p>
        <div class="riga" style="gap:8px"><button class="btn chiaro" id="v-rifai" style="flex:1">Rifalla</button><button class="btn chiaro" id="v-elimina" style="flex:1;color:#8A3B2E">Eliminala</button></div>`
      : `<p class="tenue" style="margin:4px 0 8px">Hai registrato ${min} ${min === 1 ? "minuto" : "minuti"} di vocali. Ne serve almeno 1, meglio 5 o più.</p>`}
      ${v?.pronta ? "" : `<label class="riga" style="color:var(--testo);align-items:flex-start;gap:10px"><input type="checkbox" id="v-ok" style="width:22px;height:22px;flex-shrink:0;margin-top:2px">
        <span style="font-size:14px">Acconsento che la mia voce venga ricreata dai miei vocali, solo per rispondere alle persone che ho scelto. Posso eliminarla quando voglio.</span></label>
        <button class="btn ambra" id="v-crea" style="margin-top:10px" ${min < 1 ? "disabled" : ""}>Crea la mia voce</button>`}
      <p id="v-esito" class="tenue" role="status"></p></div>`
    : `<button class="btn ambra" id="c-piu">Fa parte di Ancora+</button>`}</div>`);

  document.getElementById("c-piu")?.addEventListener("click", () => passaPiu("Chiedi a me"));
  const salva = async (campi) => {
    const { error } = await sb.from("persone").update(campi).eq("id", state.io.id);
    if (error) alert("Non salvato: " + error.message);
  };
  document.getElementById("c-attivo")?.addEventListener("change", (e) => {
    document.getElementById("c-chi").hidden = !e.target.checked; salva({ chiedi_attivo: e.target.checked });
  });
  document.querySelectorAll("[data-chi]").forEach((c) => c.onchange = () =>
    salva({ chiedi_chi: [...document.querySelectorAll("[data-chi]:checked")].map((x) => x.dataset.chi) }));

  const voce = async (azione) => {
    const esito = document.getElementById("v-esito");
    esito.textContent = azione === "elimina" ? "Elimino…" : "Sto ricreando la tua voce, ci vuole un minuto…";
    const { data: { session } } = await sb.auth.getSession();
    const r = await fetch(`${SUPABASE_URL}/functions/v1/voce`, { method: "POST",
      headers: { authorization: `Bearer ${session?.access_token}`, "content-type": "application/json" },
      body: JSON.stringify({ azione, consenso: true }) }).catch(() => null);
    const j = await r?.json().catch(() => ({}));
    if (!r?.ok) { esito.textContent = j?.errore ?? "Non riuscito, riprova."; return; }
    location.replace("#/profilo?s=chiedi-a-me"); location.reload();
  };
  document.getElementById("v-crea")?.addEventListener("click", () => {
    if (!document.getElementById("v-ok").checked) { document.getElementById("v-esito").textContent = "Serve il tuo consenso."; return; }
    voce("crea");
  });
  document.getElementById("v-rifai")?.addEventListener("click", () => confirm("Rifare la voce con tutti i vocali di adesso?") && voce("crea"));
  document.getElementById("v-elimina")?.addEventListener("click", () => confirm("Eliminare la tua voce? Le risposte saranno solo scritte.") && voce("elimina"));
  if (location.hash.includes("s=chiedi-a-me")) document.getElementById("chiedi-a-me")?.scrollIntoView();
}
