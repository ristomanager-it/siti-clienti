// Profilo di una persona: numeri, "Chiedi", il suo libro che cresce, l'album a griglia.
import { sb, state, $app, esc, nomeDi, avatar, urlMediaMolti, ICONE, attivaNotifiche, notificheAttive } from "../app.js";

const STORIE_PER_VOLUME = 25;

export default async function ({ id }) {
  const pid = id ?? state.io.id;
  const io = pid === state.io.id;
  const { data: p } = await sb.from("persone").select("id, nome, soprannome, foto_path, bio, data_nascita").eq("id", pid).maybeSingle();
  if (!p) { $app().innerHTML = `<p class="pad">Profilo non trovato.</p>`; return; }

  const { data: ricordi } = await sb.from("ricordi")
    .select("id, tipo, creato_il, ricordi_media(path, tipo, durata_sec, ordine)")
    .eq("autore_id", pid).order("creato_il", { ascending: false }).limit(300);
  const lista = ricordi ?? [];
  const racconti = lista.filter((r) => r.tipo === "racconto").length;
  const secondi = lista.flatMap((r) => r.ricordi_media ?? []).filter((m) => m.tipo === "audio").reduce((s, m) => s + (m.durata_sec ?? 0), 0);
  const conFoto = lista.map((r) => ({ r, f: (r.ricordi_media ?? []).find((m) => m.tipo === "foto"), a: (r.ricordi_media ?? []).find((m) => m.tipo === "audio") }))
    .filter((x) => x.f);
  const url = await urlMediaMolti([...conFoto.map((x) => x.f.path), p.foto_path].filter(Boolean));
  const { data: fm } = await sb.from("famiglia_membri").select("narratore").eq("persona_id", pid).maybeSingle();

  const volume = Math.floor(racconti / STORIE_PER_VOLUME) + 1;
  const nelVolume = racconti % STORIE_PER_VOLUME;
  const anno = p.data_nascita ? `, classe ${p.data_nascita.slice(0, 4)}` : "";

  $app().innerHTML = `
    <header class="testa">${id ? `<a class="icona" href="#/" aria-label="Indietro">${ICONE.indietro}</a>` : `<span style="width:44px"></span>`}
      <b>${esc(nomeDi(p))}</b><span style="width:44px"></span></header>
    <div class="pad" style="display:flex;align-items:center;gap:18px">
      <span class="anello" style="width:92px;height:92px;border-radius:46px;flex-shrink:0">${avatar(p, 86, p.foto_path ? url[p.foto_path] : null).replace('class="av"', 'class="av" style="border:3px solid var(--carta);font-size:28px"')}</span>
      <div style="display:grid;grid-template-columns:repeat(3,auto);gap:16px;text-align:center">
        <div><b style="font-size:20px">${racconti}</b><div class="tenue">racconti</div></div>
        <div><b style="font-size:20px">${secondi >= 3600 ? Math.round(secondi / 3600) + " h" : Math.round(secondi / 60) + " min"}</b><div class="tenue">di voce</div></div>
        <div><b style="font-size:20px">${conFoto.length}</b><div class="tenue">foto</div></div>
      </div>
    </div>
    <div class="pad"><h1 style="font-size:24px">${esc(p.nome)}${anno}</h1>
      ${p.bio ? `<p class="tenue" style="margin:4px 0 12px;font-size:15px">${esc(p.bio)}</p>` : ""}
      ${io ? `<a class="btn chiaro" href="#/racconta" style="margin-top:10px">Racconta qualcosa</a>
             <div class="riga" style="margin-top:8px;gap:8px"><a class="btn chiaro" href="#/piano" style="flex:1">Il piano</a>
               <a class="btn chiaro" href="#/ricette" style="flex:1">Ricettario</a></div>`
        : `<form id="chiedi" style="margin-top:10px">
            <label class="visually-hidden" for="q">Cosa vuoi chiedergli</label>
            <input id="q" placeholder="Cosa vuoi chiedere a ${esc(nomeDi(p))}?" required>
            <button class="btn ambra" style="margin-top:8px">Chiedi</button></form>`}
    </div>
    ${fm?.narratore ? `<div class="libro"><span class="copertina">Le storie di ${esc(p.nome)}</span>
      <div style="flex:1"><b>Il suo libro · volume ${volume}</b>
        <div style="font-size:13px;color:#C9D8D4">${nelVolume} storie su ${STORIE_PER_VOLUME} per completarlo</div>
        <div class="barra-prog"><i style="width:${Math.round(nelVolume / STORIE_PER_VOLUME * 100)}%"></i></div>
        <a href="#/libro/${p.id}" style="color:#F4E6CF;font-weight:800;font-size:13px;display:inline-block;margin-top:8px">Sfoglia e stampa il libro →</a></div></div>` : ""}
    ${conFoto.length ? `<div class="griglia">${conFoto.map((x) =>
      `<a href="#/ricordo/${x.r.id}" style="background-image:url('${url[x.f.path]}')" aria-label="Apri il ricordo">${x.a ? `<span>▶ voce</span>` : ""}</a>`).join("")}</div>`
      : `<p class="pad tenue">Ancora nessuna foto.</p>`}`;

  if (io) {
    const spenti = new Set(state.io.moduli_spenti ?? []);
    $app().insertAdjacentHTML("beforeend", `<h2>Le mie impostazioni</h2><div class="card">
      <div class="riga" style="margin-bottom:12px"><b style="flex:1">Notifiche</b><button class="chip" id="notif" style="margin:0">…</button></div>
      <p class="tenue" style="margin-top:0">Cosa vuoi vedere e condividere nell'agenda. Se spegni una voce, non la vedi tu e nessuno vede la tua.</p>
      ${[["vacanze", "Vacanze"], ["compiti", "Compiti"], ["esami", "Esami"]].map(([k, t]) =>
        `<label class="riga" style="margin:10px 0;font-weight:700;color:var(--testo)"><input type="checkbox" data-mio-modulo="${k}" ${spenti.has(k) ? "" : "checked"} style="width:22px;height:22px"> ${t}</label>`).join("")}
    </div>`);
    const bN = document.getElementById("notif");
    const aggiornaN = async () => { const on = await notificheAttive(); bN.textContent = on ? "✓ Attive" : "Attiva"; bN.classList.toggle("on", on); };
    aggiornaN();
    bN.onclick = async () => { if (!(await notificheAttive())) { await attivaNotifiche(); aggiornaN(); } };
    document.querySelectorAll("[data-mio-modulo]").forEach((c) => c.onchange = async () => {
      const s = new Set(state.io.moduli_spenti ?? []);
      c.checked ? s.delete(c.dataset.mioModulo) : s.add(c.dataset.mioModulo);
      state.io.moduli_spenti = [...s];
      await sb.from("persone").update({ moduli_spenti: [...s] }).eq("id", state.io.id);
    });
  }

  document.getElementById("chiedi")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = document.getElementById("q");
    await sb.from("domande_suggerite").insert({ narratore_id: pid, chiesta_da: state.io.id, testo: q.value });
    q.value = "";
    e.target.querySelector("button").textContent = "Inviata! Gli arriva con la prossima domanda";
  });
}
