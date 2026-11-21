// "Prova gratis una domanda": tre pagine pubbliche, senza account.
//  #/prova           chi vuole regalare scrive la domanda e la manda al nonno col proprio WhatsApp
//  #/rispondi/<cod>  il nonno risponde a voce: un tasto grande, poi "Invia"
//  #/ascolta/<cod>   chi l'ha mandata ascolta la risposta… e decide di regalare Ancora
import { $app, esc } from "../app.js";
import { SUPABASE_URL } from "../config.js";

const API = `${SUPABASE_URL}/functions/v1/prova`;
const DOMANDE = [
  "Com'era la casa dove sei cresciuto?",
  "Come vi siete conosciuti tu e la nonna?",
  "Qual è il ricordo più bello che hai di quando eri bambino?",
  "Che lavoro facevi e cosa ti piaceva di più?",
  "C'è un piatto della tua infanzia che non hai più mangiato?",
  "Che consiglio daresti a me, oggi?",
];
const MIC = `<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10a7 7 0 0 1-14 0"/><path d="M12 17v5"/></svg>`;
const salvaMia = (c) => { try { const l = JSON.parse(localStorage.getItem("ancora_prove") ?? "[]"); if (!l.includes(c)) localStorage.setItem("ancora_prove", JSON.stringify([c, ...l].slice(0, 10))); } catch { /* niente */ } };
const leggi = async (c) => { const r = await fetch(`${API}?codice=${encodeURIComponent(c)}`); return r.ok ? r.json() : null; };

export default async function ({ id, params }) {
  const rotta = location.hash.replace(/^#\/?/, "").split(/[/?]/)[0];
  if (rotta === "rispondi") return rispondi(id);
  if (rotta === "ascolta") return ascolta(id);
  return crea(params);
}

// --- 1. chi regala: scrive la domanda ---
function crea() {
  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/accesso" aria-label="Indietro"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></a><span class="logo" style="font-size:22px">Prova gratis</span><span style="width:44px"></span></header>
    <form id="f" class="pad">
      <h1>Fai una domanda a chi ami. Ti risponderà con la sua voce.</h1>
      <p class="tenue" style="font-size:15px">Gratis, senza registrarti. Gliela mandi tu su WhatsApp, lui tocca il link e risponde a voce. Nessuna app da scaricare.</p>
      <label for="per">A chi la fai</label><input id="per" placeholder="Nonno Franco" required>
      <label for="da">Il tuo nome</label><input id="da" placeholder="Sofia" required>
      <label>La domanda</label>
      <div id="idee">${DOMANDE.map((d) => `<button type="button" class="chip">${esc(d)}</button>`).join("")}</div>
      <textarea id="dom" rows="3" placeholder="Oppure scrivila tu" required></textarea>
      <button class="btn ambra" style="margin-top:14px">Prepara il messaggio</button>
      <p id="es" role="status"></p>
    </form>
    <div id="mie"></div>`;
  document.querySelectorAll("#idee .chip").forEach((b) => b.onclick = () => {
    document.getElementById("dom").value = b.textContent;
    document.querySelectorAll("#idee .chip").forEach((x) => x.classList.toggle("on", x === b));
  });
  try {
    const mie = JSON.parse(localStorage.getItem("ancora_prove") ?? "[]");
    if (mie.length) document.getElementById("mie").innerHTML = `<div class="pad"><a class="btn chiaro" href="#/ascolta/${esc(mie[0])}">Ascolta la risposta che aspetti</a></div>`;
  } catch { /* niente */ }

  document.getElementById("f").onsubmit = async (e) => {
    e.preventDefault();
    const es = document.getElementById("es");
    es.textContent = "Preparo…";
    const per = document.getElementById("per").value.trim(), da = document.getElementById("da").value.trim();
    const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ azione: "crea", da_nome: da, per_nome: per, domanda: document.getElementById("dom").value }) });
    const j = await res.json().catch(() => ({}));
    if (!j.codice) { es.innerHTML = `<span class="errore">${esc(j.errore ?? "Non ci sono riuscito, riprova")}</span>`; return; }
    salvaMia(j.codice);
    const link = `${location.origin}${location.pathname}#/rispondi/${j.codice}`;
    const testo = `Ciao ${per}! Ti ho fatto una domanda su Ancora, mi rispondi con un vocale? Tocca qui: ${link}`;
    $app().innerHTML = `
      <header class="testa"><span class="logo" style="font-size:22px">Prova gratis</span><span></span></header>
      <div class="pad"><h1>Pronto!</h1><p style="font-size:17px">Adesso mandalo a ${esc(per)} su WhatsApp. Quando risponde, la sua voce la ascolti qui.</p>
        <a class="btn ambra" href="https://wa.me/?text=${encodeURIComponent(testo)}" target="_blank" rel="noopener">Manda su WhatsApp</a>
        <a class="btn chiaro" style="margin-top:10px" href="#/ascolta/${j.codice}">Vai alla pagina della risposta</a>
        <p class="tenue">Salva questa pagina: è il tuo posto per ascoltarlo.</p></div>`;
  };
}

