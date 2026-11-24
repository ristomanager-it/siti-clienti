// La tombola di famiglia: #/tombola?c=<famiglia>  oppure  #/tombola?id=<tombola>
// Chi la apre fa il banco ed estrae (il numero lo sceglie il server, a caso); gli altri prendono da 1 a 6 cartelle.
// Le cartelle si segnano da sole, i premi li assegna il server; il numero si legge anche a voce, con la smorfia.
import { sb, state, $app, esc, ICONE, invitaAlGioco, invitoPiu } from "../app.js";
import { voceAlTavolo } from "../giochi/voce.js";

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

let voceSbloccata = false;
function sbloccaVoce() {
  if (voceSbloccata || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(" "); u.volume = 0; u.lang = "it-IT";
  speechSynthesis.speak(u); voceSbloccata = true;
  document.getElementById("sblocca-voce")?.remove();
}

function parla(n) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(`${n}${SMORFIA[n] ? ". " + SMORFIA[n] : ""}`);
  u.lang = "it-IT"; u.rate = 0.9; u.volume = 1;
  const v = speechSynthesis.getVoices().find((x) => x.lang?.startsWith("it")); if (v) u.voice = v;
  speechSynthesis.speak(u);
}

export default async function ({ params }) {
  let id = params?.id;
  if (!id) {
    const fam = (params?.c && state.cerchie.find((c) => c.id === params.c)) ?? state.cerchie.find((c) => c.tipo === "famiglia") ?? state.cerchie[0];
    if (!fam) { $app().innerHTML = `<div class="pad"><p>Prima entra in una famiglia o in un gruppo: la tombola si gioca tra voi.</p><a class="btn" href="#/cerchie">Famiglie e gruppi</a></div>`; return; }
    const { data, error } = await sb.rpc("tombola_crea", { p_cerchia: fam.id });
    if (error) { $app().innerHTML = `<p class="pad errore">${esc(error.message)}</p>`; return; }
    location.replace(`#/tombola?id=${data}`); return;
  }
  voceAlTavolo(id);

  let voce = true; try { voce = localStorage.getItem("ancora_tombola_voce") !== "0"; } catch { /* niente */ }
  let ultimoVisto = null, premiVisti = null, timer = null, ultimaFirma = "", animando = false;
  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/giochi" aria-label="Indietro">${ICONE.indietro}</a><b>🎄 Tombola</b>
      <button class="chip" id="voce" style="margin:0;font-size:14px">${voce ? "🔊 Voce sì" : "🔇 Voce no"}</button></header>
    ${"speechSynthesis" in window ? `<button id="sblocca-voce" class="card" style="display:block;width:calc(100% - 32px);margin:8px 16px 0;text-align:center;font-weight:800;background:#FCE8EA;border-color:#F2B8BF;cursor:pointer">🔊 Tocca qui per sentire i numeri a voce</button>` : ""}
    <div id="corpo" style="padding-bottom:130px"></div>
    <style>
      @keyframes tomb-lampo { 0%,100% { transform: scale(1); filter: brightness(1); } 25% { transform: scale(1.12); filter: brightness(1.5); } 50% { transform: scale(.96); filter: brightness(.8); } 75% { transform: scale(1.08); filter: brightness(1.4); } }
      .tomb-lampo { animation: tomb-lampo .45s ease-in-out 4; }
      .tomb-gira { filter: blur(1px); opacity: .85; }
    </style>`;
  document.getElementById("sblocca-voce")?.addEventListener("click", () => {
    voce = true; try { localStorage.setItem("ancora_tombola_voce", "1"); } catch { /* niente */ }
    document.getElementById("voce").textContent = "🔊 Voce sì"; sbloccaVoce(); parla(ultimoVisto || 1);
  });
  document.addEventListener("click", sbloccaVoce, { once: true });
  document.getElementById("voce").onclick = (e) => { voce = !voce; sbloccaVoce(); e.target.textContent = voce ? "🔊 Voce sì" : "🔇 Voce no"; if (voce) parla(ultimoVisto || 1); try { localStorage.setItem("ancora_tombola_voce", voce ? "1" : "0"); } catch { /* niente */ } };

  function estrazione(n) {
    const palla = document.getElementById("palla"), sm = document.getElementById("smorfia");
    if (!palla) return;
    animando = true; setTimeout(() => { animando = false; }, 2300);
    sm.style.visibility = "hidden"; palla.classList.add("tomb-gira");
    const fine = Date.now() + 1600;
    const giro = setInterval(() => {
      if (Date.now() < fine) { palla.textContent = 1 + Math.floor(Math.random() * 90); return; }
      clearInterval(giro);
      palla.textContent = n; palla.classList.remove("tomb-gira"); palla.classList.add("tomb-lampo");
      sm.style.visibility = "visible";
      if (navigator.vibrate) navigator.vibrate(120);
      if (voce) parla(n);
      setTimeout(() => palla.classList.remove("tomb-lampo"), 2000);
    }, 70);
  }

  async function aggiorna() {
    if (!document.getElementById("corpo")) { clearInterval(timer); return; }
    const [{ data: t }, { data: cart }] = await Promise.all([
      sb.from("tombole").select("id, cerchia_id, banco_id, stato, estratti, premi, premi_testi, prezzo_cent, pagati, programmata_il, persone:banco_id(nome, soprannome), cerchie(nome)").eq("id", id).maybeSingle(),
      sb.from("tombola_cartelle").select("id, persona_id, numeri, persone:persona_id(nome, soprannome)").eq("tombola_id", id).order("creata_il"),
    ]);
    if (!t) { document.getElementById("corpo").innerHTML = `<p class="pad">Questa tombola non c'è più.</p>`; clearInterval(timer); return; }
    // ridisegna solo se è cambiato qualcosa (così non salta lo scorrimento)
    const firma = [t.stato, t.estratti.length, (t.premi ?? []).length, (cart ?? []).map((c) => c.id).join(), JSON.stringify(t.premi_testi), t.prezzo_cent, t.pagati.join(), t.programmata_il].join("|");
    if (firma === ultimaFirma) return;
    // se il banco sta scrivendo i premi non gli cancelliamo il testo: si ridisegna al giro dopo
    const a = document.activeElement;
    if (a && a.tagName === "INPUT" && document.getElementById("corpo")?.contains(a)) return;
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
    // un numero nuovo: gira come al lotto, poi lampeggia e si legge a voce (a tutti, non solo al banco)
    const nuovo = ultimoVisto !== null && ultimo && ultimo !== ultimoVisto;
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

    const euro = (c) => (c / 100).toLocaleString("it-IT", { style: "currency", currency: "EUR" });
    const testi = t.premi_testi ?? {};
    const perPersona = [...cart.reduce((m, c) => m.set(c.persona_id, { nome: c.persone?.soprannome || c.persone?.nome, n: (m.get(c.persona_id)?.n ?? 0) + 1 }), new Map())];
    const montepremi = cart.length * t.prezzo_cent;
    const inPalio = Object.keys(PREMI).filter((k) => testi[k]);
    const palioHtml = inPalio.length || t.prezzo_cent ? `<div class="card"><b>🎁 In palio</b>${t.prezzo_cent ? ` <span class="tenue">· montepremi ${euro(montepremi)}</span>` : ""}
      ${inPalio.map((k) => { const v = (t.premi ?? []).filter((p) => p.premio === k);
        return `<div style="display:flex;gap:8px;margin-top:6px;${v.length ? "opacity:.55" : ""}"><b style="min-width:84px">${PREMI[k]}</b><span style="flex:1">${esc(testi[k])}</span>${v.length ? `<span>✓ ${v.map((x) => esc(x.nome)).join(", ")}</span>` : ""}</div>`; }).join("")}</div>` : "";
    const cassaHtml = t.prezzo_cent ? `<div class="card"><b>💶 Cassa</b> <span class="tenue">· ${euro(t.prezzo_cent)} a cartella</span>
      ${perPersona.map(([pid, x]) => { const ok = t.pagati.includes(pid);
        return `<div style="display:flex;align-items:center;gap:8px;margin-top:8px"><span style="flex:1">${esc(x.nome)} · ${x.n} ${x.n === 1 ? "cartella" : "cartelle"} · <b>${euro(x.n * t.prezzo_cent)}</b></span>
          ${banco ? `<button class="chip ${ok ? "on" : ""}" data-paga="${pid}" data-si="${ok ? 0 : 1}" style="margin:0">${ok ? "pagato ✓" : "da pagare"}</button>` : `<span class="tenue">${ok ? "pagato ✓" : "da pagare"}</span>`}</div>`; }).join("") || `<p class="tenue" style="margin:6px 0 0">Ancora nessuna cartella.</p>`}
      ${perPersona.length ? `<div style="margin-top:10px;font-weight:700">Raccolti ${euro(perPersona.filter(([pid]) => t.pagati.includes(pid)).reduce((s, [, x]) => s + x.n * t.prezzo_cent, 0))} su ${euro(montepremi)}</div>` : ""}
      ${!banco && mie.length && !t.pagati.includes(state.io.id) ? `<p style="margin:8px 0 0">Le tue cartelle: <b>${euro(mie.length * t.prezzo_cent)}</b> da dare a ${esc(t.persone?.soprannome || t.persone?.nome || "chi fa il banco")}.</p>` : ""}</div>` : "";
    const modulo = banco && t.stato !== "finita" ? `<details class="card" ${t.stato === "attesa" && !inPalio.length && !t.prezzo_cent ? "open" : ""}><summary style="font-weight:800;cursor:pointer;min-height:32px">✏️ Scrivi i premi${t.stato === "attesa" ? " e il prezzo" : ""}</summary>
      ${Object.entries(PREMI).map(([k, n]) => `<label for="pr-${k}">${n}</label><input id="pr-${k}" maxlength="60" value="${esc(testi[k] ?? "")}" placeholder="${k === "tombola" ? "es. il cesto natalizio" : k === "ambo" ? "es. un torroncino" : "es. 5 €"}">`).join("")}
      ${t.stato === "attesa" ? `<label for="prezzo">Prezzo di una cartella (€, 0 = si gioca gratis)</label><input id="prezzo" type="number" min="0" max="100" step="0.5" inputmode="decimal" value="${t.prezzo_cent ? t.prezzo_cent / 100 : ""}" placeholder="0">
        <button type="button" class="chip" id="dividi" style="margin:8px 0 0">Dividi il montepremi in automatico</button>` : ""}
      <button class="btn" id="salva-premi" style="margin-top:12px">Salva</button></details>` : "";

    const premiHtml = (t.premi ?? []).length ? `<div class="card"><b>Premi</b>${t.premi.map((p) => `<div style="margin-top:6px">🏆 <b>${PREMI[p.premio]}</b> · ${esc(p.nome)} <span class="tenue">(col ${p.numero})</span>${testi[p.premio] ? ` → ${esc(testi[p.premio])}` : ""}</div>`).join("")}</div>` : "";
    const tabellone = `<details class="card" ${banco ? "open" : ""}><summary style="font-weight:800;cursor:pointer;min-height:32px">Tabellone · ${t.estratti.length} su 90</summary>
      <div style="display:grid;grid-template-columns:repeat(10,1fr);gap:3px;margin-top:8px">${Array.from({ length: 90 }, (_, k) => k + 1).map((n) =>
        `<div style="display:grid;place-items:center;aspect-ratio:1;border-radius:6px;font-size:13px;font-weight:700;${est.has(n) ? "background:#C8102E;color:#fff" : "background:#F3EDE2;color:#999"}">${n}</div>`).join("")}</div></details>`;

    const grande = ultimo ? `<div style="text-align:center;padding:14px 16px 4px">
        <div id="palla" style="display:inline-grid;place-items:center;width:120px;height:120px;border-radius:60px;background:radial-gradient(circle at 35% 30%,#ff5a6e,#C8102E 60%,#8A0B20);color:#fff;font-size:56px;font-weight:900;box-shadow:0 6px 18px rgba(200,16,46,.35)">${ultimo}</div>
        <div id="smorfia" style="font-size:18px;font-weight:700;margin-top:8px;min-height:24px">${esc(SMORFIA[ultimo] ?? "")}</div>
        <div class="tenue" style="font-size:14px">Prima: ${t.estratti.slice(-6, -1).reverse().join(" · ") || "—"}</div></div>` : "";

    if (t.stato === "attesa") {
      corpo.innerHTML = `
        <div class="pad" style="text-align:center">
          <div style="font-size:48px">🎄</div>
          <h1 style="margin:4px 0">${banco ? "Fai tu il banco" : `Il banco è ${esc(t.persone?.soprannome || t.persone?.nome || "")}`}</h1>
          ${t.programmata_il ? `<div style="display:inline-block;margin:6px 0 4px;padding:6px 12px;border-radius:12px;background:#FCE8EA;color:#8A1022;font-weight:800">📅 ${esc(new Date(t.programmata_il).toLocaleString("it-IT", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }))}</div>` : ""}
          <p class="tenue" style="margin:0">${esc(t.cerchie?.nome ?? "")} · ${giocatori.length ? `giocano: ${giocatori.map(esc).join(", ")}` : "ancora nessuno ha preso le cartelle"}</p>
        </div>
        <div class="card"><b>Le tue cartelle: ${mie.length}</b>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">${[1, 2, 3, 4, 5, 6].map((n) => `<button class="chip ${mie.length === n ? "on" : ""}" data-n="${n}" style="margin:0;min-width:44px">${n}</button>`).join("")}
            ${mie.length ? `<button class="chip" data-n="0" style="margin:0">Nessuna</button>` : ""}</div>
          <p class="tenue" style="margin:8px 0 0;font-size:14px">Si segnano da sole: tu guardi e fai il tifo.</p></div>
        ${banco ? `<details class="card" ${t.programmata_il ? "" : ""}><summary style="font-weight:800;cursor:pointer;min-height:32px">📅 ${t.programmata_il ? "Cambia l'appuntamento" : "Su appuntamento: fissa giorno e ora"}</summary>
          <p class="tenue" style="margin:6px 0 0">Arriva la notifica a tutti, la tombola va nel calendario e 10 minuti prima parte il promemoria.</p>
          <input id="quando" type="datetime-local" value="${t.programmata_il ? new Date(new Date(t.programmata_il).getTime() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16) : ""}" style="margin-top:8px">
          <button class="btn" id="fissa" style="margin-top:10px">Fissa e avvisa tutti</button></details>` : ""}
        ${modulo}${palioHtml}${cassaHtml}
        ${mie.map(cartellaHtml).join("")}
        <div class="pad">
          ${banco ? `<button class="btn chiaro" id="avvisa" style="margin-bottom:10px">🔔 Avvisa tutti sul telefono</button><button class="btn ambra" id="estrai" style="font-size:20px">Inizia: estrai il primo numero</button>` : `<p class="tenue" style="text-align:center">Aspettiamo che ${esc(t.persone?.soprannome || t.persone?.nome || "il banco")} estragga il primo numero…</p>`}
          <button class="btn chiaro" id="invita" style="margin-top:10px">📲 Invita su WhatsApp (anche chi non è su Ancora)</button></div>`;
    } else {
      corpo.innerHTML = `
        ${t.stato === "finita" ? `<div class="card" style="text-align:center;background:#FFF6E8"><div style="font-size:40px">🏆</div><b style="font-size:20px">Tombola finita!</b>
          ${banco ? `<button class="btn ambra" id="nuova" style="margin-top:12px">Un'altra partita</button>` : ""}</div>${invitoPiu()}` : ""}
        ${grande}
        ${banco && t.stato === "in_corso" ? `<div class="pad" style="padding-top:8px"><button class="btn ambra" id="estrai" style="font-size:22px;min-height:64px">Estrai</button></div>` : ""}
        ${premiHtml}${palioHtml}
        ${mie.map(cartellaHtml).join("") || `<p class="pad tenue" style="text-align:center">Guardi la partita senza cartelle.</p>`}
        ${cassaHtml}${modulo}
        ${tabellone}
        ${banco && t.stato === "in_corso" ? `<div class="pad"><button class="chip" id="chiudi" style="color:var(--rosso)">Chiudi la partita</button></div>` : ""}`;
    }

    if (nuovo) estrazione(ultimo);

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
      sbloccaVoce();
      if (animando) return;
      be.disabled = true;
      const { data: n, error } = await sb.rpc("tombola_estrai", { p_tombola: id });
      if (error) alert(error.message);
      await aggiorna();
      setTimeout(() => { if (be.isConnected) be.disabled = false; }, 2200);
    };
    corpo.querySelector("#fissa")?.addEventListener("click", async (e) => {
      const v = corpo.querySelector("#quando").value;
      if (!v) { alert("Scegli giorno e ora."); return; }
      e.target.disabled = true;
      const { error } = await sb.rpc("tombola_programma", { p_tombola: id, p_quando: new Date(v).toISOString() });
      if (error) { alert(error.message); e.target.disabled = false; return; }
      ultimaFirma = ""; aggiorna();
    });
    corpo.querySelector("#salva-premi")?.addEventListener("click", async (e) => {
      const premi = Object.fromEntries(Object.keys(PREMI).map((k) => [k, corpo.querySelector(`#pr-${k}`).value]));
      const pz = corpo.querySelector("#prezzo");
      const { error } = await sb.rpc("tombola_imposta", { p_tombola: id, p_premi: premi, p_prezzo_cent: pz ? Math.round(Number(String(pz.value).replace(",", ".") || 0) * 100) : t.prezzo_cent });
      if (error) { alert(error.message); return; }
      e.target.blur(); ultimaFirma = ""; aggiorna();
    });
    // montepremi diviso come si usa: 10% ambo, 15% terno, 20% quaterna, 25% cinquina, 30% tombola (sulle cartelle prese finora)
    corpo.querySelector("#dividi")?.addEventListener("click", () => {
      const pz = Math.round(Number(String(corpo.querySelector("#prezzo").value).replace(",", ".") || 0) * 100);
      const tot = cart.length * pz;
      if (!tot) { alert("Metti il prezzo della cartella: il montepremi si calcola sulle cartelle prese."); return; }
      const quote = { ambo: 10, terno: 15, quaterna: 20, cinquina: 25, tombola: 30 };
      for (const [k, q] of Object.entries(quote)) corpo.querySelector(`#pr-${k}`).value = euro(Math.round(tot * q / 100 / 10) * 10);
    });
    corpo.querySelectorAll("[data-paga]").forEach((b) => b.onclick = async () => {
      await sb.rpc("tombola_pagato", { p_tombola: id, p_persona: b.dataset.paga, p_si: b.dataset.si === "1" });
      ultimaFirma = ""; aggiorna();
    });
    corpo.querySelector("#avvisa")?.addEventListener("click", async (e) => {
      const { data: n, error } = await sb.rpc("tombola_invita", { p_tombola: id });
      if (error) { alert(error.message); return; }
      e.target.textContent = n ? `🔔 Avvisati ${n} sul telefono` : "🔔 Già avvisati (si può rifare tra 10 minuti)"; e.target.disabled = true;
    });
    corpo.querySelector("#chiudi")?.addEventListener("click", async () => { if (confirm("Chiudere la partita per tutti?")) { await sb.rpc("tombola_chiudi", { p_tombola: id }); aggiorna(); } });
    corpo.querySelector("#nuova")?.addEventListener("click", () => { location.hash = `#/tombola?c=${t.cerchia_id}`; });
    corpo.querySelector("#invita")?.addEventListener("click", () => invitaAlGioco({ cerchiaId: t.cerchia_id, torna: `#/tombola?id=${id}`, titolo: "Tombola",
      testo: `🎄 Tombola su Ancora! Prendi le tue cartelle, si parte tra poco.`, perche: "Ti aspettano alla tombola: un minuto e prendi le cartelle." }));
  }

  await aggiorna();
  timer = setInterval(() => { if (!document.hidden) aggiorna(); }, 2500);
}
