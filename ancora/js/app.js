// Ancora — web app (SPA vanilla, router a hash come Ristoflow)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// versione delle pagine: cambia a ogni pubblicazione, così il telefono non tiene quelle vecchie
const VER = "154";
export const state = { io: null, famiglia: null, cerchie: [] };

const ROTTE = {
  "": () => import(`./views/home.js?v=${VER}`),
  "benvenuto": () => import(`./views/home.js?v=${VER}`),
  "racconti": () => import(`./views/racconti.js?v=${VER}`),
  "racconta": () => import(`./views/racconta.js?v=${VER}`),
  "ricordo": () => import(`./views/ricordo.js?v=${VER}`),
  "profilo": () => import(`./views/profilo.js?v=${VER}`),
  "diario": () => import(`./views/diario.js?v=${VER}`),
  "cerchie": () => import(`./views/cerchie.js?v=${VER}`),
  "regala": () => import(`./views/regala.js?v=${VER}`),
  "accesso": () => import(`./views/accesso.js?v=${VER}`),
  "perche": () => import(`./views/perche.js?v=${VER}`),
  "albero": () => import(`./views/albero.js?v=${VER}`),
  "agenda": () => import(`./views/agenda.js?v=${VER}`),
  "piano": () => import(`./views/piano.js?v=${VER}`),
  "prova": () => import(`./views/prova.js?v=${VER}`),
  "omaggio": () => import(`./views/omaggio.js?v=${VER}`),
  "scopri": () => import(`./views/scopri.js?v=${VER}`),
  "istruzioni": () => import(`./views/istruzioni.js?v=${VER}`),
  "iscriviti": () => import(`./views/iscriviti.js?v=${VER}`),
  "invita": () => import(`./views/invita.js?v=${VER}`),
  "chat": () => import(`./views/chat.js?v=${VER}`),
  "calendario": () => import(`./views/calendario.js?v=${VER}`),
  "chiedi": () => import(`./views/chiedi.js?v=${VER}`),
  "domande": () => import(`./views/domande.js?v=${VER}`),
  "spese": () => import(`./views/spese.js?v=${VER}`),
  "liste": () => import(`./views/liste.js?v=${VER}`),
  "album": () => import(`./views/album.js?v=${VER}`),
  "evento": () => import(`./views/evento.js?v=${VER}`),
  "chisiamo": () => import(`./views/info.js?v=${VER}`).then((m) => ({ default: m.chisiamo })),
  "contatti": () => import(`./views/info.js?v=${VER}`).then((m) => ({ default: m.contatti })),
  "privacy": () => import(`./views/info.js?v=${VER}`).then((m) => ({ default: m.privacy })),
  "cookie": () => import(`./views/info.js?v=${VER}`).then((m) => ({ default: m.cookie })),
  "condizioni": () => import(`./views/info.js?v=${VER}`).then((m) => ({ default: m.condizioni })),
  "rispondi": () => import(`./views/prova.js?v=${VER}`),
  "ascolta": () => import(`./views/prova.js?v=${VER}`),
  "biglietto": () => import(`./views/biglietto.js?v=${VER}`),
  "ricette": () => import(`./views/ricette.js?v=${VER}`),
  "ricetta": () => import(`./views/ricetta.js?v=${VER}`),
  "cartolina": () => import(`./views/cartolina.js?v=${VER}`),
  "locandina": () => import(`./views/locandina.js?v=${VER}`),
  "libro": () => import(`./views/libro.js?v=${VER}`),
  "film": () => import(`./views/film.js?v=${VER}`),
  "aiutante": () => import(`./views/aiutante.js?v=${VER}`),
  "giochi": () => import(`./views/giochi.js?v=${VER}`),
  "ancora-piu": () => import(`./views/ancora-piu.js?v=${VER}`),
  "tombola": () => import(`./views/tombola.js?v=${VER}`),
  "briscola": () => import(`./views/briscola.js?v=${VER}`),
  "tressette": () => import(`./views/tressette.js?v=${VER}`),
  "biliardo": () => import(`./views/biliardo.js?v=${VER}`),
  "tavolo": () => import(`./views/tavolo.js?v=${VER}`),
  "calcio": () => import(`./views/calcio.js?v=${VER}`),
  "auto": () => import(`./views/auto.js?v=${VER}`),
  "tornei": () => import(`./views/tornei.js?v=${VER}`),
  "tabellone": () => import(`./views/tabellone.js?v=${VER}`),
  "assistenza": () => import(`./views/assistenza.js?v=${VER}`),
  "albero-veloce": () => import(`./views/albero-veloce.js?v=${VER}`),
  "archivio": () => import(`./views/archivio.js?v=${VER}`),
  "settimana": () => import(`./views/settimana.js?v=${VER}`),
  "servizi": () => import(`./views/servizi.js?v=${VER}`),
};
const PUBBLICHE = new Set(["evento", "iscriviti", "chisiamo", "contatti", "privacy", "cookie", "condizioni", "scopri", "omaggio", "accesso", "regala", "perche", "prova", "rispondi", "ascolta", "biglietto", "ricetta", "cartolina"]);

export const $app = () => document.getElementById("app");
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const iniziali = (n) => (n ?? "?").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
/** Settimana ISO, es. "2026-W47": la domanda della settimana è la stessa per tutta la famiglia. */
export function settimana(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const g = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - g);
  const inizio = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const n = Math.ceil(((t - inizio) / 864e5 + 1) / 7);
  return { codice: `${t.getUTCFullYear()}-W${String(n).padStart(2, "0")}`, numero: n };
}
export const quando = (d) => new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long" });

export async function urlMedia(path) {
  const { data } = await sb.storage.from("ricordi").createSignedUrl(path, 3600);
  return data?.signedUrl;
}

/** Link firmati in blocco: { path: url } */
export async function urlMediaMolti(paths) {
  if (!paths.length) return {};
  const { data } = await sb.storage.from("ricordi").createSignedUrls(paths, 3600);
  return Object.fromEntries((data ?? []).map((d) => [d.path, d.signedUrl]));
}

// --- pezzi di interfaccia condivisi (stile "album di famiglia") ---
export const nomeDi = (p) => p?.soprannome ?? p?.nome ?? "";
const COLORI = ["#12302C", "#8C4A2E", "#C9832E", "#0F5257", "#5E7F77", "#7A3B2E"];
export const colore = (id) => COLORI[[...String(id ?? "")].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORI.length];
export const avatar = (p, size = 38, fotoUrl = null, extra = "") =>
  `<span class="av" style="${extra}width:${size}px;height:${size}px;background-color:${colore(p?.id)};${fotoUrl ? `background-image:url('${fotoUrl}')` : ""}">${fotoUrl ? "" : esc(iniziali(nomeDi(p)))}</span>`;
export const onda = (n = 18, seed = 1) => `<span class="onda" aria-hidden="true">${Array.from({ length: n }, (_, i) =>
  `<b style="height:${6 + Math.round(Math.abs(Math.sin((i + seed) * 1.7)) * 16)}px"></b>`).join("")}</span>`;
export const durata = (s) => s ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}` : "";
export const pulsanteVoce = (url, sec, seed = 1, stile = "") =>
  `<button class="voce" type="button" data-audio="${esc(url)}" style="${stile}" aria-label="Ascolta la sua voce"><i><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg></i>${onda(18, seed)}<span>${durata(sec) || "Ascolta"}</span></button>`;
export const ICONE = {
  cuore: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg>`,
  commento: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"/></svg>`,
  mic: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10a7 7 0 0 1-14 0"/><path d="M12 17v5"/></svg>`,
  agenda: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`,
  indietro: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>`,
};

/** Un solo lettore audio per tutta l'app: tocca un pulsante voce e parte, tocca di nuovo e si ferma. */
const lettore = new Audio();
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-audio]");
  if (!b) return;
  if (lettore.src === b.dataset.audio && !lettore.paused) { lettore.pause(); return; }
  lettore.src = b.dataset.audio; lettore.play().catch(() => {});
});

async function caricaIo() {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: io } = await sb.from("persone").select("*").eq("auth_user_id", user.id).maybeSingle();
  if (!io) return null;
  const { data: fm } = await sb.from("famiglia_membri").select("famiglia_id, ruolo, narratore, famiglie(nome)").eq("persona_id", io.id).maybeSingle();
  const { data: cerchie } = await sb.from("cerchie").select("id, nome, tipo, proprietario_id, moduli, foto_path, copertina_path, aiutante_nome").order("creata_il");
  const [{ data: piu }, { data: adulto }] = await Promise.all([sb.rpc("sono_piu"), sb.rpc("sono_adulto")]);
  state.io = io; state.famiglia = fm; state.cerchie = cerchie ?? []; state.piu = !!piu; state.adulto = adulto !== false;
  state.accessoPrima = io.ultimo_accesso_app;   // per il "bentornato" (prima di aggiornarlo)
  sb.from("persone").update({ ultimo_accesso_app: new Date().toISOString() }).eq("id", io.id).then(() => {});
  return io;
}

