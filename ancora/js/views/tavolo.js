// #/tavolo?t=<codice>: l'invito di un amico a un tavolo (o alla tombola). Ti siede e ti porta al gioco.
// Si entra solo nella partita: la famiglia o il gruppo di chi invita restano privati.
import { sb, $app, esc } from "../app.js";

export default async function ({ params } = {}) {
  $app().innerHTML = `<div class="pad" style="text-align:center;padding-top:80px"><div style="font-size:48px">🎲</div><p>Ti preparo il posto al tavolo…</p></div>`;
  const { data, error } = await sb.rpc("ospite_entra", { p_codice: String(params?.t ?? "") });
  if (error || !data?.url) {
    $app().innerHTML = `<div class="pad" style="text-align:center;padding-top:80px"><div style="font-size:48px">🎲</div>
      <h2>Il tavolo non c'è più</h2><p class="tenue">${esc(error?.message ?? "L'invito non vale più.")}</p>
      <a class="btn ambra" href="#/giochi">Vai ai giochi</a></div>`;
    return;
  }
  try { sessionStorage.setItem("ancora_dopo_tavolo", "1"); } catch { /* niente */ }
  location.replace(data.url);
}
