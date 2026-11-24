// Cartolina: un ricordo condiviso con un link (#/cartolina?t=<link>).
// Chi non è iscritto vede la foto, chi racconta e le prime righe; per leggerlo tutto e sentire la voce si iscrive gratis
// (col codice amico di chi l'ha condiviso). Chi è iscritto lo legge intero e ascolta la voce.
import { sb, $app, esc, traccia } from "../app.js";
import { SUPABASE_URL } from "../config.js";

export default async function ({ params }) {
  const t = params?.t ?? "";
  const { data: { session } } = await sb.auth.getSession();
  const r = await fetch(`${SUPABASE_URL}/functions/v1/ricordo-pubblico?t=${encodeURIComponent(t)}`,
    { headers: session ? { authorization: `Bearer ${session.access_token}` } : {} }).then((x) => x.json()).catch(() => ({ errore: "Connessione assente." }));
  if (r.errore) {
    $app().innerHTML = `<div class="pad" style="padding-top:60px;text-align:center"><span class="logo" style="font-size:36px">Ancora</span>
      <h1 style="margin-top:20px">${esc(r.errore)}</h1><p class="tenue">Chi l'ha condiviso può averlo tenuto di nuovo solo per la famiglia.</p>
      <a class="btn ambra" href="#/scopri">Scopri Ancora</a></div>`;
    return;
  }
  const chi = r.autore ?? "Qualcuno della famiglia";
  const testa = `
    <div style="position:relative;aspect-ratio:4/3;max-height:360px;width:100%;background:${r.foto?.[0] ? `url('${esc(r.foto[0])}') center/cover` : "linear-gradient(135deg,#7FA37E,#4D7356)"}">
      <span class="logo" style="position:absolute;left:16px;top:14px;font-size:22px;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.4)">Ancora</span></div>
    <div class="pad" style="padding-top:16px">
      <div style="display:flex;gap:10px;align-items:center">
        <span style="width:44px;height:44px;border-radius:22px;flex-shrink:0;background:${r.autore_foto ? `url('${esc(r.autore_foto)}') center/cover` : "var(--notte)"};display:grid;place-items:center;color:#fff;font-weight:800">${r.autore_foto ? "" : esc(chi[0])}</span>
        <div><b>${esc(chi)} racconta</b>${r.condiviso_da && r.condiviso_da !== r.autore ? `<div class="tenue" style="font-size:14px">te l'ha mandato ${esc(r.condiviso_da)}</div>` : ""}</div></div>
      ${r.domanda ? `<p class="tenue" style="margin:14px 0 0;font-style:italic">«${esc(r.domanda)}»</p>` : ""}
      ${r.titolo ? `<h1 style="font-size:28px;line-height:1.2;margin:8px 0 0">${esc(r.titolo)}</h1>` : ""}
    </div>`;

  if (!r.intero) {
    traccia("cartolina_assaggio");
    const torna = encodeURIComponent(`#/cartolina?t=${t}`);
    const perche = encodeURIComponent(r.voce ? `Un minuto e senti la voce di ${chi}.` : `Un minuto e leggi tutto il racconto di ${chi}.`);
    $app().innerHTML = testa + `
      <div class="card" style="position:relative;overflow:hidden">
        <p style="white-space:pre-line;line-height:1.6;margin:0;font-size:17px">${esc(r.inizio ?? "")}</p>
        ${r.lungo ? `<p style="filter:blur(6px);user-select:none;margin:8px 0 0;line-height:1.6">E poi racconta tutto il resto, con le parole di una volta, quelle che in famiglia si ripetono da anni…</p>` : ""}
        ${r.voce ? `<div style="display:flex;align-items:center;gap:10px;margin-top:14px;padding:12px 14px;border-radius:14px;background:var(--notte);color:#fff;opacity:.85">
          <span style="font-size:22px">🔒</span><b style="flex:1">La sua voce${r.durata ? ` · ${Math.max(1, Math.round(r.durata / 60))} min` : ""}</b><span>▶</span></div>` : ""}
      </div>
      <div class="pad" style="text-align:center;padding-bottom:40px">
        <h2 style="margin:6px 0 6px">${r.voce ? "Ascolta la sua voce, gratis" : "Leggilo tutto, gratis"}</h2>
        <p class="tenue" style="margin:0 0 14px">Iscriviti in un minuto, senza carta. E poi, se vuoi, fai raccontare anche i tuoi nonni.</p>
        <a class="btn ambra" id="iscr" href="#/iscriviti?${r.amico ? `amico=${encodeURIComponent(r.amico)}&` : ""}torna=${torna}&perche=${perche}">${r.voce ? "Iscriviti e ascolta" : "Iscriviti e leggi"}</a>
        <a class="btn chiaro" style="margin-top:10px" href="#/accesso?torna=${torna}">Ho già un account</a>
        <p class="tenue" style="margin-top:18px;font-size:14px">Ancora è il posto privato dove le famiglie custodiscono ricordi, voci e ricette, per sempre.</p>
      </div>`;
    document.getElementById("iscr").onclick = () => traccia("cartolina_iscriviti");
    return;
  }

  traccia("cartolina_letta");
  $app().innerHTML = testa + `
    ${r.voce_url ? `<div class="pad" style="padding-top:0"><audio src="${esc(r.voce_url)}" controls preload="metadata" style="width:100%"></audio></div>` : ""}
    ${r.testo ? `<div class="card"><p style="white-space:pre-line;line-height:1.65;margin:0;font-size:17px">${esc(r.testo)}</p></div>` : ""}
    ${r.foto?.length > 1 ? `<div style="display:flex;gap:8px;overflow-x:auto;padding:0 16px">${r.foto.slice(1).map((f) => `<img src="${esc(f)}" alt="" style="height:140px;border-radius:12px">`).join("")}</div>` : ""}
    <div class="pad" style="padding-bottom:120px">
      <div class="card" style="margin:12px 0;background:#FFF6E8;border-color:#F0D5A8">
        <b style="font-family:Fraunces,serif;font-size:19px">E i racconti della tua famiglia?</b>
        <p style="margin:6px 0 12px">Ogni settimana una domanda ai nonni, su WhatsApp: rispondono a voce e la loro storia resta per sempre.</p>
        <a class="btn ambra" href="#/" style="margin:0">Comincia con la tua famiglia</a></div>
    </div>`;
}
