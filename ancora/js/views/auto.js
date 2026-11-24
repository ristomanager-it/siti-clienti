// Le corse in 3D: #/auto?c=<gruppo> · #/auto?solo=1&pista=..&colore=.. · #/auto?id=<gara>
// Contro il telefono (3 avversari), giro veloce con la classifica del gruppo, gara dal vivo fino a 6 (ognuno guida la sua auto, le altre arrivano dal vivo).
// Tre visuali: da dietro, dal cofano, dall'alto. Comandi: pulsanti a destra e sinistra, oppure inclinando il telefono, oppure la tastiera.
import { sb, state, $app, esc, ICONE, invitaAlGioco, invitoPiu } from "../app.js";
import { voceAlTavolo } from "../giochi/voce.js";
import * as A from "../giochi/auto-motore.js";
import { caricaPista, cercaPosto, slug } from "../giochi/auto-osm.js";

// le piste dalle strade vere già pronte (le altre le crea chi gioca dal suo paese)
export const PAESI = { "osm:conflenti": { nome: "Conflenti", lat: 39.071689, lon: 16.284496 } };

const COLORI = { rossa: "#D3222A", blu: "#2457C5", gialla: "#F2C230", verde: "#1E8A4C", nera: "#222", bianca: "#F2F2F2", arancio: "#F07A1E" };
const COLORI_BOT = ["#2457C5", "#1E8A4C", "#F2C230", "#7A3FB8", "#F07A1E"];
let ferma = () => {};
const rpc = async (nome, arg) => { try { return await sb.rpc(nome, arg); } catch { return { data: null, error: true }; } };

export default async function ({ params } = {}) {
  ferma();
  if (params?.solo) return corsa({ pista: params.pista ?? "casa", colore: params.colore ?? "rossa", cerchia: params.c ?? null, giroVeloce: params.giro === "1",
    posto: params.lat ? { lat: Number(params.lat), lon: Number(params.lon), nome: params.nome ?? "Il mio paese" } : null });
  if (params?.id) return gara(params.id);
  const gruppo = (params?.c && state.cerchie.find((c) => c.id === params.c)) ?? state.cerchie.find((c) => c.tipo === "famiglia") ?? state.cerchie[0];
  let pista = "casa", colore = "rossa";
  const { data: vere } = await sb.from("piste_osm").select("chiave, nome").order("creata_il", { ascending: false }).limit(30);
  const paesi = { ...Object.fromEntries((vere ?? []).map((v) => [v.chiave, { nome: v.nome }])), ...PAESI };
  let posto = null;
  const [{ data: aperte }, { data: record }] = gruppo ? await Promise.all([
    sb.from("partite").select("id, n, posti, stato, creata_il").eq("cerchia_id", gruppo.id).eq("gioco", "auto").neq("stato", "finita").gte("creata_il", new Date(Date.now() - 864e5).toISOString()).order("creata_il", { ascending: false }),
    sb.from("auto_record").select("pista, ms, persone:persona_id(nome, soprannome)").eq("cerchia_id", gruppo.id).order("ms").limit(30),
  ]) : [{ data: [] }, { data: [] }];
  const disegna = () => {
    $app().innerHTML = `
      <header class="testa"><a class="icona" href="#/giochi${gruppo ? `?c=${gruppo.id}` : ""}" aria-label="Indietro">${ICONE.indietro}</a><b>🏎️ Corse</b><span style="width:44px"></span></header>
      <div class="pad" style="padding-bottom:120px">
        <p class="tenue" style="margin-top:0">Tre giri, in 3D. Scegli la pista e il colore della tua auto. In gara puoi cambiare visuale: da dietro, dal cofano, dall'alto.</p>
        <b>La pista</b>
        <div style="display:grid;gap:8px;margin:8px 0 14px">${Object.entries(A.PISTE).map(([k, p]) => `
          <button class="card" data-pista="${k}" style="margin:0;text-align:left;border:2px solid ${k === pista ? "#E8B56B" : "transparent"}"><b>${esc(p.nome)}</b><div class="tenue" style="font-size:14px">${esc(p.desc)}</div></button>`).join("")}</div>
        <b>📍 Le strade vere</b>
        <div style="display:grid;gap:8px;margin:8px 0 8px">${Object.entries(paesi).map(([k, p]) => `
          <button class="card" data-pista="${k}" style="margin:0;text-align:left;border:2px solid ${k === pista ? "#E8B56B" : "transparent"}"><b>📍 ${esc(p.nome)}</b><div class="tenue" style="font-size:14px">Le vie e le case vere del paese</div></button>`).join("")}</div>
        <div style="display:flex;gap:8px;margin:0 0 4px"><input id="paese" placeholder="Il tuo paese o una piazza" style="flex:1;margin:0"><button class="btn chiaro" id="cerca" style="margin:0;width:auto">Crea</button></div>
        <p class="tenue" style="font-size:12px;margin:0 0 16px">${posto ? `Pronta: ${esc(posto.nome)} ✓ · ` : ""}Mappe © contributori OpenStreetMap</p>
        <b>La tua auto</b>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 16px">${Object.entries(COLORI).map(([k, c]) => `
          <button data-colore="${k}" aria-label="${k}" style="width:44px;height:44px;border-radius:22px;background:${c};border:3px solid ${k === colore ? "#E8B56B" : "#ddd"}"></button>`).join("")}</div>
        <div style="display:grid;gap:10px">
          <a class="btn ambra" style="margin:0" href="#/auto?solo=1&pista=${encodeURIComponent(pista)}&colore=${colore}${gruppo ? `&c=${gruppo.id}` : ""}${posto && pista === posto.chiave ? `&lat=${posto.lat}&lon=${posto.lon}&nome=${encodeURIComponent(posto.nome)}` : ""}">📱 Gara contro il telefono</a>
          ${gruppo ? `<a class="btn chiaro" style="margin:0" href="#/auto?solo=1&giro=1&pista=${encodeURIComponent(pista)}&colore=${colore}&c=${gruppo.id}${posto && pista === posto.chiave ? `&lat=${posto.lat}&lon=${posto.lon}&nome=${encodeURIComponent(posto.nome)}` : ""}">⏱️ Giro veloce · entra in classifica</a>
          <button class="btn chiaro" id="gara" style="margin:0">👥 Gara dal vivo con ${esc(gruppo.nome)}</button>` : ""}
        </div>
        ${(aperte ?? []).map((p) => `<a href="#/auto?id=${p.id}" class="card" style="display:block;margin:12px 0 0;text-decoration:none;color:inherit">
          <b>${p.stato === "in_corso" ? "Gara in corso" : "Si cercano piloti"} · fino a ${p.n}</b><div class="tenue">${p.posti.map((x) => esc(x.nome ?? "posto libero")).join(" · ")}</div></a>`).join("")}
        ${record?.length ? `<h3 style="margin:22px 0 6px">🏆 Giro veloce di ${esc(gruppo.nome)}</h3>${[...Object.entries(A.PISTE).filter(([k]) => !k.startsWith("osm:")), ...Object.entries(paesi)].map(([k, p]) => {
          const r = record.filter((x) => x.pista === k).slice(0, 3); if (!r.length) return "";
          return `<div class="card" style="margin:0 0 8px"><b>${esc(p.nome)}</b>${r.map((x, i) => `<div style="display:flex;justify-content:space-between"><span>${["🥇", "🥈", "🥉"][i]} ${esc(x.persone?.soprannome || x.persone?.nome || "")}</span><b>${A.tempo(x.ms / 1000)}</b></div>`).join("")}</div>`;
        }).join("")}` : ""}
      </div>`;
    document.querySelectorAll("[data-pista]").forEach((b) => b.onclick = () => { pista = b.dataset.pista; disegna(); });
    document.querySelectorAll("[data-colore]").forEach((b) => b.onclick = () => { colore = b.dataset.colore; disegna(); });
    document.getElementById("cerca").onclick = async (e) => {
      const q = document.getElementById("paese").value.trim(); if (!q) return;
      e.target.disabled = true; e.target.textContent = "…";
      try {
        const r = await cercaPosto(q);
        if (!r) { alert("Non trovo questo posto: prova con «paese, provincia»."); e.target.disabled = false; e.target.textContent = "Crea"; return; }
        posto = { ...r, chiave: slug(r.nome) }; paesi[posto.chiave] = { nome: r.nome }; pista = posto.chiave; disegna();
      } catch { alert("Ricerca non riuscita: riprova tra poco."); e.target.disabled = false; e.target.textContent = "Crea"; }
    };
    document.getElementById("gara")?.addEventListener("click", async (e) => {
      if (pista.startsWith("osm:") && !(vere ?? []).some((v) => v.chiave === pista)) return alert("Questa pista va preparata una volta: prima fai una gara contro il telefono su questa pista, poi la usi dal vivo.");
      e.target.disabled = true;
      const { data, error } = await sb.rpc("sala_crea", { p_cerchia: gruppo.id, p_gioco: "auto", p_n: 6 });
      if (error) { alert(error.message); e.target.disabled = false; return; }
      try { sessionStorage.setItem("auto-colore", colore); sessionStorage.setItem("auto-pista", pista); } catch { /* niente */ }
      location.hash = `#/auto?id=${data}`;
    });
  };
  disegna();
}

