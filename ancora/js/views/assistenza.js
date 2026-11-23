// Assistenza: una chat tra te e noi. La vedete solo tu e chi ti risponde.
import { sb, state, $app, esc } from "../app.js";

export default async function () {
  $app().innerHTML = `
    <header class="testa"><a href="#/" aria-label="Indietro" style="font-size:22px;text-decoration:none">←</a><span class="logo" style="font-size:22px">Assistenza</span><span></span></header>
    <div id="fili" style="padding:12px 16px 120px;display:flex;flex-direction:column;gap:8px"></div>
    <form id="scrivi" style="position:fixed;left:0;right:0;bottom:calc(84px + env(safe-area-inset-bottom));display:flex;gap:8px;padding:10px 12px;background:#FBF8F2;border-top:1px solid var(--bordo);max-width:720px;margin:0 auto">
      <textarea id="testo" rows="1" maxlength="4000" placeholder="Scrivici qui…" style="flex:1;resize:none;margin:0;min-height:46px"></textarea>
      <button class="btn" style="width:auto;padding:0 18px;margin:0">Invia</button></form>`;
  const fili = document.getElementById("fili");
  const bolla = (da_noi, testo, il) => `<div style="align-self:${da_noi ? "flex-start" : "flex-end"};max-width:82%;padding:10px 14px;border-radius:18px;
      ${da_noi ? "background:#fff;border:1px solid var(--bordo);border-bottom-left-radius:6px" : "background:#2F5A55;color:#fff;border-bottom-right-radius:6px"}">
      <div style="white-space:pre-wrap;line-height:1.45">${testo}</div>
      ${il ? `<div style="font-size:11px;opacity:.65;margin-top:4px;text-align:right">${new Date(il).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>` : ""}</div>`;
  const benvenuto = bolla(true, `Ciao ${esc(state.io?.soprannome || state.io?.nome || "")}! Siamo l'assistenza di Ancora. Scrivici qualsiasi cosa: un dubbio, un problema, un'idea. Ti rispondiamo qui, di solito in giornata.\n\nIntanto, molte risposte sono nelle <a href="#/istruzioni">Istruzioni</a>.`);
  let ultimi = "";
  const carica = async () => {
    const { data } = await sb.from("assistenza").select("id, da_noi, testo, creato_il").order("creato_il").limit(500);
    const firma = (data ?? []).map((m) => m.id).join();
    if (firma === ultimi) return;
    ultimi = firma;
    fili.innerHTML = benvenuto + (data ?? []).map((m) => bolla(m.da_noi, esc(m.testo), m.creato_il)).join("");
    window.scrollTo(0, document.body.scrollHeight);
    if ((data ?? []).some((m) => m.da_noi)) sb.rpc("assistenza_letta").then(() => document.querySelectorAll(".pallino-assistenza").forEach((x) => x.remove()));
  };
  await carica();
  const giro = setInterval(() => { if (!location.hash.startsWith("#/assistenza")) return clearInterval(giro); if (!document.hidden) carica(); }, 15000);
  const t = document.getElementById("testo");
  t.oninput = () => { t.style.height = "auto"; t.style.height = Math.min(160, t.scrollHeight) + "px"; };
  document.getElementById("scrivi").onsubmit = async (e) => {
    e.preventDefault();
    const testo = t.value.trim(); if (!testo) return;
    const b = e.target.querySelector("button"); b.disabled = true;
    const { error } = await sb.from("assistenza").insert({ persona_id: state.io.id, testo });
    b.disabled = false;
    if (error) { alert("Non è partito. Riprova tra poco."); return; }
    t.value = ""; t.style.height = "auto"; await carica();
  };
}
