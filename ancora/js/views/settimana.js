// Le risposte alla domanda della settimana, e tutte quelle delle settimane passate: la famiglia che si racconta.
import { sb, state, $app, esc, nomeDi, avatar, pulsanteVoce, urlMediaMolti, ICONE, settimana } from "../app.js";

export default async function ({ params }) {
  const cerchia = state.cerchie.find((c) => c.id === params.c) ?? state.cerchie.find((c) => c.tipo === "famiglia");
  if (!cerchia) { location.hash = "#/"; return; }
  const { data: tutte } = await sb.from("ricordi")
    .select("id, titolo, testo, creato_il, autore_id, domanda_settimana, persone:autore_id(id, nome, soprannome, foto_path), ricordi_media(path, tipo, durata_sec)")
    .eq("cerchia_id", cerchia.id).not("domanda_settimana", "is", null)
    .order("creato_il", { ascending: true });
  const lista = tutte ?? [];
  const url = await urlMediaMolti(lista.flatMap((r) => (r.ricordi_media ?? []).map((m) => m.path)));

  // raggruppa per settimana, la più recente in alto
  const gruppi = new Map();
  for (const r of lista) gruppi.set(r.domanda_settimana, [...(gruppi.get(r.domanda_settimana) ?? []), r]);
  const ordine = [...gruppi.keys()].sort().reverse();
  const ora = settimana().codice;

  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/" aria-label="Indietro">${ICONE.indietro}</a>
      <b>${esc(cerchia.nome)}</b><span style="width:44px"></span></header>
    <p class="pad tenue" style="margin-top:0">Ogni settimana una domanda per tutta la famiglia. Rispondete come volete: a voce, con una foto, scrivendo.</p>
    ${ordine.map((k) => {
      const rs = gruppi.get(k);
      return `<h2>${k === ora ? "Questa settimana" : esc(k.replace("-W", " · settimana "))}</h2>
        <div class="lettera" style="font-size:20px;margin-bottom:10px">${esc(rs[0].titolo ?? "")}</div>
        ${rs.map((r, i) => {
          const a = (r.ricordi_media ?? []).find((m) => m.tipo === "audio");
          const f = (r.ricordi_media ?? []).find((m) => m.tipo === "foto");
          return `<div class="card">
            <a class="riga" href="#/ricordo/${r.id}" style="text-decoration:none;color:inherit">${avatar(r.persone, 32, r.persone?.foto_path ? url[r.persone.foto_path] : null)}<b style="flex:1">${esc(nomeDi(r.persone))}</b></a>
            ${f ? `<div class="foto" style="margin:10px 0 0;aspect-ratio:4/3;background-image:url('${url[f.path]}')"></div>` : ""}
            ${r.testo ? `<p style="margin:10px 0 0;white-space:pre-line">${esc(r.testo)}</p>` : ""}
            ${a ? pulsanteVoce(url[a.path], a.durata_sec, i + 2, "margin:10px 0 0;background:var(--notte)") : ""}
          </div>`;
        }).join("")}`;
    }).join("") || `<p class="pad">Ancora nessuna risposta.</p>`}`;
}
