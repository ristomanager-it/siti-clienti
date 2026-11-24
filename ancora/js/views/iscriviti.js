// "Crea il tuo account gratis": nome, email, password. Da un amico (?amico=CODICE) o da un invito in famiglia (?invito=CODICE).
import { sb, $app, esc } from "../app.js";
import { SUPABASE_URL } from "../config.js";

export default async function ({ params } = {}) {
  const invito = params?.invito ?? "", amico = params?.amico ?? "", ricetta = params?.ricetta ?? "";
  const torna = String(params?.torna ?? "").startsWith("#/") ? params.torna : "";   // dopo l'iscrizione: al tavolo, all'album, al ricordo…
  const dopo = invito ? `#/?invito=${encodeURIComponent(invito)}${torna ? `&torna=${encodeURIComponent(torna)}` : ""}`
    : torna || (ricetta ? `#/ricetta?t=${encodeURIComponent(ricetta)}` : "#/");
  const qsAccesso = [invito && `invito=${encodeURIComponent(invito)}`, ricetta && `ricetta=${encodeURIComponent(ricetta)}`, torna && `torna=${encodeURIComponent(torna)}`].filter(Boolean).join("&");
  // già dentro (stesso telefono): niente modulo, si va dritti
  if ((await sb.auth.getSession()).data.session) { location.replace(dopo); if (invito) location.reload(); return; }
  const ant = invito ? await fetch(`${SUPABASE_URL}/functions/v1/invito?codice=${encodeURIComponent(invito)}`).then((r) => r.json()).catch(() => null) : null;
  $app().innerHTML = `${ant && !ant.errore ? anteprima(ant) : ""}
    <div class="pad" style="padding-top:${ant && !ant.errore ? 18 : 48}px">${ant && !ant.errore ? "" : `<span class="logo" style="font-size:40px">Ancora</span><div class="tenue" style="font-weight:700;margin:-4px 0 18px">Il cloud dei tuoi ricordi</div>`}
      <h1 style="font-size:28px;line-height:1.2">${params?.perche ? esc(params.perche) : ant && !ant.errore ? "Ti hanno preparato un posto." : invito ? "Ti aspettano in famiglia." : ricetta ? "Un minuto e leggi la ricetta." : "Crea il tuo account gratis."}</h1>
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
      <p style="text-align:center;margin-bottom:0"><a href="#/accesso${qsAccesso ? "?" + esc(qsAccesso) : ""}">Ho già un account: entro</a></p>
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
      esito.innerHTML = `<span class="errore">${esc(r.errore ?? "Non è andata. Riprova.")}</span>${r.gia_registrato ? ` <a href="#/accesso${qsAccesso ? "?" + esc(qsAccesso) : ""}">Entra</a>` : ""}`;
      btn.disabled = false; return;
    }
    await sb.auth.signInWithPassword({ email, password });
    location.replace(dopo); location.reload();
  };
}

// l'anteprima della famiglia che ti ha invitato: copertina, foto, chi invita, quanti sono già dentro
export function anteprima(a) {
  return `<div style="position:relative;aspect-ratio:16/9;max-height:240px;width:100%;background:${a.copertina ? `url('${a.copertina}') center/cover` : "linear-gradient(135deg,#7FA37E,#4D7356)"}"></div>
    <div class="pad" style="display:flex;gap:14px;align-items:flex-end;margin-top:-44px;position:relative">
      <span style="width:84px;height:84px;border-radius:42px;border:4px solid var(--carta);flex-shrink:0;display:grid;place-items:center;font-family:Fraunces,serif;font-size:28px;font-weight:700;color:#fff;
        background:${a.foto ? `url('${a.foto}') center/cover` : "var(--notte)"}">${a.foto ? "" : esc((a.cerchia ?? "A")[0])}</span>
      <div style="padding-bottom:4px"><span class="tenue" style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.06em">${esc(a.da)} ti invita in</span>
        <b style="display:block;font-family:Fraunces,serif;font-size:24px;line-height:1.15">${esc(a.cerchia)}</b>
        <span class="tenue" style="font-size:14px">${a.membri} ${a.membri === 1 ? "persona" : "persone"}${a.ricordi ? ` · ${a.ricordi} ricordi` : ""}</span></div>
    </div>
    <div class="pad" style="padding-top:0"><div class="card" style="margin:0;background:#FBF4E6;font-size:15px;line-height:1.5">
      <b style="font-family:Fraunces,serif;font-size:18px">Cos'è Ancora</b><br>
      Il posto privato della ${a.tipo === "famiglia" ? "famiglia" : "vostra cerchia"}: foto, storie, vocali e chat, come un social ma <b>solo per voi</b>.
      Si entra solo su invito, niente pubblicità né estranei. Le cose belle restano in ordine, non si perdono nella chat. <b>È gratis.</b></div></div>`;
}
