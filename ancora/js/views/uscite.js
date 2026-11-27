// 🎉 Le uscite del gruppo: cena, serata, viaggio. Chi c'è, il conto, chi ha pagato.
// I soldi non passano da Ancora: si paga direttamente a chi organizza (IBAN, PayPal.me, Revolut.me) e si segna "ho pagato".
// #/uscite?c=<gruppo> → elenco · #/uscite?c=<gruppo>&nuova=1 → nuova · #/uscita?id=<uscita> → la pagina dell'uscita
import { sb, state, $app, esc, ICONE, nomeDi, urlMediaMolti } from "../app.js";

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
  // chi c'è nel gruppo (per le sorprese: a chi nasconderla)
  const [{ data: mem }, { data: cer }] = await Promise.all([
    sb.from("cerchia_membri").select("persona_id, persone(nome, cognome, soprannome)").eq("cerchia_id", gruppo.id).eq("stato", "attivo"),
    sb.from("cerchie").select("proprietario_id, persone:proprietario_id(nome, cognome, soprannome)").eq("id", gruppo.id).maybeSingle()]);
  const membri = new Map();
  for (const m of [...(mem ?? []), ...(cer ? [{ persona_id: cer.proprietario_id, persone: cer.persone }] : [])]) if (m.persona_id !== state.io.id) membri.set(m.persona_id, m.persone);
  const nascosti = new Set(u?.nascosta_a ?? []);
  const locale = (d) => { if (!d) return ""; const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };
  $app().innerHTML = `
    <header class="testa"><a class="icona" href="${u ? `#/uscita?id=${u.id}` : `#/uscite?c=${gruppo.id}`}" aria-label="Indietro">${ICONE.indietro}</a><b>${u ? "Modifica l'uscita" : "Nuova uscita"}</b><span style="width:44px"></span></header>
    <form id="f" class="pad" style="padding-top:0">
      <label>Cosa si fa</label><input id="titolo" required maxlength="80" placeholder="Cena da Corrado, Calcetto, Weekend a Napoli…" value="${esc(u?.titolo ?? "")}">
      <label>Quando</label><input id="quando" type="datetime-local" value="${locale(u?.quando)}">
      <label>Dove</label><input id="dove" maxlength="120" placeholder="Il posto o l'indirizzo" value="${esc(u?.dove ?? "")}">
      <label>Note</label><textarea id="note" rows="2" placeholder="Cosa portare, a che ora ci si vede…">${esc(u?.note ?? "")}</textarea>
      ${membri.size ? `<div class="card" style="margin:16px 0 0">
        <b>🤫 È una sorpresa?</b>
        <p class="tenue" style="margin:4px 0 8px;font-size:14px">Tocca chi non deve saperlo (es. il festeggiato): per lui quest'uscita non esiste, niente notifiche, niente di niente.</p>
        <div>${[...membri].map(([id, p]) => `<button type="button" class="chip ${nascosti.has(id) ? "on" : ""}" data-nascondi="${id}">${nascosti.has(id) ? "🤫 " : ""}${esc(nomeDi(p ?? {}))}</button>`).join("")}</div></div>` : ""}
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
        <input id="satispay" inputmode="tel" placeholder="Numero Satispay (facoltativo)" value="${esc(pag.satispay ?? "")}" style="margin-top:8px">
        <p class="tenue" style="font-size:13px;margin:6px 0 0">I soldi vanno direttamente a te: Ancora non li tocca. Questi dati li vede solo il gruppo.</p></div>
      <button class="btn ambra" style="margin-top:16px">${u ? "Salva" : "Crea e avvisa il gruppo"}</button>
      <div style="height:100px"></div></form>`;
  document.querySelectorAll("[data-nascondi]").forEach((b) => b.onclick = () => {
    const id = b.dataset.nascondi; nascosti.has(id) ? nascosti.delete(id) : nascosti.add(id);
    b.classList.toggle("on", nascosti.has(id)); b.textContent = (nascosti.has(id) ? "🤫 " : "") + nomeDi(membri.get(id) ?? {});
  });
  document.getElementById("f").onsubmit = async (e) => {
    e.preventDefault();
    const tipo = document.querySelector("[name=tipo]:checked").value, imp = centesimi(document.getElementById("importo").value);
    const pagamento = { iban: pulisciIban(document.getElementById("iban").value) || undefined, intestatario: document.getElementById("intestatario").value.trim() || undefined,
      paypal: document.getElementById("paypal").value.trim().replace(/^.*paypal\.me\//i, "").replace(/\/.*$/, "") || undefined,
      revolut: document.getElementById("revolut").value.trim().replace(/^.*revolut\.me\//i, "").replace(/[/?].*$/, "").replace(/^@/, "") || undefined,
      satispay: document.getElementById("satispay").value.replace(/[^\d+]/g, "") || undefined };
    if (tipo !== "nessuno" && !pagamento.iban && !pagamento.paypal && !pagamento.revolut && !pagamento.satispay) return alert("Scrivi almeno un modo per pagarti: IBAN, PayPal, Revolut o Satispay.");
    try { localStorage.setItem("ancora_mio_pagamento", JSON.stringify(pagamento)); } catch { /* niente */ }
    const q = document.getElementById("quando").value;
    const { data: id, error } = await sb.rpc("uscita_salva", { p_id: u?.id ?? null, p_cerchia: gruppo.id, p_titolo: document.getElementById("titolo").value,
      p_quando: q ? new Date(q).toISOString() : null, p_dove: document.getElementById("dove").value, p_note: document.getElementById("note").value,
      p_quota_cent: tipo === "quota" ? imp : null, p_totale_cent: tipo === "totale" ? imp : null, p_pagamento: pagamento, p_nascosta_a: [...nascosti] });
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
  const { data: nn } = (u.nascosta_a ?? []).length ? await sb.from("persone").select("nome, soprannome").in("id", u.nascosta_a) : { data: [] };
  const nascostiNomi = (nn ?? []).map((x) => x.soprannome || x.nome).join(", ") || "qualcuno";

  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/uscite?c=${u.cerchia_id}" aria-label="Indietro">${ICONE.indietro}</a><b>🎉 Uscita</b>${organizzo && !u.annullata ? `<a class="icona" href="#/uscite?c=${u.cerchia_id}&modifica=${u.id}" aria-label="Modifica" style="font-size:20px">✏️</a>` : `<span style="width:44px"></span>`}</header>
    <div class="pad" style="padding-top:0">
      <h1 style="margin:0;font-family:Fraunces,serif;font-size:30px;line-height:1.15">${esc(u.titolo)}</h1>
      ${u.annullata ? `<p style="color:var(--rosso);font-weight:800">Annullata</p>` : ""}
      <p style="margin:8px 0 0;font-size:17px">📅 <b>${esc(quandoTesto(u.quando))}</b></p>
      ${u.dove ? `<p style="margin:4px 0 0;font-size:17px">📍 <a href="https://maps.google.com/?q=${encodeURIComponent(u.dove)}" target="_blank" rel="noopener">${esc(u.dove)}</a></p>` : ""}
      <p class="tenue" style="margin:4px 0 0">Organizza ${esc(org ? nome(org) : "—")}</p>
      ${(u.nascosta_a ?? []).length ? `<p style="margin:10px 0 0;padding:10px 12px;border-radius:12px;background:#F3E8FF;font-weight:700">🤫 Sorpresa: ${esc(nascostiNomi)} non la vede. Acqua in bocca!</p>` : ""}
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
          ${p.satispay ? `<button class="btn chiaro" data-satispay="${esc(p.satispay)}" style="margin:0">Paga con Satispay · ${euro(quota)} al ${esc(p.satispay)}</button>` : ""}
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

      <h2 style="padding-left:0">📸 Le foto della serata</h2>
      <div id="usc-foto"><p class="tenue">Carico…</p></div>

      ${organizzo && !u.annullata ? `<div style="margin-top:24px">
        ${u.totale_cent == null && !u.quota_cent ? `<button class="btn chiaro" id="conto" style="margin:0 0 8px">🧾 Scrivi il conto da dividere</button>` : ""}
        <button class="chip" id="annulla" style="margin:0;color:var(--rosso)">Annulla l'uscita</button></div>` : ""}
      <div style="height:100px"></div></div>`;

  const ricarica = () => pagina(id);
  fotoSerata(u);
  document.querySelectorAll("[data-risp]").forEach((b) => b.onclick = async () => { await sb.rpc("uscita_rispondi", { p_uscita: id, p_risposta: b.dataset.risp }); ricarica(); });
  document.getElementById("ho-pagato")?.addEventListener("click", async () => { await sb.rpc("uscita_pagato", { p_uscita: id, p_si: !mia.pagato_il }); ricarica(); });
  document.querySelectorAll("[data-ricevuto]").forEach((b) => b.onclick = async () => { await sb.rpc("uscita_ricevuto", { p_uscita: id, p_persona: b.dataset.ricevuto, p_si: true }); ricarica(); });
  document.querySelectorAll("[data-copia]").forEach((b) => b.onclick = async () => {
    try { await navigator.clipboard.writeText(b.dataset.copia); b.textContent = "✓ IBAN copiato: incollalo nella tua banca"; } catch { prompt("Copia l'IBAN:", b.dataset.copia); }
  });
  // Satispay: si paga ai contatti col numero di telefono. Copio il numero e apro l'app.
  document.querySelectorAll("[data-satispay]").forEach((b) => b.onclick = async () => {
    try { await navigator.clipboard.writeText(b.dataset.satispay); } catch { /* niente */ }
    b.textContent = `✓ Numero copiato: in Satispay scegli "Invia" e incollalo`;
    location.href = "satispay://";
  });
  document.getElementById("annulla")?.addEventListener("click", async () => { if (confirm("Annullare l'uscita?")) { await sb.rpc("uscita_annulla", { p_uscita: id }); ricarica(); } });
  document.getElementById("conto")?.addEventListener("click", async () => {
    const v = centesimi(prompt("Quanto è venuto il conto in tutto? (es. 240)"));
    if (!v) return;
    if (!p.iban && !p.paypal && !p.revolut && !p.satispay) { alert("Prima aggiungi come pagarti (IBAN, PayPal, Revolut o Satispay): tocca ✏️ in alto."); return; }
    const { error } = await sb.rpc("uscita_salva", { p_id: id, p_cerchia: u.cerchia_id, p_titolo: u.titolo, p_quando: u.quando, p_dove: u.dove ?? "", p_note: u.note ?? "",
      p_quota_cent: null, p_totale_cent: v, p_pagamento: p, p_nascosta_a: u.nascosta_a ?? [] });
    if (error) alert(error.message); ricarica();
  });
}

// le foto e i video di tutti (anche di chi non ha Ancora, col link), e il film della serata
async function fotoSerata(u) {
  const box = document.getElementById("usc-foto"); if (!box) return;
  const { data: al } = await sb.from("album_eventi").select("id, codice").eq("uscita_id", u.id).maybeSingle();
  const { data: foto } = al ? await sb.from("album_foto").select("id, path, mime, nome_ospite").eq("album_id", al.id).order("creato_il") : { data: [] };
  const url = await urlMediaMolti((foto ?? []).map((f) => f.path));
  const lista = (foto ?? []).filter((f) => url[f.path]);
  box.innerHTML = `
    ${lista.length ? `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-bottom:10px">${lista.slice(0, 12).map((f, i) =>
      `<div data-film="${i}" style="aspect-ratio:1;border-radius:10px;overflow:hidden;background:#000;position:relative;cursor:pointer">${(f.mime ?? "").startsWith("video")
        ? `<video src="${url[f.path]}#t=0.5" muted playsinline preload="metadata" style="width:100%;height:100%;object-fit:cover"></video><span style="position:absolute;inset:0;display:grid;place-items:center;color:#fff;font-size:26px">▶</span>`
        : `<img src="${url[f.path]}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover">`}</div>`).join("")}</div>
      ${lista.length > 12 ? `<p class="tenue" style="margin:0 0 8px">e altre ${lista.length - 12}</p>` : ""}` : `<p class="tenue" style="margin-top:0">Ancora nessuna foto. Durante la serata ognuno mette le sue: alla fine ci sono tutte, in un posto solo.</p>`}
    ${lista.length >= 3 ? `<button class="btn ambra" id="film" style="margin:0 0 8px">🎬 Guarda il film della serata</button>` : ""}
    <button class="btn ${lista.length >= 3 ? "chiaro" : "ambra"}" id="aggiungi-foto" style="margin:0 0 8px">📸 Aggiungi le tue foto e video</button>
    <button class="btn chiaro" id="link-foto" style="margin:0">🔗 Link per chi non ha Ancora</button>`;
  const prendiAlbum = async () => { const { data, error } = await sb.rpc("uscita_album", { p_uscita: u.id }); if (error) { alert(error.message); return null; } return data; };
  document.getElementById("aggiungi-foto").onclick = async () => { const a = await prendiAlbum(); if (a) location.hash = `#/evento/${a.codice}`; };
  document.getElementById("link-foto").onclick = async () => {
    const a = await prendiAlbum(); if (!a) return;
    const link = `${location.origin}${location.pathname}#/evento/${a.codice}`;
    const testo = `📸 Le foto di "${u.titolo}": mettiamole tutte qui, senza scaricare niente 👇\n${link}`;
    try { if (navigator.share) await navigator.share({ text: testo }); else { await navigator.clipboard.writeText(link); alert("Link copiato"); } } catch { /* annullato */ }
  };
  const apri = (da = 0) => film(u, lista, url, da);
  document.getElementById("film")?.addEventListener("click", () => apri(0));
  box.querySelectorAll("[data-film]").forEach((d) => d.onclick = () => apri(Number(d.dataset.film)));
}

