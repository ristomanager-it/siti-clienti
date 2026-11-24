// Le piste dalle strade vere: si scaricano le strade e le case di un paese da OpenStreetMap (© contributori OpenStreetMap, ODbL),
// si cerca un giro chiuso di 1-3 km intorno al centro e lo si trasforma in pista. Si fa una volta sola: poi la pista è salvata su Ancora.
import { sb } from "../app.js";

export const LARGO_OSM = 8.5;

export const slug = (s) => "osm:" + String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);

// le chiamate a OpenStreetMap passano dal server di Ancora (Safari blocca quelle dirette)
async function mappa(corpo) {
  const { data, error } = await sb.functions.invoke("mappa-osm", { body: corpo });
  if (error) {
    let m = error.message; try { m = (await error.context.json()).errore ?? m; } catch { /* resta il messaggio */ }
    throw new Error(m);
  }
  if (data?.errore) throw new Error(data.errore);
  return data;
}

/** Dove si trova un paese (OpenStreetMap Nominatim). */
export async function cercaPosto(testo) {
  // prima dal telefono (Nominatim, veloce); se il browser lo blocca, passa da Ancora
  try {
    const ctl = new AbortController(); setTimeout(() => ctl.abort(), 8000);
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=it&accept-language=it&q=${encodeURIComponent(testo)}`, { signal: ctl.signal });
    const j = await r.json();
    if (j?.length) return { lat: Number(j[0].lat), lon: Number(j[0].lon), nome: j[0].display_name.split(",")[0] };
  } catch { /* si prova dal server */ }
  return (await mappa({ cerca: testo })).posto;
}

/** La pista già pronta su Ancora, oppure la costruisce (e la salva). */
export async function caricaPista(chiave, { nome, lat, lon } = {}, avanzamento = () => {}) {
  const { data } = await sb.from("piste_osm").select("nome, dati").eq("chiave", chiave).maybeSingle();
  if (data) return { nome: data.nome, ...data.dati };
  if (lat === undefined) throw new Error("Pista non trovata");
  avanzamento("Scarico le strade e le case da OpenStreetMap…");
  const osm = await mappa({ lat, lon });
  avanzamento("Cerco il giro più bello…");
  const dati = costruisci(osm, lat, lon);
  dati.nome = nome; dati.centro = [lat, lon];
  await sb.rpc("pista_salva", { p_chiave: chiave, p_nome: nome, p_dati: dati });
  return { nome, ...dati };
}

// --- dalla mappa alla pista ---
export function costruisci(osm, lat0, lon0) {
  const kx = Math.cos(lat0 * Math.PI / 180) * 111320, kz = 110540;
  const xy = (p) => [(p.lon - lon0) * kx, (lat0 - p.lat) * kz];
  const strade = (osm.elements ?? []).filter((e) => e.type === "way" && e.tags?.highway && e.geometry?.length > 1);
  const case_ = (osm.elements ?? []).filter((e) => e.type === "way" && e.tags?.building && e.geometry?.length > 3);
  const PESO = { primary: 0.8, secondary: 0.85, tertiary: 0.9, unclassified: 1, residential: 1, living_street: 1.2 };

  // grafo sui nodi OSM
  const pos = new Map(), adj = new Map();
  const arco = (a, b, peso) => { if (!adj.has(a)) adj.set(a, []); adj.get(a).push({ b, peso }); };
  for (const w of strade) {
    const p = PESO[w.tags.highway.replace("_link", "")] ?? 1;
    for (let i = 0; i < w.nodes.length; i++) pos.set(w.nodes[i], xy(w.geometry[i]));
    for (let i = 0; i + 1 < w.nodes.length; i++) {
      const a = w.nodes[i], b = w.nodes[i + 1]; if (a === b) continue;
      const [x1, z1] = pos.get(a), [x2, z2] = pos.get(b), d = Math.hypot(x2 - x1, z2 - z1);
      arco(a, b, d * p); arco(b, a, d * p);
    }
  }
  if (pos.size < 10) throw new Error("Qui OpenStreetMap ha poche strade: prova un paese più grande o un indirizzo vicino.");
  const nodi = [...adj.keys()];
  const incroci = nodi.filter((n) => new Set(adj.get(n).map((e) => e.b)).size >= 3);
  const dist0 = (n) => Math.hypot(...pos.get(n));

  // Dijkstra con penalità su archi e nodi già usati
  function cammino(da, a, vietati = new Set(), archiUsati = new Set()) {
    const d = new Map([[da, 0]]), prima = new Map(), fatti = new Set();
    const coda = [[0, da]];
    while (coda.length) {
      let mi = 0; for (let i = 1; i < coda.length; i++) if (coda[i][0] < coda[mi][0]) mi = i;
      const [du, u] = coda.splice(mi, 1)[0];
      if (fatti.has(u)) continue; fatti.add(u);
      if (u === a) break;
      if (du > 6000) break;
      for (const { b, peso } of adj.get(u) ?? []) {
        if (vietati.has(b) && b !== a) continue;
        const extra = archiUsati.has(u + ">" + b) || archiUsati.has(b + ">" + u) ? peso * 40 : 0;
        const nd = du + peso + extra;
        if (nd < (d.get(b) ?? Infinity)) { d.set(b, nd); prima.set(b, u); coda.push([nd, b]); }
      }
    }
    if (!prima.has(a)) return null;
    const via = [a]; while (via[0] !== da) via.unshift(prima.get(via[0]));
    return via;
  }
  const lunghezza = (via) => { let l = 0; for (let i = 0; i + 1 < via.length; i++) { const [x1, z1] = pos.get(via[i]), [x2, z2] = pos.get(via[i + 1]); l += Math.hypot(x2 - x1, z2 - z1); } return l; };

  // tanti tentativi: un incrocio vicino al centro, un altro a qualche centinaio di metri; andata e ritorno su strade diverse
  const vicini = incroci.filter((n) => dist0(n) < 450).sort((a, b) => dist0(a) - dist0(b)).slice(0, 14);
  const lontani = incroci.filter((n) => dist0(n) < 1300);
  let migliore = null;
  let semi = 1; const caso = () => ((semi = (semi * 16807) % 2147483647) / 2147483647);
  for (const A of vicini.length ? vicini : incroci.slice(0, 10)) {
    const [ax, az] = pos.get(A);
    const cand = lontani.filter((n) => { const [x, z] = pos.get(n), d = Math.hypot(x - ax, z - az); return d > 250 && d < 900; });
    for (let t = 0; t < Math.min(12, cand.length); t++) {
      const B = cand[Math.floor(caso() * cand.length)];
      const p1 = cammino(A, B); if (!p1) continue;
      const usati = new Set(); for (let i = 0; i + 1 < p1.length; i++) usati.add(p1[i] + ">" + p1[i + 1]);
      const p2 = cammino(B, A, new Set(p1.slice(1, -1)), usati); if (!p2) continue;
      const giro = [...p1, ...p2.slice(1, -1)];
      const l = lunghezza([...giro, giro[0]]);
      if (l < 700 || l > 4200) continue;
      const voto = -Math.abs(l - 1800) + Math.min(400, incroci.length) * 0;
      if (!migliore || voto > migliore.voto) migliore = { voto, giro, l };
    }
  }
  if (!migliore) throw new Error("Qui le strade non fanno un giro chiuso: prova con il nome di un paese vicino o di una piazza.");

  // polilinea → punti ogni 8 m, angoli smussati
  let linea = migliore.giro.map((n) => pos.get(n));
  linea = linea.filter((p, i) => i === 0 || Math.hypot(p[0] - linea[i - 1][0], p[1] - linea[i - 1][1]) > 0.5);
  const fitti = [];
  for (let i = 0; i < linea.length; i++) {
    const a = linea[i], b = linea[(i + 1) % linea.length], d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(d / 8));
    for (let k = 0; k < n; k++) fitti.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
  }
  let punti = fitti;
  for (let giro = 0; giro < 3; giro++) {
    punti = punti.map((_, i) => {
      const p0 = punti[(i - 1 + punti.length) % punti.length], p1 = punti[i], p2 = punti[(i + 1) % punti.length];
      return [(p0[0] + 2 * p1[0] + p2[0]) / 4, (p0[1] + 2 * p1[1] + p2[1]) / 4];
    });
  }
  // il via sul tratto più dritto
  let viaI = 0, meglio = Infinity;
  for (let i = 0; i < punti.length; i++) {
    let curva = 0;
    for (let k = -4; k < 4; k++) {
      const a = punti[(i + k + punti.length) % punti.length], b = punti[(i + k + 1 + punti.length) % punti.length], c = punti[(i + k + 2 + punti.length) % punti.length];
      let d = Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(b[1] - a[1], b[0] - a[0]);
      while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; curva += Math.abs(d);
    }
    if (curva < meglio) { meglio = curva; viaI = i; }
  }
  punti = [...punti.slice(viaI), ...punti.slice(0, viaI)].map(([x, z]) => [+x.toFixed(1), +z.toFixed(1)]);

  // le case: solo quelle che non toccano la strada
  const lontanoDaStrada = (x, z, min) => {
    for (let i = 0; i < punti.length; i++) { const dx = punti[i][0] - x, dz = punti[i][1] - z; if (dx * dx + dz * dz < min * min) return false; }
    return true;
  };
  const edifici = [];
  for (const b of case_) {
    const pol = b.geometry.map(xy);
    if (pol.some(([x, z]) => Math.hypot(x, z) > 900)) continue;
    if (!pol.every(([x, z]) => lontanoDaStrada(x, z, LARGO_OSM / 2 + 1.2))) continue;
    const piani = Number(b.tags["building:levels"]) || (b.tags.building === "church" ? 4 : 2 + ((b.id % 3) === 0 ? 1 : 0));
    edifici.push({ p: pol.slice(0, -1).map(([x, z]) => [+x.toFixed(1), +z.toFixed(1)]), h: Math.min(30, piani * 3.1 + 0.8), t: b.tags.building === "church" ? "c" : "" });
    if (edifici.length >= 1200) break;
  }
  // le altre strade del paese, per vederle intorno (solo disegno)
  const altre = [];
  for (const w of strade) {
    const l = w.geometry.map(xy).filter(([x, z]) => Math.hypot(x, z) < 1000).map(([x, z]) => [+x.toFixed(1), +z.toFixed(1)]);
    if (l.length > 1) altre.push(l);
    if (altre.length > 400) break;
  }
  return { punti, largo: LARGO_OSM, edifici, altre, lunghezza: Math.round(migliore.l) };
}