// --- finestra in primo piano (bentornato, notifiche) ---
export function popup({ titolo, testo, azioni = [] }) {
  const d = document.createElement("div");
  d.innerHTML = `<div style="position:fixed;inset:0;background:rgba(18,48,44,.5);z-index:30;display:flex;align-items:flex-end;justify-content:center">
    <div class="card" style="margin:0;width:100%;max-width:560px;border-radius:26px 26px 0 0;padding:22px 20px calc(22px + env(safe-area-inset-bottom))">
      <b style="font-family:Fraunces,serif;font-size:24px;display:block;line-height:1.2;color:var(--notte)">${esc(titolo)}</b>
      <p style="font-size:16px;margin:10px 0 16px">${testo}</p>
      ${azioni.map((a, i) => `<button class="btn ${i === 0 ? "ambra" : "chiaro"}" data-i="${i}" style="margin-top:8px">${esc(a.t)}</button>`).join("")}
    </div></div>`;
  document.body.appendChild(d);
  d.querySelectorAll("[data-i]").forEach((b) => b.onclick = async () => { d.remove(); await azioni[b.dataset.i].fn?.(); });
}

// --- notifiche push: gratis, all'ora giusta, mai troppe ---
const base64 = (s) => Uint8Array.from(atob((s + "=".repeat((4 - (s.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
export const iPhoneNonInstallata = () => /iphone|ipad/i.test(navigator.userAgent) && !navigator.standalone;
export async function notificheAttive() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  return !!(await reg?.pushManager.getSubscription());
}
export async function attivaNotifiche() {
  if (iPhoneNonInstallata()) {
    popup({ titolo: "Prima aggiungi Ancora alla Home", testo: "Su iPhone le notifiche arrivano solo all'app sulla schermata Home: tocca <b>Condividi</b> → <b>Aggiungi alla schermata Home</b>, apri Ancora da lì e attivale.", azioni: [{ t: "Ho capito" }] });
    return false;
  }
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) { alert("Questo telefono non riceve notifiche dal browser."); return false; }
  if ((await Notification.requestPermission()) !== "granted") return false;
  const reg = await navigator.serviceWorker.ready;
  const { publicKey } = await (await fetch(`${SUPABASE_URL}/functions/v1/notifiche`)).json();
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64(publicKey) });
  const j = sub.toJSON();
  await sb.from("push_iscrizioni").upsert({ persona_id: state.io.id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth }, { onConflict: "endpoint" });
  return true;
}

// bentornato: se mancavi da qualche giorno, cosa è successo in famiglia (una volta per sessione)
export const SPUNTI = [
  "Che foto hai scattato questa settimana? Mettila, con due righe.",
  "Una cosa che ti ha fatto ridere in questi giorni.",
  "Il piatto che hai cucinato di recente, e per chi.",
  "Un posto dove sei stato e dove vorresti tornare.",
  "Una canzone che ti riporta a un momento preciso.",
  "Una cosa che hai imparato da qualcuno della famiglia.",
  "Com'era la casa dove sei cresciuto? Una stanza, un odore.",
  "Una decisione di cui oggi sei contento.",
  "Il regalo più bello che hai ricevuto, e da chi.",
  "Una persona che ti ha aiutato quando non te lo aspettavi.",
];
async function spuntoPerScrivere() {
  let ultima = 0; try { ultima = Number(localStorage.getItem("ancora_spunto") ?? 0); } catch { /* niente */ }
  if (Date.now() - ultima < 3 * 864e5) return false;
  const { data } = await sb.from("ricordi").select("creato_il").eq("autore_id", state.io.id).neq("tipo", "storia").order("creato_il", { ascending: false }).limit(1);
  const giorni = data?.[0] ? (Date.now() - new Date(data[0].creato_il)) / 864e5 : 99;
  if (giorni < 5) return false;
  try { localStorage.setItem("ancora_spunto", String(Date.now())); } catch { /* niente */ }
  const spunto = SPUNTI[Math.floor(Date.now() / 864e5) % SPUNTI.length];
  popup({
    titolo: "Uno spunto per te",
    testo: `<span style="font-family:Fraunces,serif;font-size:20px;line-height:1.35">«${spunto}»</span><br><span class="tenue" style="font-size:14px">Bastano due righe, o un vocale. Lo vede chi scegli tu.</span>`,
    azioni: [{ t: "Racconta", fn: () => { location.hash = "#/racconta?spunto=" + encodeURIComponent(spunto); } }, { t: "Un'altra volta" }],
  });
  return true;
}

async function bentornato() {
  if (sessionStorage.getItem("ancora_bentornato")) return;
  sessionStorage.setItem("ancora_bentornato", "1");
  const prima = state.accessoPrima ? new Date(state.accessoPrima) : null;
  const giorni = prima ? Math.floor((Date.now() - prima) / 864e5) : 0;
  if (giorni >= 4) {
    const { count } = await sb.from("ricordi").select("id", { count: "exact", head: true })
      .neq("autore_id", state.io.id).neq("visibilita", "solo_io").gte("creato_il", prima.toISOString());
    popup({
      titolo: `Bentornato, ${state.io.soprannome ?? state.io.nome}!`,
      testo: count ? `In questi ${giorni} giorni la famiglia ha condiviso <b>${count} ${count === 1 ? "ricordo" : "ricordi"}</b>.` : `È da ${giorni} giorni che non passavi. C'è una domanda che ti aspetta.`,
      azioni: [{ t: count ? "Guarda le novità" : "Racconta qualcosa", fn: () => { location.hash = count ? "#/" : "#/racconta"; } }, { t: "Più tardi" }],
    });
    return;
  }
  // uno spunto per scrivere, se non racconta da 5 giorni (al massimo ogni 3 giorni)
  if (await spuntoPerScrivere()) return;
  // una volta sola: proponi le notifiche, con il perché
  if (!localStorage.getItem("ancora_chiesto_notifiche") && !(await notificheAttive())) {
    localStorage.setItem("ancora_chiesto_notifiche", "1");
    popup({
      titolo: "Vuoi sapere quando qualcuno racconta?",
      testo: "Ti avvisiamo quando la famiglia condivide un ricordo e quando arriva la domanda della settimana. Poche notifiche, mai di notte.",
      azioni: [{ t: "Sì, avvisami", fn: attivaNotifiche }, { t: "Non ora" }],
    });
  }
}

async function render() {
  const [rotta, query] = location.hash.replace(/^#\/?/, "").split("?");
  const nome = rotta.split("/")[0];
  const params = Object.fromEntries(new URLSearchParams(query ?? ""));
  const id = rotta.split("/")[1];

  if (!PUBBLICHE.has(nome) && !state.io && !(await caricaIo())) {
    // chi arriva dal link principale vede la pagina di vendita; da un link a un gioco, un ricordo, una ricetta… dopo l'accesso torna lì
    location.hash = nome === "" ? "#/scopri" : `#/accesso?torna=${encodeURIComponent(location.hash)}`; return;
  }
  const barra = document.getElementById("barra");
  barra.hidden = PUBBLICHE.has(nome) || state.io?.modalita === "semplice";
  barra.querySelectorAll("a").forEach((a) => a.classList.toggle("attivo", a.dataset.r === nome));

  const carica = ROTTE[nome] ?? ROTTE[""];
  const vista = await carica();
  $app().innerHTML = "";
  // arrivato da un invito a giocare: appena al tavolo, gli chiediamo di salvare Ancora sulla schermata Home (per gli inviti e le notifiche)
  if (["briscola", "tressette", "biliardo", "calcio", "tombola", "stop", "auto"].includes(nome)) {
    let dopoTavolo = false; try { dopoTavolo = sessionStorage.getItem("ancora_dopo_tavolo") === "1"; sessionStorage.removeItem("ancora_dopo_tavolo"); } catch { /* niente */ }
    if (dopoTavolo) setTimeout(() => invitoSchermataHome(true), 2500);
  }
  try {
    await vista.default({ id, params });
    if (!PUBBLICHE.has(nome) && state.io && state.io.modalita !== "semplice") aggiungiMenu();
    if (!PUBBLICHE.has(nome) && nome === "") setTimeout(() => benvenutoNuovo() || bentornato(), 1200);
    if (!PUBBLICHE.has(nome) && nome === "") setTimeout(() => invitoSchermataHome() || ricordaPiu(), 2500);
    if (!PUBBLICHE.has(nome) && state.io) setTimeout(controllaAssistenza, 1500);
  }
  catch (e) { console.error(e); $app().innerHTML = `<p class="errore">Qualcosa non ha funzionato. Riprova tra poco.</p>`; }
  window.scrollTo(0, 0);
}

// --- Aggiungi alla schermata Home: istruzioni giuste per iPhone/Android, finché non l'ha fatto ---
let promptInstalla = null;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); promptInstalla = e; });
const giaInstallata = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
export function istruzioniSchermataHome() {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const safari = ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|GSA|FBAN|FBAV|Instagram|WhatsApp/.test(ua);
  if (ios && !safari) return `<p style="margin:0 0 8px"><b>Prima aprila in Safari:</b> tocca <b>⋯</b> o l'icona della bussola in basso e scegli <b>Apri in Safari</b>. Poi:</p>
    <ol style="margin:0;padding-left:20px;line-height:1.6"><li>tocca <b>Condividi</b> <span aria-hidden="true">⬆︎</span> in basso</li><li>scorri e tocca <b>Aggiungi alla schermata Home</b></li><li>tocca <b>Aggiungi</b></li></ol>`;
  if (ios) return `<ol style="margin:0;padding-left:20px;line-height:1.6"><li>tocca <b>Condividi</b> <span aria-hidden="true">⬆︎</span> in basso (o in alto su iPad)</li><li>scorri e tocca <b>Aggiungi alla schermata Home</b></li><li>tocca <b>Aggiungi</b></li></ol>`;
  return `<ol style="margin:0;padding-left:20px;line-height:1.6"><li>tocca il menu <b>⋮</b> in alto a destra</li><li>tocca <b>Aggiungi a schermata Home</b> (o <b>Installa app</b>)</li><li>conferma</li></ol>`;
}
function invitoSchermataHome(forza = false) {
  if (giaInstallata() || document.getElementById("schermata-home") || document.getElementById("benvenuto-nuovo")) return false;
  let quando = 0; try { quando = Number(localStorage.getItem("ancora_home_chiuso") ?? 0); } catch { /* niente */ }
  // la prima volta subito e ben visibile; poi ogni 3 giorni finché non l'ha messa sulla Home
  if (!forza && Date.now() - quando < 3 * 86400_000) return false;
  const primaVolta = !quando;
  const el = document.createElement("div");
  el.id = "schermata-home";
  el.style.cssText = primaVolta
    ? "position:fixed;left:16px;right:16px;top:50%;transform:translateY(-50%);max-width:460px;margin:0 auto;z-index:60;background:#fff;border-radius:24px;box-shadow:0 0 0 100vmax rgba(18,48,44,.55),0 10px 40px rgba(0,0,0,.25);padding:22px 20px;animation:entra .3s ease"
    : "position:fixed;left:12px;right:12px;bottom:calc(100px + env(safe-area-inset-bottom));max-width:520px;margin:0 auto;z-index:30;background:#fff;border-radius:20px;box-shadow:0 10px 40px rgba(0,0,0,.25);padding:16px 18px;animation:entra .3s ease";
  el.innerHTML = `<button class="icona" aria-label="Chiudi" style="position:absolute;top:6px;right:6px;width:36px;height:36px">✕</button>
    <div style="display:flex;gap:12px;align-items:center;margin-bottom:10px"><img src="icons/icon-192.png" alt="" width="44" height="44" style="border-radius:11px">
      <b style="font-family:Fraunces,serif;font-size:19px;line-height:1.2">Metti Ancora sul telefono,<br>accanto alle altre app</b></div>
    ${promptInstalla ? `<button class="btn ambra" id="installa">Aggiungi alla schermata Home</button>` : istruzioniSchermataHome()}`;
  document.body.appendChild(el);
  el.querySelector(".icona").onclick = () => { try { localStorage.setItem("ancora_home_chiuso", String(Date.now())); } catch { /* niente */ } el.remove(); };
  el.querySelector("#installa")?.addEventListener("click", async () => { await promptInstalla.prompt(); promptInstalla = null; el.remove(); });
  return true;
}

