// L'aiutante della famiglia: il nome lo sceglie la famiglia. Chat privata di chi la fa.
// Fa cose vere (calendario, liste, ricette anche dalla foto) e le mostra in un riquadro con Apri / Annulla.
import { sb, state, $app, esc, passaPiu, ICONE } from "../app.js";
import { SUPABASE_URL } from "../config.js";

const SUGGERITI = ["Ancora", "Nonna Pina", "Il saggio", "Pippo", "Zia Rosa"];
const PRONTE = ["Cosa è successo questa settimana?", "Compleanni in arrivo?", "Cosa c'è da comprare?", "Fotografa una ricetta"];

export default async function ({ params }) {
  const famiglie = state.cerchie.filter((c) => c.tipo === "famiglia");
  const scelta = (params.c && state.cerchie.find((c) => c.id === params.c)) ?? famiglie[0] ?? state.cerchie[0];
  if (!scelta) { $app().innerHTML = `<div class="pad"><p>Prima crea o entra in una famiglia: l'aiutante lavora per lei.</p><a class="btn" href="#/cerchie">Famiglie e gruppi</a></div>`; return; }
  const { data: cer } = await sb.from("cerchie").select("id, nome, aiutante_nome").eq("id", scelta.id).single();
  if (!cer?.aiutante_nome || params.rinomina) return sceltaNome(cer ?? scelta);
  return chat(cer);
}

function sceltaNome(cer) {
  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/" aria-label="Indietro">${ICONE.indietro}</a><b>L'aiutante</b><span style="width:44px"></span></header>
    <div class="pad" style="text-align:center;padding-top:20px">
      <div style="width:64px;height:64px;border-radius:32px;background:#E1F5EE;color:#085041;display:inline-grid;place-items:center;font-size:30px">✨</div>
      <h1 style="margin:12px 0 4px">Come lo chiamate?</h1>
      <p class="tenue" style="margin:0 0 16px">L'aiutante di ${esc(cer.nome)}: si ricorda tutto quello che mettete su Ancora e vi dà una mano. Il nome lo scegliete voi, e si cambia quando volete.</p>
      <input id="nome" maxlength="30" value="${esc(cer.aiutante_nome ?? "")}" placeholder="Un nome per il vostro aiutante" style="text-align:center;font-size:18px">
      <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:10px 0 16px">
        ${SUGGERITI.map((n) => `<button type="button" class="chip" data-n="${esc(n)}" style="margin:0">${esc(n)}</button>`).join("")}</div>
      <button class="btn ambra" id="ok">Inizia</button>
      <p id="esito" role="status"></p>
    </div>`;
  const campo = document.getElementById("nome");
  document.querySelectorAll("[data-n]").forEach((b) => b.onclick = () => { campo.value = b.dataset.n; });
  document.getElementById("ok").onclick = async () => {
    const n = campo.value.trim() || "Ancora";
    const { error } = await sb.rpc("aiutante_nome", { p_cerchia: cer.id, p_nome: n });
    if (error) { document.getElementById("esito").innerHTML = `<span class="errore">Non salvato. Riprova.</span>`; return; }
    const s = state.cerchie.find((c) => c.id === cer.id); if (s) s.aiutante_nome = n;
    location.replace(`#/aiutante?c=${cer.id}`);
  };
}

