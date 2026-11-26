// 🧒 Account dei figli: il genitore segue l'account del figlio, alla luce del sole.
// #/figli → chi segui, chi ti segue, e "segui" per le persone della tua famiglia. #/figli?id=<figlio> → cosa pubblica e scrive.
import { sb, state, $app, esc, ICONE, urlMediaMolti } from "../app.js";

const quando = (d) => new Date(d).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const TIPI = { famiglia: "👨‍👩‍👧", amici: "🍻", coppia: "❤️", casa: "🏠", gruppo: "👥" };

export default async function ({ params }) {
  if (params?.id) return vista(params.id);
  const io = state.io.id;
  const { data: tutele } = await sb.from("tutele").select("id, genitore_id, figlio_id, stato, creata_il").or(`genitore_id.eq.${io},figlio_id.eq.${io}`);
  const famiglie = state.cerchie.filter((c) => c.tipo === "famiglia").map((c) => c.id);
  const { data: membri } = famiglie.length ? await sb.from("cerchia_membri").select("persona_id, persone(id, nome, cognome, soprannome)").in("cerchia_id", famiglie).eq("stato", "attivo") : { data: [] };
  const { data: proprietari } = famiglie.length ? await sb.from("cerchie").select("proprietario_id, persone:proprietario_id(id, nome, cognome, soprannome)").in("id", famiglie) : { data: [] };
  const persone = new Map();
  for (const m of [...(membri ?? []), ...(proprietari ?? [])]) if (m.persone && m.persone.id !== io) persone.set(m.persone.id, m.persone);
  const nome = (p) => `${p?.soprannome || p?.nome || ""} ${p?.soprannome ? "" : p?.cognome ?? ""}`.trim();
  const mie = (tutele ?? []).filter((t) => t.genitore_id === io && t.stato !== "chiusa");
  const suMe = (tutele ?? []).filter((t) => t.figlio_id === io && ["attiva", "richiesta"].includes(t.stato));
  const { data: nomiAltri } = suMe.length ? await sb.from("persone").select("id, nome, cognome, soprannome").in("id", suMe.map((t) => t.genitore_id)) : { data: [] };
  const daNome = (id) => nome((nomiAltri ?? []).find((p) => p.id === id) ?? persone.get(id));

  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/profilo" aria-label="Indietro">${ICONE.indietro}</a><b>Account dei figli</b><span style="width:44px"></span></header>
    <div class="pad" style="padding-top:0">
      <p class="tenue" style="margin-top:0">Segui l'account di tuo figlio: vedi quello che pubblica e scrive su Ancora, i suoi gruppi e chi c'è dentro. Lui lo sa sempre: glielo diciamo noi, e lo vede nel suo profilo.
        Se è minorenne il collegamento parte subito; se è maggiorenne deve accettare lui.</p>
      ${suMe.length ? `<h2 style="padding-left:0">Chi segue il tuo account</h2>${suMe.map((t) => `<div class="card" style="margin:0 0 10px">
        <b>👀 ${esc(daNome(t.genitore_id))}</b> ${t.stato === "attiva" ? "vede quello che pubblichi e scrivi" : "chiede di seguire il tuo account"}
        ${t.stato === "richiesta" ? `<div class="riga" style="gap:8px;margin-top:10px"><button class="btn ambra" data-si="${t.id}" style="margin:0">Accetto</button><button class="btn chiaro" data-no="${t.id}" style="margin:0">No</button></div>`
          : `<div style="margin-top:8px"><button class="chip" data-chiudi="${t.id}" style="margin:0">Interrompi</button></div>`}</div>`).join("")}` : ""}
      <h2 style="padding-left:0">Chi segui</h2>
      ${mie.length ? mie.map((t) => `<div class="card" style="margin:0 0 10px"><div class="riga"><b style="flex:1">${esc(nome(persone.get(t.figlio_id)) || "—")}</b>
          ${t.stato === "attiva" ? `<a class="btn ambra" href="#/figli?id=${t.figlio_id}" style="margin:0;width:auto;padding:0 18px">Apri</a>` : `<span class="tenue">${t.stato === "richiesta" ? "in attesa che accetti" : "ha detto di no"}</span>`}</div>
          <button class="chip" data-chiudi="${t.id}" style="margin:8px 0 0">Smetti di seguire</button></div>`).join("") : `<p class="tenue">Nessuno, per ora.</p>`}
      <h2 style="padding-left:0">Segui qualcuno della tua famiglia</h2>
      ${[...persone.values()].filter((p) => !mie.some((t) => t.figlio_id === p.id)).map((p) => `<div class="card riga" style="margin:0 0 8px"><b style="flex:1">${esc(nome(p))}</b>
        <button class="btn chiaro" data-segui="${p.id}" style="margin:0;width:auto;padding:0 18px">Segui</button></div>`).join("") || `<p class="tenue">Nella tua famiglia su Ancora non c'è nessun altro: prima invitali.</p>`}
      <div style="height:100px"></div>
    </div>`;
  const ricarica = () => import(import.meta.url).then((m) => m.default({ params: {} }));
  document.querySelectorAll("[data-segui]").forEach((b) => b.onclick = async () => {
    const p = persone.get(b.dataset.segui);
    if (!confirm(`Seguire l'account di ${nome(p)}? Lo avvisiamo noi: vedrà che lo segui.`)) return;
    const { data, error } = await sb.rpc("tutela_chiedi", { p_figlio: b.dataset.segui });
    if (error) return alert(error.message);
    alert(data === "attiva" ? "Fatto: ora puoi aprire il suo account. Gli abbiamo mandato un avviso." : "Richiesta mandata: quando accetta, lo trovi qui.");
    ricarica();
  });
  document.querySelectorAll("[data-si],[data-no]").forEach((b) => b.onclick = async () => {
    await sb.rpc("tutela_rispondi", { p_id: b.dataset.si ?? b.dataset.no, p_si: !!b.dataset.si }); ricarica();
  });
  document.querySelectorAll("[data-chiudi]").forEach((b) => b.onclick = async () => {
    if (!confirm("Chiudere il collegamento?")) return;
    const { error } = await sb.rpc("tutela_chiudi", { p_id: b.dataset.chiudi });
    if (error) alert(error.message); ricarica();
  });
}

