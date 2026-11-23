// L'aiutante della famiglia: il nome lo sceglie la famiglia. Chat privata di chi la fa.
// Fa cose vere (calendario, liste, ricette anche dalla foto) e le mostra in un riquadro con Apri / Annulla.
import { sb, state, $app, esc, passaPiu, ICONE, urlMedia, cambiaImmagine } from "../app.js";
import { SUPABASE_URL } from "../config.js";

const SUGGERITI = ["Ancora", "Nonna Pina", "Il saggio", "Pippo", "Zia Rosa"];
// [testo del bottone, domanda] — se la domanda inizia con 📷 si apre la fotocamera
const PRONTE = [
  ["📷 Cosa cucino col mio frigo?", "📷Ecco il mio frigo: cosa posso cucinare stasera?"],
  ["📷 Com'è messa questa pianta?", "📷Com'è messa questa pianta? Cosa devo fare?"],
  ["📷 Ricopia una ricetta", "📷Ricopia questa ricetta e salvala nel ricettario."],
  ["Cosa è successo questa settimana?", "Cosa è successo questa settimana?"],
  ["Compleanni in arrivo?", "Compleanni in arrivo?"],
  ["Cosa seminare questo mese?", "Cosa posso seminare o piantare questo mese?"],
];

export default async function ({ params }) {
  const famiglie = state.cerchie.filter((c) => c.tipo === "famiglia");
  const scelta = (params.c && state.cerchie.find((c) => c.id === params.c)) ?? famiglie[0] ?? state.cerchie[0];
  if (!scelta) { $app().innerHTML = `<div class="pad"><p>Prima crea o entra in una famiglia: l'aiutante lavora per lei.</p><a class="btn" href="#/cerchie">Famiglie e gruppi</a></div>`; return; }
  const { data: cer } = await sb.from("cerchie").select("id, nome, aiutante_nome").eq("id", scelta.id).single();
  const { data: restanti } = await sb.rpc("aiutante_restanti", { p_cerchia: scelta.id });
  if (restanti !== -1) return presentazione(cer ?? scelta);
  if (!cer?.aiutante_nome || params.rinomina) return sceltaNome(cer ?? scelta);
  return chat(cer);
}