// --- 2. il nonno: risponde a voce ---
async function rispondi(codice) {
  const p = await leggi(codice);
  if (!p) { $app().innerHTML = `<div class="pad" style="padding-top:60px"><h1>Questo link non funziona</h1><p>Chiedi a chi te l'ha mandato di rimandarlo.</p></div>`; return; }
  if (p.stato === "risposta") { fine(p, true); return; }

  $app().classList.add("semplice");
  $app().innerHTML = `
    <div class="pad" style="padding-top:calc(24px + env(safe-area-inset-top))"><span class="logo">Ancora</span>
      <p style="font-size:20px;margin:18px 0 8px">Ciao <b>${esc(p.per_nome)}</b>, ${esc(p.da_nome)} ti chiede:</p></div>
    <div class="lettera" style="font-size:24px">${esc(p.domanda)}</div>
    <div class="pad" style="text-align:center">
      <button id="rec" class="rec" type="button" aria-label="Tocca e parla" style="width:170px;height:170px;border-radius:85px">${MIC}</button>
      <p id="stato" style="font-size:20px;font-weight:800;margin:6px 0" role="status">Tocca il cerchio e parla</p>
      <p class="tenue" style="font-size:16px;margin-top:0">Quando hai finito, toccalo di nuovo.</p>
      <audio id="ant" controls hidden></audio>
      <button id="invia" class="btn ambra" style="min-height:64px;font-size:20px" hidden>Invia la mia voce</button>
      <button id="rifai" class="btn chiaro" style="margin-top:10px" hidden>Rifalla</button>
      <label class="tenue" style="margin-top:22px;display:block;font-weight:600">Il cerchio non funziona? <span style="text-decoration:underline">Registra da qui</span>
        <input id="file" type="file" accept="audio/*" capture style="display:none"></label>
    </div>`;

  let blob = null, inizio = 0, secondi = 0, mr = null, stream = null;
  const rec = document.getElementById("rec"), stato = document.getElementById("stato");
  const pronto = () => {
    const a = document.getElementById("ant"); a.src = URL.createObjectURL(blob); a.hidden = false;
    document.getElementById("invia").hidden = false; document.getElementById("rifai").hidden = false;
    rec.hidden = true; stato.textContent = "Ascoltati, poi tocca Invia";
  };
  rec.onclick = async () => {
    if (mr?.state === "recording") { mr.stop(); return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const pezzi = [];
      mr = new MediaRecorder(stream);
      mr.ondataavailable = (ev) => pezzi.push(ev.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        rec.classList.remove("on");
        secondi = Math.round((Date.now() - inizio) / 1000);
        blob = new Blob(pezzi, { type: mr.mimeType });
        pronto();
      };
      inizio = Date.now(); mr.start(); rec.classList.add("on");
      stato.textContent = "Ti ascolto… tocca di nuovo per finire";
    } catch {
      stato.textContent = "Il microfono non si apre: usa \"Registra da qui\" qui sotto";
    }
  };
  document.getElementById("file").onchange = (e) => { const f = e.target.files?.[0]; if (f) { blob = f; secondi = 0; pronto(); } };
  document.getElementById("rifai").onclick = () => location.reload();
  document.getElementById("invia").onclick = async () => {
    stato.textContent = "Invio…";
    document.getElementById("invia").disabled = true;
    const form = new FormData();
    form.append("codice", codice);
    form.append("durata", String(secondi));
    form.append("audio", blob, "vocale");
    const res = await fetch(API, { method: "POST", body: form });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { stato.textContent = j.errore ?? "Non è partito, riprova"; document.getElementById("invia").disabled = false; return; }
    fine(p, false);
  };
}

