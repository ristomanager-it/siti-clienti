// Accesso: si inserisce il numero, il link arriva su WhatsApp. Niente password.
import { $app, esc } from "../app.js";
import { SUPABASE_URL } from "../config.js";

export default async function ({ params }) {
  const invito = params?.invito ?? null;
  $app().innerHTML = `
    <div class="pad" style="padding-top:64px"><span class="logo" style="font-size:44px">Ancora</span>
    <p style="font-family:Fraunces,serif;font-size:22px;line-height:1.3;color:var(--notte)">I ricordi della tua famiglia, con la voce di chi li racconta.</p></div>
    <form id="f" class="card">
      <label for="tel">Il tuo numero di telefono</label>
      <input id="tel" type="tel" inputmode="tel" placeholder="+39 333 123 4567" required autocomplete="tel">
      <p class="tenue">Ti mandiamo il link di accesso su WhatsApp.</p>
      <button class="btn" type="submit">Ricevi il link</button>
      <p id="esito" role="status"></p>
    </form>
    <div class="pad"><a class="btn chiaro" href="#/regala">Regala Ancora</a></div>`;

  document.getElementById("f").onsubmit = async (e) => {
    e.preventDefault();
    let tel = document.getElementById("tel").value.replace(/[\s.-]/g, "");
    if (!tel.startsWith("+")) tel = "+39" + tel.replace(/^0039/, "");
    const esito = document.getElementById("esito");
    esito.textContent = "Invio in corso…";
    const res = await fetch(`${SUPABASE_URL}/functions/v1/accesso-link`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ telefono: tel, codice_invito: invito }),
    });
    esito.innerHTML = res.ok
      ? "Fatto! Apri WhatsApp e tocca il link. Se si apre dentro WhatsApp, scegli <b>Apri nel browser</b>."
      : `<span class="errore">${esc(res.status === 404 ? "Questo numero non è ancora su Ancora: chiedi un invito a un familiare." : "Non siamo riusciti a mandare il link.")}</span>`;
  };
}
