// Il motore del calciobalilla. La partita gira su un solo dispositivo (chi la avvia, o la TV); gli altri mandano le mosse e guardano.
// Squadra 0 difende la porta a sinistra (x=0), squadra 1 quella a destra (x=W).

export const W = 1000, H = 600, RP = 10, RO = 17;   // campo, raggio palla, raggio omino
export const PORTA = { da: 215, a: 385 };
export const GOL_VITTORIA = 5;
const ATTRITO = 110, SPONDA = 0.86, VMAX = 1500, CALCIO = 980, DUR_CALCIO = 0.16;

// le 8 stecche, da sinistra a destra: [x, squadra, omini, ruolo]
const STECCHE = [
  [55, 0, 1, "portiere"], [165, 0, 2, "difesa"], [270, 1, 3, "attacco"], [400, 0, 5, "centro"],
  [600, 1, 5, "centro"], [730, 0, 3, "attacco"], [835, 1, 2, "difesa"], [945, 1, 1, "portiere"],
];
const PASSO = { 1: 0, 2: 230, 3: 185, 5: 118 };

export function crea() {
  const stecche = STECCHE.map(([x, squadra, n, ruolo]) => {
    const passo = PASSO[n], mezzo = (n - 1) * passo / 2;
    let min = RO + 4 - (H / 2 - mezzo), max = H - RO - 4 - (H / 2 + mezzo);
    if (ruolo === "portiere") { min = -115; max = 115; }
    return { x, squadra, n, ruolo, passo, min, max, off: 0, prima: 0, calcio: 0 };
  });
  const st = { palla: { x: W / 2, y: H / 2, vx: 0, vy: 0 }, stecche, gol: [0, 0], pausa: 1.2, fermo: 0, fine: null, ultimoGol: null };
  servi(st, Math.random() < 0.5 ? 0 : 1);
  return st;
}
// dove mettere la stecca perché l'omino più adatto stia all'altezza y
export function offPerY(s, y) {
  let meglio = s.off, err = Infinity;
  for (let i = 0; i < s.n; i++) {
    const voluto = y - H / 2 - (i - (s.n - 1) / 2) * s.passo, o = Math.min(s.max, Math.max(s.min, voluto));
    const e = Math.abs(o - voluto) + Math.abs(o - s.off) * 0.02;
    if (e < err) { err = e; meglio = o; }
  }
  return meglio;
}
const omini = (s) => Array.from({ length: s.n }, (_, i) => H / 2 + s.off + (i - (s.n - 1) / 2) * s.passo);

function servi(st, versoSquadra) {
  // la palla parte dal centro, spinta piano verso chi ha appena preso gol
  st.palla = { x: W / 2, y: H / 2 + (Math.random() - 0.5) * 120, vx: versoSquadra === 0 ? -160 : 160, vy: (Math.random() - 0.5) * 220 };
  st.fermo = 0;
}

// chi comanda cosa: con 2 giocatori ognuno tutte le stecche della sua squadra; con 4 uno difesa+portiere e uno centro+attacco
export function steccheDelPosto(n, posto) {
  const squadra = n === 4 ? (posto < 2 ? 0 : 1) : posto;
  const reparto = n === 4 ? (posto % 2 === 0 ? ["portiere", "difesa"] : ["centro", "attacco"]) : null;
  return STECCHE.map((s, i) => (s[1] === squadra && (!reparto || reparto.includes(s[3])) ? i : -1)).filter((i) => i >= 0);
}
export const squadraDel = (n, posto) => (n === 4 ? (posto < 2 ? 0 : 1) : posto);

