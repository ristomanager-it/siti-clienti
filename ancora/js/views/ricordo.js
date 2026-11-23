// Un ricordo: foto grandi, la sua voce, il testo, le risposte a voce e i commenti.
import { sb, state, $app, esc, quando, nomeDi, avatar, pulsanteVoce, urlMediaMolti, ICONE } from "../app.js";

export default async function ({ id }) {
  const { data: r } = await sb.from("ricordi")
    .select("id, tipo, titolo, testo, dettagli, creato_il, autore_id, link_pubblico, visibilita, cerchia_id, persone:autore_id(id, nome, soprannome, foto_path), ricordi_media(path, tipo, durata_sec, ordine)")
    .eq("id", id).maybeSingle();
  if (!r) { $app().innerHTML = `<p class="pad">Ricordo non trovato.</p>`; return; }

  const [{ data: reazioni }, { data: risposte }] = await Promise.all([
    sb.from("reazioni").select("tipo, testo, creata_il, persone:persona_id(id, nome, soprannome)").eq("ricordo_id", id).order("creata_il"),
    sb.from("ricordi").select("id, testo, creato_il, persone:autore_id(id, nome, soprannome), ricordi_media(path, tipo, durata_sec)")
      .eq("in_risposta_a", id).order("creato_il"),
  ]);
  const media = (r.ricordi_media ?? []).sort((a, b) => a.ordine - b.ordine);
  const url = await urlMediaMolti([...media.map((m) => m.path), ...(risposte ?? []).flatMap((x) => (x.ricordi_media ?? []).map((m) => m.path))]);
  const audio = media.find((m) => m.tipo === "audio");
  const foto = media.filter((m) => m.tipo === "foto");
  const video = media.filter((m) => m.tipo === "video");
  const cuori = (reazioni ?? []).filter((x) => x.tipo === "cuore");
  const commenti = (reazioni ?? []).filter((x) => x.tipo !== "cuore");

  $app().innerHTML = `
    <header class="testa"><a class="icona" href="#/" aria-label="Indietro">${ICONE.indietro}</a>
      <a class="post-testa" style="padding:0" href="#/profilo/${r.autore_id}">${avatar(r.persone, 34)}<div><b>${esc(nomeDi(r.persone))}</b><small>${quando(r.creato_il)}</small></div></a>
      <span style="width:44px"></span></header>
    ${r.titolo ? `<div class="pad"><h1 style="font-size:24px">${esc(r.titolo)}</h1></div>` : ""}
    ${video.map((v) => `<div class="foto" style="aspect-ratio:auto;background:#000;margin-bottom:8px"><video src="${esc(url[v.path])}" controls playsinline preload="metadata" style="width:100%;max-height:75vh;display:block"></video></div>`).join("")}
    ${!foto.length && video.length && !r.testo && !audio ? "" : foto.length
      ? foto.map((f, i) => `<div class="foto" style="background-image:url('${url[f.path]}');margin-bottom:8px">${i === 0 && audio ? pulsanteVoce(url[audio.path], audio.durata_sec) : ""}</div>`).join("")
        + (r.testo ? `<div class="didascalia" style="margin-top:6px">${esc(r.testo)}</div>` : "")
      : video.length && !r.testo && !audio ? ""
      : `<div class="lettera">${esc(r.testo ?? "")}${audio ? `<div style="margin-top:14px">${pulsanteVoce(url[audio.path], audio.durata_sec, 1, "margin:0;background:rgba(18,48,44,.9)")}</div>` : ""}</div>`}
    ${r.tipo === "ricetta" ? `<div class="card" style="margin-top:12px">
      <span class="tenue" style="text-transform:uppercase;font-weight:800;letter-spacing:.5px">Ingredienti${r.dettagli?.porzioni ? ` · per ${r.dettagli.porzioni} persone` : ""}</span>
      <ul style="padding-left:20px;margin:8px 0 0;line-height:1.7">${(r.dettagli?.ingredienti ?? []).map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
      ${r.dettagli?.procedimento ? `<span class="tenue" style="text-transform:uppercase;font-weight:800;letter-spacing:.5px;display:block;margin-top:14px">Come si fa</span>
        <p style="white-space:pre-line;margin:6px 0 0;line-height:1.6">${esc(r.dettagli.procedimento)}</p>` : ""}
    </div>
    ${r.autore_id === state.io.id ? `<div class="card" id="condivisione" style="background:#FFF6E8;border-color:#F0D5A8">
      <b style="display:block">🔗 Condividi questa ricetta</b>
      <p class="tenue" style="margin:4px 0 10px">Solo questa, con chi vuoi tu. Chi la riceve vede foto e titolo e, per leggerla tutta, si iscrive gratis ad Ancora. Il resto della famiglia resta privato.</p>
      <div id="cond-azioni"></div></div>` : ""}` : ""}
    <div class="pad tenue">${cuori.length ? `♥ ${cuori.map((c) => esc(nomeDi(c.persone))).join(", ")}` : ""}</div>

    ${(risposte ?? []).length ? `<h2>Risposte</h2>` + risposte.map((x) => {
      const a = (x.ricordi_media ?? []).find((m) => m.tipo === "audio");
      return `<div class="card"><div class="riga">${avatar(x.persone, 32)}<b>${esc(nomeDi(x.persone))}</b></div>
        ${x.testo ? `<p style="margin:10px 0 0">${esc(x.testo)}</p>` : ""}
        ${a ? pulsanteVoce(url[a.path], a.durata_sec, 2, "margin:10px 0 0;background:var(--notte)") : ""}</div>`;
    }).join("") : ""}

    ${commenti.length ? `<h2>Commenti</h2>` + commenti.map((c) =>
      `<div class="card"><b>${esc(nomeDi(c.persone))}</b> ${esc(c.testo)}</div>`).join("") : ""}

    <div class="pad" style="margin-top:12px">
      ${r.autore_id !== state.io.id ? `<a class="btn ambra" href="#/racconta?risposta=${r.id}">Rispondi con la tua voce</a>`
        : `<div class="card" style="margin:0 0 10px"><label style="margin-top:0">Chi lo vede</label>
            <div>${[{ id: "solo_io", nome: "Solo io" }, ...state.cerchie].map((c) => {
              const on = c.id === "solo_io" ? r.visibilita === "solo_io" : r.cerchia_id === c.id && r.visibilita === "cerchia";
              return `<button class="chip ${on ? "on" : ""}" data-vedo="${c.id}">${esc(c.nome)}</button>`;
            }).join("")}</div>
            <button class="chip" data-elimina style="margin-top:8px;color:var(--rosso)">Elimina</button></div>`}
      <form id="rx" style="margin-top:10px">
        <label class="visually-hidden" for="msg">Scrivi un commento</label>
        <div class="riga"><input id="msg" placeholder="Scrivi a ${esc(nomeDi(r.persone))}…">
          <button class="icona" aria-label="Invia" style="background:var(--notte);color:#fff;flex-shrink:0">${ICONE.commento.replace('width="26" height="26"', 'width="20" height="20"')}</button></div>
      </form>
    </div>`;

  document.querySelectorAll("[data-vedo]").forEach((b) => b.onclick = async () => {
    const c = b.dataset.vedo;
    await sb.from("ricordi").update(c === "solo_io" ? { visibilita: "solo_io", cerchia_id: null } : { visibilita: "cerchia", cerchia_id: c }).eq("id", id);
    location.reload();
  });
  document.querySelector("[data-elimina]")?.addEventListener("click", async () => {
    if (!confirm("Eliminare questo ricordo per sempre?")) return;
    const file = (r.ricordi_media ?? []).map((m) => m.path);
    if (file.length) await sb.storage.from("ricordi").remove(file);
    await sb.from("ricordi").delete().eq("id", id);
    history.back();
  });

  document.getElementById("rx").onsubmit = async (e) => {
    e.preventDefault();
    const t = document.getElementById("msg").value.trim();
    if (!t) return;
    await sb.from("reazioni").insert({ ricordo_id: id, persona_id: state.io.id, tipo: "commento", testo: t });
    location.reload();
  };
  if (r.tipo === "ricetta" && r.autore_id === state.io.id) condivisioneRicetta(r);
}

// la ricetta condivisa con un link: crea, manda su WhatsApp, smetti di condividere
export async function condivisioneRicetta(r) {
  const box = document.getElementById("cond-azioni"); if (!box) return;
  const base = location.href.split("#")[0];
  const disegna = async (token) => {
    if (!token) {
      box.innerHTML = `<button class="btn ambra" id="cond-crea" style="margin:0">Crea il link e condividi</button>`;
      box.querySelector("#cond-crea").onclick = async () => {
        const { data, error } = await sb.rpc("ricetta_condividi", { p_ricordo: r.id, p_attiva: true });
        if (error) { alert("Non riuscito. Riprova."); return; }
        r.link_pubblico = data; await disegna(data); manda(data);
      };
      return;
    }
    const { data: letture } = await sb.rpc("ricetta_letture", { p_ricordo: r.id });
    box.innerHTML = `<button class="btn ambra" id="cond-manda" style="margin:0">Manda il link</button>
      <p class="tenue" style="margin:10px 0 0;font-size:14px">Link attivo${letture ? ` · letta da ${letture} ${letture === 1 ? "persona" : "persone"}` : ""} · <a href="#" id="cond-stop" style="color:var(--rosso)">smetti di condividere</a></p>`;
    box.querySelector("#cond-manda").onclick = () => manda(token);
    box.querySelector("#cond-stop").onclick = async (e) => {
      e.preventDefault();
      if (!confirm("Il link smette di funzionare per tutti. Continuare?")) return;
      await sb.rpc("ricetta_condividi", { p_ricordo: r.id, p_attiva: false });
      r.link_pubblico = null; disegna(null);
    };
  };
  const manda = async (token) => {
    const link = `${base}#/ricetta?t=${token}&utm_source=ricetta&utm_medium=condivisione`;
    const testo = `Ti mando la ricetta di ${r.titolo ?? "famiglia"}: la trovi qui 👇`;
    if (navigator.share) { try { await navigator.share({ title: r.titolo ?? "Ricetta", text: testo, url: link }); return; } catch { /* annullato */ } }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${testo}\n${link}`)}`, "_blank");
  };
  await disegna(r.link_pubblico);
}