async function vista(figlio) {
  $app().innerHTML = `<p class="pad tenue">Carico…</p>`;
  const { data: v, error } = await sb.rpc("tutela_vista", { p_figlio: figlio });
  if (error) { $app().innerHTML = `<div class="pad"><p>${esc(error.message)}</p><a class="btn" href="#/figli">Indietro</a></div>`; return; }
  const paths = [...v.ricordi.flatMap((r) => r.media.map((m) => m.path)), ...v.messaggi.filter((m) => m.media_path).map((m) => m.media_path)];
  const url = await urlMediaMolti(paths);
  const media = (path, tipo) => !url[path] ? "" : tipo === "foto" ? `<img src="${url[path]}" alt="" style="max-width:100%;border-radius:12px;margin-top:6px">`
    : tipo === "video" ? `<video src="${url[path]}" controls playsinline style="max-width:100%;border-radius:12px;margin-top:6px"></video>`
    : `<audio src="${url[path]}" controls style="width:100%;margin-top:6px"></audio>`;
  const p = v.persona ?? {};
  let scheda = "ricordi";
  const disegna = () => {
    document.getElementById("corpo-figlio").innerHTML = scheda === "gruppi"
      ? (v.gruppi.map((g) => `<div class="card" style="margin:0 0 10px"><b>${TIPI[g.tipo] ?? "👥"} ${esc(g.nome)}</b>${g.creato_da_lui ? ` <small class="tenue">· l'ha creato lui</small>` : ""}
          <div class="tenue" style="margin-top:4px">${g.membri.length ? esc(g.membri.join(", ")) : "Nessun altro dentro"}</div></div>`).join("") || `<p class="tenue">Nessun gruppo.</p>`)
      : scheda === "messaggi"
      ? (v.messaggi.map((m) => `<div class="card" style="margin:0 0 8px"><div class="tenue" style="font-size:13px">a ${esc(m.a ?? "—")} · ${quando(m.il)}</div>
          ${m.testo ? `<div style="white-space:pre-wrap">${esc(m.testo)}</div>` : ""}${m.media_path ? media(m.media_path, m.media_tipo) : ""}</div>`).join("") || `<p class="tenue">Nessun messaggio scritto.</p>`)
      : (v.ricordi.map((r) => `<div class="card" style="margin:0 0 10px"><div class="tenue" style="font-size:13px">${esc(r.dove ?? "")} · ${quando(r.il)}</div>
          ${r.testo ? `<div style="white-space:pre-wrap">${esc(r.testo)}</div>` : ""}${r.media.map((m) => media(m.path, m.tipo)).join("")}</div>`).join("") || `<p class="tenue">Non ha pubblicato niente.</p>`);
    document.querySelectorAll("[data-scheda]").forEach((b) => b.classList.toggle("on", b.dataset.scheda === scheda));
  };
  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/figli" aria-label="Indietro">${ICONE.indietro}</a><b>${esc(`${p.nome ?? ""} ${p.cognome ?? ""}`.trim())}</b><span style="width:44px"></span></header>
    <div class="pad" style="padding-top:0">
      <p class="tenue" style="margin-top:0">Ultimo accesso: ${p.ultimo_accesso ? quando(p.ultimo_accesso) : "—"} · Vedi quello che pubblica e scrive lui, non i contenuti degli altri.</p>
      <div style="display:flex;gap:6px;margin-bottom:12px">
        <button class="chip" data-scheda="ricordi" style="margin:0">Ricordi (${v.ricordi.length})</button>
        <button class="chip" data-scheda="messaggi" style="margin:0">Messaggi (${v.messaggi.length})</button>
        <button class="chip" data-scheda="gruppi" style="margin:0">Gruppi (${v.gruppi.length})</button></div>
      <div id="corpo-figlio"></div><div style="height:100px"></div></div>`;
  document.querySelectorAll("[data-scheda]").forEach((b) => b.onclick = () => { scheda = b.dataset.scheda; disegna(); });
  disegna();
}

/** Chiamata dalla home: chi è seguito lo sa (richiesta da accettare o avviso una volta). */
export async function avvisaFiglio(popup) {
  const { data } = await sb.from("tutele").select("id, genitore_id, stato").eq("figlio_id", state.io.id).in("stato", ["richiesta", "attiva"]);
  for (const t of data ?? []) {
    const chiave = `ancora_tutela_vista_${t.id}`;
    if (t.stato === "attiva") { try { if (localStorage.getItem(chiave)) continue; localStorage.setItem(chiave, "1"); } catch { continue; } }
    const { data: g } = await sb.from("persone").select("nome, soprannome").eq("id", t.genitore_id).maybeSingle();
    const chi = g?.soprannome || g?.nome || "Un genitore";
    if (t.stato === "richiesta") {
      popup({ titolo: `👀 ${chi} vuole seguire il tuo account`, testo: "Vedrebbe quello che pubblichi e scrivi su Ancora, e i tuoi gruppi. Puoi dire di sì o di no, e cambiare idea quando vuoi.",
        azioni: [{ t: "Accetto", fn: () => sb.rpc("tutela_rispondi", { p_id: t.id, p_si: true }) }, { t: "No", fn: () => sb.rpc("tutela_rispondi", { p_id: t.id, p_si: false }) }] });
    } else {
      popup({ titolo: `👀 ${chi} segue il tuo account`, testo: "Vede quello che pubblichi e scrivi su Ancora, e i tuoi gruppi. Lo trovi sempre in Profilo › Account dei figli.", azioni: [{ t: "Ho capito" }] });
    }
    return true;
  }
  return false;
}
