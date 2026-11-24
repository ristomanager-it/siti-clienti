// Il biliardo (palla 8): #/biliardo?c=<gruppo>  ·  #/biliardo?id=<partita>  ·  #/biliardo?solo=1&l=<bravura>
// Contro il telefono si gioca su questo telefono. Con la famiglia: chi tira calcola il tiro, gli altri lo vedono uguale (stesso motore).
import { sb, state, $app, esc, ICONE, invitaAlGioco, invitoPiu } from "../app.js";
import { voceAlTavolo } from "../giochi/voce.js";
import * as M from "../giochi/biliardo-motore.js";

const COLORI = { 1: "#F2C230", 2: "#1F4FA8", 3: "#D2302C", 4: "#5B2C83", 5: "#E8772E", 6: "#1E7A46", 7: "#7A1F2B", 8: "#111" };
const colore = (n) => COLORI[n > 8 ? n - 8 : n] ?? "#fff";
const B = 46;   // bordo di legno (unità del tavolo)
let timer = null, raf = null;

export default async function ({ params } = {}) {
  clearInterval(timer); cancelAnimationFrame(raf);
  if (params?.solo) return partita({ solo: true, livello: Number(params.l ?? 0.6) });
  if (params?.id) return partita({ id: params.id });
  const gruppo = (params?.c && state.cerchie.find((c) => c.id === params.c)) ?? state.cerchie.find((c) => c.tipo === "famiglia") ?? state.cerchie[0];
  const { data: aperti } = gruppo ? await sb.from("partite").select("id, posti, stato, creata_il").eq("cerchia_id", gruppo.id).eq("gioco", "biliardo")
    .neq("stato", "finita").gte("creata_il", new Date(Date.now() - 864e5).toISOString()).order("creata_il", { ascending: false }) : { data: [] };
  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/giochi${gruppo ? `?c=${gruppo.id}` : ""}" aria-label="Indietro">${ICONE.indietro}</a><b>🎱 Biliardo</b><span style="width:44px"></span></header>
    <div class="pad" style="padding-bottom:120px">
      <p class="tenue" style="margin-top:0">Palla 8: uno prende le piene, l'altro le spezzate, vince chi alla fine manda in buca la nera.</p>
      <div class="card" style="margin:0 0 14px"><b style="font-size:18px">📱 Contro il telefono</b>
        <p class="tenue" style="margin:4px 0 10px">Per allenarsi, anche senza connessione.</p>
        <div style="display:flex;gap:8px"><a class="btn chiaro" style="margin:0" href="#/biliardo?solo=1&l=0.35">Facile</a><a class="btn ambra" style="margin:0" href="#/biliardo?solo=1&l=0.85">Bravo</a></div></div>
      ${gruppo ? `
      <div class="card" style="margin:0 0 14px"><b style="font-size:18px">👥 Con ${esc(gruppo.nome)}</b>
        <p class="tenue" style="margin:4px 0 10px">Uno contro uno, anche da case diverse: all'altro arriva l'invito sul telefono.</p>
        <button class="btn ambra" id="nuova" style="margin:0">Nuova partita a 2</button></div>
      ${(aperti ?? []).map((p) => `<a href="#/biliardo?id=${p.id}" class="card" style="display:block;margin:0 0 10px;text-decoration:none;color:inherit">
        <b>${p.stato === "in_corso" ? "In corso" : "Si cerca un avversario"}</b><div class="tenue">${p.posti.map((x) => esc(x.nome ?? "posto libero")).join(" contro ")}</div></a>`).join("")}` : ""}
    </div>`;
  document.getElementById("nuova")?.addEventListener("click", async (e) => {
    e.target.disabled = true;
    const { data, error } = await sb.rpc("sala_crea", { p_cerchia: gruppo.id, p_gioco: "biliardo", p_n: 2 });
    if (error) { alert(error.message); e.target.disabled = false; return; }
    location.hash = `#/biliardo?id=${data}`;
  });
}

