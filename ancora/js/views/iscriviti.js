// "Crea il tuo account gratis": nome, email, password. Da un amico (?amico=CODICE) o da un invito in famiglia (?invito=CODICE).
import { sb, $app, esc } from "../app.js";
import { SUPABASE_URL } from "../config.js";

export default async function ({ params } = {}) {
  const invito = params?.invito ?? "", amico = params?.amico ?? "";
  $app().innerHTML = `
    <div class="pad" style="padding-top:48px"><span class="logo" style="font-size:40px">Ancora</span>
      <div class="tenue" style="font-weight:700;margin:-4px 0 18px">Il cloud dei tuoi ricordi</div>
      <h1 style="font-size:28px;line-height:1.2">${invito ? "Ti aspettano in famiglia." : "Crea il tuo account gratis."}</h1>
      <p style="font-size:16px;margin:0">${invito ? "Crea il tuo account e sei dentro." : "La tua famiglia, i tuoi gruppi, i tuoi ricordi. Gratis, senza carta di credito."}</p></div>
    <form id="f" class="card">
      <div class="riga" style="gap:8px">
        <div style="flex:1"><label for="nome" style="margin-top:0">Nome</label><input id="nome" required maxlength="40" autocomplete="given-name"></div>
        <div style="flex:1"><label for="cogn" style="margin-top:0">Cognome</label><input id="cogn" maxlength="40" autocomplete="family-name"></div></div>
      <label for="em">Email</label><input id="em" type="email" required autocomplete="username">
      <label for="pw">Scegli una password</label><input id="pw" type="password" minlength="8" required autocomplete="new-password">
      <label style="display:flex;gap:10px;align-items:flex-start;font-weight:600;margin:14px 0 12px"><input type="checkbox" id="termini" required style="width:22px;height:22px;flex-shrink:0">
        <span>Accetto le <a href="#/condizioni-uso" target="_blank">condizioni d'uso</a> e l'<a href="#/privacy" target="_blank">informativa privacy</a>.</span></label>
      <button class="btn ambra">Crea il mio account</button>
      <p id="esito" role="status"></p>
      <p style="text-align:center;margin-bottom:0"><a href="#/accesso${invito ? `?invito=${esc(invito)}` : ""}">Ho già un account: entro</a></p>
    </form>`;

  document.getElementById("f").onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button"), esito = document.getElementById("esito");
    btn.disabled = true; esito.textContent = "Un attimo…";
    const v = (id) => document.getElementById(id).value.trim();
    const email = v("em"), password = document.getElementById("pw").value;
    const r = await fetch(`${SUPABASE_URL}/functions/v1/iscrizione`, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: v("nome"), cognome: v("cogn"), email, password, termini: document.getElementById("termini").checked, amico, invito }) })
      .then((x) => x.json()).catch(() => ({}));
    if (!r.ok) {
      esito.innerHTML = `<span class="errore">${esc(r.errore ?? "Non è andata. Riprova.")}</span>${r.gia_registrato ? ` <a href="#/accesso${invito ? `?invito=${esc(invito)}` : ""}">Entra</a>` : ""}`;
      btn.disabled = false; return;
    }
    await sb.auth.signInWithPassword({ email, password });
    location.replace(invito ? `#/?invito=${encodeURIComponent(invito)}` : "#/"); location.reload();
  };
}
