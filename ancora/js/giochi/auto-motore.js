// Il motore delle corse: piste, fisica "arcade" delle auto, giri, avversari del telefono. Niente grafica: la disegna la vista con three.js.
// Unità: metri e secondi. La pista è una curva chiusa campionata in punti; l'auto sa sempre dov'è lungo la pista.

export const LARGO = 14;          // larghezza della strada
export const GIRI = 3;
export const VMAX = 62;           // m/s (circa 220 km/h)

export const PISTE = {
  casa: { nome: "Il giro di casa", desc: "Facile: curve larghe, per cominciare",
    punti: [[0, 0], [160, 0], [240, 40], [260, 130], [200, 210], [90, 200], [40, 140], [-60, 160], [-140, 110], [-150, 20], [-90, -40]] },
  colline: { nome: "Le colline", desc: "Curve strette e un tornante",
    punti: [[0, 0], [120, -20], [200, 30], [210, 110], [150, 150], [110, 110], [60, 160], [80, 240], [0, 280], [-90, 230], [-110, 140], [-60, 90], [-140, 40], [-110, -40]] },
  lungomare: { nome: "Il lungomare", desc: "Rettilinei lunghi: si va forte",
    punti: [[0, 0], [300, 0], [380, 50], [380, 130], [300, 170], [100, 160], [20, 220], [-80, 200], [-120, 120], [-80, 50]] },
};

// Catmull-Rom chiusa → N punti con direzione, normale e curvatura
export function creaPista(chiave) {
  const P = PISTE[chiave].punti, n = P.length, N = 900;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const t = (i / N) * n, k = Math.floor(t), u = t - k;
    const p0 = P[(k - 1 + n) % n], p1 = P[k % n], p2 = P[(k + 1) % n], p3 = P[(k + 2) % n];
    const f = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
    pts.push({ x: f(p0[0], p1[0], p2[0], p3[0]), z: f(p0[1], p1[1], p2[1], p3[1]) });
  }
  let lung = 0;
  for (let i = 0; i < N; i++) {
    const a = pts[i], b = pts[(i + 1) % N];
    const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz) || 1;
    a.tx = dx / d; a.tz = dz / d; a.nx = -a.tz; a.nz = a.tx; a.s = lung; lung += d;
  }
  for (let i = 0; i < N; i++) {
    const a = pts[(i - 6 + N) % N], c = pts[(i + 6) % N];
    let da = Math.atan2(c.tz, c.tx) - Math.atan2(a.tz, a.tx);
    while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    pts[i].curva = Math.abs(da) / Math.max(1, Math.hypot(c.x - a.x, c.z - a.z));
  }
  return { chiave, nome: PISTE[chiave].nome, pts, N, lung };
}

// il punto della pista più vicino, cercando vicino all'ultimo noto
export function vicino(pista, x, z, da = null) {
  const { pts, N } = pista;
  let best = 0, bd = Infinity;
  const giro = da === null ? [0, N] : [da - 40, da + 40];
  for (let j = giro[0]; j < giro[1]; j++) {
    const i = ((j % N) + N) % N, p = pts[i], d = (p.x - x) ** 2 + (p.z - z) ** 2;
    if (d < bd) { bd = d; best = i; }
  }
  const p = pts[best];
  return { i: best, lato: (x - p.x) * p.nx + (z - p.z) * p.nz };
}

export function griglia(pista, quante) {
  // in fila due a due dietro la linea del via
  const { pts, N } = pista;
  return Array.from({ length: quante }, (_, k) => {
    const i = (N - 8 - Math.floor(k / 2) * 9 + N) % N, p = pts[i], lato = (k % 2 ? -1 : 1) * LARGO * 0.22;
    return { x: p.x + p.nx * lato, z: p.z + p.nz * lato, a: Math.atan2(p.tz, p.tx), v: 0, i, giro: 0, metaGiro: false, fine: null, giroInizio: 0, giroMigliore: null, fuori: 0 };
  });
}