async function chat(cer) {
  const nome = cer.aiutante_nome;
  const [{ data: restanti }, { data: storia }] = await Promise.all([
    sb.rpc("aiutante_restanti", { p_cerchia: cer.id }),
    sb.from("aiutante_messaggi").select("ruolo, testo, azioni, creato_il").eq("cerchia_id", cer.id).order("creato_il", { ascending: false }).limit(40),
  ]);
  const altre = state.cerchie.filter((c) => c.id !== cer.id && c.tipo === "famiglia");
  $app().innerHTML = `
    <header class="testa" style="gap:10px">
      <a class="icona" href="#/" aria-label="Indietro">${ICONE.indietro}</a>
      <div style="width:36px;height:36px;border-radius:18px;background:#E1F5EE;color:#085041;display:grid;place-items:center;flex-shrink:0">✨</div>
      <div style="flex:1;min-width:0"><b style="display:block;font-size:17px">${esc(nome)}</b>
        <small class="tenue">${esc(cer.nome)} · <a href="#/aiutante?c=${cer.id}&rinomina=1">rinomina</a>${altre.length ? ` · <a href="#" id="altra">altra famiglia</a>` : ""}</small></div>
      <span id="conta" class="chip" style="margin:0;font-size:12px;${restanti === -1 ? "display:none" : ""}">${restanti} su 5</span>
    </header>
    <div id="fili" style="padding:12px 14px 150px;display:flex;flex-direction:column;gap:8px"></div>
    <form id="scrivi" style="position:fixed;left:0;right:0;bottom:calc(84px + env(safe-area-inset-bottom));display:flex;gap:8px;align-items:center;padding:10px 12px;background:#FBF8F2;border-top:1px solid var(--bordo);max-width:720px;margin:0 auto">
      <label class="icona" aria-label="Foto di una ricetta" style="width:44px;height:44px;display:grid;place-items:center;border-radius:22px;border:1px solid var(--bordo);cursor:pointer;flex-shrink:0">📷
        <input id="foto" type="file" accept="image/*" capture="environment" hidden></label>
      <input id="testo" placeholder="Chiedi a ${esc(nome)}…" autocomplete="off" style="flex:1;margin:0;min-height:44px">
      <button type="button" id="voce" class="icona" aria-label="Parla" style="width:44px;height:44px;border-radius:22px;border:1px solid var(--bordo);flex-shrink:0">🎙</button>
      <button class="btn" style="width:auto;padding:0 16px;margin:0;min-height:44px">Invia</button>
    </form>`;
  const fili = document.getElementById("fili");
  const bolla = (ruolo, testo, azioni) => {
    const mio = ruolo === "utente";
    const d = document.createElement("div");
    d.style.cssText = `align-self:${mio ? "flex-end" : "flex-start"};max-width:86%;padding:10px 14px;border-radius:18px;line-height:1.45;white-space:pre-wrap;${mio ? "background:#2F5A55;color:#fff;border-bottom-right-radius:6px" : "background:#fff;border:1px solid var(--bordo);border-bottom-left-radius:6px"}`;
    d.textContent = String(testo ?? "").replace(/\*\*(.+?)\*\*/g, "$1");
    for (const a of azioni ?? []) {
      const r = document.createElement("div");
      r.style.cssText = "display:flex;align-items:center;gap:8px;margin-top:8px;padding:8px 10px;border-radius:12px;background:#F3EDE2;font-size:14px;white-space:normal";
      r.innerHTML = `<span aria-hidden="true">${a.tipo === "evento" ? "📅" : a.tipo === "ricetta" ? "🍝" : "📝"}</span><span style="flex:1">${esc(a.testo)}</span>
        <a href="${esc(a.link)}" style="font-weight:700">Apri</a><button type="button" style="border:0;background:none;color:#B3402F;font-weight:700;cursor:pointer">Annulla</button>`;
      r.querySelector("button").onclick = async (e) => {
        const t = a.tipo === "evento" ? sb.from("eventi").delete().eq("id", a.id)
          : a.tipo === "ricetta" ? sb.from("ricordi").delete().eq("id", a.id)
          : sb.from("liste_voci").delete().in("id", a.ids ?? []);
        const { error } = await t;
        if (error) { alert("Non annullato: " + error.message); return; }
        r.style.opacity = ".5"; e.target.replaceWith(Object.assign(document.createElement("span"), { textContent: "annullato", style: "color:#888;font-size:13px" }));
      };
      d.appendChild(r);
    }
    fili.appendChild(d);
    return d;
  };
  bolla("aiutante", `Ciao ${state.io?.soprannome || state.io?.nome || ""}! Sono ${nome}. Posso mettere appuntamenti nel calendario, aggiungere cose alla spesa, ricopiare una ricetta da una foto e ricordarvi cosa è successo in famiglia. Come ti aiuto?`);
  for (const m of (storia ?? []).reverse()) bolla(m.ruolo, m.testo, m.azioni);
  const pronte = document.createElement("div");
  pronte.style.cssText = "display:flex;flex-wrap:wrap;gap:6px";
  pronte.innerHTML = PRONTE.map((p) => `<button type="button" class="chip" style="margin:0;background:#E1F5EE;color:#085041;border-color:#9FE1CB">${esc(p)}</button>`).join("");
  fili.appendChild(pronte);
  pronte.querySelectorAll("button").forEach((b) => b.onclick = () => b.textContent === "Fotografa una ricetta" ? document.getElementById("foto").click() : invia(b.textContent));
  window.scrollTo(0, document.body.scrollHeight);

  document.getElementById("altra")?.addEventListener("click", (e) => {
    e.preventDefault();
    const c = altre[0]; location.hash = `#/aiutante?c=${c.id}`;
  });

  let occupato = false;
  async function invia(testo, immagine = null) {
    if (occupato || (!testo && !immagine)) return;
    occupato = true;
    pronte.remove();
    bolla("utente", immagine ? `📷 ${testo || "Ricopia questa ricetta"}` : testo);
    const attesa = bolla("aiutante", "…");
    window.scrollTo(0, document.body.scrollHeight);
    try {
      const { data: { session } } = await sb.auth.getSession();
      const r = await fetch(`${SUPABASE_URL}/functions/v1/aiutante`, {
        method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ cerchia_id: cer.id, testo, immagine }),
      });
      const j = await r.json();
      attesa.remove();
      if (j.limite) { bolla("aiutante", j.errore); passaPiu("L'aiutante della famiglia senza limiti è di Ancora+."); }
      else if (!r.ok) bolla("aiutante", j.errore ?? "Non riesco a rispondere ora. Riprova tra poco.");
      else {
        bolla("aiutante", j.testo, j.azioni);
        const c = document.getElementById("conta");
        if (j.restanti >= 0) c.textContent = `${j.restanti} su 5`;
      }
    } catch { attesa.textContent = "Connessione assente. Riprova."; }
    occupato = false;
    window.scrollTo(0, document.body.scrollHeight);
  }

  const campo = document.getElementById("testo");
  document.getElementById("scrivi").onsubmit = (e) => { e.preventDefault(); const t = campo.value.trim(); campo.value = ""; invia(t); };
  // foto della ricetta: ridotta prima di partire
  document.getElementById("foto").onchange = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const img = await createImageBitmap(f).catch(() => null);
    if (!img) { alert("Questa foto non si apre. Prova con un'altra."); return; }
    const k = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    const t = campo.value.trim(); campo.value = ""; e.target.value = "";
    invia(t || "Ricopia questa ricetta e salvala nel ricettario.", c.toDataURL("image/jpeg", 0.82));
  };
  // dettatura: il telefono trascrive e si invia
  const Riconosci = window.SpeechRecognition || window.webkitSpeechRecognition;
  const bv = document.getElementById("voce");
  if (!Riconosci) bv.hidden = true;
  else bv.onclick = () => {
    const r = new Riconosci(); r.lang = "it-IT"; r.interimResults = true;
    bv.textContent = "⏺"; campo.placeholder = "Ti ascolto…";
    r.onresult = (ev) => { campo.value = [...ev.results].map((x) => x[0].transcript).join(""); };
    r.onend = () => { bv.textContent = "🎙"; campo.placeholder = `Chiedi a ${nome}…`; const t = campo.value.trim(); if (t) { campo.value = ""; invia(t); } };
    r.start();
  };
}
