// "Chiedi a…": parli con una persona della famiglia; risponde con le sue parole e, se l'ha fatta ricreare, con la sua voce.
// Lo attiva la persona stessa dal suo profilo e sceglie chi può chiedere.
import { sb, state, $app, esc, nomeDi, avatar, urlMediaMolti, ICONE } from "../app.js";
import { SUPABASE_URL } from "../config.js";

export default async function ({ id }) {
  const [{ data: p }, { data: posso }] = await Promise.all([
    sb.from("persone").select("id, nome, soprannome, foto_path").eq("id", id).maybeSingle(),
    sb.rpc("posso_chiedere", { p_persona: id })]);
  if (!p || !posso) { $app().innerHTML = `<p class="pad">Non è attivo per te.</p>`; return; }
  const { data: storia } = await sb.from("chiedi_messaggi").select("id, domanda, risposta, audio_path, creato_il")
    .eq("persona_id", id).order("creato_il").limit(60);
  const url = await urlMediaMolti([p.foto_path, ...(storia ?? []).map((m) => m.audio_path)].filter(Boolean));
  const nome = nomeDi(p);

  const bolla = (m, audio) => `
    <div style="align-self:flex-end;max-width:85%;background:var(--notte);color:#fff;border-radius:18px 18px 4px 18px;padding:10px 14px">${esc(m.domanda)}</div>
    <div style="align-self:flex-start;max-width:90%;display:flex;gap:8px;align-items:flex-end">
      ${avatar(p, 30, p.foto_path ? url[p.foto_path] : null)}
      <div style="background:#FBF4E6;border-radius:18px 18px 18px 4px;padding:12px 14px;font-family:Fraunces,serif;font-size:18px;line-height:1.4">
        ${esc(m.risposta ?? "")}
        ${audio ? `<audio controls src="${esc(audio)}" style="display:block;width:100%;margin-top:8px"></audio>` : ""}</div></div>`;

  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/profilo/${p.id}" aria-label="Indietro">${ICONE.indietro}</a>
      <b style="flex:1;font-family:Fraunces,serif;font-size:22px">Chiedi a ${esc(nome)}</b></header>
    <div class="pad" style="padding-bottom:140px">
      <div style="text-align:center;margin:4px 0 18px">${avatar(p, 84, p.foto_path ? url[p.foto_path] : null)}
        <p class="tenue" style="margin:10px 0 0;font-size:14px">Risponde con le sue parole, la sua voce e il suo modo di pensare, da tutto quello che ha raccontato.</p></div>
      <div id="dialogo" style="display:flex;flex-direction:column;gap:12px">
        ${(storia ?? []).map((m) => bolla(m, m.audio_path ? url[m.audio_path] : null)).join("")}</div>
      <p id="pensa" class="tenue" hidden style="margin-top:14px">${esc(nome)} ci sta pensando…</p>
    </div>
    <form id="chiedi" style="position:fixed;left:0;right:0;bottom:92px;padding:10px 14px;background:var(--carta);display:flex;gap:8px;border-top:1px solid rgba(0,0,0,.06)">
      <label class="visually-hidden" for="q">La tua domanda</label>
      <textarea id="q" rows="1" placeholder="Tu che faresti al posto mio?" style="flex:1;resize:none;min-height:46px" required maxlength="1500"></textarea>
      <button class="btn ambra" style="width:auto;min-height:46px;padding:0 18px">Chiedi</button></form>`;
  scrollTo(0, document.body.scrollHeight);

  document.getElementById("chiedi").onsubmit = async (e) => {
    e.preventDefault();
    const q = document.getElementById("q"), b = e.target.querySelector("button"), pensa = document.getElementById("pensa");
    const domanda = q.value.trim(); if (!domanda) return;
    b.disabled = true; pensa.hidden = false; scrollTo(0, document.body.scrollHeight);
    try {
      const { data: { session } } = await sb.auth.getSession();
      const r = await fetch(`${SUPABASE_URL}/functions/v1/chiedi`, { method: "POST",
        headers: { authorization: `Bearer ${session?.access_token}`, "content-type": "application/json" },
        body: JSON.stringify({ persona: p.id, domanda }) });
      const j = await r.json();
      if (!r.ok) { alert(j.errore ?? "Non è riuscito a rispondere."); return; }
      document.getElementById("dialogo").insertAdjacentHTML("beforeend", bolla({ domanda, risposta: j.risposta }, j.audio));
      q.value = "";
      const a = [...document.querySelectorAll("#dialogo audio")].pop();
      if (j.audio && a) a.play().catch(() => {});
      scrollTo(0, document.body.scrollHeight);
    } catch { alert("Connessione assente. Riprova."); }
    finally { b.disabled = false; pensa.hidden = true; }
  };
}
