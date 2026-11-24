// Il motore del biliardo (palla 8). Puro calcolo, niente schermo: lo usano il tavolo, l'avversario del telefono e chi guarda.
// Deterministico: stesse palle + stesso tiro = stesso risultato su ogni telefono (solo somme, prodotti e radici, passo fisso).

export const W = 1000, H = 500, R = 12;
export const MAX_V = 2300;                 // velocità del tiro più forte (px/s)
const DT = 1 / 300, ATTRITO = 270, SPONDA = 0.78, URTO = 0.95, FERMA = 4;
export const BUCHE = [
  { x: 0, y: 0, r: 30 }, { x: W / 2, y: -6, r: 26 }, { x: W, y: 0, r: 30 },
  { x: 0, y: H, r: 30 }, { x: W / 2, y: H + 6, r: 26 }, { x: W, y: H, r: 30 },
];
export const TESTA = { x: 250, y: 250 }, PIEDE = { x: 750, y: 250 };
export const gruppoDi = (n) => (n === 0 || n === 8 ? null : n < 8 ? "piene" : "spezzate");

// la piramide: la 8 al centro, una piena e una spezzata negli angoli dietro
export function nuovoTavolo(casuale = Math.random) {
  const altre = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15];
  for (let i = altre.length - 1; i > 0; i--) { const j = Math.floor(casuale() * (i + 1)); [altre[i], altre[j]] = [altre[j], altre[i]]; }
  const piena = altre.findIndex((n) => n < 8);
  const angoloA = altre.splice(piena, 1)[0]; const angoloB = altre.splice(altre.findIndex((n) => n > 8), 1)[0];
  const palle = [{ n: 0, x: TESTA.x, y: TESTA.y, in: false }];
  const dx = R * 2 * 0.8661, dy = R * 2 + 0.4;
  for (let fila = 0; fila < 5; fila++) {
    for (let k = 0; k <= fila; k++) {
      let n;
      if (fila === 2 && k === 1) n = 8;
      else if (fila === 4 && k === 0) n = angoloA;
      else if (fila === 4 && k === 4) n = angoloB;
      else n = altre.shift();
      palle.push({ n, x: +(PIEDE.x + fila * dx).toFixed(3), y: +(PIEDE.y + (k - fila / 2) * dy).toFixed(3), in: false });
    }
  }
  return { palle, turno: 0, gruppi: [null, null], apertura: true, manoLibera: false, msg: "Si spacca: tocca al primo giocatore." };
}

// una simulazione che avanza a passi: la usano l'animazione (pochi passi a fotogramma) e il telefono che pensa (tutta in un colpo)
export function crea(palle, vx, vy) {
  const b = palle.map((p) => ({ n: p.n, x: p.x, y: p.y, vx: 0, vy: 0, in: !!p.in }));
  const bianca = b.find((p) => p.n === 0);
  bianca.vx = vx; bianca.vy = vy;
  const ev = { primo: null, imbucate: [], sponde: 0, toccate: 0 };
  let ferma = false;
  function passo() {
    let muove = false;
    for (const p of b) {
      if (p.in) continue;
      const v2 = p.vx * p.vx + p.vy * p.vy;
      if (v2 === 0) continue;
      const v = Math.sqrt(v2), nv = v - ATTRITO * DT;
      if (nv <= FERMA) { p.vx = 0; p.vy = 0; continue; }
      const k = nv / v; p.vx *= k; p.vy *= k;
      p.x += p.vx * DT; p.y += p.vy * DT; muove = true;
    }
    // buche
    for (const p of b) {
      if (p.in) continue;
      for (const q of BUCHE) {
        const dx = p.x - q.x, dy = p.y - q.y;
        if (dx * dx + dy * dy < q.r * q.r) { p.in = true; p.vx = 0; p.vy = 0; ev.imbucate.push(p.n); break; }
      }
    }
    // sponde
    for (const p of b) {
      if (p.in) continue;
      if (p.x < R) { p.x = R; p.vx = -p.vx * SPONDA; p.vy *= 0.97; if (p.n === 0) ev.sponde++; }
      else if (p.x > W - R) { p.x = W - R; p.vx = -p.vx * SPONDA; p.vy *= 0.97; if (p.n === 0) ev.sponde++; }
      if (p.y < R) { p.y = R; p.vy = -p.vy * SPONDA; p.vx *= 0.97; if (p.n === 0) ev.sponde++; }
      else if (p.y > H - R) { p.y = H - R; p.vy = -p.vy * SPONDA; p.vx *= 0.97; if (p.n === 0) ev.sponde++; }
    }
    // urti tra palle (stessa massa)
    for (let i = 0; i < b.length; i++) {
      const p = b[i]; if (p.in) continue;
      for (let j = i + 1; j < b.length; j++) {
        const q = b[j]; if (q.in) continue;
        const dx = q.x - p.x, dy = q.y - p.y, d2 = dx * dx + dy * dy;
        if (d2 >= 4 * R * R || d2 === 0) continue;
        const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
        const sovra = (2 * R - d) / 2; p.x -= nx * sovra; p.y -= ny * sovra; q.x += nx * sovra; q.y += ny * sovra;
        const rel = (p.vx - q.vx) * nx + (p.vy - q.vy) * ny;
        if (rel <= 0) continue;
        const imp = rel * (1 + URTO) / 2;
        p.vx -= imp * nx; p.vy -= imp * ny; q.vx += imp * nx; q.vy += imp * ny;
        if (p.n === 0 && ev.primo === null) ev.primo = q.n;
        else if (q.n === 0 && ev.primo === null) ev.primo = p.n;
        ev.toccate++;
        muove = true;
      }
    }
    if (!muove) ferma = true;
    return !ferma;
  }
  return {
    palle: b, eventi: ev,
    avanza(n) { for (let i = 0; i < n && !ferma; i++) passo(); return !ferma; },
    tutta() { for (let i = 0; i < 300 * 40 && !ferma; i++) passo(); ferma = true; },
    get ferma() { return ferma; },
  };
}