// Chi non ha Ancora+: cosa sa fare, e il passaggio ad Ancora+.
function presentazione(cer) {
  const cosa = [["🍝", "Il cuoco", "Fotografi il frigo e ti propone la cena, con dosi e passaggi. Inventa ricette e rifà le dosi."],
    ["🌿", "Il giardiniere", "Fotografi una pianta: ti dice cos'ha e come curarla, e cosa seminare questo mese."],
    ["📅", "Il segretario", "«Domenica pranzo dalla zia alle 13», «metti il latte nella spesa»: lo fa lui."],
    ["📖", "La memoria di casa", "Compleanni, cosa è successo, la ricetta della nonna ricopiata da una foto."],
    ["🏠", "E tutto il resto", "Macchie, piccoli lavori, gite, regali, compiti dei figli."]];
  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/" aria-label="Indietro">${ICONE.indietro}</a><b>L'aiutante di casa</b><span style="width:44px"></span></header>
    <div class="pad" style="padding-top:16px;padding-bottom:130px">
      <div style="text-align:center"><div style="width:64px;height:64px;border-radius:32px;background:#E1F5EE;display:inline-grid;place-items:center;font-size:30px">✨</div>
        <h1 style="margin:12px 0 4px">Un aiutante per tutta la famiglia</h1>
        <p class="tenue" style="margin:0 0 16px">Gli date un nome voi, conosce solo quello che mettete su Ancora e risponde a tutti, nonni compresi.</p></div>
      ${cosa.map(([i, t, d]) => `<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--bordo)"><span style="font-size:24px" aria-hidden="true">${i}</span><div><b>${t}</b><div class="tenue" style="margin-top:2px">${d}</div></div></div>`).join("")}
      <button class="btn ambra" id="piu" style="margin-top:18px">È incluso in Ancora+ · scopri</button>
      <p class="tenue" style="text-align:center;font-size:14px">Basta che una persona abbia Ancora+: vale per tutta ${esc(cer.nome)}.</p>
    </div>`;
  document.getElementById("piu").onclick = () => passaPiu("L'aiutante di casa è incluso in Ancora+.");
}

function sceltaNome(cer) {
  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/" aria-label="Indietro">${ICONE.indietro}</a><b>L'aiutante</b><span style="width:44px"></span></header>
    <div class="pad" style="text-align:center;padding-top:20px">
      <div style="width:64px;height:64px;border-radius:32px;background:#E1F5EE;color:#085041;display:inline-grid;place-items:center;font-size:30px">✨</div>
      <h1 style="margin:12px 0 4px">Come lo chiamate?</h1>
      <p class="tenue" style="margin:0 0 16px">L'aiutante di casa di ${esc(cer.nome)}: cuoco, giardiniere, segretario. Si ricorda quello che mettete su Ancora e vi dà una mano in tutto. Il nome lo scegliete voi, e si cambia quando volete. La foto invece ognuno mette quella che vuole, toccando il tondo in alto nella chat.</p>
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
  const [{ data: storia }] = await Promise.all([
    sb.from("aiutante_messaggi").select("ruolo, testo, azioni, creato_il").eq("cerchia_id", cer.id).order("creato_il", { ascending: false }).limit(40),
  ]);
  const altre = state.cerchie.filter((c) => c.id !== cer.id && c.tipo === "famiglia");
  const fotoA = state.io.aiutante_foto_path ? await urlMedia(state.io.aiutante_foto_path) : "";
  $app().innerHTML = `
    <header class="testa" style="gap:10px">
      <a class="icona" href="#/" aria-label="Indietro">${ICONE.indietro}</a>
      <label aria-label="Cambia la foto del tuo aiutante" style="position:relative;width:40px;height:40px;border-radius:20px;background:#E1F5EE center/cover${fotoA ? ` url('${fotoA}')` : ""};display:grid;place-items:center;flex-shrink:0;cursor:pointer">${fotoA ? "" : "✨"}
        <i style="position:absolute;right:-4px;bottom:-4px;font-style:normal;font-size:11px;background:#fff;border-radius:9px;padding:1px 2px;border:1px solid var(--bordo)">📷</i>
        <input type="file" id="foto-aiutante" accept="image/*" hidden></label>
      <div style="flex:1;min-width:0"><b style="display:block;font-size:17px">${esc(nome)}</b>
        <small class="tenue">${esc(cer.nome)} · <a href="#/aiutante?c=${cer.id}&rinomina=1">rinomina</a>${altre.length ? ` · <a href="#" id="altra">altra famiglia</a>` : ""}</small></div>
    </header>
    <div id="fili" style="padding:12px 14px 150px;display:flex;flex-direction:column;gap:8px"></div>
    <form id="scrivi" style="position:fixed;left:0;right:0;bottom:calc(84px + env(safe-area-inset-bottom));display:flex;gap:8px;align-items:center;padding:10px 12px;background:#FBF8F2;border-top:1px solid var(--bordo);max-width:720px;margin:0 auto">
      <label class="icona" aria-label="Manda una foto" style="width:44px;height:44px;display:grid;place-items:center;border-radius:22px;border:1px solid var(--bordo);cursor:pointer;flex-shrink:0">📷
        <input id="foto" type="file" accept="image/*" capture="environment" hidden></label>
      <input id="testo" placeholder="Chiedi a ${esc(nome)}…" autocomplete="off" style="flex:1;margin:0;min-height:44px">
      <button type="button" id="voce" class="icona" aria-label="Parla" style="width:44px;height:44px;border-radius:22px;border:1px solid var(--bordo);flex-shrink:0">🎙</button>
      <button class="btn" style="width:auto;padding:0 16px;margin:0;min-height:44px">Invia</button>
    </form>`;
  const fili = document.getElementById("fili");
  // ognuno mette la foto che vuole al suo aiutante (la vede solo lui)
  document.getElementById("foto-aiutante").onchange = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const vecchia = state.io.aiutante_foto_path;
    if (await cambiaImmagine({ file, tabella: "persone", id: state.io.id, campo: "aiutante_foto", cartella: "aiutante", vecchia })) {
      const { data } = await sb.from("persone").select("aiutante_foto_path").eq("id", state.io.id).single();
      state.io.aiutante_foto_path = data?.aiutante_foto_path; location.reload();
    }
  };
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
  bolla("aiutante", `Ciao ${state.io?.soprannome || state.io?.nome || ""}! Sono ${nome}, l'aiutante di casa. Fotografa il frigo e ti dico cosa cucinare, o una pianta e ti dico come curarla. Metto gli impegni in calendario, le cose nella spesa, e mi puoi chiedere di tutto: casa, gite, compiti, regali. Come ti aiuto?`);
  for (const m of (storia ?? []).reverse()) bolla(m.ruolo, m.testo, m.azioni);
  const pronte = document.createElement("div");
  pronte.style.cssText = "display:flex;flex-wrap:wrap;gap:6px";
  pronte.innerHTML = PRONTE.map(([t, d], i) => `<button type="button" class="chip" data-i="${i}" style="margin:0;background:#E1F5EE;color:#085041;border-color:#9FE1CB">${esc(t)}</button>`).join("");
  fili.appendChild(pronte);
  let domandaFoto = "";
  pronte.querySelectorAll("button").forEach((b) => b.onclick = () => {
    const d = PRONTE[b.dataset.i][1];
    if (d.startsWith("📷")) { domandaFoto = d.slice(2); document.getElementById("foto").click(); } else invia(d);
  });
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
    bolla("utente", immagine ? `📷 ${testo || "Guarda questa foto"}` : testo);
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
      if (j.limite) { bolla("aiutante", "Sono incluso in Ancora+: con Ancora+ attivo ti rispondo di nuovo."); passaPiu("L'aiutante di casa è incluso in Ancora+."); }
      else if (!r.ok) bolla("aiutante", j.errore ?? "Non riesco a rispondere ora. Riprova tra poco.");
      else {
        bolla("aiutante", j.testo, j.azioni);
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
    const t = campo.value.trim() || domandaFoto; campo.value = ""; e.target.value = ""; domandaFoto = "";
    invia(t, c.toDataURL("image/jpeg", 0.82));
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
