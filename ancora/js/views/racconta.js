// Racconta: un grande pulsante da tenere premuto, foto, e la cerchia con cui condividere.
import { sb, state, $app, esc, ICONE } from "../app.js";

export default async function ({ params }) {
  let domanda = null, rispostaA = null;
  if (params.domanda) {
    const { data } = await sb.from("domande_inviate").select("id, testo").eq("id", params.domanda).maybeSingle();
    domanda = data;
  }
  if (params.risposta) {
    const { data } = await sb.from("ricordi").select("id, titolo, cerchia_id, persone:autore_id(nome, soprannome)").eq("id", params.risposta).maybeSingle();
    rispostaA = data;
  }
  const cerchie = state.cerchie;
  let scelta = rispostaA?.cerchia_id ?? cerchie.find((c) => c.tipo === "famiglia")?.id ?? "solo_io";
  const invito = domanda?.testo
    ?? (rispostaA ? `Rispondi a ${rispostaA.persone?.soprannome ?? rispostaA.persone?.nome}` : null)
    ?? (params.foto ? "Chi c'è in questa foto? Dove eravate?" : "Racconta una cosa che vuoi ricordare.");

  $app().innerHTML = `
    <header class="testa"><span class="logo" style="font-size:22px">Racconta</span><span></span></header>
    <div class="pad">
      <div class="lettera" style="margin:0;font-size:19px">${esc(invito)}</div>
      <button id="rec" class="rec" type="button" aria-label="Tieni premuto e parla">${ICONE.mic.replace('width="26" height="26"', 'width="48" height="48"')}</button>
      <p id="stato" class="tenue" style="text-align:center" role="status">Tieni premuto e parla</p>
      <audio id="anteprima" controls hidden></audio>
      <label for="testo">Oppure scrivi</label>
      <textarea id="testo" rows="3"></textarea>
      <label for="foto">Foto</label>
      <input id="foto" type="file" accept="image/*" multiple>
      <label>Con chi lo condividi</label>
      <div id="cerchie">${[{ id: "solo_io", nome: "Solo io" }, ...cerchie].map((c) =>
        `<button type="button" class="chip ${c.id === scelta ? "on" : ""}" data-c="${c.id}">${esc(c.nome)}</button>`).join("")}</div>
      <label class="riga" style="font-weight:700"><input id="memoria" type="checkbox" checked style="width:auto"> Entra nella memoria</label>
      <button id="salva" class="btn" style="margin-top:16px">Condividi</button>
      <p id="esito" role="status"></p>
    </div>`;

  document.querySelectorAll("#cerchie .chip").forEach((b) => b.onclick = () => {
    scelta = b.dataset.c;
    document.querySelectorAll("#cerchie .chip").forEach((x) => x.classList.toggle("on", x === b));
  });

  // --- registrazione: tieni premuto ---
  let blob = null, secondi = 0, inizio = 0;
  const rec = document.getElementById("rec"), stato = document.getElementById("stato");
  let mr, pezzi = [];
  rec.addEventListener("pointerdown", async (e) => {
    e.preventDefault();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mr = new MediaRecorder(stream); pezzi = []; inizio = Date.now();
      mr.ondataavailable = (ev) => pezzi.push(ev.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        secondi = Math.round((Date.now() - inizio) / 1000);
        blob = new Blob(pezzi, { type: mr.mimeType });
        const a = document.getElementById("anteprima"); a.src = URL.createObjectURL(blob); a.hidden = false;
        stato.textContent = "Registrato. Ascolta e condividi, oppure tieni premuto per rifarlo.";
      };
      mr.start(); rec.classList.add("on"); stato.textContent = "Sto ascoltando… lascia per finire";
    } catch {
      stato.innerHTML = `<span class="errore">Il microfono non è disponibile. Se sei dentro WhatsApp, apri Ancora nel browser.</span>`;
    }
  });
  const ferma = () => { if (mr?.state === "recording") { mr.stop(); rec.classList.remove("on"); } };
  rec.addEventListener("pointerup", ferma);
  rec.addEventListener("pointerleave", ferma);

  document.getElementById("salva").onclick = async () => {
    const esito = document.getElementById("esito");
    const testo = document.getElementById("testo").value.trim();
    const files = [...document.getElementById("foto").files];
    if (!blob && !testo && !files.length) { esito.textContent = "Registra, scrivi o aggiungi una foto."; return; }
    esito.textContent = "Salvataggio…";

    const { data: r, error } = await sb.from("ricordi").insert({
      autore_id: state.io.id,
      tipo: rispostaA ? "risposta" : (files.length && !blob ? "foto" : "racconto"),
      titolo: domanda?.testo ?? null, testo: testo || null,
      visibilita: scelta === "solo_io" ? "solo_io" : "cerchia",
      cerchia_id: scelta === "solo_io" ? null : scelta,
      in_memoria: document.getElementById("memoria").checked,
      domanda_inviata_id: domanda?.id ?? null,
      in_risposta_a: rispostaA?.id ?? null,
    }).select("id").single();
    if (error) { esito.innerHTML = `<span class="errore">Non salvato: ${esc(error.message)}</span>`; return; }

    const base = `${state.io.id}/${r.id}`;
    if (blob) {
      const path = `${base}/vocale.${blob.type.includes("mp4") ? "m4a" : "webm"}`;
      await sb.storage.from("ricordi").upload(path, blob, { contentType: blob.type });
      await sb.from("ricordi_media").insert({ ricordo_id: r.id, path, tipo: "audio", durata_sec: secondi });
      // trascrizione lato server (funzione da aggiungere: trascrivi-ricordo)
    }
    for (const [i, f] of files.entries()) {
      const path = `${base}/foto-${i}.${f.name.split(".").pop()}`;
      await sb.storage.from("ricordi").upload(path, f, { contentType: f.type });
      await sb.from("ricordi_media").insert({ ricordo_id: r.id, path, tipo: "foto", ordine: i });
    }
    if (domanda) await sb.from("domande_inviate").update({ stato: "risposta", risposta_il: new Date().toISOString() }).eq("id", domanda.id);
    location.hash = rispostaA ? `#/ricordo/${rispostaA.id}` : "#/";
  };
}