// --- Alla prima iscrizione: cosa c'è su Ancora, e i due passi che contano (schermata Home e notifiche) ---
function benvenutoNuovo() {
  try { if (localStorage.getItem("ancora_benvenuto")) return false; } catch { return false; }
  const nuovo = state.io?.creato_il && Date.now() - new Date(state.io.creato_il).getTime() < 7 * 864e5;
  if (!nuovo || document.querySelector("#schermata-home, #benvenuto-nuovo, #foglio-piu")) return false;
  const installata = giaInstallata();
  const notifiche = "Notification" in window && Notification.permission === "granted";
  const el = document.createElement("div");
  el.id = "benvenuto-nuovo";
  el.style.cssText = "position:fixed;inset:0;z-index:70;background:rgba(18,48,44,.6);display:flex;align-items:flex-end;justify-content:center";
  el.innerHTML = `<div role="dialog" aria-label="Benvenuto" style="background:#FBF8F2;width:100%;max-width:560px;max-height:92vh;overflow:auto;border-radius:24px 24px 0 0;padding:22px 18px calc(22px + env(safe-area-inset-bottom));animation:entra .3s ease">
    <b style="font-family:Fraunces,serif;font-size:27px;line-height:1.15;display:block">Benvenuto su Ancora${state.io?.nome ? `, ${esc(state.io.nome)}` : ""} 👋</b>
    <p style="margin:6px 0 12px;font-weight:700;color:#8A5A17">La prima app social privata della famiglia e dei gruppi: solo voi, niente pubblicità, niente estranei.</p>
    <div style="line-height:1.85;font-size:16px">📸 Foto, video e storie solo tra voi<br>💬 Chat del gruppo e messaggi a due<br>🎙️ Le voci e i racconti dei nonni, per sempre<br>🌳 L'albero della famiglia<br>🍝 Il ricettario di casa<br>📅 Calendario, compleanni, liste e spese<br>🎲 Tombola, carte napoletane, biliardo e calciobalilla, parlando al tavolo</div>
    <p class="tenue" style="margin:6px 0 16px;font-size:14px">Con Ancora+: l'aiutante di casa, il libro e il film della famiglia, 200 GB per tutti.</p>
    <div class="card" style="margin:0 0 10px"><b style="font-size:17px">① Metti Ancora sulla schermata Home ${installata ? "✓" : ""}</b>
      ${installata ? `<p class="tenue" style="margin:4px 0 0">Fatto: la trovi accanto alle altre app.</p>` : `<p class="tenue" style="margin:4px 0 8px">Così la apri con un tocco e ti arrivano gli inviti a giocare e i messaggi.</p>${promptInstalla ? `<button class="btn ambra" id="bn-installa" style="margin:0">Aggiungi alla schermata Home</button>` : istruzioniSchermataHome()}`}</div>
    <div class="card" style="margin:0 0 14px"><b style="font-size:17px">② Attiva le notifiche ${notifiche ? "✓" : ""}</b>
      ${notifiche ? `<p class="tenue" style="margin:4px 0 0">Attive.</p>` : `<p class="tenue" style="margin:4px 0 8px">Per sapere quando ti invitano a un tavolo, quando arriva un messaggio o una foto della famiglia.</p><button class="btn ambra" id="bn-notifiche" style="margin:0">🔔 Attiva le notifiche</button>`}</div>
    <a class="btn chiaro" href="#/istruzioni" id="bn-libretto" style="margin:0 0 10px">📖 Il libretto di istruzioni</a>
    <button class="btn" id="bn-via" style="margin:0">Cominciamo</button></div>`;
  document.body.appendChild(el);
  const chiudi = () => { try { localStorage.setItem("ancora_benvenuto", "1"); localStorage.setItem("ancora_home_chiuso", String(Date.now())); } catch { /* niente */ } el.remove(); };
  el.querySelector("#bn-via").onclick = chiudi;
  el.querySelector("#bn-libretto").onclick = chiudi;
  el.querySelector("#bn-installa")?.addEventListener("click", async () => { await promptInstalla.prompt(); promptInstalla = null; el.querySelector("#bn-installa").outerHTML = `<p class="tenue" style="margin:4px 0 0">Fatto ✓</p>`; });
  el.querySelector("#bn-notifiche")?.addEventListener("click", async (e) => { const ok = await attivaNotifiche(); if (ok) e.target.outerHTML = `<p class="tenue" style="margin:4px 0 0">Attive ✓</p>`; });
  return true;
}