const libero = (palle, x, y, salta = -1) => palle.every((p) => p.in || p.n === salta || (p.x - x) ** 2 + (p.y - y) ** 2 >= 4 * R * R + 1);
export function postoLibero(palle, x, y) {
  for (let k = 0; k < 40; k++) {
    const tx = Math.min(W - R, Math.max(R, x - k * (R + 2))), ty = Math.min(H - R, Math.max(R, y + (k % 2 ? 1 : -1) * Math.floor(k / 2) * 3));
    if (libero(palle, tx, ty, 0)) return { x: tx, y: ty };
  }
  return { x, y };
}
export const posizioneValida = (palle, x, y) => x >= R && x <= W - R && y >= R && y <= H - R && libero(palle, x, y, 0) &&
  BUCHE.every((q) => (x - q.x) ** 2 + (y - q.y) ** 2 > (q.r + 6) ** 2);

const restanti = (palle, g) => palle.filter((p) => !p.in && gruppoDi(p.n) === g).length;

// dopo un tiro: falli, gruppi, turno, vincitore. "stato" è il tavolo prima del tiro, "fine" le palle dopo.
export function regole(stato, ev, fine, nomi = ["Giocatore 1", "Giocatore 2"]) {
  const s = stato.turno, o = 1 - s;
  const gruppi = [...stato.gruppi];
  const mio = gruppi[s];
  const prima = (g) => stato.palle.filter((p) => !p.in && gruppoDi(p.n) === g).length;
  const sull8 = mio && prima(mio) === 0;
  const imb = ev.imbucate;
  const biancaDentro = imb.includes(0);
  const ottoDentro = imb.includes(8);
  let fallo = null;
  if (biancaDentro) fallo = "la bianca è finita in buca";
  else if (ev.primo === null) fallo = "non ha toccato nessuna palla";
  else if (!stato.apertura) {
    if (mio && !sull8 && gruppoDi(ev.primo) !== mio) fallo = ev.primo === 8 ? "ha toccato prima la nera" : "ha toccato prima una palla dell'avversario";
    else if (sull8 && ev.primo !== 8) fallo = "doveva toccare prima la nera";
    else if (!mio && ev.primo === 8) fallo = "ha toccato prima la nera";
  }
  const palle = fine.map((p) => ({ n: p.n, x: +p.x.toFixed(3), y: +p.y.toFixed(3), in: p.in }));
  const nuovo = { palle, turno: s, gruppi, apertura: false, manoLibera: false, msg: "" };

  if (ottoDentro) {
    if (stato.apertura) {
      // la nera alla spaccata: si rimette sul piede e si continua
      const p8 = palle.find((p) => p.n === 8); const pos = postoLibero(palle, PIEDE.x, PIEDE.y); Object.assign(p8, { in: false, x: pos.x, y: pos.y });
    } else {
      const vince = sull8 && !fallo ? s : o;
      nuovo.vincitore = vince;
      nuovo.msg = vince === s ? `🎱 ${nomi[s]} manda in buca la nera e vince!` : `💥 ${nomi[s]} ha mandato in buca la nera ${sull8 ? "con un fallo" : "troppo presto"}: vince ${nomi[o]}!`;
      return nuovo;
    }
  }
  if (biancaDentro) { const b = palle.find((p) => p.n === 0); const pos = postoLibero(palle, TESTA.x, TESTA.y); Object.assign(b, { in: false, x: pos.x, y: pos.y }); }

  const buone = imb.filter((n) => n !== 0 && n !== 8);
  if (!mio && !fallo && buone.length && !stato.apertura) {
    gruppi[s] = gruppoDi(buone[0]); gruppi[o] = gruppi[s] === "piene" ? "spezzate" : "piene";
  }
  const mioOra = gruppi[s];
  const continua = !fallo && buone.length > 0 && (!mioOra || buone.some((n) => gruppoDi(n) === mioOra) || stato.apertura);
  if (fallo) {
    nuovo.turno = o; nuovo.manoLibera = true;
    nuovo.msg = `Fallo: ${nomi[s]} ${fallo}. ${nomi[o]} mette la bianca dove vuole.`;
  } else if (continua) {
    nuovo.msg = `${nomi[s]} ne ha mandate in buca ${buone.length === 1 ? "una" : buone.length}${!mio && gruppi[s] ? ` e gioca con le ${gruppi[s]}` : ""}: tira ancora.`;
  } else {
    nuovo.turno = o;
    nuovo.msg = buone.length ? `${nomi[s]} ha mandato in buca solo palle dell'avversario. Tocca a ${nomi[o]}.` : `Tocca a ${nomi[o]}.`;
  }
  if (mioOra && restanti(palle, mioOra) === 0 && nuovo.turno === s) nuovo.msg += " Ora tocca alla nera!";
  return nuovo;
}

