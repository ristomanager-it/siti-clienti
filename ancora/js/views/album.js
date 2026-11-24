// Album degli eventi (Ancora+). #/album = i miei album e "crea"; #/album/<id> = foto e QR da stampare.
// Gli invitati caricano da #/evento/<codice> (pagina pubblica, senza account).
import { sb, state, $app, esc, urlMediaMolti, passaPiu, seServePiu } from "../app.js";
import qrcode from "https://esm.sh/qrcode-generator@1.4.4";

const linkEvento = (codice) => `${location.origin}${location.pathname}#/evento/${codice}`;

export default async function ({ id } = {}) {
  if (id) return dettaglio(id);
  const { data: album } = await sb.from("album_eventi").select("id, titolo, giorno, cerchia_id, album_foto(count)").order("creato_il", { ascending: false });
  $app().innerHTML = `
    <header class="testa"><b style="font-family:Fraunces,serif;font-size:24px;flex:1">Album degli eventi</b></header>
    <div class="pad" style="padding-top:0">
      <button class="btn ambra" id="nuovo">+ Nuovo album</button>
      ${(album ?? []).map((a) => `<a href="#/album/${a.id}" style="display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid var(--bordo);text-decoration:none;color:inherit">
        <span style="font-size:28px">📸</span><span style="flex:1"><b>${esc(a.titolo)}</b><br><span class="tenue" style="font-size:14px">${a.giorno ? new Date(a.giorno).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) + " · " : ""}${a.album_foto?.[0]?.count ?? 0} foto</span></span>›</a>`).join("")
        || `<p class="tenue" style="margin-top:12px">Matrimoni, battesimi, compleanni, il pranzo di Natale: crei l'album, stampi il QR, e gli invitati caricano le foto dal loro telefono.</p>`}
    </div>`;
  document.getElementById("nuovo").onclick = () => nuovo();   // il primo album è gratis; dal secondo serve Ancora+ (lo dice il database)
}

function nuovo() {
  const f = document.createElement("div");
  f.innerHTML = `<div data-chiudi style="position:fixed;inset:0;background:rgba(18,48,44,.45);z-index:40"></div>
    <form style="position:fixed;left:0;right:0;bottom:0;z-index:41;background:#FBF8F2;border-radius:24px 24px 0 0;padding:20px 18px calc(20px + env(safe-area-inset-bottom))">
      <div class="riga"><b style="flex:1;font-size:20px">Nuovo album</b><button type="button" data-chiudi class="chip" style="margin:0">Chiudi</button></div>
      <label for="a-t">Evento</label><input id="a-t" required maxlength="80" placeholder="Il matrimonio di Giulia e Marco">
      <label for="a-g">Giorno</label><input id="a-g" type="date">
      <label for="a-c">Le foto vanno a</label><select id="a-c">${state.cerchie.map((c) => `<option value="${c.id}">${esc(c.nome)}</option>`).join("")}</select>
      <label style="display:flex;gap:10px;align-items:flex-start;font-weight:600;margin:14px 0 0"><input type="checkbox" id="a-o" checked style="width:22px;height:22px;flex-shrink:0">
        <span>Gli invitati possono vedere tutte le foto della festa <small class="tenue" style="display:block;font-weight:400">Dopo l'iscrizione gratuita ad Ancora. Il resto della famiglia resta privato.</small></span></label>
      <button class="btn ambra" style="margin-top:14px">Crea l'album</button>
    </form>`;
  document.body.appendChild(f);
  f.querySelectorAll("[data-chiudi]").forEach((x) => x.onclick = () => f.remove());
  f.querySelector("form").onsubmit = async (e) => {
    e.preventDefault();
    const { data, error } = await sb.from("album_eventi").insert({ titolo: f.querySelector("#a-t").value.trim(), giorno: f.querySelector("#a-g").value || null,
      cerchia_id: f.querySelector("#a-c").value, creato_da: state.io.id, ospiti_vedono: f.querySelector("#a-o").checked }).select("id").single();
    if (error) { if (seServePiu(error)) { f.remove(); return; } alert("Non creato: " + error.message); return; }
    f.remove(); location.hash = `#/album/${data.id}`;
  };
}