// --- Ancora+ per chi non ce l'ha: un promemoria con foto, che cambia ogni volta ---
// 50 anni o più: una volta a settimana (al massimo 8). Gli altri: ogni 14 giorni (al massimo 4).
// Mai nei primi 2 giorni, mai insieme ad altri avvisi.
const MESSAGGI_PIU = [
  ["panettone", "Il ricettario di casa", "Le tue ricette, in eredità.", "Le dosi giuste, i trucchi, la tua voce mentre le spieghi. Per chi verrà dopo."],
  ["compiti", "Per chi conta davvero", "La tua storia, in eredità ai nipoti.", "Le scelte, le avventure, il tuo modo di vedere le cose. Raccontate da te, una domanda alla volta."],
  ["nonna-nipote", "Il regalo che resta", "I tuoi ricordi, da lasciare ai nipoti.", "Foto, voci e storie in un posto solo vostro. E a fine anno diventano un libro da tenere in mano."],
  ["foto", "Ancora, e ancora", "I tuoi ricordi, all'infinito.", "Non più in una scatola o persi in un telefono: al sicuro, solo per la tua famiglia."],
  ["colazione", "Lo scrigno della famiglia", "Foto, voci, storie, ricette. Tutto in un posto.", "Il posto dove la tua famiglia mette quello che conta. E cresce ogni giorno con voi."],
  ["letto", "Le storie di famiglia", "Le storie dei nonni, ascoltate dai nipoti dei nipoti.", "Registrate una volta, restano lì. Con la voce di chi le racconta."],
  ["compiti", "Per chi conta davvero", "«Tu che avresti fatto al posto mio?»", "Un giorno qualcuno te lo chiederà. Con Ancora+ le tue storie e le tue scelte restano lì per la tua famiglia."],
];
function eta() {
  const d = state.io?.data_nascita; if (!d) return null;
  const n = new Date(d), o = new Date();
  return o.getFullYear() - n.getFullYear() - (o < new Date(o.getFullYear(), n.getMonth(), n.getDate()) ? 1 : 0);
}
function ricordaRegalo() {
  const oggi = new Date();
  if (!state.piu || oggi.getMonth() !== 11 || oggi.getDate() > 23 || document.querySelector("#foglio-piu, #schermata-home, #banner-cookie, [role=dialog]")) return;
  let st = { volte: 0, ultima: 0 }; try { st = JSON.parse(localStorage.getItem("ancora_ricorda_regalo") ?? "null") ?? st; } catch { /* niente */ }
  if (st.volte >= 3 || Date.now() - st.ultima < 7 * 86400_000) return;
  try { localStorage.setItem("ancora_ricorda_regalo", JSON.stringify({ volte: st.volte + 1, ultima: Date.now() })); } catch { /* niente */ }
  const d = document.createElement("div");
  d.id = "foglio-piu";
  d.innerHTML = `<div data-chiudi style="position:fixed;inset:0;background:rgba(18,48,44,.6);z-index:55"></div>
    <div role="dialog" aria-label="Regala Ancora" style="position:fixed;left:16px;right:16px;top:50%;transform:translateY(-50%);max-width:440px;max-height:92vh;overflow:auto;margin:0 auto;z-index:56;background:#12302C;color:#FBF3E2;border-radius:24px;box-shadow:0 20px 50px rgba(0,0,0,.35)">
      <div style="position:relative;aspect-ratio:900/560;background:#2F5A55 url('img/promo/nonna-nipote.jpg') center/cover">
        <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(18,48,44,0) 45%,#12302C)"></div>
        <button data-chiudi aria-label="Chiudi" style="position:absolute;top:10px;right:10px;width:38px;height:38px;border-radius:19px;border:0;background:rgba(0,0,0,.35);color:#fff;font-size:17px">✕</button></div>
      <div style="padding:4px 22px 22px">
        <p style="margin:0 0 6px;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#E7C48A">Un regalo di Natale che resta</p>
        <b style="display:block;font-family:Fraunces,serif;font-size:26px;line-height:1.12;margin-bottom:10px;color:#fff">La storia della loro famiglia, da regalare.</b>
        <p style="margin:0 0 16px;line-height:1.5;color:#F3E6D2">Ai tuoi fratelli, ai suoceri, agli amici di sempre: un anno di Ancora+ per tutta la loro famiglia, il libro a fine anno e il film. Il biglietto arriva il giorno che scegli.</p>
        <a class="btn ambra" href="#/regala?q=3">3 regali al prezzo di 2 · 198 €</a>
        <a class="btn" href="#/regala" style="margin-top:8px;background:transparent;border:1.5px solid rgba(255,255,255,.35);color:#fff">Un regalo · 99 €</a>
        <button data-chiudi style="display:block;margin:12px auto 0;border:0;background:none;color:#CFC3AE;font-weight:700">Più tardi</button></div>
    </div>`;
  document.body.appendChild(d);
  d.querySelectorAll("[data-chiudi], a").forEach((x) => x.addEventListener("click", () => d.remove()));
}
function ricordaPiu() {
  if (state.piu) return ricordaRegalo();
  if (!state.io || document.querySelector("#foglio-piu, #schermata-home, #banner-cookie, [role=dialog]")) return;
  if (state.io.creato_il && Date.now() - new Date(state.io.creato_il).getTime() < 2 * 86400_000) return;
  const adulto = (eta() ?? 0) >= 50;
  const ogni = adulto ? 7 : 14, max = adulto ? 8 : 4;
  let st = { volte: 0, ultima: 0 }; try { st = JSON.parse(localStorage.getItem("ancora_ricorda_piu") ?? "null") ?? st; } catch { /* niente */ }
  if (st.volte >= max || Date.now() - st.ultima < ogni * 86400_000) return;
  try { localStorage.setItem("ancora_ricorda_piu", JSON.stringify({ volte: st.volte + 1, ultima: Date.now() })); } catch { /* niente */ }
  const [foto, occh, titolo, testo] = MESSAGGI_PIU[st.volte % MESSAGGI_PIU.length];
  const d = document.createElement("div");
  d.id = "foglio-piu";
  d.innerHTML = `<div data-chiudi style="position:fixed;inset:0;background:rgba(18,48,44,.6);z-index:55"></div>
    <div role="dialog" aria-label="Ancora+" style="position:fixed;left:16px;right:16px;top:50%;transform:translateY(-50%);max-width:440px;max-height:92vh;overflow:auto;margin:0 auto;z-index:56;background:#12302C;color:#FBF3E2;border-radius:24px;box-shadow:0 20px 50px rgba(0,0,0,.35)">
      <div style="position:relative;aspect-ratio:900/560;background:#2F5A55 url('img/promo/${foto}.jpg') center/cover">
        <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(18,48,44,0) 45%,#12302C)"></div>
        <button data-chiudi aria-label="Chiudi" style="position:absolute;top:10px;right:10px;width:38px;height:38px;border-radius:19px;border:0;background:rgba(0,0,0,.35);color:#fff;font-size:17px">✕</button></div>
      <div style="padding:4px 22px 22px">
        <p style="margin:0 0 6px;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#E7C48A">${occh}</p>
        <b style="display:block;font-family:Fraunces,serif;font-size:27px;line-height:1.12;margin-bottom:10px;color:#fff">${titolo}</b>
        <p style="margin:0 0 16px;line-height:1.5;color:#F3E6D2">${testo}</p>
        <button class="btn ambra" id="rp-scopri">Scopri Ancora<span>+</span></button>
        <a class="btn" href="#/regala" style="margin-top:8px;background:transparent;border:1.5px solid rgba(255,255,255,.35);color:#fff">Regalalo alla famiglia · 99 €</a>
        <button data-chiudi style="display:block;margin:12px auto 0;border:0;background:none;color:#CFC3AE;font-weight:700">Più tardi</button></div>
    </div>`;
  document.body.appendChild(d);
  d.querySelectorAll("[data-chiudi], a").forEach((x) => x.addEventListener("click", () => d.remove()));
  d.querySelector("#rp-scopri").onclick = () => { d.remove(); passaPiu(); };
}

sb.auth.onAuthStateChange((evento) => { if (evento === "SIGNED_IN" && !state.io) render(); });
window.addEventListener("hashchange", render);
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").then((r) => r.update()).catch(() => {});
// se è uscita una versione nuova, il telefono la prende da solo (all'apertura e quando si torna sull'app)
async function controllaVersione() {
  try {
    const v = (await (await fetch(`versione.txt?t=${Date.now()}`, { cache: "no-store" })).text()).trim();
    if (v && v !== VER && sessionStorage.getItem("ancora_ricaricata") !== v) {
      sessionStorage.setItem("ancora_ricaricata", v);
      (await navigator.serviceWorker?.getRegistration())?.update();
      location.reload();
    }
  } catch { /* offline */ }
}
controllaVersione();
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") controllaVersione(); });
render();

// Foto profilo e copertine (persone e cerchie): rimpicciolite sul telefono, poi caricate.
// cartella: "profilo" oppure "cerchia/<id>"; la vecchia immagine si cancella.
export function rimpicciolisci(file, lato) {
  return new Promise((ok) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, lato / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => ok(b ?? file), "image/jpeg", 0.85);
    };
    img.onerror = () => ok(file);
    img.src = URL.createObjectURL(file);
  });
}
export async function cambiaImmagine({ file, tabella, id, campo, cartella, vecchia }) {
  const blob = await rimpicciolisci(file, campo === "copertina" ? 1600 : 600);
  const path = `${state.io.id}/${cartella}/${campo}-${Date.now()}.jpg`;
  const up = await sb.storage.from("ricordi").upload(path, blob, { contentType: "image/jpeg" });
  if (up.error) { alert("Non caricata: " + up.error.message); return false; }
  const { error } = await sb.from(tabella).update({ [campo + "_path"]: path }).eq("id", id);
  if (error) { alert("Non salvata: " + error.message); return false; }
  if (vecchia?.startsWith(state.io.id + "/")) sb.storage.from("ricordi").remove([vecchia]);
  return true;
}
// Testata con copertina e foto tonda; con "modifica" compaiono i tasti 📷.
export const testata = ({ nome, foto, copertina, persona, modifica, chiave, alta = 150, tondo = 98 }) => `
  <div style="position:relative;aspect-ratio:16/9;max-height:${Math.max(alta, 300)}px;width:100%;background:${copertina ? `url('${copertina}') center/cover` : "linear-gradient(135deg,#7FA37E,#4D7356)"}">
    ${modifica ? `<label class="chip" style="position:absolute;right:12px;bottom:10px;margin:0;background:rgba(251,248,242,.92)">📷 Copertina<input type="file" accept="image/*" data-img="copertina" data-k="${chiave ?? ""}" hidden></label>` : ""}
  </div>
  <div class="pad" style="display:flex;align-items:flex-end;gap:14px;margin-top:-${Math.round(tondo / 2 + 6)}px;position:relative">
    <label style="position:relative;flex-shrink:0;${modifica ? "cursor:pointer" : ""}">
      <span class="anello" style="width:${tondo + 6}px;height:${tondo + 6}px;border-radius:50%;display:inline-block">${avatar(persona ?? { nome }, tondo, foto, `border:3px solid var(--carta);font-size:${Math.round(tondo / 3.2)}px;`)}</span>
      ${modifica ? `<span style="position:absolute;right:0;bottom:4px;width:32px;height:32px;border-radius:16px;background:var(--carta);display:grid;place-items:center;box-shadow:0 1px 4px rgba(0,0,0,.2)">📷</span><input type="file" accept="image/*" data-img="foto" data-k="${chiave ?? ""}" hidden>` : ""}
    </label>
    <div style="flex:1;padding-bottom:6px" data-testata-dx></div>
  </div>`;

