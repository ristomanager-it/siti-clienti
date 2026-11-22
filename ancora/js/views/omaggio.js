// "Ancora in omaggio": chi riceve un codice (#/omaggio/ANCORA-XXXX-XXXX) crea l'account e attiva 12 mesi di Ancora+.
// Chi ha già un account e ha fatto l'accesso riscatta direttamente.
import { sb, state, $app, esc } from "../app.js";
import { SUPABASE_URL } from "../config.js";

const API = `${SUPABASE_URL}/functions/v1/omaggio`;

export default async function ({ id, params }) {
  const codice = (id ?? params?.c ?? "").toUpperCase();
  const { data: { user } } = await sb.auth.getUser();
  const stato = codice ? await fetch(`${API}?codice=${encodeURIComponent(codice)}`).then((r) => r.json()).catch(() => ({})) : {};
  const { data: regalo } = codice ? await sb.rpc("regalo_da_codice", { p_codice: codice }) : { data: null };

  $app().innerHTML = `
    <div class="pad" style="padding-top:48px"><span class="logo" style="font-size:40px">Ancora</span>
      <div class="tenue" style="font-weight:700;margin:-4px 0 18px">Il cloud dei tuoi ricordi</div>
      ${regalo ? `<span class="chip on" style="margin:0 0 12px;background:#B3402F">🎁 Un regalo da ${esc(regalo.da)}</span>
      <h1 style="font-size:28px;line-height:1.2">${esc(regalo.a)}, questa è la storia della tua famiglia.</h1>
      ${regalo.messaggio ? `<p style="font-family:Fraunces,serif;font-size:20px;line-height:1.4;background:var(--ambra-chiaro);border-radius:16px;padding:14px 16px">«${esc(regalo.messaggio)}»<br><span style="font-family:Manrope,sans-serif;font-size:15px">— ${esc(regalo.da)}</span></p>` : ""}
      <p style="font-size:16px">Un anno per raccontarla insieme: crea la tua famiglia, invita chi vuoi, metteteci foto, storie e voci. A fine anno diventa un libro da tenere in mano, e un film da guardare insieme.</p>`
      : `<span class="chip on" style="margin:0 0 12px">🎁 In omaggio</span>
      <h1 style="font-size:28px;line-height:1.2">Un anno di Ancora, per te e la tua famiglia.</h1>
      <p style="font-size:16px">Le voci, le storie, le foto, i video e le ricette di famiglia, al sicuro e solo per voi. Con l'albero genealogico e le domande della settimana per tutta la famiglia.</p>`}</div>
    <form id="f" class="card">
      <label for="cod" style="margin-top:0">Codice omaggio</label>
      <input id="cod" value="${esc(codice)}" placeholder="ANCORA-XXXX-XXXX" autocapitalize="characters" required>
      <p id="stato" class="tenue" role="status">${stato.valido ? (regalo ? "✓ Regalo valido: un anno di Ancora+ e il libro di fine anno." : "✓ Codice valido: 12 mesi di Ancora+.") : stato.errore ? `<span class="errore">${esc(stato.errore)}</span>` : ""}</p>
      ${user ? `<button class="btn">${regalo ? "Attiva il regalo" : "Attiva l'omaggio"}</button>` : `
        <label for="nome">Il tuo nome</label><input id="nome" autocomplete="given-name" required>
        <label for="em">Email</label><input id="em" type="email" autocomplete="username" required>
        <label for="pw">Scegli una password</label><input id="pw" type="password" autocomplete="new-password" minlength="8" required>
        <p class="tenue">Almeno 8 caratteri. Ti servono per entrare da telefono e computer.</p>
        <label style="display:flex;gap:10px;align-items:flex-start;font-weight:600;margin:8px 0 12px"><input type="checkbox" id="termini" required style="width:22px;height:22px;flex-shrink:0">
          <span>Accetto le <a href="#/condizioni" target="_blank">condizioni</a> e l'<a href="#/privacy" target="_blank">informativa privacy</a>.</span></label>
        <button class="btn">${regalo ? "Crea la mia famiglia" : "Attiva e entra"}</button>
        <p style="text-align:center"><a href="#/accesso">Ho già un account: entro e poi attivo</a></p>`}
      <p id="esito" role="status"></p>
    </form>`;

  document.getElementById("f").onsubmit = async (e) => {
    e.preventDefault();
    const esito = document.getElementById("esito");
    const btn = e.target.querySelector("button"); btn.disabled = true;
    const cod = document.getElementById("cod").value.trim().toUpperCase();
    esito.textContent = "Attivazione in corso…";
    if (user) {
      const { data, error } = await sb.rpc("riscatta_omaggio", { p_codice: cod });
      if (error || !data?.ok) { esito.innerHTML = `<span class="errore">${esc(data?.errore ?? "Non attivato.")}</span>`; btn.disabled = false; return; }
      location.replace("#/?nuova=1"); location.reload(); return;
    }
    const email = document.getElementById("em").value.trim(), password = document.getElementById("pw").value;
    const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codice: cod, nome: document.getElementById("nome").value, email, password, termini: document.getElementById("termini").checked }) }).then((x) => x.json()).catch(() => ({}));
    if (!r.ok) {
      esito.innerHTML = `<span class="errore">${esc(r.errore ?? "Non attivato.")}</span>${r.gia_registrato ? ` <a href="#/accesso">Entra</a>` : ""}`;
      btn.disabled = false; return;
    }
    await sb.auth.signInWithPassword({ email, password });
    location.replace("#/?nuova=1"); location.reload();   // la famiglia appena nata: foto, nome, inviti
  };
}
