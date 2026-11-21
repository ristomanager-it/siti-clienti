// Albero genealogico di una famiglia (una cerchia di tipo famiglia).
// Generazioni in righe, coppie affiancate, linee dai genitori ai figli. Si completa insieme: tocca una persona per aggiungere.
import { sb, state, $app, esc, ICONE } from "../app.js";

const W = 128, H = 70, GAP = 22, COPPIA = 10, RIGA = 140, MARGINE = 24;

export default async function ({ params }) {
  const famiglie = state.cerchie.filter((c) => c.tipo === "famiglia");
  const cerchiaId = params.c ?? famiglie[0]?.id;
  const cerchia = state.cerchie.find((c) => c.id === cerchiaId);
  if (!cerchia) {
    $app().innerHTML = `<header class="testa"><span class="logo" style="font-size:22px">Albero</span><span></span></header>
      <div class="pad"><p>Per fare l'albero serve una famiglia.</p><a class="btn" href="#/cerchie">Crea la tua famiglia</a></div>`;
    return;
  }
  const [{ data: nodi }, { data: legami }] = await Promise.all([
    sb.from("albero_nodi").select("*").eq("cerchia_id", cerchiaId).order("creato_il"),
    sb.from("albero_legami").select("*").eq("cerchia_id", cerchiaId),
  ]);

  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/cerchie" aria-label="Indietro">${ICONE.indietro}</a>
      <b>${esc(cerchia.nome)}</b><span style="width:44px"></span></header>
    ${famiglie.length > 1 ? `<div class="storie" style="gap:6px;padding-bottom:8px">${famiglie.map((c) =>
      `<a class="chip ${c.id === cerchiaId ? "on" : ""}" style="flex-shrink:0;text-decoration:none" href="#/albero?c=${c.id}">${esc(c.nome)}</a>`).join("")}</div>` : ""}
    <div id="tela" style="overflow:auto;-webkit-overflow-scrolling:touch;padding-bottom:20px"></div>
    <p class="pad tenue">Tocca una persona per aggiungere genitori, figli o coniuge. L'albero lo completa tutta la famiglia.</p>
    <div id="foglio"></div>`;

  if (!nodi?.length) {
    document.getElementById("tela").innerHTML = `<div class="pad"><div class="lettera" style="margin:0;font-size:19px">Ogni albero comincia da una persona. Comincia da te: poi aggiungi i tuoi genitori, i nonni, i figli.</div>
      <button class="btn ambra" id="inizia" style="margin-top:14px">Inizia da me</button></div>`;
    document.getElementById("inizia").onclick = async () => {
      await sb.from("albero_nodi").insert({ cerchia_id: cerchiaId, persona_id: state.io.id, nome: state.io.nome,
        cognome: state.io.cognome, nascita: state.io.data_nascita, creato_da: state.io.id });
      location.reload();
    };
    return;
  }

  disegna(nodi, legami ?? []);
  document.querySelectorAll("[data-nodo]").forEach((g) => g.addEventListener("click", () =>
    scheda(nodi.find((n) => n.id === g.dataset.nodo), nodi, legami ?? [], cerchiaId)));
}

// --- impaginazione: generazioni, coppie, ordine per vicinanza ai genitori ---
function impagina(nodi, legami) {
  const gen = new Map(nodi.map((n) => [n.id, 0]));
  const gl = legami.filter((l) => l.tipo === "genitore");
  const cl = legami.filter((l) => l.tipo === "coppia");
  for (let i = 0; i < 60; i++) {
    let cambiato = false;
    for (const l of gl) if (gen.get(l.a) < gen.get(l.da) + 1) { gen.set(l.a, gen.get(l.da) + 1); cambiato = true; }
    for (const l of cl) {
      const g = Math.max(gen.get(l.da), gen.get(l.a));
      if (gen.get(l.da) !== g || gen.get(l.a) !== g) { gen.set(l.da, g); gen.set(l.a, g); cambiato = true; }
    }
    if (!cambiato) break;
  }
  // il primo antenato in cima: si parte da 0
  const min = Math.min(...gen.values());
  for (const [k, v] of gen) gen.set(k, v - min);

  const coniuge = new Map();
  for (const l of cl) { if (!coniuge.has(l.da)) coniuge.set(l.da, l.a); if (!coniuge.has(l.a)) coniuge.set(l.a, l.da); }
  const genitori = (id) => gl.filter((l) => l.a === id).map((l) => l.da);

  const figli = (id) => gl.filter((l) => l.da === id).map((l) => l.a);
  const righe = Math.max(...gen.values()) + 1;

  // unità per riga: coppie affiancate o persone sole
  const unitaRiga = [];
  for (let r = 0; r < righe; r++) {
    const fatti = new Set();
    const unita = [];
    for (const n of nodi.filter((k) => gen.get(k.id) === r)) {
      if (fatti.has(n.id)) continue;
      const c = coniuge.get(n.id);
      const u = c && gen.get(c) === r && !fatti.has(c) ? [n.id, c] : [n.id];
      u.forEach((x) => fatti.add(x));
      unita.push(u);
    }
    unitaRiga.push(unita);
  }

  const pos = new Map();
  const media = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : Infinity);
  const piazza = (r, vicini) => {
    const centro = (u) => media(u.flatMap(vicini).map((p) => pos.get(p)).filter((x) => x !== undefined));
    const unita = unitaRiga[r];
    unita.sort((a, b) => centro(a) - centro(b));
    let x = MARGINE;
    for (const u of unita) {
      const larg = u.length * W + (u.length - 1) * COPPIA;
      const c = centro(u);
      if (c !== Infinity) x = Math.max(x, c + W / 2 - larg / 2);
      u.forEach((id, i) => pos.set(id, x + i * (W + COPPIA)));
      x += larg + GAP;
    }
  };
  // giù (figli sotto i genitori), su (genitori sopra i figli), di nuovo giù
  for (let r = 0; r < righe; r++) piazza(r, genitori);
  for (let r = righe - 2; r >= 0; r--) piazza(r, figli);
  for (let r = 1; r < righe; r++) piazza(r, genitori);
  // si riparte dal margine sinistro
  const minX = Math.min(...pos.values());
  for (const [k, v] of pos) pos.set(k, v - minX + MARGINE);
  const larghezza = Math.max(...pos.values()) + W;
  return { gen, pos, righe, larghezza: larghezza + MARGINE, coniuge, gl, cl };
}

const anni = (n) => {
  const a = n.nascita ? n.nascita.slice(0, 4) : n.anno_nascita ?? "";
  const b = n.morte ? n.morte.slice(0, 4) : n.anno_morte ?? "";
  return a || b ? `${a}${b ? ` – ${b}` : ""}` : "";
};

function disegna(nodi, legami) {
  const { gen, pos, righe, larghezza, gl, cl } = impagina(nodi, legami);
  const y = (id) => MARGINE + gen.get(id) * RIGA;
  const linee = [];

  // coppie: un trattino tra i due
  for (const l of cl) {
    if (gen.get(l.da) !== gen.get(l.a)) continue;
    const [s, d] = [pos.get(l.da), pos.get(l.a)].sort((p, q) => p - q);
    linee.push(`<path d="M${s + W} ${y(l.da) + H / 2}H${d}" stroke="#C9832E" stroke-width="3"/>`);
  }
  // figli: un gruppo per coppia di genitori, ognuno con la sua altezza per non confondersi
  const gruppi = new Map();
  for (const l of gl) {
    const gs = gl.filter((x) => x.a === l.a).map((x) => x.da).sort();
    const k = gs.join("|");
    if (!gruppi.has(k)) gruppi.set(k, { gs, figli: new Set() });
    gruppi.get(k).figli.add(l.a);
  }
  let k = 0;
  for (const { gs, figli } of gruppi.values()) {
    const xp = gs.map((g) => pos.get(g) + W / 2).reduce((a, b) => a + b, 0) / gs.length;
    const yp = Math.max(...gs.map((g) => y(g))) + (gs.length > 1 ? H / 2 : H);
    const fs = [...figli];
    const yf = Math.min(...fs.map((f) => y(f)));
    const ym = yf - (RIGA - H) / 2 + ((k++ % 3) - 1) * 9;
    const xs = fs.map((f) => pos.get(f) + W / 2);
    const colore = ["#9AA7A1", "#B08B5A", "#6F8F86"][k % 3];
    linee.push(`<path d="M${xp} ${yp}V${ym}" stroke="${colore}" stroke-width="2"/>`);
    linee.push(`<path d="M${Math.min(xp, ...xs)} ${ym}H${Math.max(xp, ...xs)}" stroke="${colore}" stroke-width="2"/>`);
    for (const f of fs) linee.push(`<path d="M${pos.get(f) + W / 2} ${ym}V${y(f)}" stroke="${colore}" stroke-width="2"/>`);
  }

  const schede = nodi.map((n) => {
    const x = pos.get(n.id), yy = y(n.id);
    const memoria = n.morte || n.anno_morte;
    const io = n.persona_id === state.io.id;
    return `<g data-nodo="${n.id}" style="cursor:pointer" role="button" aria-label="${esc(n.nome)}">
      <rect x="${x}" y="${yy}" width="${W}" height="${H}" rx="16" fill="${memoria ? "#EFEAE0" : "#fff"}" stroke="${io ? "#C9832E" : "#E8E1D4"}" stroke-width="${io ? 3 : 1.5}"/>
      <text x="${x + W / 2}" y="${yy + 28}" text-anchor="middle" font-family="Manrope, sans-serif" font-weight="800" font-size="14" fill="#12302C">${esc(taglia(n.soprannome ?? n.nome, 15))}</text>
      <text x="${x + W / 2}" y="${yy + 45}" text-anchor="middle" font-family="Manrope, sans-serif" font-size="12" fill="#5D635F">${esc(taglia(n.cognome ?? "", 16))}</text>
      <text x="${x + W / 2}" y="${yy + 61}" text-anchor="middle" font-family="Manrope, sans-serif" font-size="11" fill="#5D635F">${esc(anni(n))}${memoria ? " ✝" : ""}</text>
    </g>`;
  }).join("");

  const alto = MARGINE * 2 + (righe - 1) * RIGA + H;
  document.getElementById("tela").innerHTML =
    `<svg width="${larghezza}" height="${alto}" viewBox="0 0 ${larghezza} ${alto}" style="display:block;min-width:100%">${linee.join("")}${schede}</svg>`;
}

const taglia = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

// --- scheda di una persona: modifica e aggiunta di parenti ---
function scheda(n, nodi, legami, cerchiaId) {
  const f = document.getElementById("foglio");
  const nomeDi = (id) => { const x = nodi.find((k) => k.id === id); return x ? `${x.nome} ${x.cognome ?? ""}`.trim() : ""; };
  const gen = legami.filter((l) => l.tipo === "genitore" && l.a === n.id).map((l) => nomeDi(l.da));
  const figli = legami.filter((l) => l.tipo === "genitore" && l.da === n.id).map((l) => nomeDi(l.a));
  const coniugi = legami.filter((l) => l.tipo === "coppia" && (l.da === n.id || l.a === n.id)).map((l) => nomeDi(l.da === n.id ? l.a : l.da));

  f.innerHTML = `<div style="position:fixed;inset:0;background:rgba(18,48,44,.45);z-index:20" id="velo"></div>
    <div class="card" style="position:fixed;left:0;right:0;bottom:0;margin:0;border-radius:24px 24px 0 0;z-index:21;max-height:88vh;overflow:auto;padding-bottom:calc(20px + env(safe-area-inset-bottom))">
      <div class="riga"><b style="flex:1;font-size:20px;font-family:Fraunces,serif">${esc(n.nome)} ${esc(n.cognome ?? "")}</b><button class="chip" id="chiudi">Chiudi</button></div>
      <p class="tenue" style="margin:4px 0 0">${[gen.length ? `Figlio/a di ${gen.join(" e ")}` : "", coniugi.length ? `Coniuge: ${coniugi.join(", ")}` : "", figli.length ? `Figli: ${figli.join(", ")}` : ""].filter(Boolean).map(esc).join("<br>")}</p>
      <form id="mod">
        <div class="riga"><div style="flex:1"><label for="m-nome">Nome</label><input id="m-nome" value="${esc(n.nome)}" required></div>
          <div style="flex:1"><label for="m-cognome">Cognome</label><input id="m-cognome" value="${esc(n.cognome ?? "")}"></div></div>
        <label for="m-sopr">Come lo chiamavate</label><input id="m-sopr" value="${esc(n.soprannome ?? "")}" placeholder="Nonno Peppe">
        <div class="riga"><div style="flex:1"><label for="m-na">Anno di nascita</label><input id="m-na" inputmode="numeric" value="${esc(n.nascita?.slice(0, 4) ?? n.anno_nascita ?? "")}"></div>
          <div style="flex:1"><label for="m-mo">Anno di morte</label><input id="m-mo" inputmode="numeric" value="${esc(n.morte?.slice(0, 4) ?? n.anno_morte ?? "")}" placeholder="se non c'è più"></div></div>
        <label for="m-luogo">Dove è nato o ha vissuto</label><input id="m-luogo" value="${esc(n.luogo ?? "")}">
        <button class="btn" style="margin-top:12px">Salva</button>
      </form>
      <label>Aggiungi un parente di ${esc(n.nome)}</label>
      <div class="scelta" id="agg">
        <button type="button" data-rel="genitore">Un genitore<small>padre o madre</small></button>
        <button type="button" data-rel="figlio">Un figlio<small>o una figlia</small></button>
        <button type="button" data-rel="coppia">Il coniuge<small>moglie, marito, compagno</small></button>
        <button type="button" data-rel="fratello">Un fratello<small>o una sorella</small></button>
      </div>
      <form id="nuovo" hidden>
        <div class="riga"><div style="flex:1"><label for="n-nome">Nome</label><input id="n-nome" required></div>
          <div style="flex:1"><label for="n-cognome">Cognome</label><input id="n-cognome" value="${esc(n.cognome ?? "")}"></div></div>
        <div class="riga"><div style="flex:1"><label for="n-na">Anno di nascita</label><input id="n-na" inputmode="numeric"></div>
          <div style="flex:1"><label for="n-mo">Anno di morte</label><input id="n-mo" inputmode="numeric" placeholder="se non c'è più"></div></div>
        <button class="btn ambra" style="margin-top:12px" id="n-ok">Aggiungi</button>
      </form>
      ${n.persona_id ? "" : `<button class="chip" id="elimina" style="margin-top:16px">Togli dall'albero</button>`}
    </div>`;

  const chiudi = () => { f.innerHTML = ""; };
  document.getElementById("velo").onclick = chiudi;
  document.getElementById("chiudi").onclick = chiudi;
  const anno = (v) => { const x = parseInt(v, 10); return x > 1000 && x < 2200 ? x : null; };

  document.getElementById("mod").onsubmit = async (e) => {
    e.preventDefault();
    await sb.from("albero_nodi").update({
      nome: document.getElementById("m-nome").value.trim(), cognome: document.getElementById("m-cognome").value.trim() || null,
      soprannome: document.getElementById("m-sopr").value.trim() || null, luogo: document.getElementById("m-luogo").value.trim() || null,
      anno_nascita: anno(document.getElementById("m-na").value), anno_morte: anno(document.getElementById("m-mo").value),
    }).eq("id", n.id);
    location.reload();
  };

  let rel = null;
  document.querySelectorAll("#agg button").forEach((b) => b.onclick = () => {
    rel = b.dataset.rel;
    document.querySelectorAll("#agg button").forEach((x) => x.classList.toggle("on", x === b));
    document.getElementById("nuovo").hidden = false;
    document.getElementById("n-nome").focus();
  });

  document.getElementById("nuovo").onsubmit = async (e) => {
    e.preventDefault();
    const { data: nuovo, error } = await sb.from("albero_nodi").insert({
      cerchia_id: cerchiaId, creato_da: state.io.id,
      nome: document.getElementById("n-nome").value.trim(), cognome: document.getElementById("n-cognome").value.trim() || null,
      anno_nascita: anno(document.getElementById("n-na").value), anno_morte: anno(document.getElementById("n-mo").value),
    }).select("id").single();
    if (error) { alert("Non salvato: " + error.message); return; }
    const lega = (da, a, tipo) => ({ cerchia_id: cerchiaId, da, a, tipo });
    const righe = [];
    if (rel === "genitore") {
      righe.push(lega(nuovo.id, n.id, "genitore"));
      // se c'è già l'altro genitore, i due diventano coppia
      for (const l of legami.filter((x) => x.tipo === "genitore" && x.a === n.id)) righe.push(lega(l.da, nuovo.id, "coppia"));
    } else if (rel === "figlio") {
      righe.push(lega(n.id, nuovo.id, "genitore"));
      for (const l of legami.filter((x) => x.tipo === "coppia" && (x.da === n.id || x.a === n.id))) {
        righe.push(lega(l.da === n.id ? l.a : l.da, nuovo.id, "genitore"));
      }
    } else if (rel === "coppia") {
      righe.push(lega(n.id, nuovo.id, "coppia"));
    } else if (rel === "fratello") {
      const gs = legami.filter((x) => x.tipo === "genitore" && x.a === n.id);
      if (!gs.length) {
        // senza genitori nell'albero: si crea un genitore da completare, così i fratelli restano legati
        const { data: g } = await sb.from("albero_nodi").insert({ cerchia_id: cerchiaId, creato_da: state.io.id,
          nome: "Genitore", cognome: n.cognome }).select("id").single();
        righe.push(lega(g.id, n.id, "genitore"), lega(g.id, nuovo.id, "genitore"));
      } else {
        for (const l of gs) righe.push(lega(l.da, nuovo.id, "genitore"));
      }
    }
    if (righe.length) await sb.from("albero_legami").insert(righe);
    location.reload();
  };

  document.getElementById("elimina")?.addEventListener("click", async () => {
    if (!confirm(`Togliere ${n.nome} dall'albero? Si tolgono anche i suoi legami.`)) return;
    await sb.from("albero_nodi").delete().eq("id", n.id);
    location.reload();
  });
}
