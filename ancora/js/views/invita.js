// "Invita e guadagna": il tuo link personale e i premi per chi porta gente su Ancora.
// Ogni 3 persone: 1 mese di Ancora+ (fino a 12) · alla terza famiglia nuova: 1 anno · quando una famiglia portata
// passa ad Ancora+: il 20% (rimborsato sulla carta a chi paga Ancora+, in giorni di Ancora+ a chi non paga). E +1 GB a persona.
import { sb, state, $app, esc } from "../app.js";

const euro = (c) => (c / 100).toFixed(2).replace(".", ",") + " €";

export default async function () {
  const [{ data: codice }, { data: spazio }, { data: pr }] = await Promise.all([sb.rpc("mio_codice_amico"), sb.rpc("spazio_mio"), sb.rpc("premi_miei")]);
  const link = `${location.origin}${location.pathname}#/iscriviti?amico=${codice}`;
  const testo = `Ti invito su Ancora: la casa privata della famiglia, con chat, storie, foto, l'albero e le voci dei nonni che restano per sempre. È gratis: ${link}`;
  const persone = pr?.persone ?? 0, famiglie = pr?.famiglie ?? 0, mesi = pr?.mesi ?? 0;
  const versoMese = mesi >= 12 ? 3 : persone % 3;
  const barra = (pieni, tot, colore = "#C9832E") => `<div style="display:flex;gap:4px;margin-top:8px">${Array.from({ length: tot }, (_, i) =>
    `<span style="flex:1;height:9px;border-radius:5px;background:${i < pieni ? colore : "rgba(18,48,44,.12)"}"></span>`).join("")}</div>`;
  const storico = (pr?.premi ?? []).map((p) => {
    const cosa = p.tipo === "percentuale"
      ? (p.modo === "stripe" ? `${euro(p.cent)} ${p.stato === "applicato" ? "rimborsati sulla tua carta" : "in arrivo sulla tua carta"}` : `${p.giorni} giorni di Ancora+`)
      : p.tipo === "anno" ? (p.modo === "stripe" ? `${euro(p.cent)} rimborsati (un anno)` : "1 anno di Ancora+") : (p.modo === "stripe" ? `${euro(p.cent)} rimborsati (un mese)` : "1 mese di Ancora+");
    return `<div style="padding:8px 0;border-top:1px solid var(--bordo)"><b>🎁 ${esc(cosa)}</b><br><span class="tenue" style="font-size:14px">${esc(p.motivo ?? "")} · ${new Date(p.il).toLocaleDateString("it-IT")}</span></div>`;
  }).join("");

  $app().innerHTML = `
    <header class="testa"><span class="logo" style="font-size:22px">Invita e guadagna</span><span style="flex:1"></span></header>
    <div class="pad" style="padding-top:0">
      <div class="card" style="margin:0 0 14px;background:var(--notte);color:#FBF3E2">
        <b style="font-family:Fraunces,serif;font-size:25px;line-height:1.2">Porta la tua gente su Ancora:<br>Ancora+ te lo regaliamo noi.</b>
        <p style="margin:8px 0 0;color:#E2DACB">Chi entra col tuo link è gratis. Tu guadagni a ogni passo.</p>
      </div>

      <div class="card" style="margin:0 0 10px">
        <b style="font-size:18px">👨‍👩‍👧 Ogni 3 persone: 1 mese di Ancora+</b>
        <p class="tenue" style="margin:4px 0 0">Parenti, amici, chiunque entri col tuo invito o col tuo link. Fino a 12 mesi.</p>
        ${barra(versoMese, 3)}
        <p style="margin:8px 0 0;font-weight:700">${persone} ${persone === 1 ? "persona portata" : "persone portate"} · ${mesi} ${mesi === 1 ? "mese guadagnato" : "mesi guadagnati"}${mesi < 12 ? ` · ancora ${3 - versoMese} per il prossimo` : ""}</p>
      </div>

      <div class="card" style="margin:0 0 10px">
        <b style="font-size:18px">🏡 3 famiglie nuove: 1 anno di Ancora+</b>
        <p class="tenue" style="margin:4px 0 0">Quando tre persone che hai portato aprono la loro famiglia su Ancora (i suoceri, tuo fratello, un'amica).</p>
        ${barra(Math.min(3, famiglie), 3, "#2F7A4F")}
        <p style="margin:8px 0 0;font-weight:700">${pr?.anno ? "✓ Anno guadagnato" : `${famiglie} su 3`}</p>
      </div>

      <div class="card" style="margin:0 0 14px;background:#FFF6E8;border-color:#F0D5A8">
        <b style="font-size:18px">💶 Il 20% quando passano ad Ancora+</b>
        <p style="margin:4px 0 0">Se una famiglia che hai portato si abbona, il 20% del suo primo pagamento è tuo.
          Se paghi Ancora+ te lo <b>rimborsiamo sulla carta</b>; se no diventa giorni di Ancora+ gratis (99 € → circa 73 giorni).</p>
      </div>

      <a class="btn ambra" href="https://wa.me/?text=${encodeURIComponent(testo)}" target="_blank" rel="noopener">Invita con WhatsApp</a>
      <button class="btn chiaro" id="condividi" style="margin-top:10px">Condividi in altro modo</button>
      <a class="btn chiaro" href="#/locandina" style="margin-top:10px">🖨️ Stampa la locandina col tuo codice</a>
      <p class="tenue" style="margin:16px 0 4px">Il tuo link</p>
      <p style="word-break:break-all;font-family:monospace;font-size:13px;background:#fff;border:1px solid var(--bordo);border-radius:12px;padding:10px;margin:0">${esc(link)}</p>
      <p class="tenue" style="margin-top:12px;font-size:14px">Valgono anche gli inviti in famiglia e nei gruppi (<a href="#/cerchie">Famiglie e cerchie → Invita</a>) e chi entra dalle tue cartoline, ricette e tombole.
        In più, per ogni persona: +1 GB di spazio per te (fino a +10 GB${spazio?.amici ? `, ne hai ${spazio.amici}` : ""}).</p>
      ${storico ? `<h2 style="padding-left:0">I tuoi premi</h2>${storico}` : ""}
      <div style="height:100px"></div>
    </div>`;
  document.getElementById("condividi").onclick = async () => {
    try { if (navigator.share) await navigator.share({ title: "Ancora", text: testo }); else { await navigator.clipboard.writeText(link); document.getElementById("condividi").textContent = "Link copiato ✓"; } }
    catch { /* annullato */ }
  };
}