// --- la gara dal vivo: attesa, poi la corsa ---
async function gara(id) {
  let attivo = true, timer = null;
  ferma = () => { attivo = false; clearInterval(timer); };
  voceAlTavolo(id, { alto: true });
  $app().innerHTML = `<header class="testa"><a class="icona" href="#/auto" aria-label="Indietro">${ICONE.indietro}</a><b style="flex:1">🏎️ Gara dal vivo</b></header><div id="corpo"></div>`;
  const corpo = document.getElementById("corpo");
  let pista = (() => { try { return sessionStorage.getItem("auto-pista") || "casa"; } catch { return "casa"; } })();
  const colore = (() => { try { return sessionStorage.getItem("auto-colore") || "rossa"; } catch { return "rossa"; } })();
  const { data: vere } = await sb.from("piste_osm").select("chiave, nome").order("creata_il", { ascending: false }).limit(30);
  async function carica() {
    const { data: p } = await sb.from("partite").select("*").eq("id", id).maybeSingle();
    if (!attivo) return;
    if (!p) { corpo.innerHTML = `<p class="pad">Gara non trovata.</p>`; return; }
    if (p.stato !== "attesa") { clearInterval(timer); return corsa({ riga: p, colore }); }
    const creatore = p.creato_da === state.io.id, seduto = p.posti.some((x) => x.persona_id === state.io.id);
    const gruppo = state.cerchie.find((c) => c.id === p.cerchia_id);
    corpo.innerHTML = `
      <div class="pad" style="text-align:center"><div style="font-size:48px">🏎️</div><h1 style="margin:4px 0">Gara dal vivo</h1><p class="tenue" style="margin:0">Tre giri. Corrono quelli seduti quando si dà il via.</p></div>
      <div class="pad" style="padding-top:0">${p.posti.map((x, i) => `<div class="card" style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <span style="font-size:20px">🏁</span><b style="flex:1">${x.persona_id ? esc(x.nome) : `<span class="tenue">posto libero</span>`}</b>
        ${!x.persona_id && !seduto ? `<button class="chip" data-siedi="${i}" style="margin:0">Siediti</button>` : x.persona_id === state.io.id ? `<span class="tenue">sei tu</span>` : ""}</div>`).join("")}
      ${creatore ? `<b>La pista</b><div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 12px">${[...Object.entries(A.PISTE).filter(([k]) => !k.startsWith("osm:")), ...(vere ?? []).map((v) => [v.chiave, { nome: "📍 " + v.nome }])].map(([k, x]) => `<button class="chip ${k === pista ? "on" : ""}" data-pista="${k}" style="margin:0">${esc(x.nome)}</button>`).join("")}</div>
        <button class="btn ambra" id="via">🏁 Si parte!</button>` : `<p class="tenue" style="text-align:center">${seduto ? "Sei in griglia: si parte quando lo decide chi ha aperto la gara." : "Siediti a un posto libero."}</p>`}
      ${gruppo ? `<button class="btn chiaro" id="invita" style="margin-top:10px">🔔 Avvisa tutto il gruppo «${esc(gruppo.nome)}»</button>` : ""}
      <button class="btn chiaro" id="invita-wa" style="margin-top:10px">📲 Invita un amico su WhatsApp</button>
      <p class="tenue" style="font-size:13px;text-align:center;margin:4px 0 0">L'amico entra solo in questa gara: non vede la famiglia né il gruppo.</p></div>`;
    corpo.querySelectorAll("[data-siedi]").forEach((b) => b.onclick = async () => { const { error } = await sb.rpc("briscola_siedi", { p_partita: id, p_posto: Number(b.dataset.siedi) }); if (error) alert(error.message); carica(); });
    corpo.querySelectorAll("[data-pista]").forEach((b) => b.onclick = () => { pista = b.dataset.pista; carica(); });
    corpo.querySelector("#via")?.addEventListener("click", async (e) => {
      e.target.disabled = true;
      const { error } = await sb.rpc("auto_via", { p_partita: id, p_pista: pista });
      if (error) { alert(error.message); e.target.disabled = false; return; }
      carica();
    });
    if (corpo.querySelector("#invita")) corpo.querySelector("#invita").onclick = async (e) => { const { data: n } = await sb.rpc("sala_invita", { p_partita: id }); e.target.textContent = n ? `🔔 Avvisati ${n} sul telefono` : "🔔 Già avvisati (si può rifare tra 10 minuti)"; e.target.disabled = true; };
    corpo.querySelector("#invita-wa").onclick = () => invitaAlGioco({ tipo: "partita", id, cerchiaId: p.cerchia_id, torna: `#/auto?id=${id}`, titolo: "Corse",
      testo: "🏎️ Ti sfido a una corsa in auto su Ancora: tre giri, in 3D.", perche: "Ti hanno sfidato a una corsa: un minuto e sei in griglia." });
  }
  await carica();
  timer = setInterval(() => { if (!attivo || !location.hash.includes(id)) return clearInterval(timer); if (!document.hidden) carica(); }, 2500);
}

