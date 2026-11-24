// Il gioco della famiglia: #/tabellone?c=<gruppo> (tavoli e nuova partita) · #/tabellone?id=<partita> · #/tabellone?c=<gruppo>&nomi=1 (rinomina)
// Regole e dadi stanno nella funzione "gioco-famiglia"; qui si disegna il tabellone e si mandano le mosse.
import { sb, state, $app, esc, ICONE, passaPiu, invitaAlGioco } from "../app.js";
import { SUPABASE_URL } from "../config.js";

const ICONA = { via: "🏁", ricordo: "📜", sorpresa: "🎁", tassa: "💸", auto: "🚗", serv: "🍷", castigo: "🚧", pausa: "☕", vai_castigo: "👮" };
const EFFETTI = { soldi: "Soldi (+ prendi / − paghi)", vai: "Vai alla casella n°", castigo: "In castigo", indietro: "Torna indietro di", da_tutti: "Ognuno ti dà", a_tutti: "Dai a ognuno", libero: "Esci gratis dal castigo" };
let BASE = null;

async function chiama(corpo) {
  const { data: { session } } = await sb.auth.getSession();
  const r = await fetch(`${SUPABASE_URL}/functions/v1/gioco-famiglia`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${session?.access_token}` }, body: JSON.stringify(corpo) });
  const j = await r.json().catch(() => ({ errore: "Connessione assente" }));
  if (j.errore) throw new Error(j.errore);
  return j;
}
// posizione sul quadrato 11x11: 0 in basso a destra, si gira in senso orario verso sinistra
function cella(i) {
  if (i <= 10) return [11, 11 - i];
  if (i <= 20) return [11 - (i - 10), 1];
  if (i <= 30) return [1, 1 + (i - 20)];
  return [1 + (i - 30), 11];
}

export default async function ({ params }) {
  BASE ??= await chiama({ azione: "base" }).catch(() => null);
  if (!BASE) { $app().innerHTML = `<p class="pad">Il gioco non risponde. Riprova tra poco.</p>`; return; }
  const gruppo = (params?.c && state.cerchie.find((c) => c.id === params.c)) ?? state.cerchie.find((c) => c.tipo === "famiglia") ?? state.cerchie[0];
  if (params?.nomi) return editor(gruppo);
  if (!params?.id) return tavoli(gruppo);
  return partita(params.id, !!params.tv);
}

// ---------- tavoli aperti e nuova partita ----------
async function tavoli(gruppo) {
  if (!gruppo) { $app().innerHTML = `<p class="pad">Prima entra in una famiglia o in un gruppo.</p>`; return; }
  const { data: aperti } = await sb.from("famiglia_partite").select("id, stato, posti, creata_il").eq("cerchia_id", gruppo.id).neq("stato", "finita")
    .gte("creata_il", new Date(Date.now() - 3 * 864e5).toISOString()).order("creata_il", { ascending: false });
  const [{ data: tab }, { data: piu }] = await Promise.all([
    sb.from("tabellone_famiglia").select("nomi, aggiornato_il").eq("cerchia_id", gruppo.id).maybeSingle(),
    sb.rpc("cerchia_piu", { p_cerchia: gruppo.id })]);
  const rinominate = Object.keys(tab?.nomi ?? {}).length;
  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/giochi?c=${gruppo.id}" aria-label="Indietro">${ICONE.indietro}</a><b>🏠 Il gioco della famiglia</b><span style="width:44px"></span></header>
    <div class="pad" style="padding-bottom:120px">
      <p class="tenue" style="margin-top:0">Compra i posti della famiglia, costruisci case e alberghi, incassa gli affitti. Si finisce al primo che resta senza soldi: vince il più ricco.</p>
      <a class="card" href="#/tabellone?c=${gruppo.id}&nomi=1" style="display:flex;gap:12px;align-items:center;margin:0 0 14px;text-decoration:none;color:inherit;background:#FFF6E8;border-color:#F0D5A8">
        <span style="font-size:30px">✏️</span><span style="flex:1"><b>Il tabellone di ${esc(gruppo.nome)}</b>
        <div class="tenue">${rinominate ? `${rinominate} caselle con i vostri nomi` : "Dategli i vostri nomi: la casa della nonna, la 500 del papà, il bar del paese…"}</div></span><span>›</span></a>
      ${(aperti ?? []).map((p) => `<a href="#/tabellone?id=${p.id}" class="card" style="display:block;margin:0 0 10px;text-decoration:none;color:inherit">
        <b>${p.stato === "in_corso" ? "In corso" : "Si cercano giocatori"}</b><div class="tenue">${p.posti.map((x) => `${x.pedina ?? ""} ${esc(x.nome ?? "posto libero")}`).join(" · ")}</div></a>`).join("")}
      ${piu ? `<b style="display:block;margin:6px 0 8px">Nuova partita: quanti giocatori?</b>
      <div style="display:flex;gap:8px">${[2, 3, 4, 5, 6].map((n) => `<button class="btn ${n === 4 ? "ambra" : "chiaro"}" data-n="${n}" style="margin:0;flex:1">${n}</button>`).join("")}</div>
      <p class="tenue" style="font-size:14px">Chi manca lo fa il telefono. Il gruppo riceve l'invito sul telefono.</p>`
      : `<div class="card" style="text-align:center"><div style="font-size:34px">✨</div><b>Il gioco della famiglia è incluso in Ancora+</b>
        <p class="tenue" style="margin:6px 0 12px">Tombola, briscola e tressette restano gratis per tutti.</p><button class="btn ambra" id="piu">Scopri Ancora+</button></div>`}
    </div>`;
  document.getElementById("piu")?.addEventListener("click", () => passaPiu("Il gioco della famiglia è incluso in Ancora+."));
  document.querySelectorAll("[data-n]").forEach((b) => b.onclick = async () => {
    b.disabled = true;
    try { const { id } = await chiama({ azione: "crea", cerchia_id: gruppo.id, n: Number(b.dataset.n) }); location.hash = `#/tabellone?id=${id}`; }
    catch (e) { b.disabled = false; if (e.message.includes("ANCORA_PIU")) passaPiu("Il gioco della famiglia è incluso in Ancora+."); else alert(e.message); }
  });
}

