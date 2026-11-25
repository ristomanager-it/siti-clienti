// Campionati e tornei del gruppo o della famiglia: #/tornei?c=<gruppo> (elenco e nuovo) · #/tornei?id=<torneo>
// Le partite giocate dalla sfida ("Gioca ora") contano da sole: il risultato lo scrive il database a fine partita.
import { sb, state, $app, esc, ICONE } from "../app.js";

const GIOCHI = {
  briscola: { ic: "🃏", nome: "Briscola" }, tressette: { ic: "🂡", nome: "Tressette" }, biliardo: { ic: "🎱", nome: "Biliardo" },
  calcio: { ic: "⚽", nome: "Calciobalilla" }, auto: { ic: "🏎️", nome: "Corse" },
};

export default async function ({ params } = {}) {
  if (params?.id) return dettaglio(params.id);
  const gruppo = (params?.c && state.cerchie.find((c) => c.id === params.c)) ?? state.cerchie.find((c) => c.tipo === "famiglia") ?? state.cerchie[0];
  if (!gruppo) { $app().innerHTML = `<p class="pad">Prima entra in una famiglia o in un gruppo.</p>`; return; }
  const { data: tornei } = await sb.from("tornei").select("id, nome, gioco, formato, stato, partecipanti, creato_il, persone:vincitore(nome, soprannome)")
    .eq("cerchia_id", gruppo.id).order("creato_il", { ascending: false }).limit(40);
  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/giochi?c=${gruppo.id}" aria-label="Indietro">${ICONE.indietro}</a><b>🏆 Campionati e tornei</b><span style="width:44px"></span></header>
    <div class="pad" style="padding-bottom:120px">
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin:0 0 14px">${state.cerchie.map((c) => `<a href="#/tornei?c=${c.id}" class="chip ${c.id === gruppo.id ? "on" : ""}" style="margin:0;text-decoration:none">${esc(c.nome)}</a>`).join("")}</div>
      <button class="btn ambra" id="nuovo" style="margin:0 0 16px">➕ Nuovo campionato o torneo</button>
      ${(tornei ?? []).length ? (tornei ?? []).map((t) => `<a href="#/tornei?id=${t.id}" class="card" style="display:flex;gap:12px;align-items:center;margin:0 0 10px;text-decoration:none;color:inherit">
        <span style="font-size:32px">${GIOCHI[t.gioco]?.ic ?? "🏆"}</span>
        <span style="flex:1"><b style="display:block">${esc(t.nome)}</b><span class="tenue" style="font-size:14px">${t.formato === "campionato" ? "Campionato" : "Torneo a eliminazione"} · ${t.partecipanti.length} partecipanti</span>
        ${t.stato === "finito" ? `<div style="font-weight:800;color:#8A5A17">🏆 ${esc(t.persone?.soprannome || t.persone?.nome || "")}</div>` : `<div style="font-weight:700;color:#2F7A4F;font-size:14px">in corso</div>`}</span>
        <span style="font-size:22px">›</span></a>`).join("")
        : `<p class="tenue" style="text-align:center">Ancora nessuno. Il primo campionato di ${esc(gruppo.nome)} lo fai tu!</p>`}
    </div>`;
  document.getElementById("nuovo").onclick = () => nuovo(gruppo);
}

async function nuovo(gruppo) {
  const [{ data: membri }, { data: cer }] = await Promise.all([
    sb.from("cerchia_membri").select("persona_id, persone:persona_id(nome, soprannome)").eq("cerchia_id", gruppo.id).eq("stato", "attivo"),
    sb.from("cerchie").select("proprietario_id, persone:proprietario_id(nome, soprannome)").eq("id", gruppo.id).single(),
  ]);
  const persone = [...(cer ? [{ id: cer.proprietario_id, nome: cer.persone?.soprannome || cer.persone?.nome }] : []),
    ...(membri ?? []).map((m) => ({ id: m.persona_id, nome: m.persone?.soprannome || m.persone?.nome }))]
    .filter((p, i, a) => p.id && a.findIndex((q) => q.id === p.id) === i);
  let gioco = "briscola", formato = "campionato", gare = 5;
  const scelti = new Set([state.io.id]);
  const disegna = () => {
    setTimeout(() => {
      // il modulo sta sullo stesso indirizzo dell'elenco: il tasto indietro ridisegna l'elenco
      const ind = document.getElementById("indietro");
      if (ind) ind.onclick = (e) => { e.preventDefault(); window.scrollTo(0, 0); (async () => (await import(import.meta.url)).default({ params: { c: gruppo.id } }))(); };
    });
    const corse = gioco === "auto";
    if (corse) formato = "campionato";
    $app().innerHTML = `
      <header class="testa"><a class="icona" id="indietro" href="#/tornei?c=${gruppo.id}" aria-label="Indietro">${ICONE.indietro}</a><b>Nuovo campionato o torneo</b><span style="width:44px"></span></header>
      <div class="pad" style="padding-bottom:120px">
        <b>A cosa si gioca</b>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 16px">${Object.entries(GIOCHI).map(([k, g]) => `<button class="chip ${k === gioco ? "on" : ""}" data-g="${k}" style="margin:0">${g.ic} ${g.nome}</button>`).join("")}</div>
        <b>Come</b>
        <div style="display:grid;gap:8px;margin:8px 0 16px">
          <button class="card" data-f="campionato" style="margin:0;text-align:left;border:2px solid ${formato === "campionato" ? "#E8B56B" : "transparent"}"><b>📊 Campionato</b>
            <div class="tenue" style="font-size:14px">${corse ? "Una serie di gare con i punti della Formula 1 (25, 18, 15…): vince chi ne fa di più." : "Tutti contro tutti: 3 punti a chi vince, 1 a testa se si pareggia. Vince chi fa più punti."}</div></button>
          ${corse ? "" : `<button class="card" data-f="torneo" style="margin:0;text-align:left;border:2px solid ${formato === "torneo" ? "#E8B56B" : "transparent"}"><b>🏆 Torneo a eliminazione</b>
            <div class="tenue" style="font-size:14px">Tabellone con sorteggio: chi perde esce, fino alla finale.</div></button>`}
        </div>
        ${corse ? `<b>Quante gare</b><div style="display:flex;gap:6px;margin:8px 0 16px">${[3, 5, 8, 10].map((n) => `<button class="chip ${n === gare ? "on" : ""}" data-gare="${n}" style="margin:0">${n}</button>`).join("")}</div>` : ""}
        <b>Chi partecipa</b> <span class="tenue">(${scelti.size}${corse ? " · al massimo 6" : ""})</span>
        <div style="display:grid;gap:6px;margin:8px 0 16px">${persone.map((p) => `<label class="card" style="margin:0;display:flex;gap:10px;align-items:center;padding:10px 14px">
          <input type="checkbox" data-p="${p.id}" ${scelti.has(p.id) ? "checked" : ""} style="width:22px;height:22px"><b>${esc(p.nome ?? "")}${p.id === state.io.id ? " (tu)" : ""}</b></label>`).join("")}</div>
        <b>Il nome</b>
        <input id="nome" maxlength="80" value="${esc(`${formato === "campionato" ? "Campionato" : "Torneo"} di ${GIOCHI[gioco].nome.toLowerCase()} ${new Date().getFullYear()}`)}" style="width:100%;margin:8px 0 16px">
        <button class="btn ambra" id="crea">Si parte! 🏁</button>
        <p class="tenue" style="font-size:13px;text-align:center">Arriva la notifica a chi partecipa. Le partite giocate da qui contano da sole.</p>
      </div>`;
    document.querySelectorAll("[data-g]").forEach((b) => b.onclick = () => { gioco = b.dataset.g; disegna(); });
    document.querySelectorAll("[data-f]").forEach((b) => b.onclick = () => { formato = b.dataset.f; disegna(); });
    document.querySelectorAll("[data-gare]").forEach((b) => b.onclick = () => { gare = Number(b.dataset.gare); disegna(); });
    document.querySelectorAll("[data-p]").forEach((c) => c.onchange = () => { if (c.checked) scelti.add(c.dataset.p); else scelti.delete(c.dataset.p); disegna(); });
    document.getElementById("crea").onclick = async (e) => {
      if (scelti.size < 2) return alert("Scegli almeno 2 partecipanti.");
      if (gioco === "auto" && scelti.size > 6) return alert("Nelle corse si corre al massimo in 6.");
      e.target.disabled = true;
      const { data, error } = await sb.rpc("torneo_crea", { p_cerchia: gruppo.id, p_nome: document.getElementById("nome").value.trim() || "Campionato",
        p_gioco: gioco, p_formato: formato, p_partecipanti: [...scelti], p_gare: gare });
      if (error) { alert(error.message); e.target.disabled = false; return; }
      location.hash = `#/tornei?id=${data}`;
    };
  };
  disegna();
}