function fine(p, gia) {
  $app().innerHTML = `<div class="pad" style="padding-top:calc(60px + env(safe-area-inset-top));text-align:center">
    <span class="logo" style="font-size:40px">Ancora</span>
    <h1 style="margin-top:24px">${gia ? "Hai già risposto." : "Grazie!"}</h1>
    <p style="font-size:20px">${esc(p.da_nome)} ascolterà la tua voce.</p></div>`;
}

// --- 3. chi ha fatto la domanda: ascolta ---
async function ascolta(codice) {
  const p = await leggi(codice);
  if (!p) { $app().innerHTML = `<div class="pad" style="padding-top:60px"><h1>Pagina non trovata</h1><a class="btn" href="#/prova">Fai una domanda</a></div>`; return; }
  salvaMia(codice);
  const testa = `<header class="testa"><span class="logo" style="font-size:22px">Ancora</span><span></span></header>`;
  if (p.stato !== "risposta") {
    const link = `${location.origin}${location.pathname}#/rispondi/${codice}`;
    $app().innerHTML = `${testa}<div class="pad"><h1>${esc(p.per_nome)} non ha ancora risposto</h1>
      <div class="lettera" style="margin:14px 0;font-size:19px">${esc(p.domanda)}</div>
      <p class="tenue">Ricordaglielo con un messaggio. Questa pagina si aggiorna da sola quando arriva la sua voce.</p>
      <a class="btn chiaro" href="https://wa.me/?text=${encodeURIComponent(`Ti ricordi la mia domanda? Rispondimi a voce qui: ${link}`)}" target="_blank" rel="noopener">Ricordaglielo su WhatsApp</a></div>`;
    setTimeout(() => { if (location.hash.includes(codice)) ascolta(codice); }, 30000);
    return;
  }
  $app().innerHTML = `${testa}
    <div class="pad"><p class="tenue" style="margin:0">${esc(p.per_nome)} ti ha risposto</p>
      <h1 style="margin-top:4px">${esc(p.domanda)}</h1></div>
    <div class="foto" style="aspect-ratio:auto;min-height:200px;background:linear-gradient(160deg,#2A5A52,#12302C);align-items:center;justify-content:center">
      <button class="voce" type="button" data-audio="${esc(p.audio)}" style="margin:0;transform:scale(1.25)"><i><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg></i><span>Ascolta ${esc(p.per_nome)}</span></button>
    </div>
    <div class="pad">
      <div class="card" style="margin:16px 0 0;background:var(--ambra-chiaro);border-color:#EAD2AA">
        <b style="font-family:Fraunces,serif;font-size:21px;color:#4A3410">Vuoi che la sua voce resti, per sempre?</b>
        <p style="color:#5A3E12">Con Ancora ${esc(p.per_nome)} riceve una domanda a settimana e risponde così, a voce. Tutta la famiglia ascolta, e a fine anno c'è il libro con le sue storie.</p>
        <a class="btn ambra" href="#/regala?per=${encodeURIComponent(p.per_nome)}&prova=${codice}">Regala Ancora · 129 €</a>
        <p class="tenue" style="text-align:center;margin-bottom:0">Questa prima risposta la ritrovi nel vostro album.</p>
      </div>
      <a class="btn chiaro" style="margin-top:12px" href="#/prova">Fai un'altra domanda</a>
    </div>`;
}
