// Pagina pubblica per gli invitati: #/evento/<codice>. Caricano foto e video senza account.
import { sb, $app, esc } from "../app.js";
import { SUPABASE_URL } from "../config.js";

const API = `${SUPABASE_URL}/functions/v1/album`;

export default async function ({ id }) {
  const a = await fetch(`${API}?codice=${encodeURIComponent(id ?? "")}`).then((r) => r.json()).catch(() => ({ errore: "Connessione assente." }));
  if (a.errore) { $app().innerHTML = `<div class="pad" style="padding-top:60px"><span class="logo" style="font-size:36px">Ancora</span><p>${esc(a.errore)}</p></div>`; return; }
  $app().innerHTML = `
    <div class="pad" style="padding-top:48px;text-align:center"><span class="logo" style="font-size:30px">Ancora</span>
      <h1 style="font-size:30px;line-height:1.15;margin:16px 0 6px">${esc(a.titolo)}</h1>
      ${a.giorno ? `<p class="tenue" style="margin:0">${new Date(a.giorno).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}</p>` : ""}</div>
    ${a.aperto ? `<div class="card">
      <label for="nome" style="margin-top:0">Il tuo nome (se vuoi)</label><input id="nome" maxlength="60" placeholder="Zia Anna">
      <label class="btn ambra" style="margin-top:14px;min-height:60px">📸 Scegli le foto e i video<input id="file" type="file" accept="image/*,video/*" multiple hidden></label>
      <p id="stato" role="status" style="text-align:center;margin:12px 0 0"></p>
      <p class="tenue" style="font-size:13px;text-align:center;margin:10px 0 0">Le foto le vedrà solo la famiglia, non sono pubbliche.</p></div>
      <p class="pad tenue" style="text-align:center;font-size:14px">Vuoi anche tu un posto così per la tua famiglia? <a href="#/scopri">Scopri Ancora</a></p>`
      : `<p class="pad" style="text-align:center">L'album è chiuso. Grazie!</p>`}`;
  const input = document.getElementById("file"); if (!input) return;
  input.onchange = async () => {
    const files = [...input.files].slice(0, 30), stato = document.getElementById("stato");
    if (!files.length) return;
    stato.textContent = `Caricamento di ${files.length} ${files.length === 1 ? "file" : "file"}…`;
    const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codice: id, file: files.map((f) => ({ tipo: f.type, byte: f.size })) }) }).then((x) => x.json()).catch(() => ({}));
    if (!r.caricamenti) { stato.innerHTML = `<span class="errore">${esc(r.errore ?? "Non è andata, riprova.")}</span>`; return; }
    const fatti = []; let saltati = 0;
    for (const [i, f] of files.entries()) {
      const c = r.caricamenti[i]; if (!c) { saltati++; continue; }
      const up = await sb.storage.from("ricordi").uploadToSignedUrl(c.path, c.token, f, { contentType: f.type });
      if (up.error) saltati++; else fatti.push({ path: c.path, tipo: f.type, byte: f.size });
      stato.textContent = `Caricate ${fatti.length} di ${files.length}…`;
    }
    if (fatti.length) await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codice: id, nome: document.getElementById("nome").value, fatto: fatti }) });
    stato.innerHTML = `<b style="color:#2F7A4F">✓ Grazie! ${fatti.length} ${fatti.length === 1 ? "foto caricata" : "foto caricate"}.</b>${saltati ? `<br><span class="tenue">${saltati} non caricate (formato non supportato o oltre 50 MB).</span>` : ""}`;
    input.value = "";
  };
}