async function dettaglio(id) {
  const [{ data: t }, { data: inc }] = await Promise.all([
    sb.from("tornei").select("*, persone:vincitore(nome, soprannome)").eq("id", id).maybeSingle(),
    sb.from("tornei_incontri").select("*").eq("torneo_id", id).order("turno").order("ordine"),
  ]);
  if (!t) { $app().innerHTML = `<p class="pad">Non trovato.</p>`; return; }
  const nome = Object.fromEntries(t.partecipanti.map((p) => [p.persona_id, p.persona_id === state.io.id ? "Tu" : p.nome]));
  const n = (pid) => esc(nome[pid] ?? "—");
  const corse = t.gioco === "auto", io = state.io.id;
  // classifica
  const tab = Object.fromEntries(t.partecipanti.map((p) => [p.persona_id, { g: 0, v: 0, p: 0, s: 0, pt: 0, primi: 0 }]));
  for (const x of inc ?? []) {
    if (x.stato !== "giocato") continue;
    if (corse) {
      for (const [pid, pt] of Object.entries(x.risultato?.punti ?? {})) if (tab[pid]) { tab[pid].g++; tab[pid].pt += pt; }
      if (x.vincitore && tab[x.vincitore]) tab[x.vincitore].primi++;
      continue;
    }
    if (!x.a || !x.b) continue;
    for (const pid of [x.a, x.b]) if (tab[pid]) tab[pid].g++;
    if (!x.vincitore) { tab[x.a].p++; tab[x.b].p++; tab[x.a].pt++; tab[x.b].pt++; }
    else { tab[x.vincitore].v++; tab[x.vincitore].pt += 3; const per = x.vincitore === x.a ? x.b : x.a; if (tab[per]) tab[per].s++; }
  }
  const classifica = Object.entries(tab).sort((a, b) => b[1].pt - a[1].pt || b[1].v - a[1].v || b[1].primi - a[1].primi);
  const turni = Math.max(1, ...(inc ?? []).map((x) => x.turno));
  const nomeTurno = (k) => { const da = turni - k; return da === 0 ? "Finale" : da === 1 ? "Semifinali" : da === 2 ? "Quarti" : da === 3 ? "Ottavi" : `Turno ${k}`; };
  const azione = (x) => {
    if (x.stato === "giocato" || t.stato === "finito") return "";
    if (x.stato === "in_corso" && x.partita_id) return `<a class="chip on" href="#/${t.gioco}?id=${x.partita_id}" style="margin:0;text-decoration:none">${(corse || [x.a, x.b].includes(io)) ? "▶ Al tavolo" : "👀 Guarda"}</a>`;
    if (corse ? t.partecipanti.some((p) => p.persona_id === io) : [x.a, x.b].includes(io) && x.a && x.b) return `<button class="chip on" data-gioca="${x.id}" style="margin:0">▶ ${corse ? "Corri ora" : "Gioca ora"}</button>`;
    return `<span class="tenue" style="font-size:13px">da giocare</span>`;
  };
  const ris = (x) => x.stato === "giocato" && x.risultato && !corse ? `<b>${x.risultato.a ?? ""} – ${x.risultato.b ?? ""}</b>` : "";
  const riga = (x) => `<div class="card" style="margin:0 0 8px;display:flex;align-items:center;gap:10px;padding:10px 14px">
    <span style="flex:1">${corse ? `<b>Gara ${x.turno}</b>${x.stato === "giocato" ? `<div style="font-size:14px">${(x.risultato?.ordine ?? []).slice(0, 3).map((pid, i) => `${["🥇", "🥈", "🥉"][i]} ${n(pid)}`).join(" · ")}</div>` : ""}`
      : `<span style="${x.vincitore === x.a ? "font-weight:800" : ""}">${x.a ? n(x.a) : "?"}</span> <span class="tenue">contro</span> <span style="${x.vincitore === x.b ? "font-weight:800" : ""}">${x.b ? n(x.b) : t.formato === "torneo" && x.turno === 1 ? "<i>passa il turno</i>" : "?"}</span>`}</span>
    ${ris(x)} ${azione(x)}</div>`;

  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/tornei?c=${t.cerchia_id}" aria-label="Indietro">${ICONE.indietro}</a><b style="flex:1">${GIOCHI[t.gioco]?.ic ?? "🏆"} ${esc(t.nome)}</b></header>
    <div class="pad" style="padding-bottom:120px">
      ${t.stato === "finito" ? `<div class="card" style="text-align:center;background:#FFF6E8;border-color:#F0D5A8;margin:0 0 14px"><div style="font-size:48px">🏆</div>
        <b style="font-size:22px">${esc(t.persone?.soprannome || t.persone?.nome || "")}</b><div class="tenue">vince ${t.formato === "campionato" ? "il campionato" : "il torneo"}!</div></div>` : ""}
      <p class="tenue" style="margin-top:0">${t.formato === "campionato" ? (corse ? "Campionato a gare: 25, 18, 15, 12, 10, 8 punti in ordine d'arrivo." : "Tutti contro tutti: 3 punti a chi vince, 1 a testa se pari.") : "Torneo a eliminazione diretta: chi perde esce."}</p>
      ${t.formato === "campionato" ? `<h3 style="margin:8px 0">Classifica</h3>
        <div class="card" style="margin:0 0 16px;padding:8px 12px"><table style="width:100%;border-collapse:collapse;font-size:15px">
          <tr class="tenue" style="font-size:12px;text-align:right"><td style="text-align:left">#</td><td style="text-align:left"></td><td>G</td>${corse ? "<td>🥇</td>" : "<td>V</td><td>P</td><td>S</td>"}<td><b>Pt</b></td></tr>
          ${classifica.map(([pid, r], i) => `<tr style="text-align:right;${pid === io ? "background:#FFF6E8;" : ""}"><td style="text-align:left;padding:6px 0">${i + 1}</td><td style="text-align:left"><b>${n(pid)}</b></td><td>${r.g}</td>${corse ? `<td>${r.primi}</td>` : `<td>${r.v}</td><td>${r.p}</td><td>${r.s}</td>`}<td><b>${r.pt}</b></td></tr>`).join("")}
        </table></div>
        <h3 style="margin:8px 0">${corse ? "Le gare" : "Le sfide"}</h3>${(inc ?? []).map(riga).join("")}`
      : Array.from({ length: turni }, (_, k) => `<h3 style="margin:14px 0 8px">${nomeTurno(k + 1)}</h3>${(inc ?? []).filter((x) => x.turno === k + 1).map(riga).join("")}`).join("")}
    </div>`;
  document.querySelectorAll("[data-gioca]").forEach((b) => b.onclick = async () => {
    b.disabled = true;
    const { data, error } = await sb.rpc("torneo_gioca", { p_incontro: b.dataset.gioca });
    if (error) { alert(error.message); b.disabled = false; return; }
    location.hash = data.url;
  });
}
