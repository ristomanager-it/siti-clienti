// La voce al tavolo: chi preme "Parla" entra in una chiamata a voce con gli altri del tavolo (WebRTC, da telefono a telefono).
// I messaggi per collegarsi passano dal canale dal vivo di Supabase; l'audio va diretto tra i telefoni, non passa da noi.
// Un pulsantino fisso sopra la pagina: resta anche quando il tavolo si ridisegna, e si chiude quando si esce dal gioco.
import { sb, state } from "../app.js";

const ICE = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun.cloudflare.com:3478"] }];
let attuale = null;

export function voceAlTavolo(stanza, { alto = false } = {}) {
  if (!stanza || !window.RTCPeerConnection || !navigator.mediaDevices?.getUserMedia) return;
  if (attuale?.stanza === stanza) return;
  attuale?.chiudi();

  const io = Math.random().toString(36).slice(2, 10);
  const nome = state.io?.soprannome || state.io?.nome || "Qualcuno";
  const peer = new Map();          // id → { pc, nome, audio }
  let mic = null, canale = null, dentro = false, muto = false;

  const pill = document.createElement("div");
  pill.style.cssText = `position:fixed;${alto ? "top:58px" : "bottom:calc(92px + env(safe-area-inset-bottom))"};left:12px;z-index:60;display:flex;gap:6px;align-items:center;font-family:inherit`;
  document.body.appendChild(pill);
  const audioBox = document.createElement("div"); audioBox.hidden = true; document.body.appendChild(audioBox);

  function disegna(msg = "") {
    const n = peer.size;
    pill.innerHTML = !dentro
      ? `<button data-v="entra" style="border:0;border-radius:999px;padding:10px 16px;background:#12302C;color:#FBF3E2;font-weight:800;font-size:15px;box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer">🎙️ Parla${msg ? ` · ${msg}` : ""}</button>`
      : `<span style="border-radius:999px;padding:10px 14px;background:${muto ? "#5b6b66" : "#C8102E"};color:#fff;font-weight:800;font-size:14px;box-shadow:0 4px 14px rgba(0,0,0,.25)">${muto ? "🔇 Muto" : "🔴 In voce"} · ${n ? `con ${[...peer.values()].map((p) => p.nome).slice(0, 3).join(", ")}${n > 3 ? ` e altri ${n - 3}` : ""}` : "aspetto gli altri…"}</span>
         <button data-v="muto" style="border:0;border-radius:999px;width:42px;height:42px;background:#fff;font-size:18px;box-shadow:0 4px 14px rgba(0,0,0,.2);cursor:pointer" aria-label="${muto ? "Riattiva il microfono" : "Muto"}">${muto ? "🎙️" : "🔇"}</button>
         <button data-v="esci" style="border:0;border-radius:999px;width:42px;height:42px;background:#fff;font-size:18px;box-shadow:0 4px 14px rgba(0,0,0,.2);cursor:pointer" aria-label="Esci dalla voce">✕</button>`;
  }
  pill.onclick = async (e) => {
    const v = e.target.closest("[data-v]")?.dataset.v;
    if (v === "entra") entra();
    if (v === "muto") { muto = !muto; mic?.getAudioTracks().forEach((t) => { t.enabled = !muto; }); disegna(); }
    if (v === "esci") esci();
  };

  const manda = (event, payload) => canale?.send({ type: "broadcast", event, payload: { ...payload, da: io } });

  function nuovoPeer(id, nomeAltro) {
    if (peer.has(id)) return peer.get(id);
    const pc = new RTCPeerConnection({ iceServers: ICE });
    mic.getTracks().forEach((t) => pc.addTrack(t, mic));
    const audio = document.createElement("audio"); audio.autoplay = true; audio.setAttribute("playsinline", ""); audioBox.appendChild(audio);
    pc.ontrack = (ev) => { audio.srcObject = ev.streams[0]; audio.play?.().catch(() => {}); };
    pc.onicecandidate = (ev) => { if (ev.candidate) manda("ice", { a: id, c: ev.candidate.toJSON() }); };
    pc.onconnectionstatechange = () => { if (["failed", "closed"].includes(pc.connectionState)) togli(id); };
    const p = { pc, nome: nomeAltro ?? "…", audio, coda: [] };
    peer.set(id, p); disegna();
    return p;
  }
  function togli(id) {
    const p = peer.get(id); if (!p) return;
    try { p.pc.close(); } catch { /* già chiusa */ }
    p.audio.remove(); peer.delete(id); disegna();
  }

  async function entra() {
    disegna("un attimo…");
    try { mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); }
    catch { alert("Per parlare serve il permesso del microfono: consentilo nelle impostazioni del telefono per questo sito."); disegna(); return; }
    dentro = true; disegna();
    canale = sb.channel(`voce-${stanza}`, { config: { broadcast: { self: false } } });
    // chi c'era già chiama il nuovo arrivato; il nuovo risponde (così due non si chiamano a vicenda)
    canale.on("broadcast", { event: "ciao" }, async ({ payload: m }) => {
      if (!dentro || m.da === io) return;
      const p = nuovoPeer(m.da, m.nome);
      const offerta = await p.pc.createOffer(); await p.pc.setLocalDescription(offerta);
      manda("offerta", { a: m.da, sdp: p.pc.localDescription, nome });
    });
    canale.on("broadcast", { event: "offerta" }, async ({ payload: m }) => {
      if (!dentro || m.a !== io) return;
      const p = nuovoPeer(m.da, m.nome);
      await p.pc.setRemoteDescription(m.sdp);
      for (const c of p.coda.splice(0)) await p.pc.addIceCandidate(c).catch(() => {});
      const risposta = await p.pc.createAnswer(); await p.pc.setLocalDescription(risposta);
      manda("risposta", { a: m.da, sdp: p.pc.localDescription });
    });
    canale.on("broadcast", { event: "risposta" }, async ({ payload: m }) => {
      if (m.a !== io) return; const p = peer.get(m.da); if (!p) return;
      await p.pc.setRemoteDescription(m.sdp);
      for (const c of p.coda.splice(0)) await p.pc.addIceCandidate(c).catch(() => {});
    });
    canale.on("broadcast", { event: "ice" }, async ({ payload: m }) => {
      if (m.a !== io) return; const p = peer.get(m.da); if (!p) return;
      if (p.pc.remoteDescription) await p.pc.addIceCandidate(m.c).catch(() => {}); else p.coda.push(m.c);
    });
    canale.on("broadcast", { event: "esco" }, ({ payload: m }) => togli(m.da));
    canale.subscribe((stato) => { if (stato === "SUBSCRIBED") manda("ciao", { nome }); });
  }
  function esci() {
    if (dentro) manda("esco", {});
    dentro = false; muto = false;
    for (const id of [...peer.keys()]) togli(id);
    mic?.getTracks().forEach((t) => t.stop()); mic = null;
    if (canale) { sb.removeChannel(canale); canale = null; }
    disegna();
  }
  function chiudi() {
    esci(); pill.remove(); audioBox.remove();
    removeEventListener("hashchange", controlla); removeEventListener("pagehide", esci);
    if (attuale?.stanza === stanza) attuale = null;
  }
  const controlla = () => { if (!location.hash.includes(stanza)) chiudi(); };
  addEventListener("hashchange", controlla); addEventListener("pagehide", esci);
  disegna();
  attuale = { stanza, chiudi };
}
