// Briscola a 2 e a 4 (a coppie): #/briscola?c=<gruppo>  oppure  #/briscola?id=<partita>
// Chi crea il tavolo sceglie in quanti; il gruppo riceve l'invito sul telefono. I posti vuoti li prende il telefono.
// Le carte di ognuno le vede solo lui; regole, mazzo e mosse del telefono stanno sul server.
import { sb, state, $app, esc, ICONE, invitaAlGioco, invitoPiu } from "../app.js";
import { voceAlTavolo } from "../giochi/voce.js";

const SEMI = { D: "Denari", C: "Coppe", S: "Spade", B: "Bastoni" };
const FIGURE = { 8: "Fante", 9: "Cavallo", 10: "Re" };
const COLORE = { D: "#B8860B", C: "#C8102E", S: "#1F4E79", B: "#2E6B30" };

// simboli dei semi disegnati da noi (stile semplice, leggibile anche dai nonni)
function simbolo(s, size = 22) {
  const c = COLORE[s];
  if (s === "D") return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#F2C94C" stroke="${c}" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="${c}" stroke-width="1.5"/></svg>`;
  if (s === "C") return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14c0 5-3 8-7 8s-7-3-7-8z" fill="${c}"/><rect x="11" y="12" width="2" height="5" fill="${c}"/><rect x="7" y="17" width="10" height="3" rx="1.5" fill="${c}"/></svg>`;
  if (s === "S") return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2 12h-4z" fill="${c}"/><rect x="7" y="14" width="10" height="2.5" rx="1" fill="${c}"/><rect x="11" y="16" width="2" height="6" fill="${c}"/></svg>`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3c3-1 6 1 6 4l-2 15h-2L9 7z" fill="#8B5A2B" stroke="${c}" stroke-width="1.5"/></svg>`;
}
// le carte napoletane tradizionali (scansione di pubblico dominio, Wikimedia Commons: "Carte napoletane al completo")
function carta(c, { piccola = false, attiva = false } = {}) {
  const w = piccola ? 56 : 76;
  return `<img src="img/carte/${c}.webp" alt="${nomeCarta(c)}" width="${w}" height="${Math.round(w * 1.733)}" draggable="false"
    style="display:block;width:${w}px;height:auto;border-radius:${piccola ? 6 : 8}px;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.25);${attiva ? "outline:3px solid #E8B56B;outline-offset:1px;" : ""}flex-shrink:0">`;
}
const dorso = (piccola = true) => `<div style="width:${piccola ? 30 : 54}px;height:${piccola ? 46 : 84}px;border-radius:7px;background:repeating-linear-gradient(45deg,#8A1022,#8A1022 4px,#A8162E 4px,#A8162E 8px);border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.2);flex-shrink:0"></div>`;
const SEGNI = {
  asso: { e: "😉", fa: "fa l'occhiolino", vuol: "ha l'asso di briscola", tasto: "Occhiolino" },
  tre: { e: "😏", fa: "stringe la bocca di lato", vuol: "ha il tre di briscola", tasto: "Bocca di lato" },
  re: { e: "🤨", fa: "alza le sopracciglia", vuol: "ha il re di briscola", tasto: "Sopracciglia" },
  niente: { e: "😮", fa: "apre la bocca un istante", vuol: "non ha briscole", tasto: "Bocca aperta" },
};
const FRASI = ["Bella! 👏", "Carica!", "Vai liscio", "Prendi tu", "Che fortuna 😄", "Uffa 😅"];
const NUMERI = ["", "Asso", "Due", "Tre", "Quattro", "Cinque", "Sei", "Sette", "Fante", "Cavallo", "Re"];
const nomeCarta = (c) => `${NUMERI[Number(c.slice(1))]} di ${SEMI[c[0]]}`;
// i segnali del tressette si dicono a voce alta (li sentono tutti)
const SEGNALI = {
  busso: { e: "👊", fa: "bussa", vuol: "gioca la carta più alta di questo seme" },
  striscio: { e: "👉", fa: "striscia", vuol: "ha altre carte di questo seme" },
  volo: { e: "🕊️", fa: "vola", vuol: "era l'ultima carta di questo seme" },
};
const terzi = (t) => { const n = Math.floor(t / 3), r = t % 3; return `${n}${r === 1 ? "⅓" : r === 2 ? "⅔" : ""}`; };

