// "Invita un amico": il tuo link personale. Per ogni amico che entra, +1 GB per te (fino a +10 GB).
import { sb, state, $app, esc } from "../app.js";

export default async function () {
  const [{ data: codice }, { data: spazio }] = await Promise.all([sb.rpc("mio_codice_amico"), sb.rpc("spazio_mio")]);
  const link = `${location.origin}${location.pathname}#/iscriviti?amico=${codice}`;
  const testo = `Ti invito su Ancora: la casa privata della famiglia, con chat, storie, foto, l'albero e il cloud dei ricordi. È gratis: ${link}`;
  const amici = spazio?.amici ?? 0;
  $app().innerHTML = `
    <header class="testa"><span class="logo" style="font-size:22px">Invita un amico</span><span style="flex:1"></span></header>
    <div class="pad" style="padding-top:0">
      <div class="card" style="margin:0 0 14px;background:var(--notte);color:#FBF3E2">
        <b style="font-family:Fraunces,serif;font-size:24px;line-height:1.2">+1 GB per ogni amico che entra</b>
        <p style="margin:6px 0 14px;color:#E2DACB">Fino a +10 GB, per sempre. Anche lui entra gratis, e può invitare i suoi.</p>
        <div style="display:flex;gap:4px">${Array.from({ length: 10 }, (_, i) =>
          `<span style="flex:1;height:8px;border-radius:4px;background:${i < amici ? "#C9832E" : "rgba(251,243,226,.2)"}"></span>`).join("")}</div>
        <p style="margin:8px 0 0;font-weight:700">${amici ? `${amici} ${amici === 1 ? "amico" : "amici"} · +${amici} GB guadagnati` : "Ancora nessun amico: comincia dal primo"}</p>
      </div>
      <a class="btn ambra" href="https://wa.me/?text=${encodeURIComponent(testo)}" target="_blank" rel="noopener">Invita con WhatsApp</a>
      <button class="btn chiaro" id="condividi" style="margin-top:10px">Condividi in altro modo</button>
      <p class="tenue" style="margin:16px 0 4px">Il tuo link</p>
      <p style="word-break:break-all;font-family:monospace;font-size:13px;background:#fff;border:1px solid var(--bordo);border-radius:12px;padding:10px;margin:0">${esc(link)}</p>
      <p style="margin-top:20px">Per far entrare qualcuno <b>in una tua famiglia o gruppo</b>, usa invece <a href="#/cerchie">Famiglie e cerchie → Invita</a>.</p>
    </div>`;
  document.getElementById("condividi").onclick = async () => {
    try { if (navigator.share) await navigator.share({ title: "Ancora", text: testo }); else { await navigator.clipboard.writeText(link); document.getElementById("condividi").textContent = "Link copiato ✓"; } }
    catch { /* annullato */ }
  };
}