// --- la corsa (contro il telefono, giro veloce o dal vivo) ---
async function corsa({ pista: chiave = "casa", colore = "rossa", cerchia = null, giroVeloce = false, riga = null, posto = null }) {
  const live = !!riga;
  if (live) chiave = riga.pubblico?.pista ?? "casa";
  const osm = chiave.startsWith("osm:");
  if (osm && !A.PISTE[chiave]) {
    // le strade vere: la prima volta si scaricano da OpenStreetMap, poi sono salvate su Ancora
    $app().innerHTML = `<div class="pad" style="text-align:center;padding-top:90px"><div style="font-size:52px">🗺️</div><h2 id="car">Preparo la pista…</h2>
      <p class="tenue">Le strade e le case vere, da OpenStreetMap. La prima volta ci vuole qualche secondo.</p></div>`;
    try {
      const d = await caricaPista(chiave, posto ?? PAESI[chiave] ?? {}, (t) => { const h = document.getElementById("car"); if (h) h.textContent = t; });
      A.registraPista(chiave, d.nome, d.punti, d.largo, { osm: true, edifici: d.edifici, altre: d.altre });
    } catch (e) {
      $app().innerHTML = `<div class="pad" style="text-align:center;padding-top:90px"><div style="font-size:52px">🗺️</div><h2>Pista non pronta</h2>
        <p class="tenue">${esc(e.message ?? String(e))}</p><a class="btn" href="#/auto">Indietro</a></div>`;
      return;
    }
  }
  const pista = A.creaPista(chiave);
  const io = live ? riga.posti.findIndex((x) => x.persona_id === state.io.id) : 0;
  const nomi = live ? riga.posti.map((x) => (x.persona_id === state.io.id ? "Tu" : x.nome ?? "?")) : giroVeloce ? ["Tu"] : ["Tu", "Rosa", "Bruno", "Gino"];
  const quanti = nomi.length;
  const auto = A.griglia(pista, quanti);
  const bravura = [0, 0.55, 0.7, 0.85];
  const mem = auto.map(() => ({}));
  const altri = new Map();     // dal vivo: posto → { prima, dopo, t }
  let attivo = true, raf = 0, canale = null, visuale = 0, t = 0, partito = false, finito = false, salvato = false;
  const cmd = { gas: 0, freno: 0, sterzo: 0 };
  let inclina = false, gasAuto = false;

  $app().innerHTML = `
    <div id="sala" style="position:fixed;inset:0;z-index:50;background:#86C5EA;overflow:hidden;user-select:none;-webkit-user-select:none;touch-action:none">
      <div id="hud" style="position:absolute;top:calc(8px + env(safe-area-inset-top));left:8px;right:8px;display:flex;gap:8px;align-items:flex-start;color:#fff;font-weight:800;text-shadow:0 1px 4px rgba(0,0,0,.6);z-index:3;pointer-events:none">
        <a href="#/auto" id="esci" style="pointer-events:auto;color:#fff;font-size:26px;text-decoration:none;background:rgba(0,0,0,.3);border-radius:12px;padding:0 10px">‹</a>
        <div id="pos" style="font-size:30px;line-height:1"></div>
        <div style="flex:1"><div id="giro" style="font-size:16px"></div><div id="cron" style="font-size:14px;opacity:.9"></div></div>
        <button id="vis" style="pointer-events:auto;border:0;border-radius:12px;padding:8px 12px;background:rgba(0,0,0,.35);color:#fff;font-weight:800">👁 Visuale</button>
      </div>
      <div id="classifica" style="position:absolute;top:calc(60px + env(safe-area-inset-top));left:10px;color:#fff;font-size:13px;font-weight:700;text-shadow:0 1px 3px rgba(0,0,0,.7);z-index:3;pointer-events:none;line-height:1.5"></div>
      <div id="vel" style="position:absolute;bottom:calc(150px + env(safe-area-inset-bottom));left:0;right:0;text-align:center;color:#fff;font:800 34px system-ui;text-shadow:0 2px 6px rgba(0,0,0,.6);z-index:3;pointer-events:none"></div>
      <div id="via" style="position:absolute;inset:0;display:grid;place-items:center;font:900 96px system-ui;color:#fff;text-shadow:0 4px 18px rgba(0,0,0,.6);z-index:4;pointer-events:none"></div>
      <div id="pedali" style="position:absolute;left:0;right:0;bottom:calc(14px + env(safe-area-inset-bottom));display:flex;justify-content:space-between;align-items:flex-end;padding:0 12px;z-index:3">
        <div style="display:flex;gap:10px">
          <button class="pd" data-c="sx" style="width:78px;height:78px">◀</button><button class="pd" data-c="dx" style="width:78px;height:78px">▶</button></div>
        <div style="display:flex;flex-direction:column;gap:8px;align-items:center">
          <div style="display:flex;gap:6px"><button id="incl" class="mini">📱 Inclina</button><button id="gasauto" class="mini">⚡ Gas auto</button></div>
          <div style="display:flex;gap:10px;align-items:flex-end"><button class="pd" data-c="freno" style="width:66px;height:66px;font-size:15px">Freno</button>
          <button class="pd" data-c="gas" style="width:92px;height:110px;background:rgba(46,160,90,.75)">Gas</button></div></div>
      </div>
      <div id="fine" style="position:absolute;inset:0;display:none;place-items:center;background:rgba(0,0,0,.55);z-index:5"></div>
      <style>#sala .pd{border:0;border-radius:20px;background:rgba(0,0,0,.38);color:#fff;font:800 26px system-ui;touch-action:none}
        #sala .pd.on{background:rgba(232,181,107,.85)!important;color:#12302C}
        #sala .mini{border:0;border-radius:10px;padding:6px 8px;background:rgba(0,0,0,.35);color:#fff;font-weight:800;font-size:12px}
        #sala .mini.on{background:#E8B56B;color:#12302C}</style>
    </div>`;
  const barra = document.getElementById("barra"); if (barra) barra.hidden = true;
  const sala = document.getElementById("sala");
  const $ = (s) => document.getElementById(s);

  // --- three.js ---
  let THREE;
  try { THREE = await import("https://esm.sh/three@0.170.0"); }
  catch { $("via").textContent = ""; $("fine").style.display = "grid"; $("fine").innerHTML = `<div class="card" style="max-width:320px;text-align:center">Non riesco a caricare il gioco 3D. Controlla la connessione e riprova.<a class="btn" href="#/auto" style="margin-top:10px">Indietro</a></div>`; return; }
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
  sala.prepend(renderer.domElement);
  const scena = new THREE.Scene();
  scena.background = new THREE.Color("#86C5EA");
  scena.fog = new THREE.Fog("#A9D6EF", 120, 520);
  const camera = new THREE.PerspectiveCamera(68, 1, 0.1, 1200);
  scena.add(new THREE.HemisphereLight("#ffffff", "#4C7A3A", 1.1));
  const sole = new THREE.DirectionalLight("#fff6e0", 1.4); sole.position.set(200, 300, 100); scena.add(sole);
  const misura = () => { const w = sala.clientWidth, h = sala.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w < h ? 78 : 64; camera.updateProjectionMatrix(); };
  addEventListener("resize", misura); misura();

  // prato
  const prato = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshLambertMaterial({ color: "#5E9E48" }));
  prato.rotation.x = -Math.PI / 2; scena.add(prato);
  // strada, cordoli, muretti: nastri lungo la pista
  const nastro = (da, a, y, colori, alto = 0) => {
    const pos = [], col = [], idx = [], { pts, N } = pista, c = new THREE.Color();
    for (let i = 0; i <= N; i++) {
      const p = pts[i % N];
      if (alto) { pos.push(p.x + p.nx * da, 0, p.z + p.nz * da, p.x + p.nx * da, alto, p.z + p.nz * da); }
      else pos.push(p.x + p.nx * da, y, p.z + p.nz * da, p.x + p.nx * a, y, p.z + p.nz * a);
      c.set(colori(i)); col.push(c.r, c.g, c.b, c.r, c.g, c.b);
      if (i < N) idx.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })); scena.add(m); return m;
  };
  const W = pista.largo / 2;
  nastro(-W, W, 0.03, () => "#4A4D52");
  nastro(-W - 1.4, -W, 0.05, (i) => (Math.floor(i / 4) % 2 ? "#E23B2E" : "#F4F4F4"));
  nastro(W, W + 1.4, 0.05, (i) => (Math.floor(i / 4) % 2 ? "#E23B2E" : "#F4F4F4"));
  nastro(-0.18, 0.18, 0.04, (i) => (Math.floor(i / 6) % 2 ? "#4A4D52" : "#E8E8E8"));
  if (!osm) {
    nastro(-W - 10, 0, 0, (i) => (Math.floor(i / 10) % 2 ? "#E23B2E" : "#F4F4F4"), 1.0);
    nastro(W + 10, 0, 0, (i) => (Math.floor(i / 10) % 2 ? "#E23B2E" : "#F4F4F4"), 1.0);
  } else {
    // marciapiedi e il paese vero intorno: case alte quanto i loro piani, le altre strade
    nastro(-W - 2.4, -W - 1.4, 0.12, () => "#BDB8AE"); nastro(W + 1.4, W + 2.4, 0.12, () => "#BDB8AE");
    const ex = pista.extra ?? {};
    // tutte le case in due soli pezzi (muri e tetti), così anche un telefono semplice va fluido
    const { mergeGeometries } = await import("https://esm.sh/three@0.170.0/examples/jsm/utils/BufferGeometryUtils.js");
    const tinte = ["#EADFC8", "#E7D3B0", "#F1E6D2", "#D9C7A4", "#EFD9B8", "#E4CDB4"].map((c) => new THREE.Color(c)), chiesa = new THREE.Color("#D8CDB5");
    const pezziMuri = [], pezziTetti = [];
    // dove OpenStreetMap ha poche case disegnate, il paese si completa con case lungo la strada (sempre le stesse per quella pista)
    const edifici = [...(ex.edifici ?? [])];
    if (edifici.length < 250) {
      let s = 11; const cas = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      const passo = Math.max(1, Math.round(pista.N * 13 / pista.lung));
      for (let i = 0; i < pista.N; i += passo) {
        const p = pista.pts[i];
        for (const lato of [-1, 1]) {
          if (cas() < 0.3) continue;
          const lu = 7 + cas() * 6, pr = 7 + cas() * 5, d = W + 3.5 + pr / 2 + cas() * 3;
          const cx = p.x + p.nx * lato * d, cz = p.z + p.nz * lato * d;
          if (Math.abs(A.vicino(pista, cx, cz).lato) < W + 2 + pr / 2) continue;
          const tx = p.tx * lu / 2, tz = p.tz * lu / 2, nx = p.nx * pr / 2, nz = p.nz * pr / 2;
          const piani = 2 + Math.floor(cas() * 2.4);
          edifici.push({ p: [[cx - tx - nx, cz - tz - nz], [cx + tx - nx, cz + tz - nz], [cx + tx + nx, cz + tz + nz], [cx - tx + nx, cz - tz + nz]], h: piani * 3.1 + 0.6 });
        }
      }
    }
    for (const [k, e] of edifici.entries()) {
      if (e.p.length < 3) continue;
      try {
        const forma = new THREE.Shape(e.p.map(([x, z]) => new THREE.Vector2(x, -z)));
        const g = new THREE.ExtrudeGeometry(forma, { depth: e.h, bevelEnabled: false }); g.rotateX(-Math.PI / 2);
        const c = e.t === "c" ? chiesa : tinte[k % tinte.length], n = g.attributes.position.count, col = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
        g.setAttribute("color", new THREE.BufferAttribute(col, 3)); pezziMuri.push(g);
        const t = new THREE.ShapeGeometry(forma); t.rotateX(-Math.PI / 2); t.translate(0, e.h + 0.05, 0); pezziTetti.push(t.index ? t.toNonIndexed() : t);
      } catch { /* una casa disegnata male su OpenStreetMap: si salta */ }
    }
    if (pezziMuri.length) scena.add(new THREE.Mesh(mergeGeometries(pezziMuri), new THREE.MeshLambertMaterial({ vertexColors: true })));
    if (pezziTetti.length) scena.add(new THREE.Mesh(mergeGeometries(pezziTetti), new THREE.MeshLambertMaterial({ color: "#A9533B", side: THREE.DoubleSide })));
    for (const l of ex.altre ?? []) {
      const pos = [], idx = [];
      for (let i = 0; i < l.length; i++) {
        const a = l[Math.max(0, i - 1)], b = l[Math.min(l.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz) || 1, nx = -dz / d * 3, nz = dx / d * 3;
        pos.push(l[i][0] + nx, 0.015, l[i][1] + nz, l[i][0] - nx, 0.015, l[i][1] - nz);
        if (i + 1 < l.length) idx.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      scena.add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: "#6A6C70", side: THREE.DoubleSide })));
    }
  }
  // linea del via a scacchi
  {
    const cv = document.createElement("canvas"); cv.width = 64; cv.height = 16; const x = cv.getContext("2d");
    for (let i = 0; i < 16; i++) for (let j = 0; j < 4; j++) { x.fillStyle = (i + j) % 2 ? "#111" : "#fff"; x.fillRect(i * 4, j * 4, 4, 4); }
    const tex = new THREE.CanvasTexture(cv); tex.magFilter = THREE.NearestFilter;
    const p = pista.pts[0];
    const l = new THREE.Mesh(new THREE.PlaneGeometry(3, pista.largo), new THREE.MeshBasicMaterial({ map: tex }));
    l.rotation.x = -Math.PI / 2; l.rotation.z = -Math.atan2(p.tz, p.tx); l.position.set(p.x, 0.06, p.z); scena.add(l);
    // portale del traguardo
    const mat = new THREE.MeshLambertMaterial({ color: "#C8102E" });
    for (const s of [-1, 1]) { const pal = new THREE.Mesh(new THREE.BoxGeometry(0.6, 6, 0.6), mat); pal.position.set(p.x + p.nx * s * (W + 2), 3, p.z + p.nz * s * (W + 2)); scena.add(pal); }
    const trave = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, pista.largo + 4), mat);
    trave.position.set(p.x, 6, p.z); trave.rotation.y = -Math.atan2(p.tz, p.tx); scena.add(trave);
  }
  // alberi e tribune
  {
    const tronchi = [], chiome = [];
    const casuale = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
    for (let k = 0; k < (osm ? 260 : 420); k++) {
      const i = Math.floor(casuale() * pista.N), p = pista.pts[i], lato = (casuale() < 0.5 ? -1 : 1) * (W + (osm ? 70 : 16) + casuale() * (osm ? 160 : 90));
      const x = p.x + p.nx * lato, z = p.z + p.nz * lato;
      const v = A.vicino(pista, x, z); if (Math.abs(v.lato) < W + 14) continue;
      tronchi.push([x, z]); chiome.push([x, z, 0.8 + casuale() * 0.8]);
    }
    const tr = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.35, 0.45, 3, 6), new THREE.MeshLambertMaterial({ color: "#6B4A2B" }), tronchi.length);
    const ch = new THREE.InstancedMesh(new THREE.ConeGeometry(2.6, 7, 7), new THREE.MeshLambertMaterial({ color: "#2F6B35" }), chiome.length);
    const m = new THREE.Matrix4();
    tronchi.forEach(([x, z], i) => { m.makeTranslation(x, 1.5, z); tr.setMatrixAt(i, m); });
    chiome.forEach(([x, z, s], i) => { m.makeScale(s, s, s); m.setPosition(x, 3 + 3.5 * s, z); ch.setMatrixAt(i, m); });
    scena.add(tr, ch);
    const p = pista.pts[Math.floor(pista.N * 0.02)];
    if (!osm) {
    const trib = new THREE.Mesh(new THREE.BoxGeometry(40, 6, 8), new THREE.MeshLambertMaterial({ color: "#B9BEC6" }));
    trib.position.set(p.x - p.nx * (W + 22), 3, p.z - p.nz * (W + 22)); trib.rotation.y = -Math.atan2(p.tz, p.tx); scena.add(trib);
    }
  }
  // le auto
  const creaAuto = (col) => {
    const g = new THREE.Group();
    const vern = new THREE.MeshLambertMaterial({ color: col }), scuro = new THREE.MeshLambertMaterial({ color: "#1c1c1c" }), vetro = new THREE.MeshLambertMaterial({ color: "#9FC3D8" });
    const corpo = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.7, 1.9), vern); corpo.position.y = 0.75; g.add(corpo);
    const muso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.7), vern); muso.position.set(2.3, 0.6, 0); g.add(muso);
    const abit = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.6, 1.6), vetro); abit.position.set(-0.3, 1.38, 0); g.add(abit);
    const tetto = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 1.55), vern); tetto.position.set(-0.4, 1.72, 0); g.add(tetto);
    const alet = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 1.9), scuro); alet.position.set(-2.1, 1.4, 0); g.add(alet);
    for (const s of [-0.7, 0.7]) { const sup = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.1), scuro); sup.position.set(-2.1, 1.15, s); g.add(sup); }
    for (const [x, z] of [[1.4, 1], [1.4, -1], [-1.4, 1], [-1.4, -1]]) {
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.35, 14), scuro); r.rotation.x = Math.PI / 2; r.position.set(x, 0.42, z); g.add(r);
    }
    scena.add(g); return g;
  };
  const modelli = auto.map((_, k) => creaAuto(k === io ? COLORI[colore] ?? "#D3222A" : COLORI_BOT[(k + (k >= io ? 0 : 1)) % COLORI_BOT.length]));

  // --- comandi ---
  const premuti = new Set();
  sala.querySelectorAll(".pd").forEach((b) => {
    const giu = (e) => { e.preventDefault(); premuti.add(b.dataset.c); b.classList.add("on"); };
    const su = () => { premuti.delete(b.dataset.c); b.classList.remove("on"); };
    b.addEventListener("pointerdown", giu); b.addEventListener("pointerup", su); b.addEventListener("pointercancel", su); b.addEventListener("pointerleave", su);
  });
  const tasti = new Set();
  onkeydown = (e) => { tasti.add(e.key); if (e.key.startsWith("Arrow") || e.key === " ") e.preventDefault(); if (e.key === "v") cambiaVisuale(); };
  onkeyup = (e) => tasti.delete(e.key);
  let gamma = 0;
  const orient = (e) => {
    const verticale = innerHeight > innerWidth;
    const ang = verticale ? e.gamma : (screen.orientation?.angle === 90 ? e.beta : -e.beta);
    gamma = Math.max(-1, Math.min(1, (ang ?? 0) / 22));
  };
  $("incl").onclick = async () => {
    if (!inclina && typeof DeviceOrientationEvent !== "undefined" && DeviceOrientationEvent.requestPermission) {
      try { if ((await DeviceOrientationEvent.requestPermission()) !== "granted") return; } catch { return; }
    }
    inclina = !inclina; $("incl").classList.toggle("on", inclina);
    if (inclina) addEventListener("deviceorientation", orient); else removeEventListener("deviceorientation", orient);
  };
  $("gasauto").onclick = () => { gasAuto = !gasAuto; $("gasauto").classList.toggle("on", gasAuto); };
  const VISUALI = ["Da dietro", "Dal cofano", "Dall'alto"];
  const cambiaVisuale = () => { visuale = (visuale + 1) % 3; mostraVia(VISUALI[visuale], 700, 34); };
  $("vis").onclick = cambiaVisuale;
  function leggiComandi() {
    const sx = premuti.has("sx") || tasti.has("ArrowLeft"), dx = premuti.has("dx") || tasti.has("ArrowRight");
    let sterzo = (dx ? 1 : 0) - (sx ? 1 : 0); if (inclina && !sx && !dx) sterzo = gamma;
    cmd.sterzo += (sterzo - cmd.sterzo) * 0.25;
    cmd.gas = premuti.has("gas") || tasti.has("ArrowUp") || (gasAuto && !premuti.has("freno") && !tasti.has("ArrowDown")) ? 1 : 0;
    cmd.freno = premuti.has("freno") || tasti.has("ArrowDown") || tasti.has(" ") ? 1 : 0;
  }
  function mostraVia(testo, ms = 900, px = 96) { const v = $("via"); if (!v) return; v.style.fontSize = `${px}px`; v.textContent = testo; clearTimeout(mostraVia.t); mostraVia.t = setTimeout(() => { if ($("via")) $("via").textContent = ""; }, ms); }

  // --- dal vivo ---
  let viaAlle = performance.now() + 3600;
  if (live) {
    // l'ora del via è quella del server: la confrontiamo con quella del telefono
    const { data: ora } = await rpc("auto_ora");
    const scarto = ora ? new Date(ora).getTime() - Date.now() : 0;
    viaAlle = performance.now() + (new Date(riga.pubblico.via).getTime() - (Date.now() + scarto));
    canale = sb.channel(`auto-${riga.id}`, { config: { broadcast: { self: false } } });
    canale.on("broadcast", { event: "pos" }, ({ payload: m }) => {
      if (m.s === io || m.s < 0 || m.s >= quanti) return;
      const prima = altri.get(m.s)?.dopo ?? m;
      altri.set(m.s, { prima, dopo: m, t: performance.now() });
      Object.assign(auto[m.s], { i: m.i, giro: m.g, metaGiro: !!m.m, fine: m.f ?? null, v: m.v });
    });
    canale.subscribe();
    if (riga.stato === "finita") { finito = true; }
  }

  // --- il ciclo ---
  let ultimo = performance.now(), acc = 0, ultimoInvio = 0, ultimoVia = "";
  const cam = new THREE.Vector3(), guarda = new THREE.Vector3();
  function giro(ora) {
    if (!attivo || !document.getElementById("sala")) return chiudi();
    const dt = Math.min(0.1, (ora - ultimo) / 1000); ultimo = ora;
    const mancano = (viaAlle - ora) / 1000;
    if (!partito) {
      const n = Math.ceil(mancano);
      const testo = mancano > 3 ? "" : n > 0 ? String(n) : "VIA!";
      if (testo !== ultimoVia) { ultimoVia = testo; if (testo) { mostraVia(testo, testo === "VIA!" ? 900 : 1100); try { navigator.vibrate?.(testo === "VIA!" ? 120 : 30); } catch { /* niente */ } } }
      if (mancano <= 0) partito = true;
    }
    leggiComandi();
    if (partito) {
      acc += dt;
      while (acc >= 1 / 60) {
        t += 1 / 60;
        auto.forEach((c, k) => {
          if (k === io) A.guida(pista, c, cmd, 1 / 60, t);
          else if (!live) A.guida(pista, c, A.pilota(pista, c, bravura[k] ?? 0.7, mem[k]), 1 / 60, t);
        });
        acc -= 1 / 60;
      }
    }
    // gli altri, dal vivo: si muovono morbidi tra un aggiornamento e l'altro
    if (live) for (const [s, a] of altri) {
      const f = Math.min(1.5, (ora - a.t) / 100);
      const c = auto[s];
      c.x = a.prima.x + (a.dopo.x - a.prima.x) * f; c.z = a.prima.z + (a.dopo.z - a.prima.z) * f;
      let da = a.dopo.a - a.prima.a; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
      c.a = a.prima.a + da * Math.min(1, f);
    }
    if (live && ora - ultimoInvio > 100) {
      ultimoInvio = ora; const c = auto[io];
      canale?.send({ type: "broadcast", event: "pos", payload: { s: io, x: +c.x.toFixed(2), z: +c.z.toFixed(2), a: +c.a.toFixed(3), v: +c.v.toFixed(1), i: c.i, g: c.giro, m: c.metaGiro ? 1 : 0, f: c.fine } });
    }
    // disegno
    auto.forEach((c, k) => { const m = modelli[k]; m.position.set(c.x, 0, c.z); m.rotation.y = -c.a; m.visible = !(k === io && visuale === 1); });
    const me = auto[io], dx = Math.cos(me.a), dz = Math.sin(me.a);
    if (visuale === 0) { cam.set(me.x - dx * 9, 3.6, me.z - dz * 9); guarda.set(me.x + dx * 6, 1.2, me.z + dz * 6); camera.position.lerp(cam, 0.18); camera.up.set(0, 1, 0); }
    else if (visuale === 1) { camera.position.set(me.x + dx * 0.4, 1.35, me.z + dz * 0.4); guarda.set(me.x + dx * 30, 1.1, me.z + dz * 30); camera.up.set(0, 1, 0); }
    else { cam.set(me.x - dx * 6, 62, me.z - dz * 6); guarda.set(me.x + dx * 8, 0, me.z + dz * 8); camera.position.lerp(cam, 0.2); camera.up.set(dx, 0, dz); }
    camera.lookAt(guarda);
    renderer.render(scena, camera);
    hud();
    if (me.fine !== null && !finito) arrivato();
    raf = requestAnimationFrame(giro);
  }
  let ultimoHud = 0;
  function hud() {
    if (performance.now() - ultimoHud < 120) return; ultimoHud = performance.now();
    const me = auto[io];
    const ordine = auto.map((c, k) => [k, A.strada(pista, c)]).sort((a, b) => b[1] - a[1]).map((x) => x[0]);
    if (!giroVeloce) $("pos").textContent = `${ordine.indexOf(io) + 1}°/${quanti}`;
    $("giro").textContent = me.fine !== null ? "Arrivato!" : `Giro ${Math.min(A.GIRI, me.giro + 1)}/${A.GIRI}`;
    $("cron").textContent = `${A.tempo(t)}${me.giroMigliore ? ` · migliore ${A.tempo(me.giroMigliore)}` : ""}`;
    $("vel").textContent = `${Math.round(Math.abs(me.v) * 3.6)} km/h`;
    $("classifica").innerHTML = giroVeloce ? "" : ordine.map((k, n) => `${n + 1}. ${esc(nomi[k])}${auto[k].fine !== null ? " 🏁" : ""}`).join("<br>");
  }
  async function arrivato() {
    finito = true;
    const me = auto[io];
    let nuovoRecord = false;
    if ((cerchia || live) && me.giroMigliore && !salvato) {
      salvato = true;
      const { data } = await rpc("auto_record_salva", { p_cerchia: live ? riga.cerchia_id : cerchia, p_pista: chiave, p_ms: Math.round(me.giroMigliore * 1000) });
      nuovoRecord = !!data;
    }
    if (live) await rpc("auto_arrivo", { p_partita: riga.id, p_ms: Math.round(me.fine * 1000), p_giro_ms: Math.round((me.giroMigliore ?? me.fine) * 1000) });
    setTimeout(() => risultati(nuovoRecord), 1500);
  }
  function risultati(nuovoRecord) {
    const f = $("fine"); if (!f) return;
    const ordine = auto.map((c, k) => [k, A.strada(pista, c)]).sort((a, b) => b[1] - a[1]).map((x) => x[0]);
    const posto = ordine.indexOf(io) + 1;
    f.style.display = "grid";
    f.innerHTML = `<div class="card" style="width:min(92vw,380px);max-height:86vh;overflow:auto;text-align:center;margin:0">
      <div style="font-size:46px">${giroVeloce ? "⏱️" : posto === 1 ? "🏆" : posto <= 3 ? "🏅" : "🏁"}</div>
      <h2 style="margin:4px 0">${giroVeloce ? `Giro migliore ${A.tempo(auto[io].giroMigliore ?? 0)}` : `Sei arrivato ${posto}°`}</h2>
      ${nuovoRecord ? `<p style="color:#8A5A17;font-weight:800;margin:4px 0">Nuovo record personale su ${esc(pista.nome)}!</p>` : ""}
      ${giroVeloce ? "" : `<div style="text-align:left;margin:10px 0">${ordine.map((k, n) => `<div style="display:flex;justify-content:space-between;padding:4px 0"><span>${n + 1}. ${esc(nomi[k])}</span><b>${auto[k].fine !== null ? A.tempo(auto[k].fine) : live ? "in corsa…" : "—"}</b></div>`).join("")}</div>`}
      <button class="btn ambra" id="ancora" style="margin:6px 0 0">${live ? "Un'altra gara" : "Rigioca"}</button>
      <a class="btn chiaro" href="#/auto${cerchia ? `?c=${cerchia}` : ""}" style="margin-top:8px">Esci</a>
      ${live ? `<button class="btn chiaro" id="chiudi" style="margin-top:8px">Chiudi la gara per tutti</button>` : ""}</div>${invitoPiu()}`;
    f.querySelector("#ancora").onclick = async () => {
      if (!live) { location.reload(); return; }
      const { data, error } = await sb.rpc("sala_crea", { p_cerchia: riga.cerchia_id, p_gioco: "auto", p_n: 6 });
      if (error) alert(error.message); else location.hash = `#/auto?id=${data}`;
    };
    f.querySelector("#chiudi")?.addEventListener("click", async (e) => { await sb.rpc("auto_chiudi", { p_partita: riga.id }); e.target.textContent = "Gara chiusa"; e.target.disabled = true; });
    if (live) setTimeout(() => { if ($("fine")?.style.display === "grid") risultati(nuovoRecord); }, 2500);
  }
  function chiudi() { attivo = false; cancelAnimationFrame(raf); if (canale) sb.removeChannel(canale); removeEventListener("deviceorientation", orient); onkeydown = null; onkeyup = null; try { renderer.dispose(); } catch { /* niente */ } }
  ferma = chiudi;
  raf = requestAnimationFrame(giro);
}