export default async function ({ params, gioco = "briscola" }) {
  const TRE = gioco === "tressette";
  const TITOLO = TRE ? "🃏 Tressette" : "🃏 Briscola";
  let id = params?.id;
  const gruppo = (params?.c && state.cerchie.find((c) => c.id === params.c)) ?? state.cerchie.find((c) => c.tipo === "famiglia") ?? state.cerchie[0];

  if (!id) {
    // tavoli aperti nel gruppo, oppure se ne apre uno nuovo
    const { data: aperti } = gruppo ? await sb.from("partite").select("id, n, posti, stato, creata_il").eq("cerchia_id", gruppo.id).eq("gioco", gioco)
      .neq("stato", "finita").gte("creata_il", new Date(Date.now() - 864e5).toISOString()).order("creata_il", { ascending: false }) : { data: [] };
    $app().innerHTML = `
      <header class="testa"><a class="icona" href="#/giochi${gruppo ? `?c=${gruppo.id}` : ""}" aria-label="Indietro">${ICONE.indietro}</a><b>${TITOLO}</b><span style="width:44px"></span></header>
      <div class="pad" style="padding-bottom:120px">
        ${!gruppo ? `<p>Prima entra in una famiglia o in un gruppo.</p>` : `
        <p class="tenue" style="margin-top:0">Si gioca in ${esc(gruppo.nome)}. Appena apri il tavolo, al gruppo arriva l'invito sul telefono. Se manca qualcuno, gioca il telefono al suo posto.</p>
        ${(aperti ?? []).map((p) => `<a href="#/${gioco}?id=${p.id}" class="card" style="display:block;margin:0 0 10px;text-decoration:none;color:inherit">
          <b>${p.stato === "in_corso" ? "In corso" : "Si cercano giocatori"} · ${gioco} a ${p.n}</b>
          <div class="tenue">${p.posti.map((x) => esc(x.nome ?? "posto libero")).join(" · ")}</div></a>`).join("")}
        <button class="btn ambra" data-n="4">Nuovo tavolo a 4 (a coppie)</button>
        <button class="btn" data-n="2" style="margin-top:10px">Nuovo tavolo a 2</button>
        ${TRE ? `<p class="tenue" style="font-size:14px;margin-top:14px">Si risponde sempre al seme, niente briscola. Comanda il 3, poi il 2 e l'asso. L'asso vale un punto, tre, due e figure un terzo, l'ultima presa un punto. Al compagno si può bussare, strisciare e volare.</p>`
          : `<button class="btn" data-n="5" style="margin-top:10px">Nuovo tavolo a 5 (chiamata)</button>
        <p class="tenue" style="font-size:14px;margin-top:14px">A 5: asta a punti da 61, chi vince chiama una carta (il suo seme è la briscola, chi la tiene è il socio segreto). Il chiamante prende doppio.</p>`}`}
      </div>`;
    document.querySelectorAll("[data-n]").forEach((b) => b.onclick = async () => {
      b.disabled = true;
      const { data, error } = await sb.rpc(`${gioco}_crea`, { p_cerchia: gruppo.id, p_n: Number(b.dataset.n) });
      if (error) { alert(error.message); b.disabled = false; return; }
      location.hash = `#/${gioco}?id=${data}`;
    });
    return;
  }
  voceAlTavolo(id);   // 🎙️ Parla: la voce dal vivo al tavolo

  let ultimaFirma = "", ultimaPresaVista = null, timer = null;
  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/${gioco}" aria-label="Indietro">${ICONE.indietro}</a><b>${TITOLO}</b><span style="width:44px"></span></header>
    <div id="corpo"></div>
    <div id="segni-box"></div>
    <div id="chat" class="card" style="margin:12px 16px 130px" hidden>
      <b>💬 Al tavolo</b>
      <div id="chat-righe" style="margin:6px 0;max-height:150px;overflow-y:auto;font-size:15px;line-height:1.5"></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">${FRASI.map((f) => `<button class="chip" data-frase="${esc(f)}" style="margin:0;font-size:13px">${esc(f)}</button>`).join("")}</div>
      <form id="chat-f" style="display:flex;gap:6px"><input id="chat-t" maxlength="200" placeholder="Scrivi al tavolo…" autocomplete="off" style="flex:1;margin:0">
        <button type="button" id="chat-voce" class="chip" style="margin:0" aria-label="Detta">🎙</button><button class="chip on" style="margin:0">Invia</button></form>
    </div>`;

  let ultimoMsg = 0, posti = [], mioPosto = -1, primoGiro = true;
  const righe = [];
  async function messaggi() {
    const { data } = await sb.from("partita_messaggi").select("id, posto, tipo, testo, solo_squadra").eq("partita_id", id).gt("id", ultimoMsg).order("id").limit(50);
    for (const m of data ?? []) {
      ultimoMsg = m.id;
      const chi = m.posto === mioPosto ? "tu" : esc(posti[m.posto]?.nome ?? "");
      if (m.tipo === "testo") righe.push(`<div><b>${chi}:</b> ${esc(m.testo)}</div>`);
      else {
        const sg = SEGNI[m.testo] ?? SEGNALI[m.testo]; if (!sg) continue;
        righe.push(`<div class="tenue">🤫 ${chi} ${sg.fa} ${sg.e}</div>`);
        // il segno del compagno: compare grande per qualche secondo (non al primo caricamento)
        if (m.posto !== mioPosto && !primoGiro) {
          const b = document.createElement("div"); b.setAttribute("role", "status");
          b.innerHTML = `<div style="font-size:64px;line-height:1">${sg.e}</div><b>${chi} ${sg.fa}</b><div style="font-size:14px;opacity:.85">vuol dire: ${sg.vuol}</div>`;
          b.style.cssText = "position:fixed;left:50%;top:90px;transform:translateX(-50%);z-index:60;background:rgba(18,48,44,.95);color:#fff;text-align:center;padding:16px 22px;border-radius:20px;box-shadow:0 10px 30px rgba(0,0,0,.3);max-width:86%";
          document.body.appendChild(b); setTimeout(() => b.remove(), 4000);
          if (navigator.vibrate) navigator.vibrate([60, 60, 60]);
        }
      }
    }
    primoGiro = false;
    const box = document.getElementById("chat-righe");
    if (box) { box.innerHTML = righe.slice(-30).join("") || `<span class="tenue">Ancora nessuno ha parlato.</span>`; box.scrollTop = box.scrollHeight; }
  }
  const parla = async (t) => { if (!t.trim()) return; const { error } = await sb.rpc("partita_parla", { p_partita: id, p_testo: t }); if (error) alert(error.message); messaggi(); };
  document.getElementById("chat-f").onsubmit = (e) => { e.preventDefault(); const c = document.getElementById("chat-t"); parla(c.value); c.value = ""; };
  document.querySelectorAll("[data-frase]").forEach((b) => b.onclick = () => parla(b.dataset.frase));
  const Riconosci = window.SpeechRecognition || window.webkitSpeechRecognition;
  const bv = document.getElementById("chat-voce");
  if (!Riconosci) bv.hidden = true;
  else bv.onclick = () => {
    const r = new Riconosci(); r.lang = "it-IT"; const c = document.getElementById("chat-t");
    bv.textContent = "⏺"; r.onresult = (ev) => { c.value = [...ev.results].map((x) => x[0].transcript).join(""); };
    r.onend = () => { bv.textContent = "🎙"; if (c.value.trim()) { parla(c.value); c.value = ""; } }; r.start();
  };

  async function aggiorna() {
    const corpo = document.getElementById("corpo");
    if (!corpo) { clearInterval(timer); return; }
    const [{ data: p }, { data: mani }] = await Promise.all([
      sb.from("partite").select("id, cerchia_id, creato_da, n, posti, stato, pubblico, aggiornata_il").eq("id", id).maybeSingle(),
      sb.from("partita_mani").select("posto, carte").eq("partita_id", id),
    ]);
    if (!p) { corpo.innerHTML = `<p class="pad">Questo tavolo non c'è più.</p>`; clearInterval(timer); return; }
    posti = p.posti; mioPosto = p.posti.findIndex((x) => x.persona_id === state.io.id);
    document.getElementById("chat").hidden = p.stato === "attesa" || mioPosto < 0;
    const sb4 = document.getElementById("segni-box");
    if (TRE && p.stato === "in_corso" && mioPosto >= 0) {
      if (!sb4.dataset.pronto) {
        sb4.dataset.pronto = "1";
        sb4.innerHTML = `<div class="card" style="margin:12px 16px 0"><b>📢 Segnali</b> <span class="tenue" style="font-size:13px">· li sentono tutti, si dicono quando giochi la carta</span>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px">${Object.entries(SEGNALI).map(([k, v]) => `<button data-segnale="${k}" style="border:1px solid var(--bordo);background:#fff;border-radius:14px;padding:8px 2px;cursor:pointer"><div style="font-size:28px">${v.e}</div><small style="font-weight:700;font-size:12px;text-transform:capitalize">${k}</small></button>`).join("")}</div>
          <p class="tenue" style="font-size:12px;margin:6px 0 0">👊 busso: gioca la più alta · 👉 striscio: ne ho altre · 🕊️ volo: era l'ultima</p></div>`;
        sb4.querySelectorAll("[data-segnale]").forEach((b) => b.onclick = async () => {
          const { error } = await sb.rpc("tressette_segnale", { p_partita: id, p_segnale: b.dataset.segnale });
          if (error) alert(error.message); else { b.style.background = "#E1F5EE"; setTimeout(() => { b.style.background = "#fff"; }, 800); messaggi(); }
        });
      }
    } else if (!TRE && p.n === 4 && p.stato === "in_corso" && mioPosto >= 0) {
      if (!sb4.dataset.pronto) {
        sb4.dataset.pronto = "1";
        sb4.innerHTML = `<div class="card" style="margin:12px 16px 0"><b>🤫 Segni al compagno</b> <span class="tenue" style="font-size:13px">· li vede solo lui</span>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:8px">${Object.entries(SEGNI).map(([k, v]) => `<button data-segno="${k}" style="border:1px solid var(--bordo);background:#fff;border-radius:14px;padding:8px 2px;cursor:pointer"><div style="font-size:30px">${v.e}</div><small style="font-weight:700;font-size:11px">${v.tasto}</small></button>`).join("")}</div>
          <p class="tenue" style="font-size:12px;margin:6px 0 0">😉 asso · 😏 tre · 🤨 re · 😮 niente briscola</p></div>`;
        sb4.querySelectorAll("[data-segno]").forEach((b) => b.onclick = async () => {
          const { error } = await sb.rpc("briscola_segno", { p_partita: id, p_segno: b.dataset.segno });
          if (error) alert(error.message); else { b.style.background = "#E1F5EE"; setTimeout(() => { b.style.background = "#fff"; }, 800); messaggi(); }
        });
      }
    } else { sb4.innerHTML = ""; delete sb4.dataset.pronto; }
    messaggi();
    const firma = [p.aggiornata_il, p.stato, JSON.stringify(mani)].join("|");
    if (firma === ultimaFirma) return;
    ultimaFirma = firma;
    disegna(p, mani?.[0] ?? null);
  }

  function disegna(p, mia) {
    const corpo = document.getElementById("corpo");
    const pub = p.pubblico ?? {};
    const io = p.posti.findIndex((x) => x.persona_id === state.io.id);
    const nome = (i) => esc(p.posti[i]?.nome ?? "posto libero");
    const squadra = (i) => (p.n === 4 ? i % 2 : i);

    if (p.stato === "attesa") {
      const creatore = p.creato_da === state.io.id;
      corpo.innerHTML = `
        <div class="pad" style="text-align:center"><div style="font-size:44px">🃏</div><h1 style="margin:4px 0">${TRE ? "Tressette" : "Briscola"} a ${p.n}</h1>
          <p class="tenue" style="margin:0">${p.n === 4 ? "Si gioca a coppie: chi siede di fronte è in squadra con te." : p.n === 5 ? "Chiamata: asta, carta chiamata, socio segreto." : "Uno contro uno."}</p></div>
        ${p.posti.map((x, i) => `<div class="card" style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <b style="flex:1">${p.n === 4 ? `<span class="tenue">Coppia ${i % 2 ? "B" : "A"} · </span>` : ""}${x.persona_id ? esc(x.nome) : `<span class="tenue">posto libero</span>`}</b>
          ${!x.persona_id ? `<button class="chip" data-siedi="${i}" style="margin:0">Siediti qui</button>` : x.persona_id === state.io.id ? `<span class="tenue">sei tu</span>` : ""}</div>`).join("")}
        <div class="pad">
          ${creatore ? `<button class="btn ambra" id="inizia">Si gioca${p.posti.some((x) => !x.persona_id) ? " (i posti liberi li prende il telefono)" : ""}</button>` : `<p class="tenue" style="text-align:center">${io >= 0 ? "Sei seduto: si parte quando lo decide chi ha aperto il tavolo." : "Scegli un posto libero."}</p>`}
          ${state.cerchie.some((c) => c.id === p.cerchia_id) ? `<button class="btn chiaro" id="invita" style="margin-top:10px">🔔 Avvisa tutto il gruppo «${esc(state.cerchie.find((c) => c.id === p.cerchia_id)?.nome ?? "")}»</button>` : ""}
          <button class="btn chiaro" id="invita-wa" style="margin-top:10px">📲 Invita un amico su WhatsApp</button>
          <p class="tenue" style="font-size:13px;text-align:center;margin:4px 0 0">L'amico entra solo a questo tavolo: non vede la famiglia né il gruppo.</p></div>`;
      corpo.querySelector("#invita-wa").onclick = () => invitaAlGioco({ tipo: "partita", id, cerchiaId: p.cerchia_id, torna: `#/${gioco}?id=${id}`, titolo: TRE ? "Tressette" : "Briscola",
        testo: `🃏 ${TRE ? "Tressette" : "Briscola"} a ${p.n} su Ancora, con le carte napoletane: manchi tu al tavolo.`, perche: "Manchi tu al tavolo: un minuto e ti siedi." });
      corpo.querySelectorAll("[data-siedi]").forEach((b) => b.onclick = async () => {
        const { error } = await sb.rpc("briscola_siedi", { p_partita: id, p_posto: Number(b.dataset.siedi) });
        if (error) alert(error.message); ultimaFirma = ""; aggiorna();
      });
      corpo.querySelector("#inizia")?.addEventListener("click", async (e) => {
        e.target.disabled = true;
        const { error } = await sb.rpc(`${gioco}_inizia`, { p_partita: id });
        if (error) { alert(error.message); e.target.disabled = false; } ultimaFirma = ""; aggiorna();
      });
      if (corpo.querySelector("#invita")) corpo.querySelector("#invita").onclick = async (e) => {
        const { data: n } = await sb.rpc("briscola_invita", { p_partita: id });
        e.target.textContent = n ? `🔔 Invitati ${n} sul telefono` : "🔔 Già invitati (si può rifare tra 10 minuti)"; e.target.disabled = true;
      };
      return;
    }

    const turno = Number(pub.turno), tocca = turno === io && p.stato === "in_corso";
    const manoHtml = (titolo) => io >= 0 && mia ? `<div style="margin:14px 16px 0;padding:10px;border-radius:16px;background:#F3EDE2"><div style="font-weight:800;margin-bottom:8px">${titolo}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">${mia.carte.slice().sort().map((c) => carta(c, { piccola: true })).join("")}</div></div>` : "";
    if (p.n === 5 && pub.fase === "asta") {
      const a = pub.asta ?? {}; const att = Number(a.offerta ?? 60); const passati = a.passati ?? [];
      corpo.innerHTML = `
        ${pub.avviso ? `<div class="card" style="background:#FFF6E8">${esc(pub.avviso)}</div>` : ""}
        <div class="pad" style="text-align:center"><div style="font-size:40px">🔨</div><h1 style="margin:4px 0">L'asta</h1>
          <p style="margin:0;font-size:18px">${a.chi != null ? `Offerta più alta: <b>${att}</b> di ${a.chi === io ? "te" : nome(a.chi)}` : "Nessuna offerta: si parte da 61"}</p>
          <p class="tenue" style="margin:4px 0 0">${p.posti.map((x, i) => `${passati.includes(i) ? "<s>" : ""}${i === io ? "tu" : nome(i)}${passati.includes(i) ? "</s>" : ""}${turno === i ? " ▶" : ""}`).join(" · ")}</p></div>
        ${tocca ? `<div class="card"><b>Tocca a te: quanto fai?</b>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">${[1, 2, 5, 10].map((k) => att + k <= 120 ? `<button class="chip on" data-offri="${Math.max(61, att + k)}" style="margin:0">${Math.max(61, att + k)}</button>` : "").join("")}
            <button class="chip" data-offri="passo" style="margin:0">Passo</button></div>
          <p class="tenue" style="font-size:13px;margin:8px 0 0">Offri i punti che pensi di fare con il tuo socio (su 120).</p></div>`
          : `<p class="pad tenue" style="text-align:center">Tocca a ${nome(turno)}…</p>`}
        ${manoHtml("Le tue carte")}`;
      corpo.querySelectorAll("[data-offri]").forEach((b) => b.onclick = async () => {
        corpo.querySelectorAll("[data-offri]").forEach((x) => x.disabled = true);
        const { error } = await sb.rpc("briscola_offri", { p_partita: id, p_punti: b.dataset.offri === "passo" ? null : Number(b.dataset.offri) });
        if (error) alert(error.message); ultimaFirma = ""; aggiorna();
      });
      return;
    }
    if (p.n === 5 && pub.fase === "chiamata") {
      const io_ch = Number(pub.chiamante) === io;
      let scelta = null;
      corpo.innerHTML = `
        <div class="pad" style="text-align:center"><div style="font-size:40px">📣</div>
          <h1 style="margin:4px 0">${io_ch ? `Hai vinto l'asta a ${pub.offerta}` : `${nome(pub.chiamante)} ha vinto l'asta a ${pub.offerta}`}</h1>
          <p class="tenue" style="margin:0">${io_ch ? "Chiama una carta che non hai: il suo seme diventa la briscola, chi la tiene è il tuo socio." : "Sta chiamando la carta…"}</p></div>
        ${io_ch ? `<div class="card">
          ${["D", "C", "S", "B"].map((sm) => `<div style="margin-bottom:8px"><b style="color:${COLORE[sm]}">${SEMI[sm]}</b>
            <div style="display:flex;gap:4px;overflow-x:auto;padding:4px 0">${[1, 3, 10, 9, 8, 7, 6, 5, 4, 2].map((v) => sm + v).filter((c) => !mia?.carte.includes(c))
              .map((c) => `<button data-chiama="${c}" style="border:0;background:none;padding:2px;cursor:pointer;border-radius:8px">${carta(c, { piccola: true })}</button>`).join("")}</div></div>`).join("")}
          <button class="btn ambra" id="chiamo" disabled>Chiama la carta</button></div>` : ""}
        ${manoHtml("Le tue carte")}`;
      corpo.querySelectorAll("[data-chiama]").forEach((b) => b.onclick = () => {
        corpo.querySelectorAll("[data-chiama]").forEach((x) => x.style.background = "none");
        b.style.background = "#E8B56B"; scelta = b.dataset.chiama;
        const bt = corpo.querySelector("#chiamo"); bt.disabled = false; bt.textContent = `Chiamo il ${nomeCarta(scelta)}`;
      });
      corpo.querySelector("#chiamo")?.addEventListener("click", async (e) => {
        if (!scelta) return; e.target.disabled = true;
        const { error } = await sb.rpc("briscola_chiama", { p_partita: id, p_carta: scelta });
        if (error) { alert(error.message); e.target.disabled = false; } ultimaFirma = ""; aggiorna();
      });
      return;
    }
    const punti = pub.punti ?? [0, 0];
    const etichettaSq = (s) => (p.n === 4 ? `${nome(s)} e ${nome(s + 2)}` : nome(s));
    // gli altri intorno al tavolo, dal mio punto di vista
    const altri = Array.from({ length: p.n - 1 }, (_, k) => (Math.max(io, 0) + k + 1) % p.n);
    const tav = pub.tavolo ?? [];
    const obbligo = TRE && tav.length && mia?.carte.some((c) => c[0] === tav[0].carta[0]) ? tav[0].carta[0] : null;
    const giocabile = (c) => !obbligo || c[0] === obbligo;
    const ultima = pub.ultima;
    // mano appena chiusa: la mostro un attimo, così si vede chi ha preso
    const mostraUltima = ultima && ultima.n !== ultimaPresaVista && !tav.length;
    if (ultima) ultimaPresaVista = ultima.n;

    let risultato = "";
    if (p.stato === "finita" && p.n === 5 && pub.esito) {
      const e = pub.esito, ch = Number(pub.chiamante), so = pub.socio;
      const mioPunteggio = io >= 0 ? e.punteggio[io] : 0;
      risultato = `<div class="card" style="text-align:center;background:#FFF6E8"><div style="font-size:42px">${mioPunteggio > 0 ? "🏆" : "🙂"}</div>
        <b style="font-size:20px">${e.vinto ? `${nome(ch)}${so != null && so !== ch ? ` e ${nome(so)}` : ""} ce l'hanno fatta!` : `${nome(ch)} non ce l'ha fatta`}</b>
        <div class="tenue" style="margin-top:4px">Hanno fatto ${e.fatti} su ${pub.offerta} offerti${so === ch ? " (si era chiamato da solo)" : ""}</div>
        <div style="margin-top:8px">${p.posti.map((x, i) => `${i === io ? "tu" : nome(i)} <b>${e.punteggio[i] > 0 ? "+" : ""}${e.punteggio[i]}</b>`).join(" · ")}</div>
        <a class="btn ambra" href="#/briscola?c=${p.cerchia_id}" style="margin-top:12px">Un'altra partita</a></div>`;
    } else if (p.stato === "finita" && TRE) {
      const [a, b] = pub.punti ?? [0, 0], mio = io >= 0 ? squadra(io) : 0;
      risultato = `<div class="card" style="text-align:center;background:#FFF6E8"><div style="font-size:42px">${a === b ? "🤝" : (a > b ? 0 : 1) === mio ? "🏆" : "🙂"}</div>
        <b style="font-size:20px">${a === b ? `Pareggio: ${a} a ${b}` : `Vince ${a > b ? etichettaSq(0) : etichettaSq(1)}, ${Math.max(a, b)} a ${Math.min(a, b)}`}</b>
        <div class="tenue" style="margin-top:4px">${etichettaSq(0)} ${terzi(pub.terzi[0])} · ${etichettaSq(1)} ${terzi(pub.terzi[1])} (i terzi si perdono)</div>
        <a class="btn ambra" href="#/tressette?c=${p.cerchia_id}" style="margin-top:12px">Un'altra partita</a></div>`;
    } else if (p.stato === "finita") {
      const [a, b] = punti, mio = io >= 0 ? squadra(io) : 0;
      risultato = `<div class="card" style="text-align:center;background:#FFF6E8"><div style="font-size:42px">${a === b ? "🤝" : (a > b ? 0 : 1) === mio ? "🏆" : "🙂"}</div>
        <b style="font-size:20px">${a === b ? "Pareggio: 60 a 60!" : `Vince ${a > b ? etichettaSq(0) : etichettaSq(1)}`}</b>
        <div class="tenue" style="margin-top:4px">${etichettaSq(0)} ${a} · ${etichettaSq(1)} ${b}</div>
        <a class="btn ambra" href="#/briscola?c=${p.cerchia_id}" style="margin-top:12px">Un'altra partita</a></div>`;
    }

    corpo.innerHTML = `
      ${risultato}${p.stato === "finita" ? invitoPiu() : ""}
      <div style="display:flex;justify-content:space-around;padding:10px 12px 0;gap:8px">${altri.map((i) => `<div style="text-align:center;min-width:0">
        <div style="display:flex;justify-content:center;gap:2px">${p.stato === "in_corso" ? (p.n === 2 ? dorso() + dorso() + dorso() : dorso()) : ""}</div>
        <small style="display:block;margin-top:4px;font-weight:${turno === i ? 800 : 600};${turno === i ? "color:#C8102E" : ""}">${turno === i && p.stato === "in_corso" ? "▶ " : ""}${nome(i)}${p.n === 4 && squadra(i) === squadra(io) ? " 🤝" : ""}</small></div>`).join("")}</div>

      <div style="margin:12px 16px;padding:14px 10px;border-radius:18px;background:#2E6B4F;min-height:150px;display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;position:relative">
        ${(mostraUltima ? ultima.tavolo : tav).map((x) => `<div style="text-align:center;${mostraUltima && x.posto === ultima.vince ? "transform:translateY(-6px)" : ""}">${carta(x.carta, { piccola: true, attiva: mostraUltima && x.posto === ultima.vince })}<small style="display:block;color:#fff;font-size:11px;margin-top:2px">${x.posto === io ? "tu" : nome(x.posto)}</small></div>`).join("")
          || `<span style="color:rgba(255,255,255,.8);font-weight:700">${tocca ? "Tocca a te: gioca una carta" : p.stato === "in_corso" ? `Tocca a ${nome(turno)}` : ""}</span>`}
        ${mostraUltima ? `<div style="position:absolute;bottom:6px;left:0;right:0;text-align:center;color:#fff;font-weight:800;font-size:14px">Prende ${ultima.vince === io ? "tu" : nome(ultima.vince)}${ultima.punti ? ` · ${ultima.punti} punti` : ""}</div>` : ""}
      </div>

      <div style="display:flex;align-items:center;gap:12px;padding:0 16px">
        ${TRE ? `<div style="flex:1">
          <div class="tenue" style="font-size:14px">Si risponde al seme · comanda il 3${p.n === 2 ? ` · nel mazzo ${pub.restanti ?? 0}` : ""}</div>
          <div style="font-size:14px;margin-top:4px">${etichettaSq(0)}: <b>${terzi(pub.terzi?.[0] ?? 0)}</b> · ${etichettaSq(1)}: <b>${terzi(pub.terzi?.[1] ?? 0)}</b></div>
          ${p.n === 2 && pub.pescate?.length ? `<div style="font-size:13px;margin-top:4px" class="tenue">Pescate: ${pub.pescate.map((x) => `${x.posto === io ? "tu" : nome(x.posto)} ${nomeCarta(x.carta)}`).join(" · ")}</div>` : ""}
          ${ultima ? `<div style="font-size:13px;margin-top:6px" class="tenue">Ultima mano: ${ultima.tavolo.map((x) => nomeCarta(x.carta)).join(" · ")} → ${ultima.vince === io ? "tu" : nome(ultima.vince)}</div>` : ""}
        </div>` : ""}
        ${!TRE && pub.briscola ? `<div style="text-align:center">${carta(pub.briscola, { piccola: true })}<small class="tenue" style="display:block;font-size:11px">briscola</small></div>` : ""}
        ${TRE ? "" : `<div style="flex:1">
          <div class="tenue" style="font-size:14px">Briscola: <b style="color:${COLORE[pub.briscola?.[0]]}">${SEMI[pub.briscola?.[0]] ?? ""}</b> · nel mazzo ${pub.restanti ?? 0}</div>
          ${p.n === 5 ? `<div style="font-size:14px;margin-top:4px">📣 ${Number(pub.chiamante) === io ? "Tu" : nome(pub.chiamante)} a <b>${pub.offerta}</b> · chiamato il <b>${pub.chiamata ? nomeCarta(pub.chiamata) : ""}</b></div>
            <div style="font-size:14px;margin-top:2px">Socio: <b>${pub.socio != null ? (Number(pub.socio) === io ? "tu" : nome(pub.socio)) : "ancora segreto 🤫"}</b>${mia?.carte.includes(pub.chiamata) ? " <span class='tenue'>(sei tu, ma non dirlo!)</span>" : ""}</div>`
          : `<div style="font-size:14px;margin-top:4px">${etichettaSq(0)}: <b>${punti[0]}</b> · ${etichettaSq(1)}: <b>${punti[1]}</b></div>`}
          ${ultima && !mostraUltima ? `<div style="font-size:13px;margin-top:6px;display:flex;align-items:center;gap:4px;flex-wrap:wrap"><span class="tenue">Ultima mano:</span>${ultima.tavolo.map((x) => `<span style="font-weight:700;color:${COLORE[x.carta[0]]}">${nomeCarta(x.carta).replace(" di ", " ")}</span>`).join("<span class='tenue'>·</span>")}<span class="tenue">→ ${ultima.vince === io ? "tu" : nome(ultima.vince)}${ultima.punti ? ` +${ultima.punti}` : ""}</span></div>` : ""}
        </div>`}</div>

      ${io >= 0 && mia ? `<div style="margin:14px 16px 0;padding:10px;border-radius:16px;background:${tocca ? "#FFF6E8" : "#F3EDE2"};${tocca ? "box-shadow:0 0 0 3px #E8B56B" : ""}">
        <div style="font-weight:800;margin-bottom:8px">${tocca ? (TRE && obbligo ? `▶ Tocca a te: rispondi a ${SEMI[obbligo]}` : "▶ Tocca a te: scegli la carta") : "Le tue carte"}</div>
        <div style="display:flex;gap:${mia.carte.length > 3 ? 6 : 10}px;justify-content:center;flex-wrap:wrap">${mia.carte.slice().sort().map((c) => { const ok = tocca && giocabile(c);
          return `<button data-carta="${c}" aria-label="${nomeCarta(c)}" ${ok ? "" : "disabled"} style="border:0;background:none;padding:0;cursor:${ok ? "pointer" : "default"};${ok ? "" : tocca ? "opacity:.35" : "opacity:.8"}">${carta(c, { attiva: ok, piccola: mia.carte.length > 3 })}</button>`; }).join("") || `<span class="tenue">Nessuna carta</span>`}</div></div>`
        : `<p class="pad tenue" style="text-align:center">Guardi la partita.</p>`}`;

    corpo.querySelectorAll("[data-carta]").forEach((b) => b.onclick = async () => {
      corpo.querySelectorAll("[data-carta]").forEach((x) => x.disabled = true);
      const { error } = await sb.rpc(`${gioco}_gioca`, { p_partita: id, p_carta: b.dataset.carta });
      if (error) alert(error.message);
      ultimaFirma = ""; aggiorna();
    });
    // la mano chiusa resta visibile un attimo, poi si ridisegna il tavolo vuoto
    if (mostraUltima) setTimeout(() => { ultimaFirma = ""; aggiorna(); }, 2200);
  }

  await aggiorna();
  timer = setInterval(() => { if (!document.hidden) aggiorna(); }, 2000);
}