async function partita({ id = null, solo = false, livello = 0.6 }) {
  let riga = null, tavolo = null, seq = 0, io = 0, nomi = ["Tu", "Il telefono"], veri = ["Tu", "il telefono"];   // nomi: per le schede · veri: per i messaggi
  let mira = { ax: 1, ay: 0 }, forza = 0.6, anim = null, invio = false, mostraMsg = "";

  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/biliardo" aria-label="Indietro">${ICONE.indietro}</a><b style="flex:1">🎱 Biliardo</b>
      <button class="icona" id="grande" aria-label="Schermo intero" style="font-size:20px">⛶</button></header>
    <div id="corpo"></div>`;
  const corpo = document.getElementById("corpo");
  document.getElementById("grande").onclick = () => { const el = document.getElementById("sala"); (el?.requestFullscreen ?? el?.webkitRequestFullscreen)?.call(el); };


  async function carica() {
    const { data } = await sb.from("partite").select("*").eq("id", id).maybeSingle();
    if (!data) { corpo.innerHTML = `<p class="pad">Partita non trovata.</p>`; return; }
    riga = data;
    veri = data.posti.map((p, i) => p.nome ?? `Giocatore ${i + 1}`);
    nomi = data.posti.map((p, i) => (p.persona_id === state.io.id ? "Tu" : veri[i]));
    io = data.posti.findIndex((p) => p.persona_id === state.io.id);
    if (data.stato === "attesa") { attesa(); return; }
    if (!tavolo) { tavolo = data.tavolo; seq = data.seq; mostraMsg = tavolo.msg; disegnaSala(); return; }
    if (data.seq > seq && !anim && !invio) {
      const nuovo = data.tavolo; seq = data.seq;
      if (nuovo.tiro && nuovo.tiro.chi !== io) {
        tavolo.palle = nuovo.tiro.da; mostraMsg = `${veri[nuovo.tiro.chi]} tira…`; aggiornaTesti();
        anima(nuovo.tiro.da, nuovo.tiro.vx, nuovo.tiro.vy, () => { tavolo = nuovo; mostraMsg = nuovo.msg; aggiornaTesti(); fine(); });
      } else { tavolo = nuovo; mostraMsg = nuovo.msg; aggiornaTesti(); fine(); }
    }
  }
  function attesa() {
    const creatore = riga.creato_da === state.io.id;
    corpo.innerHTML = `
      <div class="pad" style="text-align:center"><div style="font-size:48px">🎱</div><h1 style="margin:4px 0">Biliardo a 2</h1><p class="tenue" style="margin:0">Palla 8, uno contro uno.</p></div>
      ${riga.posti.map((x, i) => `<div class="card" style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <b style="flex:1">${x.persona_id ? esc(x.nome) : `<span class="tenue">posto libero</span>`}</b>
        ${!x.persona_id ? `<button class="chip" data-siedi="${i}" style="margin:0">Siediti qui</button>` : x.persona_id === state.io.id ? `<span class="tenue">sei tu</span>` : ""}</div>`).join("")}
      <div class="pad">
        ${creatore ? `<button class="btn ambra" id="inizia">Si gioca</button>` : `<p class="tenue" style="text-align:center">${io >= 0 ? "Sei seduto: si parte quando lo decide chi ha aperto il tavolo." : "Siediti al posto libero."}</p>`}
        ${state.cerchie.some((c) => c.id === riga.cerchia_id) ? `<button class="btn chiaro" id="invita" style="margin-top:10px">🔔 Avvisa tutto il gruppo «${esc(state.cerchie.find((c) => c.id === riga.cerchia_id)?.nome ?? "")}»</button>` : ""}
        <button class="btn chiaro" id="invita-wa" style="margin-top:10px">📲 Invita un amico su WhatsApp</button>
        <p class="tenue" style="font-size:13px;text-align:center;margin:4px 0 0">L'amico entra solo a questo tavolo: non vede la famiglia né il gruppo.</p></div>`;
    corpo.querySelectorAll("[data-siedi]").forEach((b) => b.onclick = async () => {
      const { error } = await sb.rpc("briscola_siedi", { p_partita: id, p_posto: Number(b.dataset.siedi) }); if (error) alert(error.message); carica();
    });
    corpo.querySelector("#inizia")?.addEventListener("click", async (e) => {
      e.target.disabled = true;
      const { error } = await sb.rpc("biliardo_inizia", { p_partita: id, p_tavolo: M.nuovoTavolo() });
      if (error) { alert(error.message); e.target.disabled = false; } carica();
    });
    if (corpo.querySelector("#invita")) corpo.querySelector("#invita").onclick = async (e) => { const { data: n } = await sb.rpc("sala_invita", { p_partita: id }); e.target.textContent = n ? `🔔 Invitati ${n} sul telefono` : "🔔 Già invitati (si può rifare tra 10 minuti)"; e.target.disabled = true; };
    corpo.querySelector("#invita-wa").onclick = () => invitaAlGioco({ tipo: "partita", id, cerchiaId: riga.cerchia_id, torna: `#/biliardo?id=${id}`, titolo: "Biliardo",
      testo: "🎱 Ti sfido a biliardo su Ancora: palla 8, uno contro uno.", perche: "Ti hanno sfidato a biliardo: un minuto e prendi la stecca." });
  }

  // --- il tavolo ---
  let cv, ctx, k = 1, verticale = false;
  const map = (x, y) => (verticale ? [(y + B) * k, (x + B) * k] : [(x + B) * k, (y + B) * k]);
  const inv = (sx, sy) => (verticale ? [sy / k - B, sx / k - B] : [sx / k - B, sy / k - B]);
  const tocca = () => tavolo && !("vincitore" in tavolo) && !anim && !invio && (solo ? tavolo.turno === 0 : tavolo.turno === io);

  function disegnaSala() {
    // tutto in una schermata, senza scorrere e senza la barra in basso: tavolo al centro, comandi sotto a portata di pollice
    corpo.innerHTML = `
      <div id="sala" style="position:fixed;inset:0;z-index:50;background:#0E2622;color:#FBF3E2;display:flex;flex-direction:column;padding:calc(6px + env(safe-area-inset-top)) 8px calc(8px + env(safe-area-inset-bottom));box-sizing:border-box">
        <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
          <a href="#/biliardo" aria-label="Esci" style="color:#FBF3E2;font-size:24px;text-decoration:none;padding:0 6px">‹</a>
          <div id="gioc" style="display:flex;gap:6px;flex:1"></div>
          <button id="grande2" aria-label="Schermo intero" style="border:0;background:none;color:#FBF3E2;font-size:20px">⛶</button></div>
        <div id="area" style="flex:1;min-height:0;overflow:hidden;display:grid;place-items:center"><canvas id="tav" style="display:block;touch-action:none;border-radius:14px"></canvas></div>
        <p id="msg" style="text-align:center;min-height:20px;margin:6px 0 4px;font-weight:700;font-size:15px"></p>
        <div id="comandi" style="width:100%;max-width:560px;margin:0 auto;max-height:46vh;overflow:auto"></div>
      </div>`;
    document.getElementById("grande2").onclick = () => { const el = document.getElementById("sala"); (el?.requestFullscreen ?? el?.webkitRequestFullscreen)?.call(el); };
    const barra = document.getElementById("barra"); if (barra) barra.hidden = true;   // niente barra in basso durante la partita (il router la rimette uscendo)
    cv = document.getElementById("tav"); ctx = cv.getContext("2d");
    const misura = () => {
      const sala = document.getElementById("sala"); if (!sala) return;
      const area = document.getElementById("area"); const larg = Math.min(area.clientWidth, 1400), alt = area.clientHeight;
      verticale = innerWidth < innerHeight;
      const lw = verticale ? M.H + 2 * B : M.W + 2 * B, lh = verticale ? M.W + 2 * B : M.H + 2 * B;
      k = Math.min(larg / lw, alt / lh);
      const dpr = devicePixelRatio || 1;
      cv.width = lw * k * dpr; cv.height = lh * k * dpr; cv.style.width = `${lw * k}px`; cv.style.height = `${lh * k}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); disegna();
    };
    addEventListener("resize", misura); document.addEventListener("fullscreenchange", () => setTimeout(misura, 120));
    // il tavolo si adatta allo spazio che resta (anche quando cambiano i comandi sotto o la barra del browser)
    try { new ResizeObserver(() => misura()).observe(document.getElementById("area")); } catch { /* vecchi browser: basta resize */ }
    misura();
    // mira: si tocca il tavolo nel punto dove si vuole mandare la bianca. Con la palla in mano si trascina la bianca.
    let trascino = false;
    const punto = (e) => { const r = cv.getBoundingClientRect(); return inv(e.clientX - r.left, e.clientY - r.top); };
    cv.onpointerdown = (e) => {
      if (!tocca()) return; const [x, y] = punto(e); const b = bianca();
      if (tavolo.manoLibera && Math.hypot(x - b.x, y - b.y) < M.R * 3) { trascino = true; cv.setPointerCapture(e.pointerId); return; }
      mira = direzione(x, y); disegna(); cv.setPointerCapture(e.pointerId);
    };
    cv.onpointermove = (e) => {
      if (!tocca() || !(e.buttons || e.pointerType === "touch")) return; const [x, y] = punto(e);
      if (trascino) { if (M.posizioneValida(tavolo.palle, x, y)) { const b = bianca(); b.x = +x.toFixed(2); b.y = +y.toFixed(2); } disegna(); return; }
      mira = direzione(x, y); disegna();
    };
    cv.onpointerup = () => { trascino = false; };
    aggiornaTesti(); comandi(); fine();
  }
  const bianca = () => tavolo.palle.find((p) => p.n === 0);
  function direzione(x, y) { const b = bianca(); const dx = x - b.x, dy = y - b.y, d = Math.hypot(dx, dy); return d < 2 ? mira : { ax: dx / d, ay: dy / d }; }

  function comandi() {
    const c = document.getElementById("comandi"); if (!c) return;
    if ("vincitore" in tavolo) {
      c.innerHTML = `<div style="text-align:center"><div style="font-size:46px">${(solo ? tavolo.vincitore === 0 : tavolo.vincitore === io) ? "🏆" : "🎱"}</div>
        <button class="btn ambra" id="ancora">Rivincita</button><a class="btn chiaro" href="#/biliardo" style="margin-top:10px">Esci</a></div>${invitoPiu()}`;
      c.querySelector("#ancora").onclick = async () => {
        if (solo) { tavolo = M.nuovoTavolo(); mostraMsg = tavolo.msg; aggiornaTesti(); comandi(); disegna(); return; }
        const { data, error } = await sb.rpc("sala_crea", { p_cerchia: riga.cerchia_id, p_gioco: "biliardo", p_n: 2 });
        if (error) alert(error.message); else location.hash = `#/biliardo?id=${data}`;
      };
      return;
    }
    c.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px">
        <button class="chip" id="sx" style="margin:0;font-size:22px;padding:10px 14px;touch-action:manipulation">↺</button>
        <label style="flex:1;font-size:13px;line-height:1.1">Forza <b id="fv">${Math.round(forza * 100)}%</b>
          <input type="range" id="forza" min="5" max="100" value="${Math.round(forza * 100)}" style="width:100%;accent-color:#E8B56B;height:28px"></label>
        <button class="chip" id="dx" style="margin:0;font-size:22px;padding:10px 14px;touch-action:manipulation">↻</button>
        <button class="btn ambra" id="tira" style="margin:0;width:auto;padding:12px 18px;font-size:18px">Tira</button></div>
      <p style="text-align:center;font-size:12px;opacity:.7;margin:5px 0 0">Tocca il tavolo per mirare${tavolo.manoLibera ? " · palla in mano: trascina la bianca" : ""}</p>`;
    const giro = (a) => { const c2 = Math.cos(a), s2 = Math.sin(a); mira = { ax: mira.ax * c2 - mira.ay * s2, ay: mira.ax * s2 + mira.ay * c2 }; disegna(); };
    let ripeti;
    for (const [idb, a] of [["sx", -0.004], ["dx", 0.004]]) {
      const el = c.querySelector(`#${idb}`);
      el.onpointerdown = () => { giro(a); ripeti = setInterval(() => giro(a), 70); };
      el.onpointerup = el.onpointerleave = () => clearInterval(ripeti);
    }
    c.querySelector("#forza").oninput = (e) => { forza = e.target.value / 100; c.querySelector("#fv").textContent = `${e.target.value}%`; };
    c.querySelector("#tira").onclick = () => { if (tocca()) tira(mira.ax * M.MAX_V * forza, mira.ay * M.MAX_V * forza); };
    abilita();
  }
  function abilita() { const t = document.getElementById("tira"); if (t) { t.disabled = !tocca(); t.style.opacity = tocca() ? 1 : 0.45; } }

  function tira(vx, vy) {
    vx = +vx.toFixed(3); vy = +vy.toFixed(3);
    const da = tavolo.palle.map((p) => ({ ...p }));
    const prima = { ...tavolo, palle: da };
    mostraMsg = ""; aggiornaTesti();
    anima(da, vx, vy, async (sim) => {
      const nuovo = M.regole(prima, sim.eventi, sim.palle, veri);
      nuovo.tiro = { da, vx, vy, chi: solo ? 0 : io };
      if (solo) { delete nuovo.tiro; tavolo = nuovo; mostraMsg = nuovo.msg; aggiornaTesti(); fine(); return; }
      invio = true;
      const { data, error } = await sb.rpc("biliardo_tiro", { p_partita: id, p_seq: seq, p_tavolo: nuovo });
      invio = false;
      if (error) { alert(error.message); tavolo = null; carica(); return; }
      seq = data; tavolo = nuovo; mostraMsg = nuovo.msg; aggiornaTesti(); fine();
    });
  }
  function anima(palle, vx, vy, poi) {
    const sim = M.crea(palle, vx, vy);
    tavolo = { ...tavolo, palle: sim.palle }; anim = sim; abilita();
    const giro = () => {
      const va = sim.avanza(5); disegna();
      if (va) raf = requestAnimationFrame(giro);
      else { anim = null; poi(sim); }
    };
    raf = requestAnimationFrame(giro);
  }
  // dopo ogni tiro: tocca al telefono? è finita?
  function fine() {
    comandi(); disegna();
    if (solo && !("vincitore" in tavolo) && tavolo.turno === 1) {
      setTimeout(() => {
        const c = M.sceltaBot(tavolo, livello);
        if (c.bianca) { const b = bianca(); b.x = c.bianca.x; b.y = c.bianca.y; disegna(); }
        mira = { ax: c.vx, ay: c.vy }; const d = Math.hypot(c.vx, c.vy); mira = { ax: c.vx / d, ay: c.vy / d }; disegna();
        setTimeout(() => {
          const da = tavolo.palle.map((p) => ({ ...p })), prima = { ...tavolo, palle: da };
          anima(da, c.vx, c.vy, (sim) => { tavolo = M.regole(prima, sim.eventi, sim.palle, veri); mostraMsg = tavolo.msg; aggiornaTesti(); fine(); });
        }, 700);
      }, 600);
    }
  }
  function aggiornaTesti() {
    const g = document.getElementById("gioc"); if (!g || !tavolo) return;
    const quante = (gr) => tavolo.palle.filter((p) => !p.in && M.gruppoDi(p.n) === gr).length;
    g.innerHTML = [0, 1].map((i) => {
      const gr = tavolo.gruppi[i], turno = tavolo.turno === i && !("vincitore" in tavolo);
      return `<div style="flex:1;padding:8px 10px;border-radius:12px;background:${turno ? "#E8B56B" : "rgba(255,255,255,.08)"};color:${turno ? "#12302C" : "#FBF3E2"}">
        <b>${esc(nomi[i])}</b><div style="font-size:13px">${gr ? `${gr === "piene" ? "● piene" : "◐ spezzate"} · ${quante(gr) || "tocca alla nera"}` : "tavolo aperto"}</div></div>`;
    }).join("");
    const m = document.getElementById("msg"); if (m) m.textContent = mostraMsg || (tocca() ? "Tocca a te" : anim ? "" : `Tocca a ${veri[tavolo.turno]}`);
    abilita();
  }

  function disegna() {
    if (!ctx || !tavolo) return;
    const lw = cv.width / (devicePixelRatio || 1), lh = cv.height / (devicePixelRatio || 1);
    ctx.clearRect(0, 0, lw, lh);
    ctx.fillStyle = "#5A3418"; ctx.beginPath(); ctx.roundRect(0, 0, lw, lh, 16 * k); ctx.fill();
    const [x0, y0] = map(0, 0), [x1, y1] = map(M.W, M.H);
    ctx.fillStyle = "#1E6B45"; ctx.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
    // linea di testa e puntini
    ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(...map(M.TESTA.x, 0)); ctx.lineTo(...map(M.TESTA.x, M.H)); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.35)"; for (const s of [M.TESTA, M.PIEDE]) { const [sx, sy] = map(s.x, s.y); ctx.beginPath(); ctx.arc(sx, sy, 2.5, 0, 7); ctx.fill(); }
    for (const q of M.BUCHE) { const [sx, sy] = map(q.x, q.y); ctx.fillStyle = "#0B0B0B"; ctx.beginPath(); ctx.arc(sx, sy, (q.r - 4) * k, 0, 7); ctx.fill(); }
    // mira
    if (tocca()) {
      const b = bianca(); const p = traiettoria(b, mira);
      const [bx, by] = map(b.x, b.y), [ex, ey] = map(p.x, p.y);
      ctx.setLineDash([6, 6]); ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.beginPath(); ctx.arc(ex, ey, M.R * k, 0, 7); ctx.stroke();
      if (p.palla) { const t = p.palla; const nx = t.x - p.x, ny = t.y - p.y, d = Math.hypot(nx, ny) || 1;
        ctx.strokeStyle = "rgba(232,181,107,.9)"; ctx.beginPath(); ctx.moveTo(...map(t.x, t.y)); ctx.lineTo(...map(t.x + nx / d * 90, t.y + ny / d * 90)); ctx.stroke(); }
      // la stecca, tirata indietro quanto la forza
      const indietro = 24 + forza * 60, lung = 330;
      const [sx1, sy1] = map(b.x - mira.ax * indietro, b.y - mira.ay * indietro), [sx2, sy2] = map(b.x - mira.ax * (indietro + lung), b.y - mira.ay * (indietro + lung));
      ctx.lineCap = "round"; ctx.strokeStyle = "#E9D3A8"; ctx.lineWidth = 7 * k + 2; ctx.beginPath(); ctx.moveTo(sx1, sy1); ctx.lineTo(sx2, sy2); ctx.stroke();
      ctx.strokeStyle = "#3B2412"; ctx.lineWidth = 9 * k + 2; ctx.beginPath(); ctx.moveTo(...map(b.x - mira.ax * (indietro + lung * 0.7), b.y - mira.ay * (indietro + lung * 0.7))); ctx.lineTo(sx2, sy2); ctx.stroke(); ctx.lineCap = "butt";
    }
    for (const p of tavolo.palle) if (!p.in) palla(p);
  }
  function palla(p) {
    const [sx, sy] = map(p.x, p.y), r = M.R * k;
    ctx.save(); ctx.beginPath(); ctx.arc(sx, sy, r, 0, 7); ctx.clip();
    if (p.n === 0) ctx.fillStyle = "#FBF8F0";
    else if (p.n > 8) ctx.fillStyle = "#FBF8F0"; else ctx.fillStyle = colore(p.n);
    ctx.fillRect(sx - r, sy - r, 2 * r, 2 * r);
    if (p.n > 8) { ctx.fillStyle = colore(p.n); if (verticale) ctx.fillRect(sx - r * 0.55, sy - r, r * 1.1, 2 * r); else ctx.fillRect(sx - r, sy - r * 0.55, 2 * r, r * 1.1); }
    ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.arc(sx - r * 0.35, sy - r * 0.35, r * 0.35, 0, 7); ctx.fill();
    ctx.restore();
    if (p.n) {
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(sx, sy, r * 0.48, 0, 7); ctx.fill();
      ctx.fillStyle = "#111"; ctx.font = `800 ${Math.max(7, r * 0.62)}px Nunito, system-ui`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(p.n), sx, sy + 0.5);
    }
  }
  // dove arriva la bianca: prima palla incontrata o sponda
  function traiettoria(b, d) {
    let tMin = 2000, palla = null;
    for (const p of tavolo.palle) {
      if (p.in || p.n === 0) continue;
      const fx = p.x - b.x, fy = p.y - b.y, proj = fx * d.ax + fy * d.ay; if (proj <= 0) continue;
      const perp2 = fx * fx + fy * fy - proj * proj, r2 = 4 * M.R * M.R; if (perp2 > r2) continue;
      const t = proj - Math.sqrt(r2 - perp2); if (t < tMin) { tMin = t; palla = p; }
    }
    if (!palla) {
      const tx = d.ax > 0 ? (M.W - M.R - b.x) / d.ax : d.ax < 0 ? (M.R - b.x) / d.ax : 1e9;
      const ty = d.ay > 0 ? (M.H - M.R - b.y) / d.ay : d.ay < 0 ? (M.R - b.y) / d.ay : 1e9;
      tMin = Math.min(tx, ty);
    }
    return { x: b.x + d.ax * tMin, y: b.y + d.ay * tMin, palla };
  }

  if (solo) { tavolo = M.nuovoTavolo(); nomi = ["Tu", livello > 0.7 ? "Il telefono (bravo)" : "Il telefono"]; veri = [state.io?.soprannome || state.io?.nome || "Tu", "il telefono"]; mostraMsg = tavolo.msg; disegnaSala(); return; }
  voceAlTavolo(id, { alto: true });
  await carica();
  timer = setInterval(() => { if (!document.hidden && location.hash.includes(id)) carica(); else if (!location.hash.startsWith("#/biliardo")) clearInterval(timer); }, 1500);
}
