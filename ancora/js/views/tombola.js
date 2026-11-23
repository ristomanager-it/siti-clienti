// La tombola di famiglia: #/tombola?c=<famiglia>  oppure  #/tombola?id=<tombola>
// Chi la apre fa il banco ed estrae (il numero lo sceglie il server, a caso); gli altri prendono da 1 a 6 cartelle.
// Le cartelle si segnano da sole, i premi li assegna il server; il numero si legge anche a voce, con la smorfia.
import { sb, state, $app, esc, ICONE } from "../app.js";

const SMORFIA = ["", "L'Italia", "La bambina", "La gatta", "Il maiale", "La mano", "", "Il vasetto", "La Madonna", "La figliolanza", "I fagioli",
  "I topolini", "Il soldato", "Sant'Antonio", "L'ubriaco", "Il ragazzo", "", "La disgrazia", "Il sangue", "La risata", "La festa",
  "", "Il pazzo", "Lo scemo", "Le guardie", "Natale", "Nannina", "", "", "", "",
  "Il padrone di casa", "Il capitone", "Gli anni di Cristo", "La testa", "L'uccellino", "Le nacchere", "Il monaco", "Le botte", "", "La noia",
  "Il coltello", "Il caffè", "La donna al balcone", "Il carcere", "Il vino buono", "I soldi", "Il morto", "Il morto che parla", "Il pezzo di carne", "Il pane",
  "Il giardino", "La mamma", "Il vecchio", "Il cappello", "La musica", "La caduta", "Il gobbo", "Il pacco", "I peli", "Si lamenta",
  "Il cacciatore", "", "La sposa", "La giacca a coda", "Il pianto", "Le due zitelle", "Il polpo nella chitarra", "La zuppa cotta", "Sottosopra", "Il palazzo",
  "", "La meraviglia", "L'ospedale", "La grotta", "Pulcinella", "La fontana", "I diavoletti", "La bella ragazza", "Il ladro", "La bocca",
  "I fiori", "La tavola imbandita", "Il maltempo", "La chiesa", "Le anime del purgatorio", "La bottega", "I pidocchi", "I caciocavalli", "La vecchia", "La paura"];
const PREMI = { ambo: "Ambo", terno: "Terno", quaterna: "Quaterna", cinquina: "Cinquina", tombola: "TOMBOLA" };

// una cartella vera: 3 righe x 9 colonne, 5 numeri per riga, ogni colonna con la sua decina (1-9, 10-19 … 80-90)
function nuovaCartella() {
  for (;;) {
    const m = [0, 1, 2].map(() => { const c = [...Array(9).keys()].sort(() => Math.random() - 0.5).slice(0, 5); return Array.from({ length: 9 }, (_, i) => c.includes(i)); });
    const perCol = Array.from({ length: 9 }, (_, j) => m.filter((r) => r[j]).length);
    if (perCol.some((x) => x === 0)) continue;
    const g = Array(27).fill(0);
    for (let j = 0; j < 9; j++) {
      const da = j === 0 ? 1 : j * 10, a = j === 8 ? 90 : j * 10 + 9;
      const pool = Array.from({ length: a - da + 1 }, (_, k) => da + k).sort(() => Math.random() - 0.5).slice(0, perCol[j]).sort((x, y) => x - y);
      let k = 0; for (let r = 0; r < 3; r++) if (m[r][j]) g[r * 9 + j] = pool[k++];
    }
    return g;
  }
}

function parla(n) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(`${n}${SMORFIA[n] ? ". " + SMORFIA[n] : ""}`);
  u.lang = "it-IT"; u.rate = 0.9;
  const v = speechSynthesis.getVoices().find((x) => x.lang?.startsWith("it")); if (v) u.voice = v;
  speechSynthesis.speak(u);
}