async function dettaglio(id) {
  const { data: a } = await sb.from("album_eventi").select("*").eq("id", id).maybeSingle();
  if (!a) { $app().innerHTML = `<p class="pad">Album non trovato.</p>`; return; }
  const { data: foto } = await sb.from("album_foto").select("*").eq("album_id", id).order("creato_il", { ascending: false });
  const url = await urlMediaMolti((foto ?? []).map((x) => x.path));
  const link = linkEvento(a.codice);
  const qr = qrcode(0, "M"); qr.addData(link); qr.make();
  $app().innerHTML = `
    <header class="testa" style="gap:8px"><a href="#/album" aria-label="Indietro" style="font-size:24px;text-decoration:none;color:inherit;width:30px">‹</a>
      <b style="font-family:Fraunces,serif;font-size:22px;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(a.titolo)}</b></header>
    <div class="pad" style="padding-top:0">
      <div class="card" style="margin:0 0 12px;text-align:center" id="cartello">
        <div style="font-family:Fraunces,serif;font-size:22px;line-height:1.2">${esc(a.titolo)}</div>
        <p style="margin:6px 0 10px">Inquadra e carica le tue foto 📸</p>
        <div style="width:200px;margin:0 auto">${qr.createSvgTag({ cellSize: 5, margin: 2, scalable: true })}</div>
        <p class="tenue" style="font-size:12px;margin:8px 0 0">Senza scaricare niente · ${a.ospiti_vedono ? "e poi vedi tutte le foto della festa" : "le vedrà solo la famiglia"}</p></div>
      <div class="riga" style="gap:8px"><button class="btn" id="stampa" style="flex:1">Stampa il cartello</button>
        <a class="btn chiaro" style="flex:1" target="_blank" href="https://wa.me/?text=${encodeURIComponent(`Carica qui le tue foto di "${a.titolo}": ${link}`)}">Manda il link</a></div>
      <label style="display:flex;gap:10px;align-items:center;font-weight:600;margin:12px 0 0"><input type="checkbox" id="ospiti" ${a.ospiti_vedono ? "checked" : ""} style="width:22px;height:22px">
        Gli invitati iscritti vedono tutte le foto</label>
      <p class="tenue" style="margin:10px 0 0;font-size:13px">Aperto fino al ${new Date(a.aperto_fino).toLocaleDateString("it-IT", { day: "numeric", month: "long" })}.</p>
      <h2 style="padding-left:0">${foto?.length ?? 0} foto</h2>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px">${(foto ?? []).map((x) => x.mime?.startsWith("video")
        ? `<video src="${url[x.path]}" controls playsinline style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px"></video>`
        : `<a href="${url[x.path]}" target="_blank"><img src="${url[x.path]}" alt="${esc(x.nome_ospite ?? "")}" loading="lazy" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px"></a>`).join("")}</div>
    </div>`;
  document.getElementById("ospiti").onchange = async (e) => {
    const { error } = await sb.from("album_eventi").update({ ospiti_vedono: e.target.checked }).eq("id", id);
    if (error) { alert("Non salvato: " + error.message); e.target.checked = !e.target.checked; } else dettaglio(id);
  };
  document.getElementById("stampa").onclick = () => {
    const w = open("", "_blank");
    w.document.write(`<html><head><title>${esc(a.titolo)}</title><style>body{font-family:Georgia,serif;text-align:center;padding:40px}h1{font-size:38px;margin:0 0 10px}p{font-size:22px}svg{width:340px;height:340px}</style></head>
      <body><h1>${esc(a.titolo)}</h1><p>Inquadra con la fotocamera e carica le tue foto 📸</p>${qr.createSvgTag({ cellSize: 8, margin: 2 })}
      <p style="font-size:16px;color:#555">Senza scaricare niente · ${a.ospiti_vedono ? "poi vedi tutte le foto della festa" : "le vedrà solo la famiglia"} · Ancora</p><script>setTimeout(()=>print(),400)<\/script></body></html>`);
    w.document.close();
  };
}
