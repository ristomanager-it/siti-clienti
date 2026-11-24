// Accesso: si inserisce il numero, il link arriva su WhatsApp. Niente password.
import { sb, $app, esc } from "../app.js";
import { SUPABASE_URL } from "../config.js";

// tanti ganci, uno per ogni famiglia: girano da soli
const GANCI = [
  "Ancora. Le radici che restano.",
  "Le storie di casa, raccontate da chi le ha vissute.",
  "La famiglia che si mette insieme, un ricordo alla volta.",
  "Il cloud dei tuoi ricordi: storie, voci, foto, video, ricette, il diario.",
  "Le ricette di casa, con la voce di chi le fa.",
  "L'albero della famiglia, completato insieme.",
  "Per chi è lontano: sentirsi vicini, ogni settimana.",
  "Il diario di ogni giorno, solo per te.",
  "Un regalo che dura tutta la vita.",
  "Se vi siete persi di vista, ritrovatevi.",
];

export default async function ({ params }) {
  const invito = params?.invito ?? null, ricetta = params?.ricetta ?? null;
  const torna = String(params?.torna ?? "").startsWith("#/") ? params.torna : "";
  const dopo = invito ? `#/?invito=${invito}${torna ? `&torna=${encodeURIComponent(torna)}` : ""}` : torna || (ricetta ? `#/ricetta?t=${encodeURIComponent(ricetta)}` : "#/");
  const qs = [invito && `invito=${invito}`, ricetta && `ricetta=${encodeURIComponent(ricetta)}`, torna && `torna=${encodeURIComponent(torna)}`].filter(Boolean).join("&");
  const ant = invito ? await fetch(`${SUPABASE_URL}/functions/v1/invito?codice=${encodeURIComponent(invito)}`).then((r) => r.json()).catch(() => null) : null;
  const { anteprima } = invito ? await import("./iscriviti.js") : {};
  $app().innerHTML = `${ant && !ant.errore ? anteprima(ant) : ""}
    <div class="pad" style="padding-top:64px"><span class="logo" style="font-size:44px">Ancora</span><div class="tenue" style="font-weight:700;letter-spacing:.02em;margin:-4px 0 18px">Il cloud dei tuoi ricordi</div>
    <p id="gancio" style="font-family:Fraunces,serif;font-size:25px;line-height:1.25;color:var(--notte);min-height:94px;margin-bottom:4px;transition:opacity .5s">${GANCI[0]}</p>
    </div>
    <form id="f" class="card">
      <label for="tel">Il tuo numero di telefono</label>
      <input id="tel" type="tel" inputmode="tel" placeholder="+39 333 123 4567" required autocomplete="tel">
      <p class="tenue">Ti mandiamo il link di accesso su WhatsApp.</p>
      <button class="btn" type="submit">Ricevi il link</button>
      <p id="esito" role="status"></p>
      <p style="text-align:center;margin:8px 0 0">Non hai un account? <a href="#/iscriviti${qs ? "?" + qs : ""}"><b>Crealo gratis</b></a></p>
    </form>
    <details class="card"><summary style="font-weight:800;cursor:pointer;min-height:32px">Entra con email e password</summary>
      <form id="fe">
        <label for="em">Email</label><input id="em" type="email" autocomplete="username" required>
        <label for="pw">Password</label><input id="pw" type="password" autocomplete="current-password" required>
        <button class="btn" style="margin-top:12px">Entra</button>
        <p id="esitoe" role="status"></p>
      </form></details>
    <div class="pad"><a class="btn ambra" href="#/scopri">Scopri Ancora</a>
      <a class="btn chiaro" style="margin-top:10px" href="#/regala">Regala Ancora</a>
      <p style="text-align:center"><a href="#/scopri">Scopri Ancora</a> · <a href="#/perche">Perché Ancora</a></p></div>`;

  document.getElementById("fe").onsubmit = async (e) => {
    e.preventDefault();
    const { error } = await sb.auth.signInWithPassword({ email: document.getElementById("em").value.trim(), password: document.getElementById("pw").value });
    if (error) { document.getElementById("esitoe").innerHTML = `<span class="errore">Email o password non corretti.</span>`; return; }
    location.hash = dopo;
  };

  let g = 0;
  const giro = setInterval(() => {
    const el = document.getElementById("gancio");
    if (!el) { clearInterval(giro); return; }
    el.style.opacity = 0;
    setTimeout(() => { g = (g + 1) % GANCI.length; el.textContent = GANCI[g]; el.style.opacity = 1; }, 500);
  }, 3800);

  document.getElementById("f").onsubmit = async (e) => {
    e.preventDefault();
    let tel = document.getElementById("tel").value.replace(/[\s.-]/g, "");
    tel = tel.replace(/^00/, "+"); if (!tel.startsWith("+")) tel = "+39" + tel;   // dall'estero: +44…, 001…
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
