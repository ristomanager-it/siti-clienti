// Spese di famiglia: chi ha pagato cosa e chi deve quanto. #/spese?c=<cerchia>
import { sb, state, $app, esc, nomeDi } from "../app.js";

const euro = (c) => (c / 100).toLocaleString("it-IT", { style: "currency", currency: "EUR" });

export default async function ({ params } = {}) {
  let ricordata = null; try { ricordata = localStorage.getItem("ancora_cerchia"); } catch { /* niente */ }
  const cerchia = state.cerchie.find((c) => c.id === params?.c) ?? state.cerchie.find((c) => c.id === ricordata) ?? state.cerchie[0];
  if (!cerchia) { $app().innerHTML = `<header class="testa"><b style="font-family:Fraunces,serif;font-size:24px">Spese</b></header><p class="pad">Prima crea o entra in una famiglia.</p>`; return; }

  const [{ data: spese }, persone] = await Promise.all([
    sb.from("spese").select("*").eq("cerchia_id", cerchia.id).order("giorno", { ascending: false }).order("creato_il", { ascending: false }),
    membri(cerchia.id)]);
  const nome = (id) => id === state.io.id ? "Tu" : nomeDi(persone.find((p) => p.id === id) ?? { nome: "?" });

  // saldo: chi ha pagato ha dato, chi è nella divisione deve la sua parte
  const saldo = new Map(persone.map((p) => [p.id, 0]));
  for (const s of spese ?? []) {
    saldo.set(s.pagato_da, (saldo.get(s.pagato_da) ?? 0) + s.importo_cent);
    const parte = s.importo_cent / s.divisa_tra.length;
    for (const p of s.divisa_tra) saldo.set(p, (saldo.get(p) ?? 0) - parte);
  }
  // chi deve a chi, con il minor numero di passaggi
  const deb = [...saldo].filter(([, v]) => v < -50).map(([id, v]) => [id, -v]).sort((a, b) => b[1] - a[1]);
  const cre = [...saldo].filter(([, v]) => v > 50).sort((a, b) => b[1] - a[1]);
  const passaggi = [];
  for (let i = 0, j = 0; i < deb.length && j < cre.length;) {
    const q = Math.min(deb[i][1], cre[j][1]);
    passaggi.push({ da: deb[i][0], a: cre[j][0], cent: Math.round(q) });
    deb[i][1] -= q; cre[j][1] -= q;
    if (deb[i][1] < 50) i++; if (cre[j][1] < 50) j++;
  }
  const totale = (spese ?? []).filter((s) => !s.rimborso).reduce((t, s) => t + s.importo_cent, 0);

  $app().innerHTML = `
    <header class="testa"><b style="font-family:Fraunces,serif;font-size:24px;flex:1">Spese</b></header>
    <div class="pad" style="padding-top:0">
      ${state.cerchie.length > 1 ? `<select id="cerchia" aria-label="Famiglia" style="margin-bottom:12px">${state.cerchie.map((c) => `<option value="${c.id}" ${c.id === cerchia.id ? "selected" : ""}>${esc(c.nome)}</option>`).join("")}</select>` : `<p class="tenue" style="margin:0 0 10px">${esc(cerchia.nome)}</p>`}
      <div class="card" style="margin:0 0 14px">
        <div class="riga"><span class="tenue" style="flex:1">Spese in tutto</span><b style="font-family:Fraunces,serif;font-size:24px">${euro(totale)}</b></div>
        ${passaggi.length ? passaggi.map((x) => `<div class="riga" style="padding:8px 0;border-top:1px solid var(--bordo);gap:8px">
            <span style="flex:1"><b>${esc(nome(x.da))}</b> ${x.da === state.io.id ? "devi" : "deve"} <b>${euro(x.cent)}</b> a <b>${esc(nome(x.a))}</b></span>
            ${x.da === state.io.id || x.a === state.io.id ? `<button class="chip" style="margin:0" data-salda='${JSON.stringify(x)}'>Saldato</button>` : ""}</div>`).join("")
          : `<p style="margin:8px 0 0;color:#2F7A4F;font-weight:700">✓ Siete pari</p>`}
      </div>
      <button class="btn ambra" id="nuova">+ Aggiungi una spesa</button>
      <h2 style="padding-left:0">Movimenti</h2>
      ${(spese ?? []).map((s) => `<div style="display:flex;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid var(--bordo)">
          <span style="flex:1"><b>${esc(s.descrizione)}</b><br><span class="tenue" style="font-size:14px">${new Date(s.giorno).toLocaleDateString("it-IT", { day: "numeric", month: "short" })} · ${s.rimborso ? `${esc(nome(s.pagato_da))} → ${esc(nome(s.divisa_tra[0]))}` : `pagato da ${esc(nome(s.pagato_da))} · diviso tra ${s.divisa_tra.length}`}</span></span>
          <b>${euro(s.importo_cent)}</b>${s.autore_id === state.io.id ? `<button class="chip" data-togli="${s.id}" style="margin:0" aria-label="Togli">✕</button>` : ""}</div>`).join("") || `<p class="tenue">Ancora nessuna spesa.</p>`}
    </div>`;

  document.getElementById("cerchia")?.addEventListener("change", (e) => { location.hash = `#/spese?c=${e.target.value}`; });
  document.getElementById("nuova").onclick = () => nuovaSpesa(cerchia, persone);
  document.querySelectorAll("[data-togli]").forEach((b) => b.onclick = async () => { if (confirm("Togliere questa spesa?")) { await sb.from("spese").delete().eq("id", b.dataset.togli); location.reload(); } });
  document.querySelectorAll("[data-salda]").forEach((b) => b.onclick = async () => {
    const x = JSON.parse(b.dataset.salda);
    if (!confirm(`Confermi che ${nome(x.da)} ha dato ${euro(x.cent)} a ${nome(x.a)}?`)) return;
    await sb.from("spese").insert({ cerchia_id: cerchia.id, descrizione: "Rimborso", importo_cent: x.cent, pagato_da: x.da, divisa_tra: [x.a], rimborso: true, autore_id: state.io.id });
    location.reload();
  });
}