// --- Consenso cookie e tracciabilità delle campagne (UTM) ---
// Necessari: sempre. Statistiche (UTM per 30 giorni + conteggio visite anonimo): solo con consenso.
const CHIAVE_CONSENSO = "ancora_consenso", CHIAVE_UTM = "ancora_utm";
const leggi = (k) => { try { return JSON.parse(localStorage.getItem(k) ?? "null"); } catch { return null; } };
const scrivi = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch { /* niente */ } };
let utmSessione = null;   // senza consenso resta solo in memoria per questa visita (non salvato)

function utmDaUrl() {
  const q = new URLSearchParams(location.search);
  const h = new URLSearchParams(location.hash.split("?")[1] ?? "");
  const p = (k) => q.get("utm_" + k) ?? h.get("utm_" + k);
  const u = { sorgente: p("source"), mezzo: p("medium"), campagna: p("campaign"), contenuto: p("content"), termine: p("term") };
  return Object.values(u).some(Boolean) ? u : null;
}

/** La campagna da cui è arrivata la persona (prima visita degli ultimi 30 giorni), o null. */
// le persone che conosco, dalle mie famiglie e cerchie (per chat, lettere, ecc.)
export async function personeConosciute() {
  const ids = state.cerchie.map((c) => c.id);
  if (!ids.length) return [];
  const [{ data: m }, { data: prop }] = await Promise.all([
    sb.from("cerchia_membri").select("cerchia_id, persone(id, nome, cognome, soprannome, foto_path, data_nascita)").in("cerchia_id", ids).eq("stato", "attivo"),
    sb.from("cerchie").select("id, persone:proprietario_id(id, nome, cognome, soprannome, foto_path, data_nascita)").in("id", ids)]);
  const nomeCerchia = (id) => state.cerchie.find((c) => c.id === id)?.nome ?? "";
  const tutte = [...(m ?? []).map((x) => ({ ...x.persone, dove: nomeCerchia(x.cerchia_id) })), ...(prop ?? []).map((x) => ({ ...x.persone, dove: nomeCerchia(x.id) }))];
  return [...new Map(tutte.filter((p) => p?.id && p.id !== state.io.id).map((p) => [p.id, p])).values()].sort((a, b) => nomeDi(a).localeCompare(nomeDi(b)));
}

// domande su misura: chiede una nuova domanda partendo dai racconti (solo se attive; il server decide se serve)
export async function chiediSuMisura() {
  if (!state.io?.domande_su_misura || !state.piu) return;   // le domande su misura sono di Ancora+
  try {
    const { data: { session } } = await sb.auth.getSession();
    fetch(`${SUPABASE_URL}/functions/v1/domanda-su-misura`, { method: "POST", headers: { authorization: `Bearer ${session?.access_token}`, "content-type": "application/json" }, body: "{}" }).catch(() => {});
  } catch { /* niente */ }
}

export function utm() {
  if (leggi(CHIAVE_CONSENSO)?.statistiche) {
    const s = leggi(CHIAVE_UTM);
    if (s && Date.now() - s.t < 30 * 86400_000) return s.u;
  }
  return utmSessione;
}

// --- Cosa fanno le persone nella pagina di vendita (solo con il consenso ai cookie statistici) ---
let sessioneLanding = null;
export function traccia(evento, valore = null) {
  if (!leggi(CHIAVE_CONSENSO)?.statistiche) return;
  try {
    sessioneLanding ??= sessionStorage.getItem("ancora_sessione") ?? (() => { const x = crypto.randomUUID().slice(0, 18); sessionStorage.setItem("ancora_sessione", x); return x; })();
    const fatti = JSON.parse(sessionStorage.getItem("ancora_eventi") ?? "[]");
    const chiave = evento + (evento === "scroll" ? valore : "");
    if (evento !== "tempo" && fatti.includes(chiave)) return;   // ogni evento una volta per visita
    if (evento !== "tempo") sessionStorage.setItem("ancora_eventi", JSON.stringify([...fatti, chiave].slice(-80)));
  } catch { return; }
  const u = utm() ?? {};
  sb.from("eventi_landing").insert({ sessione: sessioneLanding, evento: String(evento).slice(0, 60), valore,
    sorgente: u.sorgente ?? null, mezzo: u.mezzo ?? null, campagna: u.campagna ?? null, contenuto: u.contenuto ?? null }).then(() => {});
}

function registraVisita() {
  const nuovo = utmDaUrl();
  if (nuovo) utmSessione = nuovo;
  if (!leggi(CHIAVE_CONSENSO)?.statistiche) return;
  if (nuovo && !leggi(CHIAVE_UTM)) scrivi(CHIAVE_UTM, { u: nuovo, t: Date.now() });   // vale il primo contatto
  try { if (sessionStorage.getItem("ancora_visita")) return; sessionStorage.setItem("ancora_visita", "1"); } catch { return; }
  const u = nuovo ?? {};
  sb.from("visite").insert({ sorgente: u.sorgente ?? null, mezzo: u.mezzo ?? null, campagna: u.campagna ?? null,
    contenuto: u.contenuto ?? null, termine: u.termine ?? null, pagina: (location.hash.split("?")[0] || "#/").slice(0, 60),
    referrer: document.referrer ? new URL(document.referrer).hostname : null }).then(() => {});
}

/** Banner del consenso: compare alla prima visita, o quando si riaprono le preferenze. */
export function consensoCookie(forza = false) {
  if (!forza && leggi(CHIAVE_CONSENSO)) { registraVisita(); return; }
  document.getElementById("banner-cookie")?.remove();
  const d = document.createElement("div");
  d.id = "banner-cookie";
  d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "Preferenze cookie");
  d.style.cssText = "position:fixed;left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));max-width:540px;margin:0 auto;z-index:50;background:#12302C;color:#FBF3E2;border-radius:20px;padding:16px 16px 14px;box-shadow:0 8px 30px rgba(0,0,0,.3)";
  d.innerHTML = `<b style="font-size:16px">Un biscotto, solo se vuoi 🍪</b>
    <p style="margin:6px 0 12px;font-size:14px;line-height:1.45;color:#E2DACB">Usiamo solo ciò che serve a far funzionare Ancora. Se accetti, ricordiamo anche da quale campagna sei arrivato, per capire cosa funziona. Niente pubblicità. <a href="#/cookie" style="color:#F4D39B">Dettagli</a></p>
    <div style="display:flex;gap:8px"><button id="ck-no" class="btn chiaro" style="flex:1;min-height:44px;margin:0">Solo necessari</button>
      <button id="ck-si" class="btn" style="flex:1;min-height:44px;margin:0;background:#C9832E;color:#12302C">Accetta</button></div>`;
  document.body.appendChild(d);
  const scegli = (si) => {
    scrivi(CHIAVE_CONSENSO, { statistiche: si, il: new Date().toISOString() });
    if (!si) scrivi(CHIAVE_UTM, null);
    d.remove(); registraVisita();
  };
  d.querySelector("#ck-no").onclick = () => scegli(false);
  d.querySelector("#ck-si").onclick = () => scegli(true);
}
consensoCookie();

