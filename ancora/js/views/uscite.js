// 🎉 Le uscite del gruppo: cena, serata, viaggio. Chi c'è, il conto, chi ha pagato.
// I soldi non passano da Ancora: si paga direttamente a chi organizza (IBAN, PayPal.me, Revolut.me) e si segna "ho pagato".
// #/uscite?c=<gruppo> → elenco · #/uscite?c=<gruppo>&nuova=1 → nuova · #/uscita?id=<uscita> → la pagina dell'uscita
import { sb, state, $app, esc, ICONE, nomeDi } from "../app.js";

const euro = (c) => (c / 100).toLocaleString("it-IT", { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 }) + " €";
const quandoTesto = (d) => d ? new Date(d).toLocaleString("it-IT", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Data da decidere";
const centesimi = (v) => { const n = Number(String(v ?? "").replace(/[^\d,.-]/g, "").replace(",", ".")); return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null; };
const pulisciIban = (s) => String(s ?? "").replace(/\s+/g, "").toUpperCase();
const ultimoPagamento = () => { try { return JSON.parse(localStorage.getItem("ancora_mio_pagamento") ?? "{}"); } catch { return {}; } };

export default async function ({ params }) {
  if (params?.id) return pagina(params.id);
  const gruppo = state.cerchie.find((c) => c.id === params?.c) ?? state.cerchie[0];
  if (!gruppo) { $app().innerHTML = `<p class="pad">Prima entra in un gruppo.</p>`; return; }
  if (params?.nuova || params?.modifica) return modulo(gruppo, params.modifica);
  const { data: lista } = await sb.from("uscite").select("id, titolo, quando, dove, annullata, creato_da, uscite_adesioni(persona_id, risposta)")
    .eq("cerchia_id", gruppo.id).order("quando", { ascending: false, nullsFirst: true }).limit(60);
  const ora = Date.now();
  const prossime = (lista ?? []).filter((u) => !u.annullata && (!u.quando || new Date(u.quando).getTime() > ora - 6 * 3600e3)).reverse();
  const passate = (lista ?? []).filter((u) => !prossime.includes(u));
  const riga = (u) => {
    const si = u.uscite_adesioni.filter((a) => a.risposta === "si").length, mia = u.uscite_adesioni.find((a) => a.persona_id === state.io.id)?.risposta;
    return `<a href="#/uscita?id=${u.id}" class="card" style="display:block;margin:0 0 10px;text-decoration:none;color:inherit;${u.annullata ? "opacity:.5" : ""}">
      <div class="riga"><b style="flex:1;font-size:18px">${esc(u.titolo)}</b>${u.annullata ? `<span class="chip" style="margin:0">annullata</span>` : mia ? `<span class="chip ${mia === "si" ? "on" : ""}" style="margin:0">${mia === "si" ? "ci sei" : mia === "no" ? "non ci sei" : "forse"}</span>` : `<span class="chip" style="margin:0;background:#FFE9C7">rispondi</span>`}</div>
      <div class="tenue" style="margin-top:4px">📅 ${esc(quandoTesto(u.quando))}${u.dove ? ` · 📍 ${esc(u.dove)}` : ""} · 👥 ${si}</div></a>`;
  };
  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/?c=${gruppo.id}" aria-label="Indietro">${ICONE.indietro}</a><b>🎉 Uscite · ${esc(gruppo.nome)}</b><span style="width:44px"></span></header>
    <div class="pad" style="padding-top:0">
      <a class="btn ambra" href="#/uscite?c=${gruppo.id}&nuova=1" style="margin:0 0 16px">+ Organizza un'uscita</a>
      ${prossime.length ? `<h2 style="padding-left:0">In programma</h2>${prossime.map(riga).join("")}` : `<p class="tenue">Niente in programma. Una cena, una serata, un viaggio: crea l'uscita, il gruppo risponde chi c'è e alla fine dividete il conto.</p>`}
      ${passate.length ? `<h2 style="padding-left:0">Già fatte</h2>${passate.map(riga).join("")}` : ""}
      <div style="height:100px"></div></div>`;
}

async function modulo(gruppo, idModifica) {
  let u = null;
  if (idModifica) ({ data: u } = await sb.from("uscite").select("*").eq("id", idModifica).maybeSingle());
  const pag = u?.pagamento ?? ultimoPagamento();
  const locale = (d) => { if (!d) return ""; const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };
  $app().innerHTML = `
    <header class="testa"><a class="icona" href="${u ? `#/uscita?id=${u.id}` : `#/uscite?c=${gruppo.id}`}" aria-label="Indietro">${ICONE.indietro}</a><b>${u ? "Modifica l'uscita" : "Nuova uscita"}</b><span style="width:44px"></span></header>
    <form id="f" class="pad" style="padding-top:0">
      <label>Cosa si fa</label><input id="titolo" required maxlength="80" placeholder="Cena da Corrado, Calcetto, Weekend a Napoli…" value="${esc(u?.titolo ?? "")}">
      <label>Quando</label><input id="quando" type="datetime-local" value="${locale(u?.quando)}">
      <label>Dove</label><input id="dove" maxlength="120" placeholder="Il posto o l'indirizzo" value="${esc(u?.dove ?? "")}">
      <label>Note</label><textarea id="note" rows="2" placeholder="Cosa portare, a che ora ci si vede…">${esc(u?.note ?? "")}</textarea>
      <div class="card" style="margin:16px 0 0">
        <b>💶 I soldi (se servono)</b>
        <div class="riga" style="gap:8px;margin:10px 0 0">
          <label class="riga" style="margin:0;gap:6px;font-weight:700"><input type="radio" name="tipo" value="nessuno" ${!u?.quota_cent && !u?.totale_cent ? "checked" : ""}> Niente</label>
          <label class="riga" style="margin:0;gap:6px;font-weight:700"><input type="radio" name="tipo" value="quota" ${u?.quota_cent ? "checked" : ""}> A testa</label>
          <label class="riga" style="margin:0;gap:6px;font-weight:700"><input type="radio" name="tipo" value="totale" ${u?.totale_cent ? "checked" : ""}> Conto da dividere</label></div>
        <input id="importo" inputmode="decimal" placeholder="Importo in €" value="${u?.quota_cent ? (u.quota_cent / 100).toString().replace(".", ",") : u?.totale_cent ? (u.totale_cent / 100).toString().replace(".", ",") : ""}" style="margin-top:10px">
        <p class="tenue" style="font-size:13px;margin:6px 0 0">"Conto da dividere": lo scrivi anche dopo, e si divide tra chi ha detto che c'è.</p>
        <label style="margin-top:12px">Dove ti pagano</label>
        <input id="iban" placeholder="IBAN" value="${esc(pag.iban ?? "")}" autocomplete="off">
        <input id="intestatario" placeholder="Intestato a" value="${esc(pag.intestatario ?? "")}" style="margin-top:8px">
        <input id="paypal" placeholder="Nome PayPal.me (facoltativo)" value="${esc(pag.paypal ?? "")}" style="margin-top:8px">
        <input id="revolut" placeholder="Nome Revolut.me (facoltativo)" value="${esc(pag.revolut ?? "")}" style="margin-top:8px">
        <p class="tenue" style="font-size:13px;margin:6px 0 0">I soldi vanno direttamente a te: Ancora non li tocca. Questi dati li vede solo il gruppo.</p></div>
      <button class="btn ambra" style="margin-top:16px">${u ? "Salva" : "Crea e avvisa il gruppo"}</button>
      <div style="height:100px"></div></form>`;
  document.getElementById("f").onsubmit = async (e) => {
    e.preventDefault();
    const tipo = document.querySelector("[name=tipo]:checked").value, imp = centesimi(document.getElementById("importo").value);
    const pagamento = { iban: pulisciIban(document.getElementById("iban").value) || undefined, intestatario: document.getElementById("intestatario").value.trim() || undefined,
      paypal: document.getElementById("paypal").value.trim().replace(/^.*paypal\.me\//i, "").replace(/\/.*$/, "") || undefined,
      revolut: document.getElementById("revolut").value.trim().replace(/^.*revolut\.me\//i, "").replace(/[/?].*$/, "").replace(/^@/, "") || undefined };
    if (tipo !== "nessuno" && !pagamento.iban && !pagamento.paypal && !pagamento.revolut) return alert("Scrivi almeno un modo per pagarti: IBAN, PayPal o Revolut.");
    try { localStorage.setItem("ancora_mio_pagamento", JSON.stringify(pagamento)); } catch { /* niente */ }
    const q = document.getElementById("quando").value;
    const { data: id, error } = await sb.rpc("uscita_salva", { p_id: u?.id ?? null, p_cerchia: gruppo.id, p_titolo: document.getElementById("titolo").value,
      p_quando: q ? new Date(q).toISOString() : null, p_dove: document.getElementById("dove").value, p_note: document.getElementById("note").value,
      p_quota_cent: tipo === "quota" ? imp : null, p_totale_cent: tipo === "totale" ? imp : null, p_pagamento: pagamento });
    if (error) return alert("Non salvata: " + error.message);
    location.hash = `#/uscita?id=${id}`;
  };
}

