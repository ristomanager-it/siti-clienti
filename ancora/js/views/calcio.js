// Il calciobalilla: #/calcio?c=<gruppo>  ·  #/calcio?id=<partita>  ·  #/calcio?solo=1&l=<bravura>
// La partita gira su un solo dispositivo (il telefono di chi la avvia, oppure il televisore): gli altri telefoni fanno da manopola
// e vedono il campo. Le mosse viaggiano dal vivo (Supabase Realtime, broadcast); i posti vuoti li gioca il telefono.
import { sb, state, $app, esc, ICONE, invitaAlGioco, invitoPiu } from "../app.js";
import { voceAlTavolo } from "../giochi/voce.js";
import * as C from "../giochi/calcio-motore.js";

let ferma = () => {};
const mioId = (() => { try { let v = sessionStorage.getItem("calcio-id"); if (!v) { v = Math.random().toString(36).slice(2, 10); sessionStorage.setItem("calcio-id", v); } return v; } catch { return Math.random().toString(36).slice(2, 10); } })();

export default async function ({ params } = {}) {
  ferma();
  if (params?.solo) return campo({ solo: true, livello: Number(params.l ?? 0.6) });
  if (params?.id) return tavolo(params.id);
  const gruppo = (params?.c && state.cerchie.find((c) => c.id === params.c)) ?? state.cerchie.find((c) => c.tipo === "famiglia") ?? state.cerchie[0];
  const { data: aperti } = gruppo ? await sb.from("partite").select("id, n, posti, stato, creata_il").eq("cerchia_id", gruppo.id).eq("gioco", "calcio")
    .neq("stato", "finita").gte("creata_il", new Date(Date.now() - 864e5).toISOString()).order("creata_il", { ascending: false }) : { data: [] };
  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/giochi${gruppo ? `?c=${gruppo.id}` : ""}" aria-label="Indietro">${ICONE.indietro}</a><b>⚽ Calciobalilla</b><span style="width:44px"></span></header>
    <div class="pad" style="padding-bottom:120px">
      <p class="tenue" style="margin-top:0">Muovi il dito per spostare le stecche, tocca per tirare. Vince chi arriva a ${C.GOL_VITTORIA}.</p>
      <div class="card" style="margin:0 0 14px"><b style="font-size:18px">📱 Contro il telefono</b>
        <div style="display:flex;gap:8px;margin-top:10px"><a class="btn chiaro" style="margin:0" href="#/calcio?solo=1&l=0.35">Facile</a><a class="btn ambra" style="margin:0" href="#/calcio?solo=1&l=0.8">Bravo</a></div></div>
      ${gruppo ? `
      <div class="card" style="margin:0 0 14px"><b style="font-size:18px">👥 Con ${esc(gruppo.nome)}</b>
        <p class="tenue" style="margin:4px 0 10px">Il campo sul televisore e i telefoni come manopole, oppure ognuno da casa sua. A chi manca, gioca il telefono.</p>
        <div style="display:flex;gap:8px"><button class="btn ambra" data-n="2" style="margin:0">Uno contro uno</button><button class="btn ambra" data-n="4" style="margin:0">Due contro due</button></div></div>
      ${(aperti ?? []).map((p) => `<a href="#/calcio?id=${p.id}" class="card" style="display:block;margin:0 0 10px;text-decoration:none;color:inherit">
        <b>${p.stato === "in_corso" ? "In corso" : "Si cercano giocatori"} · a ${p.n}</b><div class="tenue">${p.posti.map((x) => esc(x.nome ?? "posto libero")).join(" · ")}</div></a>`).join("")}` : ""}
    </div>`;
  document.querySelectorAll("[data-n]").forEach((b) => b.onclick = async () => {
    b.disabled = true;
    const { data, error } = await sb.rpc("sala_crea", { p_cerchia: gruppo.id, p_gioco: "calcio", p_n: Number(b.dataset.n) });
    if (error) { alert(error.message); b.disabled = false; return; }
    location.hash = `#/calcio?id=${data}`;
  });
}