// --- Menu laterale dell'app: tutte le voci in un posto, al posto di bottoni e chip sparsi ---
function vociMenu() {
  const spenti = new Set(state.io.moduli_spenti ?? []);
  const attivi = (k) => !spenti.has(k) && state.cerchie.some((c) => c.moduli?.[k]);
  const famiglie = [...state.cerchie].sort((a, b) => (a.tipo === "famiglia" ? 0 : 1) - (b.tipo === "famiglia" ? 0 : 1));
  return [
    ["Le mie famiglie e i gruppi", [...famiglie.map((c) => [`#/?c=${c.id}`, c.nome]),
      ...(famiglie.length > 1 ? [["#/?c=tutti", "Tutte insieme"]] : []), ["#/?c=diretti", "Messaggi per me"]]],
    ["La famiglia", [["#/aiutante", `✨ ${famiglie.find((c) => c.tipo === "famiglia")?.aiutante_nome || "L'aiutante"}`], ["#/giochi", "🎲 Giochi"], ["#/calendario", "Calendario"], ["#/liste", "Liste e desideri"], ["#/spese", "Spese"], ["#/album", "Album degli eventi"], ["#/domande", "Domande per te"], ["#/albero", "L'albero"], ["#/cerchie", "Famiglie e cerchie"]]],
    ["I miei ricordi", [["#/archivio", "Il cloud dei ricordi"], ["#/racconta", "Racconta"], ["#/racconta?lettera=1", "Una lettera per più avanti"], ["#/diario", "Il diario"], ["#/ricette", "Il ricettario"], [`#/libro/${state.io.id}`, "Il mio libro"], ["#/libro?famiglia=", "Il libro della famiglia"], ["#/film", "Il film dell'anno"]]],
    ["Agenda", [["vacanze", "Vacanze"], ["compiti", "Compiti"], ["esami", "Esami"]].filter(([k]) => attivi(k)).map(([k, t]) => [`#/agenda?t=${k}`, t])],
    ["Il mio account", [["#/invita", "Invita e guadagna Ancora+ 🎁"], ["#/locandina", "Porta Ancora in parrocchia o a scuola"], ["#/profilo", "Profilo e impostazioni"], ["#/piano", "Il piano"], ["#/servizi", "Servizi"], ["#/regala", "Regala Ancora"], ["#/omaggio", "Codice omaggio"], ["#/assistenza", "Assistenza · scrivici"]]],
  ].filter(([, v]) => v.length);
}

