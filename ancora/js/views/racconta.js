// Racconta: un grande pulsante da tenere premuto, foto, e la cerchia con cui condividere.
import { sb, state, $app, esc, ICONE, nomeDi, personeConosciute, chiediSuMisura, seServePiu } from "../app.js";

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
  let domandaSett = null;
  if (params.settimana && params.q) {
    const { data } = await sb.from("domande_famiglia").select("testo").eq("id", params.q).maybeSingle();
    domandaSett = data?.testo ?? null;
  }
  const cerchie = state.cerchie;
  const lettera = !!params.lettera;
  const persone = await personeConosciute();
  let scelta = lettera ? "persona" : params.c || rispostaA?.cerchia_id || cerchie.find((c) => c.tipo === "famiglia")?.id || "solo_io";
  let quando = lettera ? "1" : "subito";
  const spunto = params.spunto ? String(params.spunto).slice(0, 200) : null;
  const invito = lettera ? "Scrivi una lettera a chi vuoi tu. Resta chiusa fino al giorno che scegli: prima, vede solo che c'è." : domandaSett ?? domanda?.testo ?? spunto
    ?? (rispostaA ? `Rispondi a ${rispostaA.persone?.soprannome ?? rispostaA.persone?.nome}` : null)
    ?? (params.ricetta ? "La ricetta di famiglia: racconta come si fa, e chi te l'ha insegnata."
      : params.foto ? "Chi c'è in questa foto? Dove eravate?" : "Racconta una cosa che vuoi ricordare.");

  $app().innerHTML = `
    <header class="testa"><span class="logo" style="font-size:22px">${lettera ? "Una lettera" : "Racconta"}</span><span></span></header>
    <div class="pad">
      <div class="lettera" style="margin:0;font-size:19px">${esc(invito)}</div>
      <button id="rec" class="rec" type="button" aria-label="Tieni premuto e parla">${ICONE.mic.replace('width="26" height="26"', 'width="48" height="48"')}</button>
      <p id="stato" class="tenue" style="text-align:center" role="status">Tieni premuto e parla</p>
      <audio id="anteprima" controls hidden></audio>
      <label class="riga" style="font-weight:800;color:var(--testo)"><input id="isric" type="checkbox" ${params.ricetta ? "checked" : ""} style="width:22px;height:22px"> È una ricetta</label>
      <div id="ric" ${params.ricetta ? "" : "hidden"}>
        <label for="rnome">Nome della ricetta</label><input id="rnome" placeholder="Il ragù della nonna">
        <label for="rpor">Per quante persone</label><input id="rpor" inputmode="numeric" placeholder="6" style="width:auto">
        <label for="ring">Ingredienti, uno per riga</label><textarea id="ring" rows="5" placeholder="500 g di macinato misto&#10;1 kg di passata&#10;1 bicchiere di vino rosso"></textarea>
        <label for="rpro">Come si fa</label><textarea id="rpro" rows="5" placeholder="Il segreto è la pazienza: almeno tre ore a fuoco basso…"></textarea>
      </div>
      <label for="testo">Oppure scrivi</label>
      <textarea id="testo" rows="3"></textarea>
      <label for="foto">Foto o video</label>
      <input id="foto" type="file" accept="image/*,video/*" multiple>
      <label>Per chi lo scrivi</label>
      <div id="cerchie">${[{ id: "solo_io", nome: "Solo io" }, ...cerchie, ...(persone.length ? [{ id: "persona", nome: "Una persona" }] : [])].map((c) =>
        `<button type="button" class="chip ${c.id === scelta ? "on" : ""}" data-c="${c.id}">${esc(c.nome)}</button>`).join("")}</div>
      <div id="chi" ${scelta === "persona" ? "" : "hidden"}><label for="dest">A chi</label>
        <select id="dest"><option value="">Scegli…</option>${persone.map((p) => `<option value="${p.id}" data-nasc="${p.data_nascita ?? ""}">${esc(nomeDi(p))}${p.dove ? ` · ${esc(p.dove)}` : ""}</option>`).join("")}</select></div>
      <details id="dopo" ${lettera ? "open" : ""} style="margin-top:14px"><summary style="font-weight:800;cursor:pointer">✉️ Da aprire più avanti</summary>
        <p class="tenue" style="margin:6px 0">Fino a quel giorno resta chiusa: chi la riceve vede solo che c'è e quando si apre.</p>
        <div id="quando">${[["subito", "Subito"], ["1", "Tra 1 anno"], ["5", "Tra 5 anni"], ["10", "Tra 10 anni"], ["18", "Ai suoi 18 anni"], ["data", "Scegli il giorno"]].map(([k, t]) =>
          `<button type="button" class="chip ${k === quando ? "on" : ""}" data-q="${k}" ${k === "18" ? "hidden" : ""}>${t}</button>`).join("")}</div>
        <input id="qdata" type="date" hidden style="width:auto" min="${new Date(Date.now() + 86400_000).toISOString().slice(0, 10)}">
      </details>
      <div id="luogo-box" style="margin-top:12px">
        <button type="button" class="chip" id="luogo-btn" style="margin:0">📍 Aggiungi un luogo</button>
        <div id="luogo-campo" hidden>
          <label for="luogo">Dove</label>
          <div class="riga" style="gap:8px"><input id="luogo" maxlength="80" placeholder="Orlando, Florida · la casa al mare" style="flex:1;margin:0" autocomplete="off">
            <button type="button" class="chip" id="luogo-qui" style="margin:0;white-space:nowrap">📍 Qui</button></div>
          <div id="luogo-proposte" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px"></div>
          <small class="tenue" id="luogo-stato"></small></div></div>
      <label class="riga" style="font-weight:700"><input id="memoria" type="checkbox" checked style="width:auto"> Entra nella memoria</label>
      <button id="salva" class="btn" style="margin-top:16px">${lettera ? "Chiudi la lettera" : "Condividi"}</button>
      <p id="esito" role="status"></p>
    </div>`;

  if (params.condivisi) riprendiCondivisi();
  document.getElementById("isric").onchange = (e) => { document.getElementById("ric").hidden = !e.target.checked; };

  document.querySelectorAll("#cerchie .chip").forEach((b) => b.onclick = () => {
    scelta = b.dataset.c;
    document.querySelectorAll("#cerchie .chip").forEach((x) => x.classList.toggle("on", x === b));
    document.getElementById("chi").hidden = scelta !== "persona";
    aggiorna18();
  });
  const dest = document.getElementById("dest");
  // "ai suoi 18 anni" solo se scrivo a una persona di cui so la data e che non li ha ancora compiuti
  const diciotto = () => {
    const n = scelta === "persona" ? dest.selectedOptions[0]?.dataset.nasc : "";
    if (!n) return null;
    const d = new Date(n + "T12:00"); d.setFullYear(d.getFullYear() + 18);
    return d > new Date() ? d.toISOString().slice(0, 10) : null;
  };
  const aggiorna18 = () => {
    const b = document.querySelector('#quando [data-q="18"]'); b.hidden = !diciotto();
    if (b.hidden && quando === "18") document.querySelector('#quando [data-q="subito"]').click();
  };
  dest.onchange = aggiorna18;
  document.querySelectorAll("#quando .chip").forEach((b) => b.onclick = () => {
    quando = b.dataset.q;
    document.querySelectorAll("#quando .chip").forEach((x) => x.classList.toggle("on", x === b));
    document.getElementById("qdata").hidden = quando !== "data";
  });
  const dataApertura = () => {
    if (quando === "subito") return null;
    if (quando === "18") return diciotto();
    if (quando === "data") return document.getElementById("qdata").value || "";
    const d = new Date(); d.setFullYear(d.getFullYear() + Number(quando)); return d.toISOString().slice(0, 10);
  };

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

  // 📍 il luogo: un locale, un posto, una città. Si cerca mentre scrivi, oppure "Qui" propone i locali intorno (OpenStreetMap).
  // Si salva il nome e le coordinate del posto (per un locale le sue; per "Qui" arrotondate a circa 1 km).
  let luogoQui = null, vicino = null, giro = 0;
  const box = document.getElementById("luogo-proposte"), campo = document.getElementById("luogo"), st = document.getElementById("luogo-stato");
  const TAG = ["amenity:restaurant", "amenity:cafe", "amenity:bar", "amenity:pub", "amenity:fast_food", "amenity:ice_cream", "amenity:pizzeria",
    "tourism:hotel", "tourism:attraction", "tourism:museum", "tourism:viewpoint", "leisure:park", "leisure:beach_resort", "natural:beach", "shop:bakery", "amenity:place_of_worship"]
    .map((t) => `&osm_tag=${t}`).join("");
  const nomeDiPosto = (p) => { const x = p.properties ?? {}; const dove = x.city ?? x.town ?? x.village ?? x.county ?? "";
    return x.name ? (dove && dove !== x.name ? `${x.name}, ${dove}` : x.name) : dove; };
  const proponi = (lista, intestazione = "") => {
    box.innerHTML = (intestazione ? `<small class="tenue" style="width:100%">${intestazione}</small>` : "") + lista.map((p, i) => `<button type="button" class="chip" data-p="${i}" style="margin:0">${esc(p.nome)}</button>`).join("");
    box.querySelectorAll("[data-p]").forEach((b) => b.onclick = () => { luogoQui = lista[Number(b.dataset.p)]; campo.value = luogoQui.nome; box.innerHTML = ""; });
  };
  const daPhoton = (feats) => [...new Map((feats ?? []).map((f) => { const n = nomeDiPosto(f); const [lon, lat] = f.geometry?.coordinates ?? []; return [n, { nome: n, lat: Math.round(lat * 1e4) / 1e4, lon: Math.round(lon * 1e4) / 1e4 }]; })
    .filter(([n]) => n)).values()].slice(0, 8);
  document.getElementById("luogo-btn").onclick = (e) => { e.target.hidden = true; document.getElementById("luogo-campo").hidden = false; campo.focus(); };
  // mentre scrivi: locali e posti che si chiamano così (vicino a te, se hai toccato "Qui")
  campo.oninput = () => {
    luogoQui = null; const q = campo.value.trim(); const io = ++giro;
    if (q.length < 3) { box.innerHTML = ""; return; }
    setTimeout(async () => {
      if (io !== giro) return;
      try {
        const j = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8${vicino ? `&lat=${vicino.lat}&lon=${vicino.lon}` : ""}`).then((r) => r.json());
        if (io === giro) proponi(daPhoton(j.features));
      } catch { /* senza proposte si scrive a mano */ }
    }, 350);
  };
  // "Qui": la città e i locali intorno a te
  document.getElementById("luogo-qui").onclick = () => {
    if (!navigator.geolocation) { st.textContent = "Questo telefono non dà la posizione: scrivi il luogo."; return; }
    st.textContent = "Cerco dove sei…";
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: la, longitude: lo } = pos.coords;
      vicino = { lat: la, lon: lo };
      const citta = { nome: "", lat: Math.round(la * 100) / 100, lon: Math.round(lo * 100) / 100 };
      try {
        const j = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&accept-language=it&lat=${la}&lon=${lo}`).then((r) => r.json());
        const a = j.address ?? {};
        const posto = a.city ?? a.town ?? a.municipality ?? a.village ?? a.county ?? "";
        const zona = a.country_code === "it" ? (a.county ?? a.state ?? "") : (a.state ?? a.country ?? "");
        citta.nome = [posto, zona && zona !== posto ? zona : ""].filter(Boolean).join(", ");
      } catch { /* niente */ }
      let locali = [];
      try { locali = daPhoton((await fetch(`https://photon.komoot.io/reverse?lat=${la}&lon=${lo}&limit=12&radius=0.4${TAG}`).then((r) => r.json())).features); } catch { /* niente */ }
      st.textContent = "";
      if (citta.nome) { luogoQui = citta; campo.value = citta.nome; }
      const lista = [...(citta.nome ? [citta] : []), ...locali.filter((x) => x.nome !== citta.nome)];
      if (lista.length) proponi(lista, locali.length ? "Sei in uno di questi posti?" : "");
      else st.textContent = "Non trovo il nome del posto: scrivilo tu.";
    }, () => { st.textContent = "Posizione non permessa: scrivi il luogo."; }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 });
  };

  document.getElementById("salva").onclick = async () => {
    const esito = document.getElementById("esito");
    const testo = document.getElementById("testo").value.trim();
    const files = [...document.getElementById("foto").files];
    const isRic = document.getElementById("isric").checked;
    const ricetta = isRic ? {
      nome: document.getElementById("rnome").value.trim() || "Ricetta di famiglia",
      porzioni: parseInt(document.getElementById("rpor").value, 10) || null,
      ingredienti: document.getElementById("ring").value.split("\n").map((x) => x.trim()).filter(Boolean),
      procedimento: document.getElementById("rpro").value.trim() || null,
    } : null;
    if (!blob && !testo && !files.length && !ricetta?.ingredienti.length && !ricetta?.procedimento) { esito.textContent = "Registra, scrivi o aggiungi una foto."; return; }
    const destinatario = scelta === "persona" ? dest.value : null;
    if (scelta === "persona" && !destinatario) { esito.textContent = "Scegli a chi è destinata."; return; }
    const apre = dataApertura();
    if (apre === "") { esito.textContent = "Scegli il giorno in cui si apre."; return; }
    if (apre && scelta === "solo_io") { esito.textContent = "Una lettera da aprire più avanti va a qualcuno: scegli la famiglia o una persona."; return; }
    esito.textContent = "Salvataggio…";

    const { data: r, error } = await sb.from("ricordi").insert({
      autore_id: state.io.id,
      tipo: ricetta ? "ricetta" : rispostaA ? "risposta" : (files.length && !blob ? "foto" : "racconto"),
      titolo: ricetta ? ricetta.nome : domandaSett ?? domanda?.testo ?? null, testo: testo || null,
      domanda_settimana: domandaSett ? params.settimana : null,
      dettagli: (() => {
        const d = ricetta ? { porzioni: ricetta.porzioni, ingredienti: ricetta.ingredienti, procedimento: ricetta.procedimento } : {};
        const nomeLuogo = document.getElementById("luogo")?.value.trim();
        if (nomeLuogo) d.luogo = { nome: nomeLuogo, ...(luogoQui && luogoQui.nome === nomeLuogo ? { lat: luogoQui.lat, lon: luogoQui.lon } : {}) };
        return Object.keys(d).length ? d : null;
      })(),
      visibilita: scelta === "solo_io" ? "solo_io" : destinatario ? "diretto" : "cerchia",
      cerchia_id: scelta === "solo_io" || destinatario ? null : scelta,
      destinatario_id: destinatario,
      sblocco: apre ? "da_data" : "subito", sblocco_data: apre,
      in_memoria: document.getElementById("memoria").checked,
      domanda_inviata_id: domanda?.id ?? null,
      in_risposta_a: rispostaA?.id ?? null,
    }).select("id").single();
    if (error) { if (seServePiu(error)) { esito.innerHTML = ""; return; } esito.innerHTML = `<span class="errore">Non salvato: ${esc(error.message)}</span>`; return; }

    const base = `${state.io.id}/${r.id}`;
    if (blob) {
      const path = `${base}/vocale.${blob.type.includes("mp4") ? "m4a" : "webm"}`;
      await sb.storage.from("ricordi").upload(path, blob, { contentType: blob.type });
      await sb.from("ricordi_media").insert({ ricordo_id: r.id, path, tipo: "audio", durata_sec: secondi, byte: blob.size, mime: blob.type || null });
      // trascrizione lato server (funzione da aggiungere: trascrivi-ricordo)
    }
    const { videoPronto } = await import("../video.js");
    for (let [i, f] of files.entries()) {
      const tipoF = f.type.startsWith("video") ? "video" : "foto";
      if (tipoF === "video") { f = await videoPronto(f); if (!f) continue; }
      if (f.size > 50 * 1024 * 1024) { alert(`"${f.name}" supera i 50 MB e non è stato caricato.`); continue; }
      const path = `${base}/${tipoF}-${i}.${f.name.split(".").pop()}`;
      await sb.storage.from("ricordi").upload(path, f, { contentType: f.type });
      await sb.from("ricordi_media").insert({ ricordo_id: r.id, path, tipo: tipoF, ordine: i, byte: f.size, mime: f.type || null,
        scattato_il: f.lastModified ? new Date(f.lastModified).toISOString() : null });
    }
    if (domanda) await sb.from("domande_inviate").update({ stato: "risposta", risposta_il: new Date().toISOString() }).eq("id", domanda.id);
    if (testo || domanda || domandaSett) chiediSuMisura();
    if (apre) { alert(`Lettera chiusa. Si aprirà il ${new Date(apre + "T12:00").toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}.`); location.hash = "#/archivio"; return; }
    if (params.nodo && params.c) {
      await sb.from("albero_ricordi").insert({ nodo_id: params.nodo, ricordo_id: r.id, cerchia_id: params.c });
      location.hash = `#/albero?c=${params.c}&n=${params.nodo}`; return;
    }
    location.hash = rispostaA ? `#/ricordo/${rispostaA.id}` : "#/";
  };
}

// arrivato con "Condividi → Ancora" da un'altra app: il testo o il link e i file sono pronti nella pagina
async function riprendiCondivisi() {
  try {
    const c = await caches.open("ancora-condivisi");
    const t = await c.match("condivisi/testo"); const testo = t ? await t.text() : "";
    if (testo) { const el = document.getElementById("testo"); el.value = testo; el.dispatchEvent(new Event("input", { bubbles: true })); }
    const dt = new DataTransfer();
    for (const k of await c.keys()) {
      if (k.url.endsWith("/testo")) continue;
      const r = await c.match(k); const b = await r.blob();
      dt.items.add(new File([b], decodeURIComponent(r.headers.get("X-Nome") || "file"), { type: b.type }));
    }
    if (dt.files.length) { const f = document.getElementById("foto"); f.files = dt.files; f.dispatchEvent(new Event("change", { bubbles: true })); }
    for (const k of await c.keys()) await c.delete(k);
  } catch { /* niente */ }
}
