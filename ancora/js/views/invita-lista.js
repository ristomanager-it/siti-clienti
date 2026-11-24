// Invita più persone insieme: #/invita-lista?c=<gruppo>
// Si fa la lista (a mano o dalla rubrica, dove il telefono lo permette), poi un solo invio:
// si apre UN messaggio SMS già pronto con tutti i numeri (si manda dal proprio telefono, gratis).
// Per chi preferisce WhatsApp: dalla stessa lista, un tocco per persona.
import { sb, state, $app, esc, ICONE } from "../app.js";

const CHIAVE = "ancora_lista_inviti";
const pulisci = (n) => { let t = String(n ?? "").replace(/[^\d+]/g, ""); if (t.startsWith("00")) t = "+" + t.slice(2); if (!t.startsWith("+") && t.length >= 9) t = "+39" + t; return t; };
const iPhone = /iPhone|iPad|iPod/.test(navigator.userAgent);

export default async function ({ params }) {
  const c = (params?.c && state.cerchie.find((x) => x.id === params.c)) ?? state.cerchie[0];
  if (!c) { $app().innerHTML = `<p class="pad">Prima crea una famiglia o un gruppo.</p>`; return; }
  let lista = []; try { lista = JSON.parse(localStorage.getItem(CHIAVE + c.id) ?? "[]"); } catch { /* niente */ }
  const salva = () => { try { localStorage.setItem(CHIAVE + c.id, JSON.stringify(lista)); } catch { /* niente */ } };
  const rubrica = "contacts" in navigator && "select" in navigator.contacts;

  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/cerchie" aria-label="Indietro">${ICONE.indietro}</a><b>📋 Invita più persone</b><span style="width:44px"></span></header>
    <div class="pad" style="padding-bottom:130px">
      <p class="tenue" style="margin-top:0">Fai la lista di chi vuoi in <b>${esc(c.nome)}</b>, poi con un solo invio arriva l'invito a tutti.</p>
      ${rubrica ? `<button class="btn chiaro" id="da-rubrica">📇 Scegli dalla rubrica (anche più di uno)</button>` : ""}
      <form id="aggiungi" class="card" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
        <input id="nome" placeholder="Nome (es. zia Rosa)" maxlength="40" style="margin:0;flex:1 1 140px">
        <input id="tel" type="tel" inputmode="tel" placeholder="Numero di telefono" style="margin:0;flex:1 1 140px">
        <button class="chip on" style="margin:0">Aggiungi</button></form>
      <div id="righe"></div>
      <div id="invio"></div>
    </div>`;

  const disegna = () => {
    document.getElementById("righe").innerHTML = lista.length ? `<div class="card">${lista.map((p, i) => `
      <div style="display:flex;align-items:center;gap:8px;padding:6px 0;${i ? "border-top:1px solid var(--bordo)" : ""}">
        <span style="flex:1"><b>${esc(p.nome || "Senza nome")}</b><br><small class="tenue">${esc(p.tel)}</small></span>
        <a class="chip" data-wa="${i}" href="#" style="margin:0;text-decoration:none">${p.wa ? "✓ WhatsApp" : "WhatsApp"}</a>
        <button class="chip" data-via="${i}" style="margin:0" aria-label="Togli">✕</button></div>`).join("")}</div>` : `<p class="tenue" style="text-align:center">La lista è vuota: aggiungi i numeri qui sopra.</p>`;
    document.getElementById("invio").innerHTML = lista.length ? `
      <button class="btn ambra" id="invia-tutti" style="font-size:18px">✉️ Invia a tutti (${lista.length}) con un messaggio</button>
      <p class="tenue" style="font-size:13px;text-align:center;margin:6px 0 0">Si apre un SMS già scritto con tutti i numeri: tocchi Invia e arriva a tutti. ${iPhone ? "Su iPhone diventa una chat di gruppo." : ""}</p>
      <button class="chip" id="svuota" style="margin-top:12px">Svuota la lista</button>` : "";
    document.querySelectorAll("[data-via]").forEach((b) => b.onclick = () => { lista.splice(Number(b.dataset.via), 1); salva(); disegna(); });
    document.querySelectorAll("[data-wa]").forEach((b) => b.onclick = async (e) => {
      e.preventDefault();
      const p = lista[Number(b.dataset.wa)];
      const link = await linkGruppo(); if (!link) return;
      window.open(`https://wa.me/${p.tel.replace("+", "")}?text=${encodeURIComponent(testo(link, p.nome))}`, "_blank");
      p.wa = true; salva(); disegna();
    });
    document.getElementById("invia-tutti")?.addEventListener("click", async () => {
      const link = await linkGruppo(); if (!link) return;
      const numeri = lista.map((p) => p.tel).join(",");
      const corpo = encodeURIComponent(testo(link));
      location.href = iPhone ? `sms://open?addresses=${numeri}&body=${corpo}` : `sms:${numeri.replaceAll(",", ";")}?body=${corpo}`;
    });
    document.getElementById("svuota")?.addEventListener("click", () => { if (confirm("Svuotare la lista?")) { lista = []; salva(); disegna(); } });
  };

  let link = null;
  async function linkGruppo() {
    if (link) return link;
    const { data, error } = await sb.rpc("invito_di_gruppo", { p_cerchia: c.id });
    if (error) { alert("Invito non creato: " + error.message); return null; }
    return (link = `${location.origin}${location.pathname}#/iscriviti?invito=${data}`);
  }
  const testo = (l, nome) => `${nome ? `Ciao ${nome.split(" ")[0]}! ` : ""}Ti ho preparato un posto in "${c.nome}" su Ancora: è come un social, ma solo per noi. Foto, storie, vocali e chat, senza pubblicità e senza estranei. È gratis.\n\nEntra da qui: ${l}`;

  document.getElementById("aggiungi").onsubmit = (e) => {
    e.preventDefault();
    const tel = pulisci(document.getElementById("tel").value);
    if (tel.replace("+", "").length < 9) { alert("Controlla il numero."); return; }
    if (lista.some((p) => p.tel === tel)) { alert("Questo numero è già nella lista."); return; }
    lista.push({ nome: document.getElementById("nome").value.trim(), tel }); salva();
    document.getElementById("nome").value = ""; document.getElementById("tel").value = ""; document.getElementById("nome").focus();
    disegna();
  };
  document.getElementById("da-rubrica")?.addEventListener("click", async () => {
    try {
      const scelti = await navigator.contacts.select(["name", "tel"], { multiple: true });
      for (const s of scelti) {
        const tel = pulisci(s.tel?.[0]); if (!tel || lista.some((p) => p.tel === tel)) continue;
        lista.push({ nome: s.name?.[0] ?? "", tel });
      }
      salva(); disegna();
    } catch { /* annullato */ }
  });
  disegna();
}