export default async function ({ params }) {
  let id = params?.id;
  if (!id) {
    const fam = (params?.c && state.cerchie.find((c) => c.id === params.c)) ?? state.cerchie.find((c) => c.tipo === "famiglia") ?? state.cerchie[0];
    if (!fam) { $app().innerHTML = `<div class="pad"><p>Prima entra in una famiglia: la tombola si gioca tra voi.</p><a class="btn" href="#/cerchie">Famiglie e gruppi</a></div>`; return; }
    const { data, error } = await sb.rpc("tombola_crea", { p_cerchia: fam.id });
    if (error) { $app().innerHTML = `<p class="pad errore">${esc(error.message)}</p>`; return; }
    location.replace(`#/tombola?id=${data}`); return;
  }

  let voce = true; try { voce = localStorage.getItem("ancora_tombola_voce") !== "0"; } catch { /* niente */ }
  let ultimoVisto = null, premiVisti = null, timer = null, ultimaFirma = "";
  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/giochi" aria-label="Indietro">${ICONE.indietro}</a><b>🎄 Tombola di famiglia</b>
      <button class="icona" id="voce" aria-label="Voce" style="border:0;background:none;font-size:22px">${voce ? "🔊" : "🔇"}</button></header>
    <div id="corpo" style="padding-bottom:130px"></div>`;
  document.getElementById("voce").onclick = (e) => { voce = !voce; e.target.textContent = voce ? "🔊" : "🔇"; try { localStorage.setItem("ancora_tombola_voce", voce ? "1" : "0"); } catch { /* niente */ } };

  async function aggiorna() {
    if (!document.getElementById("corpo")) { clearInterval(timer); return; }
    const [{ data: t }, { data: cart }] = await Promise.all([
      sb.from("tombole").select("id, cerchia_id, banco_id, stato, estratti, premi, persone:banco_id(nome, soprannome), cerchie(nome)").eq("id", id).maybeSingle(),
      sb.from("tombola_cartelle").select("id, persona_id, numeri, persone:persona_id(nome, soprannome)").eq("tombola_id", id).order("creata_il"),
    ]);
    if (!t) { document.getElementById("corpo").innerHTML = `<p class="pad">Questa tombola non c'è più.</p>`; clearInterval(timer); return; }
    // ridisegna solo se è cambiato qualcosa (così non salta lo scorrimento)
    const firma = [t.stato, t.estratti.length, (t.premi ?? []).length, (cart ?? []).map((c) => c.id).join()].join("|");
    if (firma === ultimaFirma) return;
    ultimaFirma = firma;
    disegna(t, cart ?? []);
  }

  function disegna(t, cart) {
    const corpo = document.getElementById("corpo"); if (!corpo) return;
    const banco = t.banco_id === state.io.id;
    const mie = cart.filter((c) => c.persona_id === state.io.id);
    const giocatori = [...new Map(cart.map((c) => [c.persona_id, c.persone?.soprannome || c.persone?.nome])).values()];
    const est = new Set(t.estratti);
    const ultimo = t.estratti.at(-1);
    // un numero nuovo: si legge a voce (anche a chi non fa il banco)
    if (ultimoVisto !== null && ultimo && ultimo !== ultimoVisto && voce) parla(ultimo);
    ultimoVisto = ultimo ?? 0;
    // un premio nuovo: festa
    const nPremi = (t.premi ?? []).length;
    if (premiVisti !== null && nPremi > premiVisti) {
      const nuovi = t.premi.slice(premiVisti);
      const msg = nuovi.map((p) => `${PREMI[p.premio]}! ${p.nome}`).join(" · ");
      if (voce && "speechSynthesis" in window) setTimeout(() => { const u = new SpeechSynthesisUtterance(msg); u.lang = "it-IT"; speechSynthesis.speak(u); }, 1800);
      const b = document.createElement("div");
      b.textContent = "🎉 " + msg; b.setAttribute("role", "status");
      b.style.cssText = "position:fixed;left:16px;right:16px;top:70px;z-index:50;background:#C8102E;color:#fff;font-weight:800;font-size:20px;text-align:center;padding:16px;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,.25)";
      document.body.appendChild(b); setTimeout(() => b.remove(), 5000);
    }
    premiVisti = nPremi;

    const cella = (n) => n ? `<div style="display:grid;place-items:center;aspect-ratio:1;border-radius:8px;font-weight:800;font-size:17px;${est.has(n) ? "background:#C8102E;color:#fff" : "background:#fff;color:#1d1d1d"}${n === ultimo ? ";outline:3px solid #E8B56B" : ""}">${n}</div>`
      : `<div style="aspect-ratio:1;border-radius:8px;background:rgba(255,255,255,.35)"></div>`;
    const cartellaHtml = (c, i) => {
      const vinte = (t.premi ?? []).filter((p) => p.cartella === c.id).map((p) => PREMI[p.premio]);
      return `<div style="background:#F3E3C3;border-radius:14px;padding:8px;margin:0 16px 12px">
        <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin:0 2px 6px;color:#6b4e1f"><span>Cartella ${i + 1}</span><span>${vinte.map((v) => `🏆 ${v}`).join(" ")}</span></div>
        <div style="display:grid;grid-template-columns:repeat(9,1fr);gap:4px">${c.numeri.map(cella).join("")}</div></div>`;
    };

    const premiHtml = (t.premi ?? []).length ? `<div class="card"><b>Premi</b>${t.premi.map((p) => `<div style="margin-top:6px">🏆 <b>${PREMI[p.premio]}</b> · ${esc(p.nome)} <span class="tenue">(col ${p.numero})</span></div>`).join("")}</div>` : "";
    const tabellone = `<details class="card" ${banco ? "open" : ""}><summary style="font-weight:800;cursor:pointer;min-height:32px">Tabellone · ${t.estratti.length} su 90</summary>
      <div style="display:grid;grid-template-columns:repeat(10,1fr);gap:3px;margin-top:8px">${Array.from({ length: 90 }, (_, k) => k + 1).map((n) =>
        `<div style="display:grid;place-items:center;aspect-ratio:1;border-radius:6px;font-size:13px;font-weight:700;${est.has(n) ? "background:#C8102E;color:#fff" : "background:#F3EDE2;color:#999"}">${n}</div>`).join("")}</div></details>`;

    const grande = ultimo ? `<div style="text-align:center;padding:14px 16px 4px">
        <div style="display:inline-grid;place-items:center;width:120px;height:120px;border-radius:60px;background:#C8102E;color:#fff;font-size:56px;font-weight:900;box-shadow:0 6px 18px rgba(200,16,46,.35)">${ultimo}</div>
        <div style="font-size:18px;font-weight:700;margin-top:8px;min-height:24px">${esc(SMORFIA[ultimo] ?? "")}</div>
        <div class="tenue" style="font-size:14px">Prima: ${t.estratti.slice(-6, -1).reverse().join(" · ") || "—"}</div></div>` : "";

    if (t.stato === "attesa") {
      corpo.innerHTML = `
        <div class="pad" style="text-align:center">
          <div style="font-size:48px">🎄</div>
          <h1 style="margin:4px 0">${banco ? "Fai tu il banco" : `Il banco è ${esc(t.persone?.soprannome || t.persone?.nome || "")}`}</h1>
          <p class="tenue" style="margin:0">${esc(t.cerchie?.nome ?? "")} · ${giocatori.length ? `giocano: ${giocatori.map(esc).join(", ")}` : "ancora nessuno ha preso le cartelle"}</p>
        </div>
        <div class="card"><b>Le tue cartelle: ${mie.length}</b>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">${[1, 2, 3, 4, 5, 6].map((n) => `<button class="chip ${mie.length === n ? "on" : ""}" data-n="${n}" style="margin:0;min-width:44px">${n}</button>`).join("")}
            ${mie.length ? `<button class="chip" data-n="0" style="margin:0">Nessuna</button>` : ""}</div>
          <p class="tenue" style="margin:8px 0 0;font-size:14px">Si segnano da sole: tu guardi e fai il tifo.</p></div>
        ${mie.map(cartellaHtml).join("")}
        <div class="pad">
          ${banco ? `<button class="btn ambra" id="estrai" style="font-size:20px">Inizia: estrai il primo numero</button>` : `<p class="tenue" style="text-align:center">Aspettiamo che ${esc(t.persone?.soprannome || t.persone?.nome || "il banco")} estragga il primo numero…</p>`}
          <button class="btn chiaro" id="invita" style="margin-top:10px">Invita a giocare su WhatsApp</button></div>`;
    } else {
      corpo.innerHTML = `
        ${t.stato === "finita" ? `<div class="card" style="text-align:center;background:#FFF6E8"><div style="font-size:40px">🏆</div><b style="font-size:20px">Tombola finita!</b>
          ${banco ? `<button class="btn ambra" id="nuova" style="margin-top:12px">Un'altra partita</button>` : ""}</div>` : ""}
        ${grande}
        ${banco && t.stato === "in_corso" ? `<div class="pad" style="padding-top:8px"><button class="btn ambra" id="estrai" style="font-size:22px;min-height:64px">Estrai</button></div>` : ""}
        ${premiHtml}
        ${mie.map(cartellaHtml).join("") || `<p class="pad tenue" style="text-align:center">Guardi la partita senza cartelle.</p>`}
        ${tabellone}
        ${banco && t.stato === "in_corso" ? `<div class="pad"><button class="chip" id="chiudi" style="color:var(--rosso)">Chiudi la partita</button></div>` : ""}`;
    }

    corpo.querySelectorAll("[data-n]").forEach((b) => b.onclick = async () => {
      const voglio = Number(b.dataset.n);
      if (voglio < mie.length) await sb.from("tombola_cartelle").delete().in("id", mie.slice(voglio).map((c) => c.id));
      else if (voglio > mie.length) {
        const { error } = await sb.from("tombola_cartelle").insert(Array.from({ length: voglio - mie.length }, () => ({ tombola_id: id, persona_id: state.io.id, numeri: nuovaCartella() })));
        if (error) alert("La partita è già iniziata: le cartelle si prendono prima.");
      }
      ultimaFirma = ""; aggiorna();
    });
    const be = corpo.querySelector("#estrai");
    if (be) be.onclick = async () => {
      be.disabled = true;
      const { data: n, error } = await sb.rpc("tombola_estrai", { p_tombola: id });
      if (error) alert(error.message);
      else if (voce) { parla(n); ultimoVisto = n; }
      await aggiorna();
    };
    corpo.querySelector("#chiudi")?.addEventListener("click", async () => { if (confirm("Chiudere la partita per tutti?")) { await sb.rpc("tombola_chiudi", { p_tombola: id }); aggiorna(); } });
    corpo.querySelector("#nuova")?.addEventListener("click", () => { location.hash = `#/tombola?c=${t.cerchia_id}`; });
    corpo.querySelector("#invita")?.addEventListener("click", async () => {
      const link = `${location.href.split("#")[0]}#/tombola?id=${id}`;
      const testo = `🎄 Tombola di famiglia su Ancora! Prendi le tue cartelle, si parte tra poco: ${link}`;
      if (navigator.share) { try { await navigator.share({ title: "Tombola di famiglia", text: testo }); return; } catch { /* annullato */ } }
      window.open(`https://wa.me/?text=${encodeURIComponent(testo)}`, "_blank");
    });
  }

  await aggiorna();
  timer = setInterval(() => { if (!document.hidden) aggiorna(); }, 2500);
}