// un passo di guida. comandi: { gas 0..1, freno 0..1, sterzo -1..1 }
export function guida(pista, c, cmd, dt, t) {
  if (c.fine !== null) { c.v = Math.max(0, c.v - 12 * dt); avanza(c, dt); return; }
  const { lato } = (c._v = vicino(pista, c.x, c.z, c.i));
  const fuori = Math.abs(lato) > LARGO / 2 + 0.6;
  let acc = cmd.gas * (c.v < 25 ? 16 : 11) - cmd.freno * 28 - 0.0028 * c.v * c.v - 0.4;
  if (fuori) acc -= 0.06 * c.v * c.v / 10 + 3;
  c.v = Math.max(cmd.freno > 0.5 && c.v < 1 ? -6 : 0, Math.min(VMAX, c.v + acc * dt));
  const presa = 1 - 0.5 * Math.min(1, Math.abs(c.v) / VMAX);
  c.a += cmd.sterzo * 1.7 * Math.min(1, Math.abs(c.v) / 10) * presa * dt * Math.sign(c.v || 1);
  avanza(c, dt);
  // il muretto: oltre l'erba non si va
  const n = vicino(pista, c.x, c.z, c.i);
  if (Math.abs(n.lato) > LARGO / 2 + 10) {
    const p = pista.pts[n.i], s = Math.sign(n.lato);
    c.x = p.x + p.nx * s * (LARGO / 2 + 9.8); c.z = p.z + p.nz * s * (LARGO / 2 + 9.8); c.v *= 0.55;
  }
  c.fuori = fuori ? 1 : 0;
  // giri: si deve passare da metà pista prima di ritagliare il traguardo
  const prima = c.i; c.i = n.i;
  if (c.i > pista.N * 0.45 && c.i < pista.N * 0.55) c.metaGiro = true;
  if (c.metaGiro && prima > pista.N * 0.9 && c.i < pista.N * 0.1) {
    c.giro++; c.metaGiro = false;
    const tempo = t - c.giroInizio; c.giroInizio = t;
    if (c.giro > 0 && (c.giroMigliore === null || tempo < c.giroMigliore)) c.giroMigliore = tempo;
    if (c.giro >= GIRI) c.fine = t;
  }
}
function avanza(c, dt) { c.x += Math.cos(c.a) * c.v * dt; c.z += Math.sin(c.a) * c.v * dt; }

// il telefono che guida: guarda avanti, rallenta prima delle curve, sbaglia un pochino
export function pilota(pista, c, bravura = 0.8, mem = {}) {
  const { pts, N } = pista;
  const avanti = 10 + Math.floor(c.v / 3);
  const q = pts[(c.i + avanti) % N];
  if (mem.scarto === undefined || Math.random() < 0.01) mem.scarto = (Math.random() - 0.5) * LARGO * 0.35;
  const tx = q.x + q.nx * mem.scarto, tz = q.z + q.nz * mem.scarto;
  let d = Math.atan2(tz - c.z, tx - c.x) - c.a;
  while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
  let curva = 0; for (let k = 5; k < 60; k += 5) curva = Math.max(curva, pts[(c.i + k) % N].curva);
  const vVoluta = Math.min(VMAX * (0.78 + 0.2 * bravura), Math.sqrt((7 + 7 * bravura) / Math.max(curva, 0.0005)));
  return { sterzo: Math.max(-1, Math.min(1, d * 2.2)), gas: c.v < vVoluta ? 1 : 0, freno: c.v > vVoluta + 4 ? 0.7 : 0 };
}

// ordine di gara: chi ha fatto più strada
export const strada = (pista, c) => (c.fine !== null ? 1e9 - c.fine : c.giro * pista.N + (c.metaGiro || c.i < pista.N * 0.5 ? c.i : c.i - pista.N));
export const tempo = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, "0")}`;