// un passo di gioco. comandi: [{ u: 0..1, calcio: bool }, …] per posto
export function passo(st, n, comandi, dt) {
  if (st.fine !== null) return;
  for (let p = 0; p < n; p++) {
    const c = comandi[p]; if (!c) continue;
    for (const i of steccheDelPosto(n, p)) {
      const s = st.stecche[i];
      // con due pollici: u/calcio per portiere e difesa, u2/calcio2 per centro e attacco (se non ci sono, tutto con u)
      const avanti = (s.ruolo === "centro" || s.ruolo === "attacco") && c.u2 !== undefined;
      const uu = avanti ? c.u2 : c.u, kk = avanti ? c.calcio2 : c.calcio;
      if (c.y !== undefined && c.y !== null) {
        // si punta un'altezza del campo: ogni stecca porta lì il suo omino più adatto (veloce ma non a scatti)
        const voluto = offPerY(s, c.y), max = 2600 * dt;
        s.off += Math.max(-max, Math.min(max, voluto - s.off));
      } else {
        const u = squadraDel(n, p) === 1 ? 1 - uu : uu;      // ognuno vede la sua porta in basso: la squadra 1 ha la mano rovesciata
        s.off = s.min + (s.max - s.min) * Math.min(1, Math.max(0, u));
      }
      if (kk && s.calcio <= 0) s.calcio = DUR_CALCIO;
    }
  }
  if (st.pausa > 0) { st.pausa -= dt; for (const s of st.stecche) { s.prima = s.off; s.calcio = Math.max(0, s.calcio - dt); } return; }

  const b = st.palla;
  const v = Math.hypot(b.vx, b.vy);
  if (v > 0) { const nv = Math.max(0, v - ATTRITO * dt); b.vx *= nv / v; b.vy *= nv / v; }
  b.x += b.vx * dt; b.y += b.vy * dt;

  // sponde lunghe
  if (b.y < RP) { b.y = RP; b.vy = Math.abs(b.vy) * SPONDA; }
  if (b.y > H - RP) { b.y = H - RP; b.vy = -Math.abs(b.vy) * SPONDA; }
  // porte e sponde corte
  const inPorta = b.y > PORTA.da && b.y < PORTA.a;
  if (b.x < RP && !inPorta) { b.x = RP; b.vx = Math.abs(b.vx) * SPONDA; }
  if (b.x > W - RP && !inPorta) { b.x = W - RP; b.vx = -Math.abs(b.vx) * SPONDA; }
  if (b.x < -RP || b.x > W + RP) {
    const segna = b.x < 0 ? 1 : 0;
    st.gol[segna]++; st.ultimoGol = segna;
    if (st.gol[segna] >= GOL_VITTORIA) { st.fine = segna; return; }
    st.pausa = 1.6; servi(st, 1 - segna); return;
  }

  // gli omini
  for (const s of st.stecche) {
    const vy = (s.off - s.prima) / dt;
    const dir = s.squadra === 0 ? 1 : -1;
    if (b.vx * dir > 350) continue;   // il tiro dei tuoi passa sotto gli omini della tua squadra (alzano le gambe)
    for (const y of omini(s)) {
      const dx = b.x - s.x, dy = b.y - y, d = Math.hypot(dx, dy);
      if (d >= RP + RO || d === 0) continue;
      const nx = dx / d, ny = dy / d;
      b.x = s.x + nx * (RP + RO); b.y = y + ny * (RP + RO);
      if (s.calcio > 0) {
        // il tiro: forte verso la porta avversaria, angolato da dove si colpisce e da come si muove la stecca
        b.vx = dir * CALCIO * (0.85 + Math.random() * 0.25);
        b.vy = ny * 320 + vy * 0.35;
      } else {
        const rvx = b.vx, rvy = b.vy - vy, rel = rvx * nx + rvy * ny;
        if (rel < 0) { b.vx -= 1.55 * rel * nx; b.vy -= 1.55 * rel * ny; }
        b.vy += vy * 0.25;
        if (Math.abs(b.vx) < 25) b.vx += dir * 40;       // non resta incastrata sotto l'omino
      }
    }
  }
  const nv = Math.hypot(b.vx, b.vy); if (nv > VMAX) { b.vx *= VMAX / nv; b.vy *= VMAX / nv; }
  for (const s of st.stecche) { s.prima = s.off; s.calcio = Math.max(0, s.calcio - dt); }

  // palla ferma dove nessuno arriva: si rimette al centro
  st.fermo = nv < 20 ? st.fermo + dt : 0;
  if (st.fermo > 2.5) servi(st, Math.random() < 0.5 ? 0 : 1);
}

// il telefono che gioca: porta l'omino più vicino davanti alla palla e tira quando ce l'ha sotto
export function bot(st, n, posto, livello = 0.6, mem = {}, dt = 1 / 120) {
  // reagisce un po' in ritardo e con un piccolo errore, come una persona (meno se è bravo)
  mem.t = (mem.t ?? 0) - dt;
  if (mem.t <= 0 || !mem.vista) {
    mem.t = 0.22 - livello * 0.14;
    mem.vista = { x: st.palla.x, y: st.palla.y, vx: st.palla.vx, vy: st.palla.vy };
    mem.errore = (Math.random() - 0.5) * (1 - livello) * 70;
  }
  const b = mem.vista, sq = squadraDel(n, posto), mie = steccheDelPosto(n, posto).map((i) => st.stecche[i]);
  const dir = sq === 0 ? 1 : -1;
  // la stecca che conta: la più vicina alla palla tra quelle che la palla deve ancora superare (verso la mia porta)
  const davanti = mie.filter((s) => (s.x - b.x) * dir < 25).sort((a, c) => Math.abs(a.x - b.x) - Math.abs(c.x - b.x));
  const s = davanti[0] ?? mie.slice().sort((a, c) => Math.abs(a.x - b.x) - Math.abs(c.x - b.x))[0];
  const anticipo = Math.min(0.35, Math.abs(s.x - b.x) / (Math.abs(b.vx) + 200));
  const yy = Math.min(H - RP, Math.max(RP, b.y + b.vy * anticipo * livello + mem.errore));
  // l'omino più vicino a quella y decide di quanto spostare la stecca
  const ys = omini(s); let best = ys[0]; for (const y of ys) if (Math.abs(y - yy) < Math.abs(best - yy)) best = y;
  const voluto = Math.min(s.max, Math.max(s.min, s.off + (yy - best)));
  let u = (voluto - s.min) / (s.max - s.min || 1);
  if (sq === 1) u = 1 - u;
  const prima = mem.u ?? 0.5, vel = (0.7 + livello * 1.5) * dt;
  u = prima + Math.max(-vel, Math.min(vel, u - prima)); mem.u = u;
  const vera = st.palla, vicina = Math.abs(vera.x - s.x) < RO + RP + 10 && Math.abs(vera.y - (best + (s.off - (mem.offVisto ?? s.off)))) < RO + 10;
  mem.offVisto = s.off;
  const calcio = vicina && Math.random() < 0.35 + livello * 0.5;
  return { u, calcio };
}

// stato compatto da mandare a chi guarda (circa 12 volte al secondo)
export const compatto = (st) => ({ b: [Math.round(st.palla.x), Math.round(st.palla.y)], o: st.stecche.map((s) => Math.round(s.off)),
  k: st.stecche.map((s) => (s.calcio > 0 ? 1 : 0)), g: st.gol, p: st.pausa > 0 ? 1 : 0, f: st.fine, u: st.ultimoGol });
export function applica(st, c) {
  st.palla.x = c.b[0]; st.palla.y = c.b[1]; st.gol = c.g; st.pausa = c.p ? 1 : 0; st.fine = c.f ?? null; st.ultimoGol = c.u ?? null;
  c.o.forEach((o, i) => { st.stecche[i].off = o; st.stecche[i].calcio = c.k[i] ? 0.1 : 0; });
}
export { omini };