const nomeSquadra = (n, p) => (C.squadraDel(n, p) === 0 ? "Blu" : "Rossi");
const ruolo = (n, p) => (n === 4 ? (p % 2 === 0 ? "difesa e portiere" : "centro e attacco") : "tutte le stecche");

async function tavolo(id) {
  let riga = null, attivo = true, timer = null;
  ferma = () => { attivo = false; clearInterval(timer); };
  $app().innerHTML = `<header class="testa"><a class="icona" href="#/calcio" aria-label="Indietro">${ICONE.indietro}</a><b style="flex:1">⚽ Calciobalilla</b></header><div id="corpo"></div>`;
  const corpo = document.getElementById("corpo");
  voceAlTavolo(id, { alto: true });
  async function carica() {
    const { data } = await sb.from("partite").select("*").eq("id", id).maybeSingle();
    if (!attivo) return;
    if (!data) { corpo.innerHTML = `<p class="pad">Partita non trovata.</p>`; return; }
    riga = data;
    if (data.stato === "attesa") return attesa();
    clearInterval(timer);
    return campo({ riga: data });
  }
  function attesa() {
    const io = riga.posti.findIndex((x) => x.persona_id === state.io.id), creatore = riga.creato_da === state.io.id;
    corpo.innerHTML = `
      <div class="pad" style="text-align:center"><div style="font-size:48px">⚽</div><h1 style="margin:4px 0">Calciobalilla ${riga.n === 4 ? "due contro due" : "uno contro uno"}</h1>
        <p class="tenue" style="margin:0">${riga.n === 4 ? "In ogni squadra uno tiene difesa e portiere, l'altro centro e attacco." : "Ognuno muove tutte le stecche della sua squadra."}</p></div>
      ${riga.posti.map((x, i) => `<div class="card" style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <span style="width:14px;height:14px;border-radius:7px;background:${C.squadraDel(riga.n, i) === 0 ? "#2D6CDF" : "#D2302C"}"></span>
        <b style="flex:1">${x.persona_id ? esc(x.nome) : `<span class="tenue">posto libero</span>`}<div class="tenue" style="font-size:13px;font-weight:600">${nomeSquadra(riga.n, i)} · ${ruolo(riga.n, i)}</div></b>
        ${!x.persona_id ? `<button class="chip" data-siedi="${i}" style="margin:0">Siediti qui</button>` : x.persona_id === state.io.id ? `<span class="tenue">sei tu</span>` : ""}</div>`).join("")}
      <div class="pad">
        ${creatore ? `<button class="btn ambra" id="via">Fischio d'inizio, il campo su questo telefono</button>
          <button class="btn chiaro" id="tv" style="margin-top:10px">📺 Il campo sul televisore</button>
          <p class="tenue" style="font-size:14px;margin:6px 0 0">Per il televisore: apri Ancora sul browser del televisore (o del computer collegato), entra col tuo account, apri questa partita e premi lì "📺 Il campo sul televisore". I telefoni diventano le manopole.</p>`
          : `<p class="tenue" style="text-align:center">${io >= 0 ? "Sei seduto: si parte quando lo decide chi ha aperto il tavolo." : "Scegli un posto libero."}</p>`}
        ${state.cerchie.some((c) => c.id === riga.cerchia_id) ? `<button class="btn chiaro" id="invita" style="margin-top:10px">🔔 Avvisa tutto il gruppo «${esc(state.cerchie.find((c) => c.id === riga.cerchia_id)?.nome ?? "")}»</button>` : ""}
        <button class="btn chiaro" id="invita-wa" style="margin-top:10px">📲 Invita un amico su WhatsApp</button>
        <p class="tenue" style="font-size:13px;text-align:center;margin:4px 0 0">L'amico entra solo a questo tavolo: non vede la famiglia né il gruppo.</p></div>`;
    corpo.querySelectorAll("[data-siedi]").forEach((b) => b.onclick = async () => {
      const { error } = await sb.rpc("briscola_siedi", { p_partita: id, p_posto: Number(b.dataset.siedi) }); if (error) alert(error.message); carica();
    });
    const avvia = async (tv) => {
      const { error } = await sb.rpc("calcio_avvia", { p_partita: id, p_host: mioId + (tv ? ":tv" : "") });
      if (error) alert(error.message); else carica();
    };
    corpo.querySelector("#via")?.addEventListener("click", () => avvia(false));
    corpo.querySelector("#tv")?.addEventListener("click", () => avvia(true));
    if (corpo.querySelector("#invita")) corpo.querySelector("#invita").onclick = async (e) => { const { data: n } = await sb.rpc("sala_invita", { p_partita: id }); e.target.textContent = n ? `🔔 Invitati ${n} sul telefono` : "🔔 Già invitati (si può rifare tra 10 minuti)"; e.target.disabled = true; };
    corpo.querySelector("#invita-wa").onclick = () => invitaAlGioco({ tipo: "partita", id, cerchiaId: riga.cerchia_id, torna: `#/calcio?id=${id}`, titolo: "Calciobalilla",
      testo: `⚽ Calciobalilla su Ancora ${riga.n === 4 ? "due contro due" : "uno contro uno"}: manchi tu!`, perche: "Ti aspettano al calciobalilla: un minuto e sei in campo." });
  }
  await carica();
  timer = setInterval(() => { if (!attivo || !location.hash.includes(id)) return clearInterval(timer); if (!document.hidden && riga?.stato === "attesa") carica(); }, 2500);
}