// ---------- rinominare il tabellone ----------
async function editor(gruppo) {
  const { data: tab } = await sb.from("tabellone_famiglia").select("nomi, carte, carte2").eq("cerchia_id", gruppo.id).maybeSingle();
  const nomi = tab?.nomi ?? {};
  const mazzi = { ricordo: tab?.carte ?? BASE.carte.map((c) => ({ ...c })), sorpresa: tab?.carte2 ?? BASE.sorprese.map((c) => ({ ...c })) };
  const gruppi = [...new Set(BASE.caselle.filter((c) => c.t === "prop").map((c) => c.g))];
  const riga = (i) => { const c = BASE.caselle[i];
    return `<div style="display:flex;align-items:center;gap:8px;margin-top:6px"><span style="width:28px;text-align:center">${c.t === "prop" ? `<span style="display:inline-block;width:18px;height:18px;border-radius:4px;background:${BASE.colori[c.g]}"></span>` : ICONA[c.t]}</span>
      <input data-nome="${i}" maxlength="40" value="${esc(nomi[i] ?? "")}" placeholder="${esc(c.nome)}" style="margin:0;flex:1"><small class="tenue" style="width:48px;text-align:right">${c.prezzo ? c.prezzo + " €" : ""}</small></div>`; };
  const disegna = (m) => document.getElementById(`carte-${m}`).innerHTML = mazzi[m].map((c, k) => `
    <div style="border-top:1px solid var(--bordo);padding:8px 0">
      <input data-ct="${m}:${k}" maxlength="120" value="${esc(c.t)}" placeholder="Scrivi la carta…" style="margin:0 0 6px">
      <div style="display:flex;gap:6px;align-items:center"><select data-ce="${m}:${k}" style="margin:0;flex:1">${Object.entries(EFFETTI).map(([e, n]) => `<option value="${e}" ${c.e === e ? "selected" : ""}>${n}</option>`).join("")}</select>
        <input data-cv="${m}:${k}" type="number" value="${c.v}" style="margin:0;width:80px" ${["castigo", "libero"].includes(c.e) ? "hidden" : ""}>
        <button type="button" data-cx="${m}:${k}" class="chip" style="margin:0" aria-label="Togli">✕</button></div></div>`).join("");
  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/tabellone?c=${gruppo.id}" aria-label="Indietro">${ICONE.indietro}</a><b>✏️ Il vostro tabellone</b><span style="width:44px"></span></header>
    <div class="pad" style="padding-bottom:130px">
      <p class="tenue" style="margin-top:0">Scrivete i vostri posti, anche del passato. Le meno care sono le prime, le più care le ultime: la casa più importante della famiglia mettetela in fondo, al blu. Vale per le prossime partite di ${esc(gruppo.nome)}.</p>
      ${gruppi.map((g) => `<div class="card" style="border-left:6px solid ${BASE.colori[g]}">${BASE.caselle.map((c, i) => c.g === g ? riga(i) : "").join("")}</div>`).join("")}
      <div class="card"><b>🚗 Le auto e 🍷 gli altri posti</b>${BASE.caselle.map((c, i) => ["auto", "serv", "tassa"].includes(c.t) ? riga(i) : "").join("")}</div>
      ${[["ricordo", "📜 Il mazzo Ricordo", "Hai rotto il vaso della zia: paga 50 €…"], ["sorpresa", "🎁 Il mazzo Sorpresa", "Vinci alla tombola di Natale: prendi 100 €…"]].map(([m, t, es]) => `
        <div class="card"><b>${t}</b><p class="tenue" style="margin:4px 0 0;font-size:14px">Scrivete le vostre carte, es. "${es}"</p>
          <div id="carte-${m}"></div><button type="button" class="chip" data-nuova="${m}" style="margin-top:8px">+ Aggiungi una carta</button></div>`).join("")}
      <button class="btn ambra" id="salva">Salva il tabellone</button><p id="esito" role="status" style="text-align:center"></p>
    </div>`;
  disegna("ricordo"); disegna("sorpresa");
  const leggi = () => { for (const m of ["ricordo", "sorpresa"]) mazzi[m] = mazzi[m].map((c, k) => ({ t: document.querySelector(`[data-ct="${m}:${k}"]`).value, e: document.querySelector(`[data-ce="${m}:${k}"]`).value, v: Number(document.querySelector(`[data-cv="${m}:${k}"]`).value || 0) })); };
  const box = $app().querySelector(".pad");
  box.addEventListener("change", (e) => { if (e.target.dataset.ce) { leggi(); disegna(e.target.dataset.ce.split(":")[0]); } });
  box.addEventListener("click", (e) => {
    const x = e.target.dataset.cx, n = e.target.dataset.nuova;
    if (x) { leggi(); const [m, k] = x.split(":"); mazzi[m].splice(Number(k), 1); disegna(m); }
    if (n) { leggi(); mazzi[n].push({ t: "", e: "soldi", v: 50 }); disegna(n); }
  });
  document.getElementById("salva").onclick = async (e) => {
    leggi();
    const n = {}; document.querySelectorAll("[data-nome]").forEach((x) => { if (x.value.trim()) n[x.dataset.nome] = x.value.trim(); });
    e.target.disabled = true;
    const { error } = await sb.rpc("tabellone_salva", { p_cerchia: gruppo.id, p_nomi: n, p_carte: mazzi.ricordo.filter((c) => c.t.trim()), p_carte2: mazzi.sorpresa.filter((c) => c.t.trim()) });
    e.target.disabled = false;
    document.getElementById("esito").innerHTML = error ? `<span class="errore">${esc(error.message)}</span>` : "Salvato ✓ Vale dalla prossima partita.";
  };
}

// ---------- la partita ----------
async function partita(id, tv = false) {
  let firma = "", timer = null, aperta = null, cartaVista = null;
  $app().innerHTML = tv
    ? `<div id="corpo" style="position:fixed;inset:0;z-index:70;background:#14302B;display:flex;align-items:center;justify-content:center;gap:16px;padding:10px;box-sizing:border-box"></div>
       <div style="position:fixed;top:8px;right:8px;z-index:71;display:flex;gap:6px"><button class="chip" id="schermo" style="margin:0">⛶ Schermo intero</button><a class="chip" href="#/tabellone?id=${id}" style="margin:0;text-decoration:none">✕ Esci</a></div>`
    : `<header class="testa"><a class="icona" href="#/tabellone" aria-label="Indietro">${ICONE.indietro}</a><b>🏠 Il gioco della famiglia</b>
         <a class="chip" href="#/tabellone?id=${id}&tv=1" style="margin:0;text-decoration:none;font-size:13px">📺 Grande</a></header>
       <div id="corpo" style="padding-bottom:130px"></div>`;
  document.getElementById("schermo")?.addEventListener("click", () => { document.documentElement.requestFullscreen?.().catch(() => {}); });
  if (tv) addEventListener("resize", () => { firma = ""; aggiorna(); }, { once: true });

  async function aggiorna() {
    const corpo = document.getElementById("corpo"); if (!corpo) { clearInterval(timer); return; }
    const { data: p } = await sb.from("famiglia_partite").select("*").eq("id", id).maybeSingle();
    if (!p) { corpo.innerHTML = `<p class="pad">Partita non trovata.</p>`; clearInterval(timer); return; }
    const f = p.aggiornata_il + p.stato;
    if (f === firma) return; firma = f;
    disegna(p);
  }
  const fai = async (corpo, btn) => {
    if (btn) btn.disabled = true;
    try { await chiama({ id, ...corpo }); } catch (e) { alert(e.message); }
    firma = ""; await aggiorna();
  };

  function disegna(p) {
    const corpo = document.getElementById("corpo");
    const io = p.posti.findIndex((x) => x.persona_id === state.io.id);
    const nomeCas = (i) => p.tabellone?.nomi?.[i] || BASE.caselle[i].nome;
    const chi = (i) => (i === io ? "tu" : esc(p.posti[i]?.nome ?? ""));

    if (p.stato === "attesa") {
      corpo.innerHTML = `
        <div class="pad" style="text-align:center"><div style="font-size:44px">🏠</div><h1 style="margin:4px 0">Si cercano giocatori</h1></div>
        ${p.posti.map((x, i) => `<div class="card" style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><span style="font-size:24px">${x.pedina}</span>
          <b style="flex:1">${x.persona_id ? esc(x.nome) : `<span class="tenue">posto libero</span>`}</b>
          ${!x.persona_id ? `<button class="chip" data-siedi="${i}" style="margin:0">Siediti qui</button>` : x.persona_id === state.io.id ? `<span class="tenue">sei tu</span>` : ""}</div>`).join("")}
        <div class="pad">${p.creato_da === state.io.id ? `<button class="btn ambra" id="inizia">Si gioca${p.posti.some((x) => !x.persona_id) ? " (i posti liberi li prende il telefono)" : ""}</button>` : `<p class="tenue" style="text-align:center">Si parte quando lo decide chi ha aperto la partita.</p>`}
          <button class="btn chiaro" id="invita-wa" style="margin-top:10px">📲 Invita su WhatsApp (anche chi non è su Ancora)</button></div>`;
      corpo.querySelector("#invita-wa").onclick = () => invitaAlGioco({ cerchiaId: p.cerchia_id, torna: `#/tabellone?id=${id}`, titolo: "Il gioco della famiglia",
        testo: "🏠 Giochiamo al gioco della famiglia su Ancora: c'è un posto per te al tabellone.", perche: "C'è un posto per te al gioco della famiglia." });
      corpo.querySelectorAll("[data-siedi]").forEach((b) => b.onclick = () => fai({ azione: "siedi", posto: Number(b.dataset.siedi) }, b));
      corpo.querySelector("#inizia")?.addEventListener("click", (e) => fai({ azione: "inizia" }, e.target));
      return;
    }

    const g = p.gioco, mioTurno = g.turno === io && p.stato === "in_corso";
    const vw = document.documentElement.clientWidth, vh = window.innerHeight;
    const L = tv ? Math.min(vh - 20, vw - (vw > vh * 1.3 ? 300 : 20)) : Math.min(vw - 16, 560), lato = (L - 4 - 10) / 11;
    const qui = (i) => p.posti.map((x, k) => (g.pos[k] === i ? x.pedina : "")).join("");
    const caselle = BASE.caselle.map((c, i) => {
      const [r, col] = cella(i), o = g.propr[i], h = g.case[i] ?? 0;
      const angolo = i % 10 === 0;
      return `<button data-cas="${i}" style="grid-row:${r};grid-column:${col};position:relative;border:1px solid #d9cfbd;background:${o != null ? "#FFF6E8" : "#fff"};padding:0;margin:0;overflow:hidden;cursor:pointer;min-width:0;border-radius:3px">
        ${c.t === "prop" ? `<div style="height:${Math.max(5, lato * 0.16)}px;background:${BASE.colori[c.g]}"></div>` : `<div style="font-size:${angolo ? lato * 0.42 : lato * 0.3}px;line-height:1.15">${ICONA[c.t] ?? ""}</div>`}
        ${["prop", "auto", "serv", "tassa"].includes(c.t) || angolo ? `<div style="font-size:${Math.max(5.5, lato * 0.15)}px;line-height:1.05;padding:1px 1px 0;font-weight:600;color:#333;overflow:hidden;display:-webkit-box;-webkit-line-clamp:${lato > 60 ? 3 : 2};-webkit-box-orient:vertical;word-break:break-word">${esc(nomeCas(i))}</div>` : ""}
        ${h ? `<div style="font-size:7px;line-height:1">${h === 5 ? "🏨" : "🏠".repeat(h)}</div>` : c.prezzo && o == null ? `<div style="font-size:${Math.max(7, lato * 0.22)}px;line-height:1;font-weight:700;color:#555">${c.prezzo}€</div>` : ""}
        ${o != null ? `<div style="position:absolute;left:1px;bottom:1px;width:6px;height:6px;border-radius:3px;background:${["#C8102E", "#1F4E9C", "#2E8B57", "#B8860B", "#7B2CBF", "#333"][o]}"></div>` : ""}
        <div style="font-size:${lato * 0.4}px;line-height:1;position:absolute;right:0;bottom:0">${qui(i)}</div></button>`;
    }).join("");

    const fine = p.stato === "finita";
    const cartaHtml = g.carta ? `<div style="background:${g.cartaMazzo === "sorpresa" ? "#FCE8EA" : "#FFF6E8"};border:2px solid ${g.cartaMazzo === "sorpresa" ? "#C8102E" : "#E8B56B"};border-radius:10px;padding:4px 8px;font-size:${Math.max(11, lato * 0.3)}px;margin:2px 0">${g.cartaMazzo === "sorpresa" ? "🎁" : "📜"} ${esc(g.carta)}</div>` : "";
    const centro = `<div style="grid-row:2 / 11;grid-column:2 / 11;padding:6px;min-height:0;display:flex;flex-direction:column;gap:4px;overflow:hidden;text-align:center;justify-content:center">
      ${fine ? `<div style="font-size:30px">🏆</div><b>Vince ${chi(g.vincitore)}!</b><small class="tenue">${g.patrimoni?.[g.vincitore]} € di patrimonio</small>`
        : `<div style="font-size:13px">Tocca a <b>${p.posti[g.turno].pedina} ${chi(g.turno)}</b></div>
           <div style="font-size:30px;line-height:1.1">${g.dadi ? `${["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][g.dadi[0] - 1]}${["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][g.dadi[1] - 1]}` : "🎲🎲"}</div>`}
      <div style="display:flex;gap:${lato * 0.4}px;justify-content:center;margin:2px 0">${["ricordo", "sorpresa"].map((m) => {
        const tocca = mioTurno && g.fase === "carta" && BASE.caselle[g.pos[io]]?.t === m;
        const attesa = g.fase === "carta" && BASE.caselle[g.pos[g.turno]]?.t === m;
        return `<button ${tocca ? `data-az="gira"` : "disabled"} style="width:${lato * 1.9}px;height:${lato * 1.3}px;border-radius:8px;border:2px solid ${m === "ricordo" ? "#E8B56B" : "#C8102E"};background:${m === "ricordo" ? "repeating-linear-gradient(45deg,#FFF6E8,#FFF6E8 6px,#F7E3BF 6px,#F7E3BF 12px)" : "repeating-linear-gradient(45deg,#FCE8EA,#FCE8EA 6px,#F6C9CF 6px,#F6C9CF 12px)"};
          display:grid;place-items:center;padding:0;cursor:${tocca ? "pointer" : "default"};${attesa ? "animation:mazzo-tocca 1s ease-in-out infinite;box-shadow:0 0 0 3px #E8B56B" : "box-shadow:2px 2px 0 rgba(0,0,0,.15)"}">
          <span style="font-size:${lato * 0.32}px;line-height:1.1">${m === "ricordo" ? "📜" : "🎁"}<br><b style="font-size:${Math.max(7, lato * 0.17)}px">${tocca ? "Tocca e gira!" : m === "ricordo" ? "Ricordo" : "Sorpresa"}</b></span></button>`; }).join("")}</div>
      ${cartaHtml}
      <div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center">${p.posti.map((x, i) => `<span style="background:${i === g.turno ? "#FFF6E8" : "#fff"};border:1px solid ${i === g.turno ? "#E8B56B" : "#d9cfbd"};border-radius:10px;padding:1px 6px;font-size:12px;font-weight:700">${x.pedina} 💶 ${g.soldi[i]}</span>`).join("")}</div>
      <div style="font-size:11px;color:#555;text-align:left;line-height:1.35;overflow:hidden;max-height:${Math.max(40, lato * 3)}px">${g.registro.slice(0, 4).map((r) => `<div>${esc(r)}</div>`).join("")}</div></div>`;

    const k = g.pos[io] ?? 0, cc = BASE.caselle[k];
    let azioni = "";
    if (mioTurno) {
      if (g.fase === "tira") azioni = `${g.castigo[io] > 0 ? `<p style="margin:0 0 8px">😤 Sei in castigo: fai un doppio per uscire, oppure</p>
          <div style="display:flex;gap:8px;margin-bottom:8px"><button class="btn chiaro" data-az="esci" style="margin:0">Paga 50 €</button>${g.liberi[io] ? `<button class="btn chiaro" data-az="esci-carta" style="margin:0">Usa la carta</button>` : ""}</div>` : ""}
        <button class="btn ambra" data-az="tira" style="font-size:20px">🎲 Tira i dadi</button>`;
      else if (g.fase === "carta") azioni = `<button class="btn ambra" data-az="gira" style="font-size:20px">${BASE.caselle[k].t === "sorpresa" ? "🎁" : "📜"} Gira la carta</button>`;
      else if (g.fase === "decidi") azioni = `<p style="margin:0 0 8px">Sei su <b>${esc(nomeCas(k))}</b>: costa <b>${cc.prezzo} €</b> (hai ${g.soldi[io]} €).</p>
        <div style="display:flex;gap:8px"><button class="btn ambra" data-az="compra" style="margin:0;flex:2" ${g.soldi[io] < cc.prezzo ? "disabled" : ""}>Compra</button><button class="btn chiaro" data-az="lascia" style="margin:0;flex:1">Lascia</button></div>`;
      else azioni = `<button class="btn ambra" data-az="passa">Fine turno</button><p class="tenue" style="font-size:13px;text-align:center;margin:6px 0 0">Prima puoi costruire: tocca una tua casella colorata.</p>`;
    } else if (!fine) azioni = `<p class="tenue" style="text-align:center;margin:0">Tocca a ${chi(g.turno)}…</p>`;

    if (g.cartaN && cartaVista !== null && g.cartaN !== cartaVista && g.carta) {
      const o = document.createElement("div");
      const ros = g.cartaMazzo === "sorpresa";
      o.innerHTML = `<div class="carta-gira" style="width:min(80vw,340px);min-height:200px;border-radius:18px;background:${ros ? "#FCE8EA" : "#FFF6E8"};border:4px solid ${ros ? "#C8102E" : "#E8B56B"};padding:22px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.35)">
        <div style="font-size:42px">${ros ? "🎁" : "📜"}</div><b style="display:block;font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:${ros ? "#8A1022" : "#8a5a14"}">${ros ? "Sorpresa" : "Ricordo"} · ${esc(p.posti[g.turno]?.nome ?? "")}</b>
        <p style="font-size:20px;font-weight:700;line-height:1.35;margin:12px 0 0">${esc(g.carta)}</p></div>`;
      o.style.cssText = "position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.35);display:grid;place-items:center;perspective:900px";
      o.onclick = () => o.remove(); document.body.appendChild(o); setTimeout(() => o.remove(), 4200);
    }
    cartaVista = g.cartaN ?? 0;
    if (tv) {
      corpo.innerHTML = `<div style="display:grid;grid-template-columns:repeat(11,${lato}px);grid-template-rows:repeat(11,${lato}px);width:${L}px;height:${L}px;gap:1px;background:#E8F1E4;border-radius:12px;padding:2px;box-sizing:border-box;overflow:hidden">${caselle}${centro}</div>
        ${vw > vh * 1.3 ? `<div style="width:270px;color:#fff">${p.posti.map((x, i) => `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;margin-bottom:8px;border-radius:14px;background:${i === g.turno && !fine ? "#E8B56B" : "rgba(255,255,255,.08)"};color:${i === g.turno && !fine ? "#14302B" : "#fff"}">
          <span style="font-size:30px">${x.pedina}</span><span style="flex:1;font-weight:700">${esc(x.nome ?? "")}${g.castigo[i] > 0 ? " 😤" : ""}</span><b style="font-size:22px">${g.soldi[i]} €</b></div>`).join("")}</div>` : ""}`;
      corpo.querySelectorAll("[data-cas]").forEach((b) => b.disabled = true);
      corpo.querySelectorAll("[data-az]").forEach((b) => b.disabled = true);
      return;
    }
    corpo.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(11,${lato}px);grid-template-rows:repeat(11,${lato}px);width:${L}px;height:${L}px;margin:8px auto;gap:1px;background:#E8F1E4;border-radius:10px;padding:2px;box-sizing:border-box;overflow:hidden">${caselle}${centro}</div>
      <div class="card" style="margin-top:4px">${azioni}</div>
      <div class="card">${p.posti.map((x, i) => `<div style="display:flex;align-items:center;gap:8px;padding:3px 0;${i === g.turno && !fine ? "font-weight:800" : ""}">
        <span style="width:10px;height:10px;border-radius:5px;background:${["#C8102E", "#1F4E9C", "#2E8B57", "#B8860B", "#7B2CBF", "#333"][i]}"></span><span>${x.pedina}</span>
        <span style="flex:1">${chi(i)}${g.castigo[i] > 0 ? " 😤" : ""}</span><b>${g.soldi[i]} €</b></div>`).join("")}</div>
      ${p.creato_da === state.io.id && !fine ? `<div class="pad"><button class="chip" id="finisci" style="color:var(--rosso)">Chiudi la partita (vince il più ricco)</button></div>` : ""}
      ${fine ? `<div class="pad"><a class="btn ambra" href="#/tabellone?c=${p.cerchia_id}">Un'altra partita</a></div>` : ""}
      <div id="scheda"></div>`;


    corpo.querySelectorAll("[data-az]").forEach((b) => b.onclick = () => {
      const a = b.dataset.az;
      fai(a === "gira" ? { azione: "gira" } : a === "compra" ? { azione: "compra", si: true } : a === "lascia" ? { azione: "compra", si: false } : a === "esci-carta" ? { azione: "esci", carta: true } : { azione: a }, b);
    });
    corpo.querySelector("#finisci")?.addEventListener("click", (e) => { if (confirm("Chiudere la partita? Vince chi ha il patrimonio più alto.")) fai({ azione: "finisci" }, e.target); });
    // scheda della casella: nome, prezzo, chi ce l'ha, case, costruire
    const scheda = (i) => {
      aperta = i;
      const c = BASE.caselle[i], o = g.propr[i], h = g.case[i] ?? 0;
      const puo = mioTurno && g.fase === "fine" && o === io && c.t === "prop" && h < 5 && BASE.caselle.every((x, j) => x.g !== c.g || g.propr[j] === io);
      document.getElementById("scheda").innerHTML = `<div class="card" style="border-top:6px solid ${c.t === "prop" ? BASE.colori[c.g] : "#ccc"}">
        <b style="font-size:18px">${ICONA[c.t] ?? ""} ${esc(nomeCas(i))}</b>
        ${c.prezzo ? `<div class="tenue">${c.t === "tassa" ? "Si pagano" : "Costa"} ${c.prezzo} €${c.t === "prop" ? ` · una casa ${BASE.costo_casa[c.g]} €` : ""}</div>` : ""}
        ${o != null ? `<div>È di <b>${chi(o)}</b>${h ? ` · ${h === 5 ? "albergo" : h + (h === 1 ? " casa" : " case")}` : ""}</div>` : ""}
        <div class="tenue" style="font-size:13px;margin-top:4px">Qui: ${p.posti.filter((_, k) => g.pos[k] === i).map((x) => x.pedina + " " + esc(x.nome)).join(", ") || "nessuno"}</div>
        ${puo ? `<button class="btn" id="costruisci" style="margin-top:10px">🔨 Costruisci ${h === 4 ? "l'albergo" : "una casa"} (${BASE.costo_casa[c.g]} €)</button>` : ""}</div>`;
      document.getElementById("costruisci")?.addEventListener("click", (e) => fai({ azione: "costruisci", casella: i }, e.target));
      document.getElementById("scheda").scrollIntoView({ behavior: "smooth", block: "nearest" });
    };
    corpo.querySelectorAll("[data-cas]").forEach((b) => b.onclick = () => scheda(Number(b.dataset.cas)));
    if (aperta != null) scheda(aperta);
  }

  await aggiorna();
  timer = setInterval(() => { if (!document.hidden) aggiorna(); }, 2000);
}