// l'avversario del telefono: prova i tiri verso ogni buca, li simula e sceglie il migliore (con un po' di mano tremolante)
export function sceltaBot(stato, livello = 0.6, casuale = Math.random) {
  const s = stato.turno, mio = stato.gruppi[s];
  const vive = stato.palle.filter((p) => !p.in && p.n !== 0);
  let bersagli = mio ? vive.filter((p) => gruppoDi(p.n) === mio) : vive.filter((p) => p.n !== 8);
  if (mio && !bersagli.length) bersagli = vive.filter((p) => p.n === 8);
  if (!bersagli.length) bersagli = vive;
  let bianca = stato.palle.find((p) => p.n === 0);
  const posizioni = [];
  if (stato.manoLibera) {
    for (const t of bersagli) for (const q of BUCHE) {
      const dx = t.x - q.x, dy = t.y - q.y, d = Math.hypot(dx, dy) || 1;
      const x = t.x + dx / d * 140, y = t.y + dy / d * 140;
      if (posizioneValida(stato.palle, x, y)) posizioni.push({ x, y });
    }
    posizioni.push(postoLibero(stato.palle, TESTA.x, TESTA.y));
  } else posizioni.push({ x: bianca.x, y: bianca.y });

  let migliore = null;
  const prova = (pos, vx, vy) => {
    const palle = stato.palle.map((p) => (p.n === 0 ? { ...p, x: pos.x, y: pos.y } : p));
    const sim = crea(palle, vx, vy); sim.tutta();
    const r = regole({ ...stato, palle }, sim.eventi, sim.palle);
    let punti = 0;
    if ("vincitore" in r) punti += r.vincitore === s ? 1000 : -1000;
    if (r.turno === s) punti += 40;
    const g = r.gruppi[s];
    punti += sim.eventi.imbucate.filter((n) => n !== 0 && n !== 8 && (!g || gruppoDi(n) === g)).length * 15;
    punti -= sim.eventi.imbucate.filter((n) => g && gruppoDi(n) && gruppoDi(n) !== g).length * 10;
    if (r.manoLibera && r.turno !== s) punti -= 50;
    punti += casuale() * 3;
    if (!migliore || punti > migliore.punti) migliore = { punti, vx, vy, pos };
  };
  const posScelte = posizioni.slice(0, 4);
  for (const pos of posScelte) {
    for (const t of bersagli) for (const q of BUCHE) {
      const dx = q.x - t.x, dy = q.y - t.y, d = Math.hypot(dx, dy) || 1;
      const gx = t.x - dx / d * 2 * R, gy = t.y - dy / d * 2 * R;
      const ax = gx - pos.x, ay = gy - pos.y, a = Math.hypot(ax, ay) || 1;
      if ((ax * dx + ay * dy) / (a * d) < 0.15) continue;      // angolo impossibile
      for (const f of posScelte.length > 1 ? [0.5, 0.75] : [0.42, 0.62, 0.85]) prova(pos, ax / a * MAX_V * f, ay / a * MAX_V * f);
    }
    if (stato.apertura) prova(pos, MAX_V, (casuale() - 0.5) * 40);
  }
  if (!migliore) {
    const t = bersagli[0], ax = t.x - bianca.x, ay = t.y - bianca.y, a = Math.hypot(ax, ay) || 1;
    migliore = { vx: ax / a * MAX_V * 0.6, vy: ay / a * MAX_V * 0.6, pos: { x: bianca.x, y: bianca.y } };
  }
  // la mano trema un po': meno per il telefono bravo
  const errore = (1 - livello) * 0.05 * (casuale() - 0.5);
  const c = Math.cos(errore), sn = Math.sin(errore);
  const vx = migliore.vx * c - migliore.vy * sn, vy = migliore.vx * sn + migliore.vy * c;
  return { vx: +vx.toFixed(3), vy: +vy.toFixed(3), bianca: stato.manoLibera ? migliore.pos : null };
}