// --- il campo ---
function campo({ riga = null, solo = false, livello = 0.6 }) {
  const n = solo ? 2 : riga.n;
  const host = solo || (riga.pubblico?.host ?? "").split(":")[0] === mioId;
  const schermo = !solo && (riga.pubblico?.host ?? "").endsWith(":tv") && host;
  const io = solo ? 0 : schermo ? -1 : riga.posti.findIndex((x) => x.persona_id === state.io.id);
  const nomi = solo ? ["Tu", "Il telefono"] : riga.posti.map((x) => (x.persona_id === state.io.id ? "Tu" : x.nome ?? "il telefono"));
  const umano = solo ? [true, false] : riga.posti.map((x) => !!x.persona_id);
  const st = C.crea();
  const comandi = Array.from({ length: n }, () => ({ u: 0.5, calcio: false }));
  const memBot = Array.from({ length: n }, () => ({}));
  const visto = Array(n).fill(0);
  let attivo = true, raf = 0, canale = null, ultimoStato = Date.now(), golVisti = [0, 0], salvata = false;
  let prec = null, cur = null, curT = 0;
  const mia = io >= 0 ? C.squadraDel(n, io) : 0;

  $app().innerHTML = `
    <div id="sala" style="position:fixed;inset:0;background:#0E2622;color:#FBF3E2;display:flex;flex-direction:column;align-items:center;z-index:50;user-select:none">
      <div style="display:flex;align-items:center;gap:8px;width:100%;max-width:1100px;padding:8px 10px;box-sizing:border-box">
        <a href="#/calcio" class="icona" style="color:#FBF3E2" aria-label="Esci">${ICONE.indietro}</a>
        <div id="tab" style="flex:1;text-align:center;font-weight:800;font-size:22px"></div>
        <button class="icona" id="grande" style="color:#FBF3E2;font-size:20px" aria-label="Schermo intero">⛶</button></div>
      <div style="flex:1;min-height:0;width:100%;position:relative"><canvas id="cv" style="touch-action:none;display:block;position:absolute;inset:0;width:100%;height:100%"></canvas></div>
      <div id="sotto" style="width:100%;max-width:560px;padding:8px 12px 14px;box-sizing:border-box"></div>
      <div id="avviso" style="position:absolute;inset:0;display:none;place-items:center;pointer-events:none;font:800 64px Fraunces,serif;color:#E8B56B;text-shadow:0 4px 20px rgba(0,0,0,.6)"></div>
    </div>`;
  const barra = document.getElementById("barra"); if (barra) barra.hidden = true;   // niente barra in basso: servono i pollici (il router la rimette uscendo)
  const cv = document.getElementById("cv"), ctx = cv.getContext("2d");
  document.getElementById("grande").onclick = () => { const el = document.getElementById("sala"); (el.requestFullscreen ?? el.webkitRequestFullscreen)?.call(el); };
  const sotto = document.getElementById("sotto");
  // due pollici: a sinistra difesa e portiere, a destra centro e attacco. Si trascina per muovere, si tocca (o si spinge in su) per tirare.
  const duo = io >= 0 && n === 2;
  const pad = (g, ic, tit) => `<div class="pad-calcio" data-g="${g}" style="flex:1;height:118px;border-radius:18px;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.18);display:grid;place-items:center;text-align:center;touch-action:none;user-select:none;-webkit-user-select:none">
    <div><div style="font-size:26px">${ic}</div><b style="font-size:15px">${tit}</b><div style="font-size:12px;opacity:.7">trascina ↔ · tocca = tiro</div></div></div>`;
  sotto.innerHTML = io >= 0 ? `<div style="display:flex;gap:10px">${duo ? pad(1, "🛡️", "Difesa") + pad(2, "⚽", "Attacco") : pad(1, "⚽", ruolo(n, io))}</div>
    <p style="text-align:center;font-size:12px;opacity:.7;margin:6px 0 0">${nomeSquadra(n, io)}${duo ? " · un pollice per parte" : ""}</p>`
    : `<p style="text-align:center;opacity:.8;margin:0">📺 Campo grande · si gioca con i telefoni</p>`;

  // --- disegno ---
  let k = 1, vert = false, ox = 0, oy = 0, cw = 0, chh = 0;
  const giraSquadra = mia === 1;
  function misura() {
    const dpr = devicePixelRatio || 1, r = cv.getBoundingClientRect();
    cw = r.width; chh = r.height; cv.width = cw * dpr; cv.height = chh * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    vert = cw < chh;
    const lw = vert ? C.H : C.W, lh = vert ? C.W : C.H, bordo = 40;
    k = Math.min(cw / (lw + bordo * 2), chh / (lh + bordo * 2));
    ox = (cw - lw * k) / 2; oy = (chh - lh * k) / 2;
  }
  const map = (x, y) => {
    if (giraSquadra) { x = C.W - x; y = C.H - y; }
    return vert ? [ox + y * k, oy + (C.W - x) * k] : [ox + x * k, oy + y * k];
  };
  addEventListener("resize", misura); document.addEventListener("fullscreenchange", () => setTimeout(misura, 120));
  setTimeout(misura, 0);

  function disegna(s) {
    ctx.clearRect(0, 0, cw, chh);
    const [ax, ay] = map(0, 0), [bx, by] = map(C.W, C.H);
    const x0 = Math.min(ax, bx), y0 = Math.min(ay, by), w = Math.abs(bx - ax), h = Math.abs(by - ay);
    ctx.fillStyle = "#3A2414"; ctx.beginPath(); ctx.roundRect(x0 - 18 * k, y0 - 18 * k, w + 36 * k, h + 36 * k, 18 * k); ctx.fill();
    ctx.fillStyle = "#2E8B4F"; ctx.fillRect(x0, y0, w, h);
    for (let i = 0; i < 10; i++) { ctx.fillStyle = i % 2 ? "rgba(255,255,255,.035)" : "rgba(0,0,0,.035)"; const [p1x, p1y] = map(i * 100, 0), [p2x, p2y] = map(i * 100 + 100, C.H); ctx.fillRect(Math.min(p1x, p2x), Math.min(p1y, p2y), Math.abs(p2x - p1x), Math.abs(p2y - p1y)); }
    ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 2;
    ctx.strokeRect(x0, y0, w, h); const [m1x, m1y] = map(C.W / 2, 0), [m2x, m2y] = map(C.W / 2, C.H); ctx.beginPath(); ctx.moveTo(m1x, m1y); ctx.lineTo(m2x, m2y); ctx.stroke();
    const [cx, cy] = map(C.W / 2, C.H / 2); ctx.beginPath(); ctx.arc(cx, cy, 70 * k, 0, 7); ctx.stroke();
    for (const [gx, col] of [[0, "#2D6CDF"], [C.W, "#D2302C"]]) {
      const [p1x, p1y] = map(gx, C.PORTA.da), [p2x, p2y] = map(gx + (gx ? 22 : -22), C.PORTA.a);
      ctx.fillStyle = col; ctx.fillRect(Math.min(p1x, p2x), Math.min(p1y, p2y), Math.abs(p2x - p1x), Math.abs(p2y - p1y));
    }
    // stecche e omini
    s.stecche.forEach((r, i) => {
      const [s1x, s1y] = map(r.x, -14), [s2x, s2y] = map(r.x, C.H + 14);
      const mie = io >= 0 && C.steccheDelPosto(n, io).includes(i);
      ctx.strokeStyle = mie ? "#F3E2B8" : "#B9BCC2"; ctx.lineWidth = (mie ? 7 : 5) * k + 1; ctx.beginPath(); ctx.moveTo(s1x, s1y); ctx.lineTo(s2x, s2y); ctx.stroke();
      for (const y of C.omini(r)) {
        const dir = (r.squadra === 0 ? 1 : -1) * (r.calcio > 0 ? 1 : 0);
        const [px, py] = map(r.x + dir * 12, y);
        ctx.fillStyle = r.squadra === 0 ? "#2D6CDF" : "#D2302C";
        ctx.beginPath(); ctx.ellipse(px, py, (vert ? C.RO : C.RO * 0.75) * k, (vert ? C.RO * 0.75 : C.RO) * k, 0, 0, 7); ctx.fill();
        ctx.fillStyle = "#F2D3B1"; ctx.beginPath(); ctx.arc(px, py, C.RO * 0.42 * k, 0, 7); ctx.fill();
      }
    });
    const [px, py] = map(s.palla.x, s.palla.y);
    ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.arc(px + 2, py + 3, C.RP * k, 0, 7); ctx.fill();
    ctx.fillStyle = "#FFFDF6"; ctx.beginPath(); ctx.arc(px, py, C.RP * k + 1, 0, 7); ctx.fill();
    document.getElementById("tab").innerHTML = `<span style="color:#7FA8F5">${esc(squadra(0))}</span> ${s.gol[0]} – ${s.gol[1]} <span style="color:#F08A84">${esc(squadra(1))}</span>`;
  }
  const squadra = (sq) => { const chi = nomi.filter((_, p) => C.squadraDel(n, p) === sq); return chi.length ? chi.join(" e ") : sq ? "Rossi" : "Blu"; };

  function avviso(testo, ms = 1300) {
    const a = document.getElementById("avviso"); if (!a) return;
    a.textContent = testo; a.style.display = "grid"; clearTimeout(avviso.t); avviso.t = setTimeout(() => { a.style.display = "none"; }, ms);
  }
  function controllaGol(s) {
    if (s.gol[0] !== golVisti[0] || s.gol[1] !== golVisti[1]) {
      const chi = s.gol[0] > golVisti[0] ? 0 : 1; golVisti = [...s.gol];
      avviso(io >= 0 && C.squadraDel(n, io) !== chi ? "Gol subito 😬" : "GOOOL!"); try { navigator.vibrate?.(180); } catch { /* niente */ }
    }
  }
  function finale(s) {
    const vinto = io >= 0 ? C.squadraDel(n, io) === s.fine : null;
    sotto.innerHTML = `<div style="text-align:center"><div style="font-size:40px">${vinto === false ? "⚽" : "🏆"}</div>
      <b style="font-size:20px">Vincono ${esc(squadra(s.fine))} ${s.gol[s.fine]} a ${s.gol[1 - s.fine]}</b>
      <button class="btn ambra" id="ancora" style="margin-top:10px">Rivincita</button></div>${invitoPiu().replace("margin:12px 16px", "margin:10px 0 0")}`;
    sotto.querySelector("#ancora").onclick = async () => {
      if (solo) { location.reload(); return; }
      const { data, error } = await sb.rpc("sala_crea", { p_cerchia: riga.cerchia_id, p_gioco: "calcio", p_n: n });
      if (error) alert(error.message); else location.hash = `#/calcio?id=${data}`;
    };
  }

  // --- comandi di questo telefono ---
  let ultimoInvio = 0, daInviare = false;
  const mio = { u: 0.5, u2: 0.5, calcio: false, calcio2: false };
  const calcia = (g = 0) => { if (g !== 2) mio.calcio = true; if (g !== 1 && (duo || g === 0)) mio.calcio2 = duo; invia(true); };
  function invia(subito = false) {
    if (host || io < 0) return;
    daInviare = true;
    const ora = Date.now(); if (!subito && ora - ultimoInvio < 90) return;
    ultimoInvio = ora; daInviare = false;
    canale?.send({ type: "broadcast", event: "in", payload: { s: io, u: +mio.u.toFixed(3), k: mio.calcio ? 1 : 0, ...(duo ? { u2: +mio.u2.toFixed(3), k2: mio.calcio2 ? 1 : 0 } : {}) } });
    mio.calcio = false; mio.calcio2 = false;
  }
  if (io >= 0) {
    const tocchi = new Map();   // pointerId → { g, x, y, t, ux, uy }
    sotto.querySelectorAll(".pad-calcio").forEach((el) => {
      const g = Number(el.dataset.g);
      el.onpointerdown = (e) => { e.preventDefault(); el.setPointerCapture(e.pointerId); tocchi.set(e.pointerId, { g, x: e.clientX, y: e.clientY, t: Date.now(), ux: e.clientX, uy: e.clientY, w: el.clientWidth, h: el.clientHeight }); el.style.background = "rgba(255,255,255,.16)"; };
      el.onpointermove = (e) => {
        const t = tocchi.get(e.pointerId); if (!t) return;
        const d = vert ? (e.clientX - t.ux) / t.w : (e.clientY - t.uy) / t.h;   // tutto il pad = un po' più di tutta la corsa della stecca
        t.ux = e.clientX; t.uy = e.clientY;
        if (g === 2) mio.u2 = Math.min(1, Math.max(0, mio.u2 + d * 1.25)); else mio.u = Math.min(1, Math.max(0, mio.u + d * 1.25));
        invia();
      };
      const su = (e) => {
        const t = tocchi.get(e.pointerId); if (!t) return; tocchi.delete(e.pointerId); el.style.background = "rgba(255,255,255,.08)";
        const dt = Date.now() - t.t, dx = e.clientX - t.x, dy = e.clientY - t.y;
        if ((dt < 230 && Math.hypot(dx, dy) < 16) || (dt < 300 && -dy > 28 && Math.abs(dy) > Math.abs(dx))) {   // tocco o spinta in su = tiro
          calcia(g === 2 ? 2 : duo ? 1 : 0); el.style.borderColor = "#E8B56B"; setTimeout(() => { el.style.borderColor = "rgba(255,255,255,.18)"; }, 160);
          try { navigator.vibrate?.(20); } catch { /* niente */ }
        }
      };
      el.onpointerup = su; el.onpointercancel = su;
    });
    onkeydown = (e) => {
      if (!document.getElementById("cv")) return;
      if (e.key === " ") { calcia(0); e.preventDefault(); }
      const passo = 0.06;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") { mio.u = Math.min(1, mio.u + passo); mio.u2 = Math.min(1, mio.u2 + passo); invia(); }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") { mio.u = Math.max(0, mio.u - passo); mio.u2 = Math.max(0, mio.u2 - passo); invia(); }
    };
  }

  // --- la rete ---
  if (!solo) {
    canale = sb.channel(`calcio-${riga.id}`, { config: { broadcast: { self: false } } });
    if (host) canale.on("broadcast", { event: "in" }, ({ payload: p }) => {
      if (p.s < 0 || p.s >= n) return;
      comandi[p.s].u = p.u; if (p.k) comandi[p.s].calcio = true;
      if (p.u2 !== undefined) { comandi[p.s].u2 = p.u2; if (p.k2) comandi[p.s].calcio2 = true; }
      visto[p.s] = Date.now();
    });
    else canale.on("broadcast", { event: "st" }, ({ payload }) => { prec = cur; cur = payload; curT = performance.now(); ultimoStato = Date.now(); });
    canale.subscribe();
  }

  // --- il ciclo ---
  const avvio = Date.now(); let ultimo = performance.now(), acc = 0, ultimoBroadcast = 0;
  function giroHost(ora) {
    acc += Math.min(0.1, (ora - ultimo) / 1000); ultimo = ora;
    while (acc >= 1 / 120) {
      for (let p = 0; p < n; p++) {
        const assente = !umano[p] || (p !== io && !solo && Date.now() - Math.max(visto[p], avvio) > 8000);
        if (p === io) {
          comandi[p].u = mio.u; if (mio.calcio) { comandi[p].calcio = true; mio.calcio = false; }
          if (duo) { comandi[p].u2 = mio.u2; if (mio.calcio2) { comandi[p].calcio2 = true; mio.calcio2 = false; } }
        }
        else if (assente) Object.assign(comandi[p], C.bot(st, n, p, solo ? livello : 0.55, memBot[p], 1 / 120), { u2: undefined });
      }
      C.passo(st, n, comandi, 1 / 120);
      for (const c of comandi) { c.calcio = false; c.calcio2 = false; }
      acc -= 1 / 120;
    }
    if (!solo && ora - ultimoBroadcast > 80) { ultimoBroadcast = ora; canale?.send({ type: "broadcast", event: "st", payload: C.compatto(st) }); }
    disegna(st); controllaGol(st);
    if (st.fine !== null && !salvata) {
      salvata = true; finale(st);
      if (!solo) { canale?.send({ type: "broadcast", event: "st", payload: C.compatto(st) }); sb.rpc("calcio_fine", { p_partita: riga.id, p_gol: st.gol }); }
    }
  }
  const vista = C.crea();
  function giroOspite(ora) {
    if (daInviare) invia();
    if (cur) {
      if (prec) {
        const t = Math.min(1, (ora - curT) / 80);
        C.applica(vista, cur);
        vista.palla.x = prec.b[0] + (cur.b[0] - prec.b[0]) * t; vista.palla.y = prec.b[1] + (cur.b[1] - prec.b[1]) * t;
        vista.stecche.forEach((s, i) => { s.off = prec.o[i] + (cur.o[i] - prec.o[i]) * t; });
      } else C.applica(vista, cur);
      // la mia stecca la vedo subito dove ho il dito (niente ritardo)
      if (io >= 0) for (const i of C.steccheDelPosto(n, io)) {
        const s = vista.stecche[i], mu = duo && (s.ruolo === "centro" || s.ruolo === "attacco") ? mio.u2 : mio.u;
        const u = C.squadraDel(n, io) === 1 ? 1 - mu : mu; s.off = s.min + (s.max - s.min) * u;
      }
      disegna(vista); controllaGol(vista);
      if (vista.fine !== null && !salvata) { salvata = true; finale(vista); }
    } else disegna(vista);
    if (Date.now() - ultimoStato > 5000 && vista.fine === null) {
      const creatore = riga.creato_da === state.io.id;
      if (!document.getElementById("riprendi")) sotto.insertAdjacentHTML("afterbegin", `<div id="riprendi" style="text-align:center;margin-bottom:8px"><b>Il campo non risponde…</b>
        ${creatore ? `<button class="btn chiaro" id="qui" style="margin-top:6px">Riprendi su questo telefono</button>` : `<div style="opacity:.8;font-size:14px">Aspetta chi ha avviato la partita.</div>`}</div>`);
      document.getElementById("qui")?.addEventListener("click", async () => { await sb.rpc("calcio_avvia", { p_partita: riga.id, p_host: mioId }); location.reload(); });
    } else document.getElementById("riprendi")?.remove();
  }
  function giro(ora) { if (!attivo || !document.getElementById("cv")) return chiudi(); (host ? giroHost : giroOspite)(ora); raf = requestAnimationFrame(giro); }
  function chiudi() { attivo = false; cancelAnimationFrame(raf); if (canale) sb.removeChannel(canale); onkeydown = null; }
  ferma = chiudi;
  if (!solo && riga.stato === "finita") { const fin = C.crea(); fin.gol = riga.pubblico?.gol ?? [0, 0]; fin.fine = fin.gol[0] > fin.gol[1] ? 0 : 1; setTimeout(() => { disegna(fin); finale(fin); }, 50); salvata = true; return; }
  raf = requestAnimationFrame(giro);
}