async function membri(cerchiaId) {
  const [{ data: m }, { data: c }] = await Promise.all([
    sb.from("cerchia_membri").select("persone(id, nome, cognome, soprannome)").eq("cerchia_id", cerchiaId).eq("stato", "attivo"),
    sb.from("cerchie").select("persone:proprietario_id(id, nome, cognome, soprannome)").eq("id", cerchiaId).single()]);
  const tutti = [...(m ?? []).map((x) => x.persone), c?.persone, state.io].filter(Boolean);
  return [...new Map(tutti.map((p) => [p.id, p])).values()];
}

function nuovaSpesa(cerchia, persone) {
  const f = document.createElement("div");
  f.innerHTML = `<div data-chiudi style="position:fixed;inset:0;background:rgba(18,48,44,.45);z-index:40"></div>
    <form style="position:fixed;left:0;right:0;bottom:0;z-index:41;max-height:90vh;overflow:auto;background:#FBF8F2;border-radius:24px 24px 0 0;padding:20px 18px calc(20px + env(safe-area-inset-bottom))">
      <div class="riga"><b style="flex:1;font-size:20px">Nuova spesa</b><button type="button" data-chiudi class="chip" style="margin:0">Chiudi</button></div>
      <label for="s-d">Per cosa</label><input id="s-d" required maxlength="120" placeholder="Casa al mare, regalo ai nonni, spesa">
      <label for="s-i">Quanto (€)</label><input id="s-i" required inputmode="decimal" placeholder="120,00">
      <label for="s-p">Chi ha pagato</label>
      <select id="s-p">${persone.map((p) => `<option value="${p.id}" ${p.id === state.io.id ? "selected" : ""}>${esc(p.id === state.io.id ? "Io" : nomeDi(p))}</option>`).join("")}</select>
      <label>Diviso tra</label>
      ${persone.map((p) => `<label class="riga" style="margin:8px 0;font-weight:700"><input type="checkbox" value="${p.id}" checked style="width:22px;height:22px"> ${esc(p.id === state.io.id ? "Io" : nomeDi(p))}</label>`).join("")}
      <button class="btn ambra" style="margin-top:12px">Aggiungi</button>
    </form>`;
  document.body.appendChild(f);
  f.querySelectorAll("[data-chiudi]").forEach((x) => x.onclick = () => f.remove());
  f.querySelector("form").onsubmit = async (e) => {
    e.preventDefault();
    const importo = Math.round(parseFloat(f.querySelector("#s-i").value.replace(/\./g, "").replace(",", ".")) * 100);
    const tra = [...f.querySelectorAll("input[type=checkbox]:checked")].map((c) => c.value);
    if (!(importo > 0)) { alert("Scrivi l'importo, es. 120,00"); return; }
    if (!tra.length) { alert("Scegli tra chi dividere."); return; }
    const { error } = await sb.from("spese").insert({ cerchia_id: cerchia.id, descrizione: f.querySelector("#s-d").value.trim(), importo_cent: importo,
      pagato_da: f.querySelector("#s-p").value, divisa_tra: tra, autore_id: state.io.id });
    if (error) { alert("Non salvata: " + error.message); return; }
    location.reload();
  };
}