async function pagina(id) {
  const [{ data: u }, { data: quota }] = await Promise.all([
    sb.from("uscite").select("*, uscite_adesioni(persona_id, risposta, pagato_il, ricevuto_il, persone(nome, cognome, soprannome))").eq("id", id).maybeSingle(),
    sb.rpc("uscita_quota", { p_uscita: id })]);
  if (!u) { $app().innerHTML = `<div class="pad"><p>Uscita non trovata.</p><a class="btn" href="#/">Home</a></div>`; return; }
  const io = state.io.id, organizzo = u.creato_da === io;
  const ad = u.uscite_adesioni ?? [], mia = ad.find((a) => a.persona_id === io);
  const nome = (a) => a.persona_id === io ? "Tu" : nomeDi(a.persone ?? {});
  const org = ad.find((a) => a.persona_id === u.creato_da);
  const gruppi = { si: ad.filter((a) => a.risposta === "si"), forse: ad.filter((a) => a.risposta === "forse"), no: ad.filter((a) => a.risposta === "no") };
  const soldi = !!(u.quota_cent || u.totale_cent), p = u.pagamento ?? {};
  const devo = soldi && !organizzo && mia?.risposta === "si" && quota > 0;
  const linkPaypal = p.paypal ? `https://paypal.me/${encodeURIComponent(p.paypal)}/${(quota / 100).toFixed(2)}EUR` : null;
  const linkRevolut = p.revolut ? `https://revolut.me/${encodeURIComponent(p.revolut)}` : null;
  const daIncassare = soldi && organizzo ? gruppi.si.filter((a) => a.persona_id !== io) : [];

  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/uscite?c=${u.cerchia_id}" aria-label="Indietro">${ICONE.indietro}</a><b>🎉 Uscita</b>${organizzo && !u.annullata ? `<a class="icona" href="#/uscite?c=${u.cerchia_id}&modifica=${u.id}" aria-label="Modifica" style="font-size:20px">✏️</a>` : `<span style="width:44px"></span>`}</header>
    <div class="pad" style="padding-top:0">
      <h1 style="margin:0;font-family:Fraunces,serif;font-size:30px;line-height:1.15">${esc(u.titolo)}</h1>
      ${u.annullata ? `<p style="color:var(--rosso);font-weight:800">Annullata</p>` : ""}
      <p style="margin:8px 0 0;font-size:17px">📅 <b>${esc(quandoTesto(u.quando))}</b></p>
      ${u.dove ? `<p style="margin:4px 0 0;font-size:17px">📍 <a href="https://maps.google.com/?q=${encodeURIComponent(u.dove)}" target="_blank" rel="noopener">${esc(u.dove)}</a></p>` : ""}
      <p class="tenue" style="margin:4px 0 0">Organizza ${esc(org ? nome(org) : "—")}</p>
      ${u.note ? `<p style="white-space:pre-wrap;margin:10px 0 0">${esc(u.note)}</p>` : ""}

      ${u.annullata ? "" : `<div class="card" style="margin:16px 0 0">
        <b>Ci sei?</b>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:10px">${[["si", "👍 Ci sono"], ["forse", "🤔 Forse"], ["no", "👎 No"]].map(([k, t]) =>
          `<button class="btn ${mia?.risposta === k ? "ambra" : "chiaro"}" data-risp="${k}" style="margin:0;min-height:48px;padding:0 6px">${t}</button>`).join("")}</div></div>`}

      ${devo ? `<div class="card" style="margin:12px 0 0;background:${mia.ricevuto_il ? "#E8F4EC" : "#FFF6E8"}">
        <b style="font-size:18px">${mia.ricevuto_il ? "✅ Pagato, confermato" : mia.pagato_il ? "⏳ Hai pagato, in attesa di conferma" : `💶 Devi ${euro(quota)} a ${esc(org ? nome(org) : "chi organizza")}`}</b>
        ${!mia.ricevuto_il ? `<div style="margin-top:10px;display:grid;gap:8px">
          ${p.iban ? `<button class="btn chiaro" data-copia="${esc(p.iban)}" style="margin:0">🏦 Copia IBAN ${esc(p.iban.slice(0, 4))}…${esc(p.iban.slice(-4))}${p.intestatario ? ` · ${esc(p.intestatario)}` : ""}</button>` : ""}
          ${linkPaypal ? `<a class="btn chiaro" href="${linkPaypal}" target="_blank" rel="noopener" style="margin:0">Paga con PayPal · ${euro(quota)}</a>` : ""}
          ${linkRevolut ? `<a class="btn chiaro" href="${linkRevolut}" target="_blank" rel="noopener" style="margin:0">Paga con Revolut · ${euro(quota)}</a>` : ""}
          <button class="btn ${mia.pagato_il ? "chiaro" : "ambra"}" id="ho-pagato" style="margin:0">${mia.pagato_il ? "Non ho ancora pagato" : "✓ Ho pagato"}</button></div>` : ""}</div>` : ""}

      ${soldi ? `<p class="tenue" style="margin:12px 0 0">💶 ${u.quota_cent ? `${euro(u.quota_cent)} a testa` : `Conto ${euro(u.totale_cent)} diviso tra ${gruppi.si.length}: ${euro(quota)} a testa`}</p>` : ""}

      ${daIncassare.length ? `<div class="card" style="margin:12px 0 0"><b>Chi ti deve pagare</b>
        ${daIncassare.map((a) => `<div class="riga" style="padding:8px 0;border-top:1px solid var(--bordo)"><span style="flex:1">${esc(nome(a))} · ${euro(quota)}</span>
          ${a.ricevuto_il ? `<span class="chip on" style="margin:0">✅ ricevuto</span>` : `<button class="chip ${a.pagato_il ? "on" : ""}" data-ricevuto="${a.persona_id}" style="margin:0">${a.pagato_il ? "Dice di aver pagato · conferma" : "Segna ricevuto"}</button>`}</div>`).join("")}
        <p class="tenue" style="margin:8px 0 0;font-size:14px">Incassati ${daIncassare.filter((a) => a.ricevuto_il).length} su ${daIncassare.length}</p></div>` : ""}

      <h2 style="padding-left:0">👥 Chi c'è · ${gruppi.si.length}</h2>
      <p style="margin:0">${gruppi.si.map((a) => esc(nome(a))).join(", ") || "Ancora nessuno"}</p>
      ${gruppi.forse.length ? `<p class="tenue" style="margin:8px 0 0">🤔 Forse: ${gruppi.forse.map((a) => esc(nome(a))).join(", ")}</p>` : ""}
      ${gruppi.no.length ? `<p class="tenue" style="margin:4px 0 0">👎 Non ci sono: ${gruppi.no.map((a) => esc(nome(a))).join(", ")}</p>` : ""}

      ${organizzo && !u.annullata ? `<div style="margin-top:24px">
        ${u.totale_cent == null && !u.quota_cent ? `<button class="btn chiaro" id="conto" style="margin:0 0 8px">🧾 Scrivi il conto da dividere</button>` : ""}
        <button class="chip" id="annulla" style="margin:0;color:var(--rosso)">Annulla l'uscita</button></div>` : ""}
      <div style="height:100px"></div></div>`;

  const ricarica = () => pagina(id);
  document.querySelectorAll("[data-risp]").forEach((b) => b.onclick = async () => { await sb.rpc("uscita_rispondi", { p_uscita: id, p_risposta: b.dataset.risp }); ricarica(); });
  document.getElementById("ho-pagato")?.addEventListener("click", async () => { await sb.rpc("uscita_pagato", { p_uscita: id, p_si: !mia.pagato_il }); ricarica(); });
  document.querySelectorAll("[data-ricevuto]").forEach((b) => b.onclick = async () => { await sb.rpc("uscita_ricevuto", { p_uscita: id, p_persona: b.dataset.ricevuto, p_si: true }); ricarica(); });
  document.querySelectorAll("[data-copia]").forEach((b) => b.onclick = async () => {
    try { await navigator.clipboard.writeText(b.dataset.copia); b.textContent = "✓ IBAN copiato: incollalo nella tua banca"; } catch { prompt("Copia l'IBAN:", b.dataset.copia); }
  });
  document.getElementById("annulla")?.addEventListener("click", async () => { if (confirm("Annullare l'uscita?")) { await sb.rpc("uscita_annulla", { p_uscita: id }); ricarica(); } });
  document.getElementById("conto")?.addEventListener("click", async () => {
    const v = centesimi(prompt("Quanto è venuto il conto in tutto? (es. 240)"));
    if (!v) return;
    if (!p.iban && !p.paypal && !p.revolut) { alert("Prima aggiungi come pagarti (IBAN, PayPal o Revolut): tocca ✏️ in alto."); return; }
    const { error } = await sb.rpc("uscita_salva", { p_id: id, p_cerchia: u.cerchia_id, p_titolo: u.titolo, p_quando: u.quando, p_dove: u.dove ?? "", p_note: u.note ?? "",
      p_quota_cent: null, p_totale_cent: v, p_pagamento: p });
    if (error) alert(error.message); ricarica();
  });
}

/** Per la home del gruppo: le prossime uscite, con "ci sei?" a un tocco. */
export async function prossimeUscite(cerchia) {
  const { data } = await sb.from("uscite").select("id, titolo, quando, dove, uscite_adesioni(persona_id, risposta)")
    .eq("cerchia_id", cerchia).eq("annullata", false).gte("quando", new Date(Date.now() - 6 * 3600e3).toISOString()).order("quando").limit(3);
  return (data ?? []).map((u) => {
    const si = u.uscite_adesioni.filter((a) => a.risposta === "si").length, mia = u.uscite_adesioni.find((a) => a.persona_id === state.io.id)?.risposta;
    return `<a href="#/uscita?id=${u.id}" class="card" style="display:flex;gap:12px;align-items:center;margin:0 16px 10px;text-decoration:none;color:inherit;border:2px solid ${mia ? "transparent" : "#E8B56B"}">
      <span style="font-size:30px">🎉</span><span style="flex:1;min-width:0"><b style="display:block">${esc(u.titolo)}</b>
      <span class="tenue" style="font-size:14px">${esc(quandoTesto(u.quando))} · 👥 ${si}${mia ? "" : " · <b style='color:var(--ambra)'>ci sei?</b>"}</span></span><span style="font-size:22px">›</span></a>`;
  }).join("");
}
