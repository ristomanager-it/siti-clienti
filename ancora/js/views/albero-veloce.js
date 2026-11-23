// L'albero in due minuti: una pagina sola con mamma, papà, nonni, coniuge, figli e fratelli.
// Pensata anche per i ragazzi: chiedono i nomi ai nonni e li scrivono qui. Chi è già nella famiglia si sceglie con un tocco.
import { sb, state, $app, esc, ICONE, seServePiu, personeConosciute } from "../app.js";

export default async function ({ params }) {
  const famiglie = state.cerchie.filter((c) => c.tipo === "famiglia");
  const cerchiaId = params.c ?? famiglie[0]?.id;
  const cerchia = famiglie.find((c) => c.id === cerchiaId);
  if (!cerchia) { location.replace("#/albero"); return; }

  const [{ data: nodi }, { data: legami }, conosciute] = await Promise.all([
    sb.from("albero_nodi").select("*").eq("cerchia_id", cerchiaId),
    sb.from("albero_legami").select("*").eq("cerchia_id", cerchiaId),
    personeConosciute(),
  ]);
  const N = nodi ?? [], L = legami ?? [];
  const io = N.find((n) => n.persona_id === state.io.id);
  const genitoriDi = (id) => L.filter((l) => l.tipo === "genitore" && l.a === id).map((l) => N.find((n) => n.id === l.da)).filter(Boolean);
  const figliDi = (id) => L.filter((l) => l.tipo === "genitore" && l.da === id).map((l) => N.find((n) => n.id === l.a)).filter(Boolean);
  const coniugeDi = (id) => L.filter((l) => l.tipo === "coppia" && (l.da === id || l.a === id)).map((l) => N.find((n) => n.id === (l.da === id ? l.a : l.da))).filter(Boolean);

  // chi c'è già: si mostra come fatto, si completa il resto
  const gen = io ? genitoriDi(io.id) : [];
  let mamma = gen.find((g) => g.sesso === "f") ?? null, papa = gen.find((g) => g.sesso === "m") ?? null;
  for (const g of gen.filter((x) => x !== mamma && x !== papa)) { if (!mamma) mamma = g; else if (!papa) papa = g; }
  const conj = io ? coniugeDi(io.id)[0] ?? null : null;
  const figli = io ? figliDi(io.id) : [];
  const fratelli = io ? [...new Set(gen.flatMap((g) => figliDi(g.id)))].filter((x) => x.id !== io.id) : [];
  const nonniDi = (p) => p ? genitoriDi(p.id) : [];
  const nome = (n) => `${n.nome} ${n.cognome ?? ""}`.trim();
  const mieiNomi = conosciute.filter((p) => p.id !== state.io.id);

  const campo = (id, etichetta, gia, sesso = "") => gia
    ? `<div class="riga" style="padding:10px 0;border-bottom:1px solid var(--bordo)"><span class="tenue" style="width:96px">${etichetta}</span><b style="flex:1">${esc(nome(gia))}</b><span aria-hidden="true">✓</span></div>`
    : `<div class="riga" style="gap:8px;padding:6px 0;border-bottom:1px solid var(--bordo)"><label for="${id}" class="tenue" style="width:96px;margin:0">${etichetta}</label>
        <input id="${id}" data-sesso="${sesso}" list="conosciuti" placeholder="Nome e cognome" style="flex:2;margin:0" autocomplete="off">
        <input id="${id}-a" inputmode="numeric" placeholder="Anno" style="width:72px;margin:0" maxlength="4"></div>`;
  const lista = (id, etichetta, gia) => `
    ${gia.map((g) => campo("", etichetta, g)).join("")}
    <div id="${id}-righe"></div>
    <button type="button" class="chip" data-aggiungi="${id}" data-etichetta="${etichetta}" style="margin:8px 0 0">+ ${etichetta.toLowerCase()}</button>`;

  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/albero?c=${cerchiaId}" aria-label="Indietro">${ICONE.indietro}</a><b>L'albero in 2 minuti</b><span style="width:44px"></span></header>
    <form class="pad" id="f" style="padding-top:4px">
      <p class="tenue" style="margin-top:0">Scrivi solo i nomi che sai: il resto si completa dopo, anche insieme agli altri. Non sai i nonni? Chiedili a mamma e papà, o ai nonni stessi: è un bel modo per farsi raccontare.</p>
      <datalist id="conosciuti">${mieiNomi.map((p) => `<option value="${esc(`${p.nome} ${p.cognome ?? ""}`.trim())}">`).join("")}</datalist>
      <h2 style="margin:16px 0 4px">I tuoi genitori</h2>
      ${campo("mamma", "Mamma", mamma, "f")}${campo("papa", "Papà", papa, "m")}
      <h2 style="margin:18px 0 4px">I nonni</h2>
      ${campo("nm1", "Nonna (mamma)", nonniDi(mamma).find((x) => x.sesso === "f") ?? nonniDi(mamma)[0], "f")}
      ${campo("nm2", "Nonno (mamma)", nonniDi(mamma).find((x) => x.sesso === "m") ?? nonniDi(mamma)[1], "m")}
      ${campo("np1", "Nonna (papà)", nonniDi(papa).find((x) => x.sesso === "f") ?? nonniDi(papa)[0], "f")}
      ${campo("np2", "Nonno (papà)", nonniDi(papa).find((x) => x.sesso === "m") ?? nonniDi(papa)[1], "m")}
      <h2 style="margin:18px 0 4px">La tua famiglia</h2>
      ${campo("conj", "Moglie, marito", conj)}
      ${lista("figlio", "Figlio o figlia", figli)}
      <h2 style="margin:18px 0 4px">Fratelli e sorelle</h2>
      ${lista("fratello", "Fratello o sorella", fratelli)}
      <button class="btn ambra" style="margin-top:20px">Metti tutti nell'albero</button>
      <p id="esito" role="status"></p>
    </form>`;

  let k = 0;
  document.querySelectorAll("[data-aggiungi]").forEach((b) => {
    const aggiungi = () => {
      const id = `${b.dataset.aggiungi}-${k++}`;
      document.getElementById(`${b.dataset.aggiungi}-righe`).insertAdjacentHTML("beforeend", campo(id, b.dataset.etichetta, null));
      document.getElementById(id).dataset.gruppo = b.dataset.aggiungi;
    };
    b.onclick = () => { aggiungi(); document.querySelector(`#${b.dataset.aggiungi}-righe input:last-of-type`)?.focus(); };
    if (b.dataset.aggiungi === "figlio" && !figli.length) aggiungi();
    if (b.dataset.aggiungi === "fratello" && !fratelli.length) aggiungi();
  });

  document.getElementById("f").onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector(".btn"), esito = document.getElementById("esito");
    btn.disabled = true; esito.textContent = "Metto tutti al loro posto…";
    const anno = (v) => { const x = parseInt(v, 10); return x > 1000 && x < 2200 ? x : null; };
    const leggi = (el) => {
      const testo = el.value.trim(); if (!testo) return null;
      const membro = mieiNomi.find((p) => `${p.nome} ${p.cognome ?? ""}`.trim().toLowerCase() === testo.toLowerCase());
      const [n, ...c] = testo.split(/\s+/);
      return { cerchia_id: cerchiaId, creato_da: state.io.id, persona_id: membro?.id ?? null,
        nome: membro?.nome ?? n, cognome: membro?.cognome ?? (c.join(" ") || null),
        sesso: el.dataset.sesso || null, anno_nascita: anno(document.getElementById(el.id + "-a")?.value) };
    };
    try {
      // io: c'è già o lo creo
      let me = io;
      if (!me) {
        const { data, error } = await sb.from("albero_nodi").insert({ cerchia_id: cerchiaId, persona_id: state.io.id, nome: state.io.nome,
          cognome: state.io.cognome, nascita: state.io.data_nascita, creato_da: state.io.id }).select("*").single();
        if (error) throw error; me = data;
      }
      const crea = async (el) => {
        const r = el && leggi(el); if (!r) return null;
        const { data, error } = await sb.from("albero_nodi").insert(r).select("*").single();
        if (error) throw error; return data;
      };
      const $ = (id) => document.getElementById(id);
      let M = mamma ?? await crea($("mamma")), P = papa ?? await crea($("papa"));
      const nm = [await crea($("nm1")), await crea($("nm2"))].filter(Boolean);
      const np = [await crea($("np1")), await crea($("np2"))].filter(Boolean);
      // nonni senza il genitore in mezzo: un genitore da completare li collega
      const segnaposto = async (nomeS, sesso) => { const { data, error } = await sb.from("albero_nodi").insert({ cerchia_id: cerchiaId, creato_da: state.io.id, nome: nomeS, sesso }).select("*").single(); if (error) throw error; return data; };
      if (nm.length && !M) M = await segnaposto("Mamma", "f");
      if (np.length && !P) P = await segnaposto("Papà", "m");
      const C = conj ?? await crea($("conj"));
      const nuoviFigli = [], nuoviFratelli = [];
      for (const el of document.querySelectorAll('[data-gruppo="figlio"]')) { const x = await crea(el); if (x) nuoviFigli.push(x); }
      for (const el of document.querySelectorAll('[data-gruppo="fratello"]')) { const x = await crea(el); if (x) nuoviFratelli.push(x); }

      const righe = [];
      const lega = (da, a, tipo) => { if (da && a && da.id !== a.id) righe.push({ cerchia_id: cerchiaId, da: da.id, a: a.id, tipo }); };
      for (const g of [M, P]) lega(g, me, "genitore");
      if (M && P) lega(M, P, "coppia");
      for (const g of nm) lega(g, M, "genitore"); if (nm.length === 2) lega(nm[0], nm[1], "coppia");
      for (const g of np) lega(g, P, "genitore"); if (np.length === 2) lega(np[0], np[1], "coppia");
      if (C) lega(me, C, "coppia");
      for (const f of nuoviFigli) { lega(me, f, "genitore"); if (C) lega(C, f, "genitore"); }
      // fratelli: figli degli stessi genitori (se non ci sono, un genitore da completare li tiene insieme)
      let genitori = [M, P].filter(Boolean);
      if (nuoviFratelli.length && !genitori.length) {
        const { data: g } = await sb.from("albero_nodi").insert({ cerchia_id: cerchiaId, creato_da: state.io.id, nome: "Genitore", cognome: me.cognome }).select("*").single();
        genitori = [g]; lega(g, me, "genitore");
      }
      for (const f of nuoviFratelli) for (const g of genitori) lega(g, f, "genitore");
      // i genitori già nell'albero ma appena aggiunti a me? i legami doppi si ignorano
      if (righe.length) {
        const { error } = await sb.from("albero_legami").upsert(righe, { onConflict: "da,a,tipo", ignoreDuplicates: true });
        if (error) throw error;
      }
      location.replace(`#/albero?c=${cerchiaId}`);
    } catch (err) {
      btn.disabled = false;
      if (!seServePiu(err)) esito.innerHTML = `<span class="errore">Non sono riuscito a salvare tutto (${esc(err.message ?? err)}). Quelli già salvati restano: riprova per gli altri.</span>`;
    }
  };
}
