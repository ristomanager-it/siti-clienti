// Domande per te: la tua domanda personale e, per ogni famiglia (non per gli amici), la domanda della settimana.
// Ci si arriva dalla notifica, dalla chat (in cima) o dal menu: la bacheca resta per i post.
import { sb, state, $app, esc, avatar, settimana, ICONE } from "../app.js";

export default async function () {
  const sett = settimana();
  const famiglie = state.cerchie.filter((c) => c.tipo === "famiglia");
  const [{ data: d }, { data: domande }] = await Promise.all([sb.rpc("mia_domanda", { p_altra: false }), sb.from("domande_famiglia").select("id, testo").order("id")]);
  const fd = domande?.length ? domande[sett.numero % domande.length] : null;
  const risposte = {};
  if (fd) for (const f of famiglie) {
    const { data } = await sb.from("ricordi").select("id, autore_id, persone:autore_id(id, nome, soprannome)").eq("cerchia_id", f.id).eq("domanda_settimana", sett.codice);
    risposte[f.id] = data ?? [];
  }
  const tua = !d ? "" : `<div class="card" style="border-left:4px solid var(--ambra)">
    <span style="font-size:12px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:#8A5A17">${d.chiesta_da ? `${esc(d.chiesta_da)} ti chiede` : "La tua domanda"}</span>
    <b style="display:block;font-family:Fraunces,serif;font-size:21px;line-height:1.3;margin:6px 0 12px">${esc(d.testo)}</b>
    ${d.fatta ? `<div class="riga" style="gap:8px"><span class="tenue" style="flex:1">✓ Hai risposto. La prossima arriva la settimana prossima.</span><button class="chip" id="altra" style="margin:0">Un'altra</button></div>`
      : `<div class="riga" style="gap:8px"><a class="btn ambra" style="flex:1;min-height:46px" href="#/racconta?domanda=${d.id}">Rispondi a voce</a><button class="chip" id="altra" style="margin:0">Cambia</button></div>`}
    ${state.adulto && !state.io.domande_su_misura ? `<a href="#/profilo?s=su-misura" class="tenue" style="display:block;margin-top:10px;font-size:14px">Vuoi domande su misura, che partono da quello che racconti?</a>` : ""}</div>`;
  const perFamiglia = !fd ? "" : famiglie.map((f) => {
    const r = risposte[f.id] ?? [], io = r.some((x) => x.autore_id === state.io.id);
    return `<div class="card" style="background:#F4E6CF">
      <span style="font-size:12px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:#8A5A17">La domanda della settimana · ${esc(f.nome)}</span>
      <b style="display:block;font-family:Fraunces,serif;font-size:20px;line-height:1.3;margin:6px 0 10px">${esc(fd.testo)}</b>
      <div style="display:flex;align-items:center;gap:6px;font-size:13px">${r.slice(0, 6).map((x) => avatar(x.persone, 26)).join("")}
        <span>${r.length ? `${r.length} ${r.length === 1 ? "ha risposto" : "hanno risposto"}` : "Nessuno ha ancora risposto: comincia tu"}</span></div>
      <div class="riga" style="gap:8px;margin-top:12px">
        ${io ? "" : `<a class="btn ambra" style="flex:1;min-height:46px" href="#/racconta?settimana=${sett.codice}&c=${f.id}&q=${fd.id}">Rispondi a voce</a>`}
        ${r.length ? `<a class="btn chiaro" style="flex:1;min-height:46px" href="#/settimana?c=${f.id}&s=${sett.codice}&q=${fd.id}">Ascolta le risposte</a>` : ""}</div></div>`;
  }).join("");
  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/chat" aria-label="Indietro">${ICONE.indietro}</a><b style="flex:1;font-family:Fraunces,serif;font-size:22px">Domande per te</b></header>
    <div class="pad" style="display:grid;gap:14px">${tua}${perFamiglia}${!tua && !perFamiglia ? `<p class="tenue">Nessuna domanda per ora.</p>` : ""}</div>`;
  document.getElementById("altra")?.addEventListener("click", async () => { await sb.rpc("mia_domanda", { p_altra: true }); location.reload(); });
}