// il film: le foto a tutto schermo che si muovono piano e sfumano una nell'altra, i video brevi in mezzo
function film(u, lista, url, da = 0) {
  const o = document.createElement("div");
  o.style.cssText = "position:fixed;inset:0;z-index:80;background:#000;color:#fff;overflow:hidden";
  o.innerHTML = `<style>
    @keyframes kb1{from{transform:scale(1.05) translate(0,0)}to{transform:scale(1.22) translate(-3%,-2%)}}
    @keyframes kb2{from{transform:scale(1.2) translate(-2%,2%)}to{transform:scale(1.04) translate(2%,0)}}
    .scena{position:absolute;inset:0;opacity:0;transition:opacity 1s ease}.scena.on{opacity:1}
    .scena img,.scena video{width:100%;height:100%;object-fit:cover}</style>
    <div id="palco" style="position:absolute;inset:0"></div>
    <div style="position:absolute;left:0;right:0;bottom:0;padding:18px 18px calc(22px + env(safe-area-inset-bottom));background:linear-gradient(transparent,rgba(0,0,0,.65));pointer-events:none">
      <div style="font:700 26px Fraunces,serif">${esc(u.titolo)}</div>
      <div style="opacity:.85">${u.quando ? new Date(u.quando).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : ""}${u.dove ? ` · ${esc(u.dove)}` : ""}</div></div>
    <div id="barretta" style="position:absolute;top:calc(10px + env(safe-area-inset-top));left:12px;right:60px;display:flex;gap:3px">${lista.map(() => `<i style="flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.35)"></i>`).join("")}</div>
    <button id="chiudi-film" aria-label="Chiudi" style="position:absolute;top:calc(2px + env(safe-area-inset-top));right:8px;width:44px;height:44px;border:0;background:none;color:#fff;font-size:28px">×</button>`;
  document.body.appendChild(o);
  const palco = o.querySelector("#palco"), tacche = [...o.querySelectorAll("#barretta i")];
  let i = da, timer = null, chiuso = false;
  const mostra = () => {
    if (chiuso) return;
    if (i >= lista.length) { i = 0; }
    tacche.forEach((t, k) => t.style.background = k <= i ? "#fff" : "rgba(255,255,255,.35)");
    const f = lista[i], video = (f.mime ?? "").startsWith("video");
    const sc = document.createElement("div"); sc.className = "scena";
    sc.innerHTML = video ? `<video src="${url[f.path]}" playsinline muted autoplay></video>`
      : `<img src="${url[f.path]}" alt="" style="animation:${i % 2 ? "kb2" : "kb1"} 5s ease-out forwards">`;
    palco.appendChild(sc); requestAnimationFrame(() => requestAnimationFrame(() => sc.classList.add("on")));
    [...palco.children].slice(0, -2).forEach((x) => x.remove());
    let durata = 4000;
    if (video) { const v = sc.querySelector("video"); v.onloadedmetadata = () => { clearTimeout(timer); timer = setTimeout(avanti, Math.min(8000, (v.duration || 4) * 1000)); }; durata = 8000; }
    timer = setTimeout(avanti, durata);
  };
  const avanti = () => { clearTimeout(timer); i++; mostra(); };
  palco.onclick = (e) => { clearTimeout(timer); i = e.clientX < innerWidth / 3 ? Math.max(0, i - 1) : i + 1; mostra(); };
  o.querySelector("#chiudi-film").onclick = () => { chiuso = true; clearTimeout(timer); o.remove(); };
  mostra();
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