function aggiungiMenu() {
  const testa = document.querySelector("#app header.testa");
  if (!testa || testa.querySelector(".apri-menu")) return;
  const b = document.createElement("button");
  b.className = "icona apri-menu"; b.setAttribute("aria-label", "Menu");
  b.style.cssText = "border:0;background:transparent;cursor:pointer;color:inherit;position:relative";
  b.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`;
  testa.appendChild(b);
  b.onclick = apriMenu;
}

let assistenzaDaLeggere = 0;
async function controllaAssistenza() {
  if (!state.io) return;
  const { data } = await sb.rpc("assistenza_non_lette");
  assistenzaDaLeggere = data ?? 0;
  const b = document.querySelector(".apri-menu");
  if (b) { b.querySelector(".pallino-menu")?.remove(); if (assistenzaDaLeggere) b.insertAdjacentHTML("beforeend", `<span class="pallino-menu" style="position:absolute;top:2px;right:0;width:10px;height:10px;border-radius:5px;background:#B3402F"></span>`); }
}

function apriMenu() {
  document.getElementById("menu-app")?.remove();
  const attuale = location.hash || "#/";
  const m = document.createElement("div");
  m.id = "menu-app";
  m.innerHTML = `<div data-chiudi style="position:fixed;inset:0;background:rgba(18,48,44,.45);z-index:40"></div>
    <nav aria-label="Menu" style="position:fixed;top:0;right:0;bottom:0;width:min(84vw,330px);z-index:41;background:#FBF8F2;overflow:auto;
      padding:calc(16px + env(safe-area-inset-top)) 18px calc(24px + env(safe-area-inset-bottom));box-shadow:-10px 0 30px rgba(0,0,0,.2);animation:entra .18s ease-out">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">${avatar(state.io, 40)}
        <b style="flex:1;font-size:17px">${esc(nomeDi(state.io))}</b>
        <button data-chiudi aria-label="Chiudi" style="width:40px;height:40px;border-radius:20px;border:0;background:#EFE8DC;font-size:18px;cursor:pointer">✕</button></div>
      ${state.piu ? `<a href="#/ancora-piu" style="display:inline-block;margin-top:2px;padding:5px 12px;border-radius:999px;background:#E3EDE2;color:#2F5A3A;font-weight:800;font-size:13px;text-decoration:none">Ancora<span style="color:#C9832E">+</span> attivo ✓</a>`
        : `<a href="#/ancora-piu" style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;min-height:48px;border-radius:14px;background:linear-gradient(135deg,#D9622B,#C8102E);color:#fff;font-weight:800;font-size:17px;text-decoration:none;box-shadow:0 4px 14px rgba(200,16,46,.25)">✨ Scopri Ancora<span style="color:#FFE2A8">+</span></a>`}
      ${vociMenu().map(([gruppo, voci]) => `<div style="margin-top:18px;font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#8A5A17">${gruppo}</div>
        ${voci.map(([h, t]) => `<a href="${h}" style="display:block;padding:12px 10px;margin:2px -10px;border-radius:12px;text-decoration:none;font-size:17px;font-weight:700;
          color:#12302C;${attuale === h ? "background:#F3E6CF" : ""}">${t}${h === "#/assistenza" && assistenzaDaLeggere ? ` <span class="pallino-assistenza" style="display:inline-block;min-width:20px;padding:1px 6px;border-radius:10px;background:#B3402F;color:#fff;font-size:12px;text-align:center">${assistenzaDaLeggere}</span>` : ""}</a>`).join("")}`).join("")}
      <a href="#/istruzioni" style="display:flex;align-items:center;gap:10px;margin-top:20px;padding:12px 14px;border-radius:14px;background:#12302C;color:#FBF3E2;text-decoration:none">
        <span style="font-size:26px">📖</span><span><b style="display:block;font-size:17px">Libretto di istruzioni</b><small style="opacity:.8">Tutto Ancora, spiegato in fretta</small></span></a>
      <button id="esci-app" style="margin-top:14px;border:0;background:transparent;color:#8A3B2E;font-weight:700;font-size:15px;cursor:pointer;padding:8px 0">Esci</button>
    </nav>`;
  document.body.appendChild(m);
  const chiudi = () => m.remove();
  m.querySelectorAll("[data-chiudi], nav a").forEach((x) => x.addEventListener("click", chiudi));
  m.querySelector("#esci-app").onclick = async () => { await sb.auth.signOut(); state.io = null; chiudi(); location.hash = "#/accesso"; };
  addEventListener("hashchange", chiudi, { once: true });
}

// --- Aggiornamento: tira giù per aggiornare, e aggiornamento da solo quando riapri l'app ---
const PAGINE_VIVE = new Set(["", "calendario", "chat", "spese", "liste", "settimana", "archivio", "cerchie", "albero", "agenda", "ricette", "profilo", "ricordo", "racconti"]);
const paginaAttuale = () => (location.hash.replace(/^#\/?/, "").split(/[/?]/)[0] || "");
const occupato = () => document.querySelector("#menu-app, #banner-cookie, input:focus, textarea:focus")
  || [...document.querySelectorAll("video")].some((v) => !v.paused)
  || [...document.body.children].some((e) => e.id !== "tira-giu" && e.id !== "app" && getComputedStyle(e).position === "fixed" && Number(getComputedStyle(e).zIndex) >= 40);

export async function aggiorna() {
  if (!state.io || !PAGINE_VIVE.has(paginaAttuale())) return;
  const y = scrollY;
  await render();
  scrollTo(0, Math.min(y, document.body.scrollHeight));
}

(function tiraGiu() {
  let inizio = null, dy = 0;
  const ind = document.createElement("div");
  ind.id = "tira-giu"; ind.setAttribute("aria-hidden", "true");
  ind.style.cssText = "position:fixed;top:0;left:50%;z-index:45;width:40px;height:40px;margin-left:-20px;border-radius:20px;background:#fff;box-shadow:0 4px 14px rgba(0,0,0,.18);display:grid;place-items:center;color:#C9832E;font-weight:800;transform:translateY(-60px);transition:transform .15s";
  ind.textContent = "↻";
  document.body.appendChild(ind);
  addEventListener("touchstart", (e) => {
    inizio = scrollY <= 0 && !occupato() && state.io && PAGINE_VIVE.has(paginaAttuale()) ? e.touches[0].clientY : null; dy = 0;
  }, { passive: true });
  addEventListener("touchmove", (e) => {
    if (inizio == null) return;
    dy = Math.max(0, e.touches[0].clientY - inizio);
    ind.style.transition = "none";
    ind.style.transform = `translateY(${Math.min(dy, 110) - 50}px) rotate(${dy * 3}deg)`;
  }, { passive: true });
  addEventListener("touchend", async () => {
    if (inizio == null) return;
    inizio = null; ind.style.transition = "transform .15s";
    if (dy > 80) {
      ind.style.transform = "translateY(20px)"; ind.animate([{ rotate: "0deg" }, { rotate: "360deg" }], { duration: 700, iterations: Infinity });
      await aggiorna();
      ind.getAnimations().forEach((a) => a.cancel());
    }
    ind.style.transform = "translateY(-60px)";
  });
})();

// riaperta l'app dopo almeno un minuto: si aggiorna da sola
let nascostaDa = null;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) { nascostaDa = Date.now(); return; }
  if (nascostaDa && Date.now() - nascostaDa > 60_000 && !occupato()) aggiorna();
  nascostaDa = null;
});

// --- Icona a tema: cambia da sola con il periodo (Natale, San Valentino, Pasqua, festa della mamma, estate, autunno) ---
function pasqua(anno) {   // algoritmo di Gauss/Meeus per la Pasqua gregoriana
  const a = anno % 19, b = Math.floor(anno / 100), c = anno % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mese = Math.floor((h + l - 7 * m + 114) / 31), giorno = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(anno, mese - 1, giorno);
}
export function temaDelPeriodo(oggi = new Date()) {
  const y = oggi.getFullYear(), md = (oggi.getMonth() + 1) * 100 + oggi.getDate();
  const tra = (da, a) => oggi >= da && oggi <= a;
  const giorni = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 23, 59);
  if (md >= 1115 || md <= 106) return "natale";   // con la promo di Natale già da metà novembre
  if (md >= 207 && md <= 214) return "sanvalentino";
  const p = pasqua(y); if (tra(giorni(p, -7), giorni(p, 1))) return "pasqua";
  const maggio1 = new Date(y, 4, 1), mamma = new Date(y, 4, 1 + ((7 - maggio1.getDay()) % 7) + 7);   // seconda domenica di maggio
  if (tra(giorni(mamma, -6), giorni(mamma, 0))) return "festamamma";
  if (md >= 621 && md <= 831) return "estate";
  if (md >= 1001 && md <= 1114) return "autunno";
  return null;
}
(function iconaATema() {
  const forzato = new URLSearchParams(location.search).get("tema");
  const tema = forzato ?? temaDelPeriodo();
  const link = document.querySelector('link[rel="icon"][type="image/svg+xml"]');
  if (link && tema) link.href = `icons/tema/${tema}.svg`;
})();

// --- Ancora+ : le funzioni in più. Basta che uno paghi e tutta la famiglia le ha. ---
export const VANTAGGI_PIU = [
  ["L'albero senza limiti", "il gratuito arriva a 10 persone per albero"],
  ["Gli alberi uniti", "la tua famiglia, quella dei tuoi genitori, quella dei suoceri"],
  ["Il libro intero della famiglia", "in PDF e stampato, con i QR per sentire le voci"],
  ["Il film dell'anno intero", "le foto e i video di tutti, montati con la musica (gratis: anteprima di 5 momenti)"],
  ["L'aiutante di casa", "cuoco, giardiniere e segretario, col nome che scegliete voi: dalla foto del frigo la cena, dalla foto di una pianta come curarla"],
  ["Il gioco della famiglia", "compri e costruisci sul tabellone con i vostri posti e le vostre carte (tombola, briscola e tressette sono gratis per tutti)"],
  ["Ricette, lettere e album senza limiti", "il ricettario di casa intero, le lettere da aprire più avanti per ognuno, un album per ogni evento"],
  ["200 GB per tutta la famiglia", "invece di 2 GB a testa"],
  ["Le storie e i consigli di ognuno", "sempre lì quando servono: «tu che avresti fatto?», «com'era quella volta?»"],
];
/** Mostra Ancora+ quando qualcuno tocca una funzione in più. */
export function passaPiu(motivo = "") {
  document.getElementById("foglio-piu")?.remove();
  const d = document.createElement("div");
  d.id = "foglio-piu";
  d.innerHTML = `<div data-chiudi style="position:fixed;inset:0;background:rgba(18,48,44,.5);z-index:55"></div>
    <div role="dialog" aria-label="Ancora+" style="position:fixed;left:0;right:0;bottom:0;z-index:56;max-height:88vh;overflow:auto;background:#FBF8F2;border-radius:24px 24px 0 0;padding:22px 20px calc(22px + env(safe-area-inset-bottom))">
      <div style="display:flex;align-items:center;gap:10px"><b style="font-family:Fraunces,serif;font-size:28px;flex:1">Ancora<span style="color:#C9832E">+</span></b>
        <button data-chiudi aria-label="Chiudi" style="width:40px;height:40px;border-radius:20px;border:0;background:#EFE8DC;font-size:18px">✕</button></div>
      ${motivo ? `<p style="margin:6px 0 4px;font-weight:700">${esc(motivo)}</p>` : ""}
      <p class="tenue" style="margin:4px 0 12px">Basta che uno in famiglia lo prenda, e lo hanno tutti.</p>
      ${VANTAGGI_PIU.map(([t, s]) => `<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid #EFE6D8">
        <span style="flex-shrink:0;width:22px;height:22px;border-radius:11px;background:#4D7356;color:#fff;display:grid;place-items:center;font-size:13px;font-weight:800">✓</span>
        <span><b>${t}</b><br><span class="tenue" style="font-size:14px">${s}</span></span></div>`).join("")}
      <a href="#/ancora-piu" style="display:block;margin-top:12px;font-weight:700">Vedi tutto quello che c'è in più →</a>
      <a class="btn ambra" href="#/piano" style="margin-top:12px">Passa ad Ancora+ · 99 € l'anno</a>
      <a class="btn chiaro" href="#/regala" style="margin-top:8px">Regala «La storia della tua famiglia» · 99 €</a>
    </div>`;
  document.body.appendChild(d);
  d.querySelectorAll("[data-chiudi], a").forEach((x) => x.addEventListener("click", () => d.remove()));
}
/** Errori che arrivano dal database quando serve Ancora+ */
export function seServePiu(error) {
  if (error?.message?.includes("ANCORA_PIU")) { passaPiu(error.message.replace(/^.*ANCORA_PIU:\s*/, "")); return true; }
  return false;
}

// pallino dei messaggi non letti sulla chat in basso (ogni 20 secondi, solo con l'app aperta)
async function aggiornaBadgeChat() {
  const b = document.getElementById("badge-chat");
  if (!b || !state.io || document.hidden) return;
  const { data: n } = await sb.rpc("chat_non_letti");
  b.hidden = !n; b.textContent = n > 99 ? "99+" : String(n ?? "");
  // numerino sull'icona dell'app (telefono): i messaggi non letti; a zero si toglie
  try { n ? await navigator.setAppBadge?.(n) : await navigator.clearAppBadge?.(); } catch { /* non supportato */ }
}
setInterval(aggiornaBadgeChat, 20_000);
addEventListener("hashchange", () => setTimeout(aggiornaBadgeChat, 800));
setTimeout(aggiornaBadgeChat, 2500);

/** Il "cos'è Ancora" che va in ogni invito: tutto quello che c'è, in poche righe da WhatsApp. */
export const ANCORA_IN_BREVE = `*Ancora* è la prima app social privata della famiglia e dei gruppi: solo voi, niente pubblicità, niente estranei.
📸 Foto, video e storie solo tra voi
💬 Chat del gruppo e messaggi a due
🎙️ Le voci e i racconti dei nonni, per sempre
🌳 L'albero della famiglia
🍝 Il ricettario di casa
📅 Calendario, compleanni, liste della spesa e spese di casa
🎲 Tombola, briscola, tressette, biliardo e calciobalilla, anche da case diverse
✨ Con Ancora+: l'aiutante di casa (cucina, piante, compiti, viaggi), il libro stampato e il film della vostra famiglia
È gratis, si entra in un minuto.`;
export const ANCORA_UNA_RIGA = "📲 Ancora è la prima app social privata della famiglia e dei gruppi: ti iscrivi gratis in un minuto.";
// le poche righe che raccontano Ancora in un invito: diverse per ogni tipo di gruppo, senza elenchi, per incuriosire
export const ANCORA_INFO_PER = {
  famiglia: "Solo noi, niente pubblicità né estranei: le foto e i video di tutti in un posto solo, le voci dei nonni che restano per sempre, le ricette di casa… e la sera ci si sfida pure, anche da case diverse. Guardala, poi mi dici 😉",
  casa: "Solo chi vive qui: le spese da dividere, la lista della spesa, il calendario di casa e la nostra chat… e quando c'è da staccare, si gioca insieme anche ognuno dalla sua stanza 😄",
  coppia: "Solo noi due: le nostre foto, i nostri ricordi, le date importanti che non dimentichiamo più… e qualche sfida per vedere chi vince 😏",
  amici: "Solo noi, niente pubblicità né estranei: la nostra chat, le foto delle serate che non finiscono in giro… e la sera ci si sfida parlando a voce, ognuno da casa sua. Provala e mi dici 😏",
  gruppo: "Solo noi del gruppo, niente pubblicità né estranei: chat, foto e video, il calendario per organizzarci… e qualche sorpresa per stare insieme anche a distanza 😉",
};
export const ANCORA_INFO = ANCORA_INFO_PER.famiglia;
export const ANCORA_INFO_AMICI = ANCORA_INFO_PER.amici;
export const SALVALA = "📌 Quando la apri, salvala sulla schermata Home del telefono: così ti arrivano gli inviti e i messaggi.";
export const saluto = () => `Ciao! 👋 Sono ${state.io?.soprannome || state.io?.nome || "io"}${state.io?.cognome && !state.io?.soprannome ? ` ${state.io.cognome}` : ""}.`;

/** "Chiedilo in famiglia": chi è gratis (spesso i ragazzi che giocano) manda a mamma, papà o ai nonni i motivi veri per prendere Ancora+. */
export async function chiediPiu() {
  const { data: codice } = await sb.rpc("mio_codice_amico");
  const link = `${location.origin}${location.pathname}#/iscriviti?amico=${codice ?? ""}&torna=${encodeURIComponent("#/ancora-piu")}&utm_source=chiedi_piu`;
  const msg = `Su Ancora ci giochiamo già: tombola, carte, biliardo, calciobalilla. Ma Ancora+ servirebbe a tutta la famiglia, e basta che lo prenda uno per averlo tutti 🙏

✨ Con Ancora+ (99 € l'anno per tutta la famiglia, meno di 9 € al mese):
📸 Le foto e i video di casa al sicuro, 200 GB per tutti, senza pubblicità e senza estranei
🎙️ Le voci e le storie dei nonni conservate per sempre, con le domande su misura per ognuno
📖 Il libro della famiglia, mese per mese, con i QR per riascoltare le voci
🎬 Il film del nostro anno, con le nostre foto e la musica
🍝 L'aiutante di casa: fotografi il frigo e ti dice cosa cucinare, il menu della settimana, aiuto coi compiti, le piante, i viaggi
🌳 L'albero di famiglia senza limiti e il ricettario di casa senza limiti
🏠 Il gioco della famiglia, col tabellone dei nostri posti

Guarda qui 👉 ${link}`;
  try { if (navigator.share) { await navigator.share({ title: "Ancora+ per la famiglia", text: msg }); return; } } catch { return; }
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
}
/** Il riquadro piccolo che chi è gratis vede alla fine di una partita. */
export function invitoPiu() {
  if (state.piu) return "";
  return `<div class="card" style="margin:12px 16px;background:#FFF6E8;border-color:#F0D5A8;color:#12302C;text-align:left">
    <b style="font-size:17px">✨ Ancora+ per tutta la famiglia</b>
    <p style="margin:4px 0 10px;font-size:15px;line-height:1.45">Le voci dei nonni per sempre, il libro e il film della famiglia, l'aiutante di casa per cucina e compiti, 200 GB per le foto di tutti. Basta che lo prenda uno.</p>
    <div style="display:flex;gap:8px"><button class="btn ambra" data-chiedi-piu style="margin:0;flex:1">📲 Chiedilo in famiglia</button><a class="btn chiaro" href="#/ancora-piu" style="margin:0;flex:1">Scopri</a></div></div>`;
}
document.addEventListener("click", (e) => { if (e.target.closest?.("[data-chiedi-piu]")) { e.preventDefault(); chiediPiu(); } });

/** Invito a un tavolo per chi non è del gruppo (anche chi non è su Ancora): entra SOLO nella partita o nella tombola,
 *  non nella famiglia. Il link porta il codice di chi invita (premi) e, dopo l'iscrizione o l'accesso, siede al tavolo.
 *  Senza "tipo" (il gioco della famiglia) resta l'invito nel gruppo. */
export async function invitaAlGioco({ tipo = null, id = null, cerchiaId, torna, testo, titolo = "Ancora", perche = "" }) {
  let link;
  if (tipo) {
    const [{ data: codice, error }, { data: amico }] = await Promise.all([sb.rpc("ospite_codice", { p_tipo: tipo, p_id: id }), sb.rpc("mio_codice_amico")]);
    if (error) { alert("Invito non creato: " + error.message); return; }
    link = `${location.origin}${location.pathname}#/iscriviti?amico=${amico ?? ""}&torna=${encodeURIComponent(`#/tavolo?t=${codice}`)}${perche ? `&perche=${encodeURIComponent(perche)}` : ""}&da=${encodeURIComponent(state.io?.soprannome || state.io?.nome || "")}&utm_source=invito_gioco`;
  } else {
    const { data: codice, error } = await sb.rpc("invito_di_gruppo", { p_cerchia: cerchiaId, p_persone: 20 });
    if (error) { alert("Invito non creato: " + error.message); return; }
    link = `${location.origin}${location.pathname}#/iscriviti?invito=${codice}&torna=${encodeURIComponent(torna)}${perche ? `&perche=${encodeURIComponent(perche)}` : ""}`;
  }
  const msg = `${saluto()}\n${testo}\n\n👉 ${link}\n\n${ANCORA_UNA_RIGA}\n${SALVALA}`;
  try { if (navigator.share) { await navigator.share({ title: titolo, text: msg }); return; } } catch { return; }
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
}

/** Crea un invito per una famiglia/gruppo e apre la condivisione (WhatsApp o il menu del telefono). */
export async function invitaInCerchia(cerchiaId) {
  const c = state.cerchie.find((x) => x.id === cerchiaId);
  const { data: attivi } = await sb.rpc("inviti_di_gruppo_miei", { p_cerchia: cerchiaId });
  // un solo foglio: quante persone? → manda. Sotto, i link già mandati con quanti sono entrati.
  const f = document.createElement("div");
  f.style.cssText = "position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.4);display:flex;align-items:flex-end";
  f.innerHTML = `<div style="background:#FBF8F2;width:100%;max-width:720px;margin:0 auto;border-radius:22px 22px 0 0;padding:20px 16px calc(20px + env(safe-area-inset-bottom));max-height:90vh;overflow-y:auto">
    <b style="font-size:20px;display:block">Invita in ${esc(c?.nome ?? "Ancora")}</b>
    <p class="tenue" style="margin:4px 0 12px">Quante persone devono entrare con questo link? Lo mandi una volta (anche nel gruppo WhatsApp) e ognuno entra col suo telefono.</p>
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px">${[1, 2, 5, 10, 20, 30].map((n) => `<button class="btn ${n === 5 ? "ambra" : "chiaro"}" data-n="${n}" style="margin:0;padding:0;min-height:52px;font-size:18px">${n}</button>`).join("")}</div>
    <p class="tenue" style="font-size:13px;margin:8px 0 0">1 = invito personale. Il link vale 14 giorni.</p>
    ${(attivi ?? []).length ? `<b style="display:block;margin:16px 0 6px">Link già mandati</b>${attivi.map((a) => `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid var(--bordo)">
      <span style="flex:1">🔗 Entrati <b>${a.usi} su ${a.max_usi}</b> <small class="tenue">· fino al ${new Date(a.scade_il).toLocaleDateString("it-IT")}</small></span>
      ${a.usi < a.max_usi ? `<button class="chip" data-rimanda="${a.codice}" style="margin:0">Rimanda</button><button class="chip" data-chiudi="${a.codice}" style="margin:0">Chiudi</button>` : `<span class="tenue">completo</span>`}</div>`).join("")}` : ""}
    <button class="btn chiaro" data-annulla style="margin-top:14px">Annulla</button></div>`;
  document.body.appendChild(f);
  const manda = async (codice, persone) => {
    const link = `${location.origin}${location.pathname}#/iscriviti?invito=${codice}`;
    const voi = persone > 1;
    const testo = `${saluto()}\nHo trovato un'app che fa proprio al caso nostro: *Ancora*, la prima app social privata della famiglia e dei gruppi.\n\n${ANCORA_INFO_PER[c?.tipo] ?? ANCORA_INFO_PER.gruppo}\n\n${voi ? "Vi ho" : "Ti ho"} già preparato un posto in "${c?.nome ?? "Ancora"}": ${voi ? "iscrivetevi da qui, ognuno col suo telefono" : "iscriviti da qui"}, è gratis 👇\n${link}\n\n📌 Quando ${voi ? "la aprite, salvatela" : "la apri, salvala"} sulla schermata Home del telefono: così ${voi ? "vi arrivano" : "ti arrivano"} gli inviti e i messaggi.`;
    try { if (navigator.share) { await navigator.share({ title: c?.nome ?? "Ancora", text: testo }); return; } } catch { return; }
    window.open(`https://wa.me/?text=${encodeURIComponent(testo)}`, "_blank");
  };
  f.onclick = async (e) => {
    const b = e.target.closest("button");
    if (e.target === f || b?.dataset.annulla != null) { f.remove(); return; }
    if (b?.dataset.n) {
      const n = Number(b.dataset.n);
      let codice;
      if (n === 1) {
        const { data: inv, error } = await sb.from("inviti").insert({ invitato_da: state.io.id, cerchia_id: cerchiaId }).select("codice").single();
        if (error) { alert("Invito non creato: " + error.message); return; } codice = inv.codice;
      } else {
        const { data, error } = await sb.rpc("invito_di_gruppo", { p_cerchia: cerchiaId, p_persone: n });
        if (error) { alert("Invito non creato: " + error.message); return; } codice = data;
      }
      f.remove(); manda(codice, n);
    } else if (b?.dataset.rimanda) { f.remove(); manda(b.dataset.rimanda, 2); }
    else if (b?.dataset.chiudi) {
      if (!confirm("Chiudere questo link? Chi non è ancora entrato non potrà più usarlo.")) return;
      await sb.rpc("invito_chiudi", { p_codice: b.dataset.chiudi }); f.remove(); invitaInCerchia(cerchiaId);
    }
  };
}
