// Ricetta condivisa con un link: #/ricetta?t=<link>
// Chi non è iscritto vede l'assaggio e si iscrive gratis (col codice amico di chi l'ha condivisa) per leggerla tutta.
// Chi è iscritto la legge intera e può salvarla nel suo ricettario.
import { sb, state, $app, esc, traccia, seServePiu } from "../app.js";
import { SUPABASE_URL } from "../config.js";

const etichetta = "text-transform:uppercase;font-weight:800;letter-spacing:.5px;font-size:13px;color:var(--tenue,#6b6b6b)";

export default async function ({ params }) {
  const t = params?.t ?? "";
  const { data: { session } } = await sb.auth.getSession();
  const r = await fetch(`${SUPABASE_URL}/functions/v1/ricetta-pubblica?t=${encodeURIComponent(t)}`,
    { headers: session ? { authorization: `Bearer ${session.access_token}` } : {} }).then((x) => x.json()).catch(() => ({ errore: "Connessione assente." }));
  if (r.errore) {
    $app().innerHTML = `<div class="pad" style="padding-top:60px;text-align:center"><span class="logo" style="font-size:36px">Ancora</span>
      <h1 style="margin-top:20px">${esc(r.errore)}</h1><p class="tenue">Chi l'ha condivisa può averla tenuta di nuovo solo per la sua famiglia.</p>
      <a class="btn ambra" href="#/scopri">Scopri Ancora</a></div>`;
    return;
  }
  const di = r.autore ? `La ricetta di ${esc(r.autore)}` : "Una ricetta di famiglia";
  const testa = `
    <div style="position:relative;aspect-ratio:4/3;max-height:340px;width:100%;background:${r.foto?.[0] ? `url('${r.foto[0]}') center/cover` : "linear-gradient(135deg,#E8B56B,#B5652E)"}">
      <span class="logo" style="position:absolute;left:16px;top:14px;font-size:22px;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.4)">Ancora</span></div>
    <div class="pad" style="padding-top:16px">
      <div class="tenue" style="font-weight:700">${di}</div>
      <h1 style="font-size:28px;line-height:1.2;margin:4px 0 0">${esc(r.titolo ?? "Ricetta")}</h1>
      ${r.porzioni ? `<div class="tenue" style="margin-top:4px">Per ${esc(String(r.porzioni))} persone</div>` : ""}
    </div>`;

  if (!r.intera) {
    traccia("ricetta_assaggio");
    const dopo = `ricetta=${encodeURIComponent(t)}`;
    const nascosti = Math.max(0, r.n_ingredienti - (r.assaggio?.length ?? 0));
    $app().innerHTML = testa + `
      <div class="card" style="position:relative;overflow:hidden">
        <span style="${etichetta}">Ingredienti${r.n_ingredienti ? ` · ${r.n_ingredienti}` : ""}</span>
        <ul style="padding-left:20px;margin:8px 0 0;line-height:1.7">${(r.assaggio ?? []).map((i) => `<li>${esc(i)}</li>`).join("")}
          ${nascosti ? Array.from({ length: Math.min(nascosti, 4) }, () => `<li style="filter:blur(5px);user-select:none">ingrediente segreto di famiglia</li>`).join("") : ""}</ul>
        <span style="${etichetta};display:block;margin-top:14px">Come si fa</span>
        <p style="filter:blur(6px);user-select:none;margin:6px 0 0;line-height:1.6">Si prepara con calma, come si faceva una volta, seguendo i passaggi che in famiglia si tramandano da anni…</p>
      </div>
      <div class="pad" style="text-align:center;padding-bottom:40px">
        <h2 style="margin:6px 0 6px">Leggi la ricetta intera, gratis</h2>
        <p class="tenue" style="margin:0 0 14px">${r.autore ? `${esc(r.autore)} l'ha condivisa con te su Ancora.` : "È stata condivisa con te su Ancora."} Iscriviti in un minuto: senza carta, e puoi salvarla nel tuo ricettario.</p>
        <a class="btn ambra" id="iscr" href="#/iscriviti?${r.amico ? `amico=${encodeURIComponent(r.amico)}&` : ""}${dopo}">Iscriviti e leggila</a>
        <a class="btn chiaro" style="margin-top:10px" href="#/accesso?${dopo}">Ho già un account</a>
        <p class="tenue" style="margin-top:18px;font-size:14px">Ancora è il posto privato dove le famiglie custodiscono ricordi, voci e ricette, per sempre.</p>
      </div>`;
    document.getElementById("iscr").onclick = () => traccia("ricetta_iscriviti");
    return;
  }

  traccia("ricetta_letta");
  $app().innerHTML = testa + `
    ${r.foto?.length > 1 ? `<div style="display:flex;gap:8px;overflow-x:auto;padding:0 16px">${r.foto.slice(1).map((f) => `<img src="${esc(f)}" alt="" style="height:120px;border-radius:12px">`).join("")}</div>` : ""}
    ${r.testo ? `<div class="pad"><p style="white-space:pre-line;line-height:1.6;margin:0">${esc(r.testo)}</p></div>` : ""}
    <div class="card">
      <span style="${etichetta}">Ingredienti</span>
      <ul style="padding-left:20px;margin:8px 0 0;line-height:1.7">${(r.ingredienti ?? []).map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
      ${r.procedimento ? `<span style="${etichetta};display:block;margin-top:14px">Come si fa</span>
        <p style="white-space:pre-line;margin:6px 0 0;line-height:1.6">${esc(r.procedimento)}</p>` : ""}
    </div>
    <div class="pad" style="padding-bottom:120px">
      ${r.mia ? `<p class="tenue" style="text-align:center">È la tua ricetta: così la vede chi riceve il link.</p>`
        : `<button class="btn ambra" id="salva">Salva nel mio ricettario</button><p id="esito" role="status" style="text-align:center"></p>`}
      <a class="btn chiaro" style="margin-top:10px" href="#/">Vai ad Ancora</a>
    </div>`;

  document.getElementById("salva")?.addEventListener("click", async (e) => {
    const esito = document.getElementById("esito");
    const fam = state.cerchie?.find((c) => c.tipo === "famiglia");
    e.target.disabled = true;
    const { data, error } = await sb.from("ricordi").insert({
      autore_id: state.io.id, tipo: "ricetta", titolo: (r.titolo ?? "Ricetta").slice(0, 120),
      testo: r.autore ? `Dalla ricetta di ${r.autore}.` : null,
      cerchia_id: fam?.id ?? null, visibilita: fam ? "cerchia" : "solo_io",
      dettagli: { porzioni: r.porzioni, ingredienti: r.ingredienti ?? [], procedimento: r.procedimento ?? "" },
    }).select("id").single();
    if (error) { e.target.disabled = false; if (!seServePiu(error)) esito.innerHTML = `<span class="errore">Non salvata. Riprova.</span>`; return; }
    traccia("ricetta_salvata");
    esito.innerHTML = `Salvata ✓ <a href="#/ricordo/${data.id}">Aprila</a>`;
  });
}
