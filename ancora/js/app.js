// Ancora — web app (SPA vanilla, router a hash come Ristoflow)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const state = { io: null, famiglia: null, cerchie: [] };

const ROTTE = {
  "": () => import("./views/home.js"),
  "benvenuto": () => import("./views/home.js"),
  "racconti": () => import("./views/racconti.js"),
  "racconta": () => import("./views/racconta.js"),
  "ricordo": () => import("./views/ricordo.js"),
  "profilo": () => import("./views/profilo.js"),
  "diario": () => import("./views/diario.js"),
  "cerchie": () => import("./views/cerchie.js"),
  "regala": () => import("./views/regala.js"),
  "accesso": () => import("./views/accesso.js"),
  "perche": () => import("./views/perche.js"),
  "albero": () => import("./views/albero.js"),
  "agenda": () => import("./views/agenda.js"),
  "piano": () => import("./views/piano.js"),
  "prova": () => import("./views/prova.js"),
  "rispondi": () => import("./views/prova.js"),
  "ascolta": () => import("./views/prova.js"),
  "biglietto": () => import("./views/biglietto.js"),
  "ricette": () => import("./views/ricette.js"),
};
const PUBBLICHE = new Set(["accesso", "regala", "perche", "prova", "rispondi", "ascolta", "biglietto"]);

export const $app = () => document.getElementById("app");
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const iniziali = (n) => (n ?? "?").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
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
export const avatar = (p, size = 38, fotoUrl = null) =>
  `<span class="av" style="width:${size}px;height:${size}px;background-color:${colore(p?.id)};${fotoUrl ? `background-image:url('${fotoUrl}')` : ""}">${fotoUrl ? "" : esc(iniziali(nomeDi(p)))}</span>`;
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
  const { data: cerchie } = await sb.from("cerchie").select("id, nome, tipo, proprietario_id, moduli").order("creata_il");
  state.io = io; state.famiglia = fm; state.cerchie = cerchie ?? [];
  sb.from("persone").update({ ultimo_accesso_app: new Date().toISOString() }).eq("id", io.id).then(() => {});
  return io;
}

async function render() {
  const [rotta, query] = location.hash.replace(/^#\/?/, "").split("?");
  const nome = rotta.split("/")[0];
  const params = Object.fromEntries(new URLSearchParams(query ?? ""));
  const id = rotta.split("/")[1];

  if (!PUBBLICHE.has(nome) && !state.io && !(await caricaIo())) {
    location.hash = "#/accesso"; return;
  }
  const barra = document.getElementById("barra");
  barra.hidden = PUBBLICHE.has(nome) || state.io?.modalita === "semplice";
  barra.querySelectorAll("a").forEach((a) => a.classList.toggle("attivo", a.dataset.r === nome));

  const carica = ROTTE[nome] ?? ROTTE[""];
  const vista = await carica();
  $app().innerHTML = "";
  try { await vista.default({ id, params }); }
  catch (e) { console.error(e); $app().innerHTML = `<p class="errore">Qualcosa non ha funzionato. Riprova tra poco.</p>`; }
  window.scrollTo(0, 0);
}

sb.auth.onAuthStateChange((evento) => { if (evento === "SIGNED_IN" && !state.io) render(); });
window.addEventListener("hashchange", render);
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
render();
