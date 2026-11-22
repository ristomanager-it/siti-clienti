// Calendario: appuntamenti di famiglia, agenda personale (solo tu), compleanni dall'albero, vacanze ed esami dall'agenda.
// #/calendario?m=2026-12  (mese)   ·   tocca un giorno per vederlo, "+" per aggiungere.
import { sb, state, $app, esc } from "../app.js";

const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default async function ({ params } = {}) {
  const oggi = new Date(); oggi.setHours(0, 0, 0, 0);
  const [y, m] = (params?.m ?? `${oggi.getFullYear()}-${oggi.getMonth() + 1}`).split("-").map(Number);
  const primo = new Date(y, m - 1, 1), ultimo = new Date(y, m, 0);
  const da = iso(primo), a = iso(ultimo);

  const [{ data: ev }, { data: ag }, { data: comp }] = await Promise.all([
    sb.from("eventi").select("*").gte("giorno", da).lte("giorno", a).order("ora", { nullsFirst: true }),
    sb.from("agenda").select("id, tipo, titolo, dal, al, cerchia_id").lte("dal", a).or(`al.gte.${da},and(al.is.null,dal.gte.${da})`),
    sb.rpc("compleanni")]);

  const nomeCerchia = (id) => id ? (state.cerchie.find((c) => c.id === id)?.nome ?? "Famiglia") : "Solo tu";
  const perGiorno = new Map();
  const metti = (g, voce) => { if (!perGiorno.has(g)) perGiorno.set(g, []); perGiorno.get(g).push(voce); };
  for (const e of ev ?? []) metti(e.giorno, { tipo: "evento", e, testo: e.titolo, ora: e.ora?.slice(0, 5), dove: e.luogo, chi: nomeCerchia(e.cerchia_id), colore: e.cerchia_id ? "#4D7356" : "#5D635F" });
  for (const v of ag ?? []) {
    const ic = v.tipo === "vacanze" ? "🏖" : v.tipo === "esami" ? "🎓" : "📚";
    const inizio = new Date(v.dal), fine = new Date(v.al ?? v.dal);
    for (let d = new Date(Math.max(inizio, primo)); d <= fine && d <= ultimo; d.setDate(d.getDate() + 1))
      metti(iso(d), { tipo: "agenda", testo: `${ic} ${v.titolo}`, chi: nomeCerchia(v.cerchia_id), colore: "#C9832E", link: `#/agenda?t=${v.tipo}` });
  }
  for (const c of comp ?? []) if (c.mese === m) {
    const anni = c.anno ? y - c.anno : null;
    metti(iso(new Date(y, m - 1, c.giorno)), { tipo: "compleanno", testo: `🎂 ${c.nome}${anni ? ` · ${anni} anni` : ""}`, chi: "Compleanno", colore: "#B3402F" });
  }

  const sel = params?.g ?? (oggi >= primo && oggi <= ultimo ? iso(oggi) : null);
  const prec = new Date(y, m - 2, 1), succ = new Date(y, m, 1);
  const vuoti = (primo.getDay() + 6) % 7;   // la settimana parte dal lunedì

  $app().innerHTML = `
    <header class="testa"><b style="font-family:Fraunces,serif;font-size:24px;flex:1">Calendario</b></header>
    <div class="pad" style="padding-top:0">
      <div class="riga" style="margin-bottom:8px">
        <a class="icona" href="#/calendario?m=${prec.getFullYear()}-${prec.getMonth() + 1}" aria-label="Mese prima" style="font-size:24px;text-decoration:none;color:inherit;width:44px;text-align:center">‹</a>
        <b style="flex:1;text-align:center;font-size:19px;text-transform:capitalize">${MESI[m - 1]} ${y}</b>
        <a class="icona" href="#/calendario?m=${succ.getFullYear()}-${succ.getMonth() + 1}" aria-label="Mese dopo" style="font-size:24px;text-decoration:none;color:inherit;width:44px;text-align:center">›</a></div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center">
        ${["L", "M", "M", "G", "V", "S", "D"].map((g) => `<span class="tenue" style="font-size:12px;font-weight:800">${g}</span>`).join("")}
        ${Array.from({ length: vuoti }, () => "<span></span>").join("")}
        ${Array.from({ length: ultimo.getDate() }, (_, i) => {
          const d = iso(new Date(y, m - 1, i + 1)), voci = perGiorno.get(d) ?? [], eOggi = d === iso(oggi);
          return `<a href="#/calendario?m=${y}-${m}&g=${d}" style="aspect-ratio:1;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;text-decoration:none;font-weight:700;
            color:${d === sel ? "#FBF3E2" : "var(--testo)"};background:${d === sel ? "var(--notte)" : eOggi ? "#F3E6CF" : "#fff"};border:1px solid ${eOggi ? "var(--ambra)" : "var(--bordo)"}">${i + 1}
            <span style="display:flex;gap:2px;height:6px">${[...new Set(voci.map((v) => v.colore))].slice(0, 3).map((c) => `<i style="width:6px;height:6px;border-radius:3px;background:${c}"></i>`).join("")}</span></a>`;
        }).join("")}
      </div>
      <div class="riga" style="margin:18px 0 6px"><b style="flex:1;font-size:18px">${sel ? new Date(sel).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }) : "Questo mese"}</b>
        <button class="btn ambra" id="aggiungi" style="width:auto;margin:0;min-height:40px;padding:0 16px">+ Aggiungi</button></div>
      <div id="lista">${(sel ? [[sel, perGiorno.get(sel) ?? []]] : [...perGiorno].sort(([x], [y2]) => x.localeCompare(y2)))
        .map(([g, voci]) => voci.map((v) => `<div style="display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--bordo)">
          <span style="width:4px;align-self:stretch;border-radius:2px;background:${v.colore}"></span>
          <span style="flex:1"><b>${v.ora ? `${v.ora} · ` : ""}${esc(v.testo)}</b><br><span class="tenue" style="font-size:14px">${sel ? "" : new Date(g).toLocaleDateString("it-IT", { day: "numeric", month: "short" }) + " · "}${esc(v.chi)}${v.dove ? ` · ${esc(v.dove)}` : ""}</span></span>
          ${v.tipo === "evento" && v.e.autore_id === state.io.id ? `<button class="chip" data-togli="${v.e.id}" style="margin:0" aria-label="Togli">✕</button>` : v.link ? `<a class="chip" href="${v.link}" style="margin:0;text-decoration:none">Apri</a>` : ""}</div>`).join("")).join("")
        || `<p class="tenue">${sel ? "Niente in questo giorno." : "Niente questo mese."}</p>`}</div>
    </div>`;

  document.getElementById("aggiungi").onclick = () => nuovo(sel ?? iso(oggi < primo ? primo : oggi));
  document.querySelectorAll("[data-togli]").forEach((b) => b.onclick = async () => {
    if (!confirm("Togliere questo appuntamento?")) return;
    await sb.from("eventi").delete().eq("id", b.dataset.togli); location.reload();
  });
}

function nuovo(giorno) {
  const famiglie = [...state.cerchie];
  const f = document.createElement("div");
  f.innerHTML = `<div data-chiudi style="position:fixed;inset:0;background:rgba(18,48,44,.45);z-index:40"></div>
    <form style="position:fixed;left:0;right:0;bottom:0;z-index:41;max-height:90vh;overflow:auto;background:#FBF8F2;border-radius:24px 24px 0 0;padding:20px 18px calc(20px + env(safe-area-inset-bottom))">
      <div class="riga"><b style="flex:1;font-size:20px">Nuovo appuntamento</b><button type="button" data-chiudi class="chip" style="margin:0">Chiudi</button></div>
      <label for="e-t">Cosa</label><input id="e-t" required maxlength="120" placeholder="Visita della nonna, recita, pranzo di Natale">
      <div class="riga" style="gap:8px"><div style="flex:1"><label for="e-g">Giorno</label><input id="e-g" type="date" required value="${giorno}"></div>
        <div style="flex:1"><label for="e-o">Ora (se c'è)</label><input id="e-o" type="time"></div></div>
      <label for="e-l">Dove</label><input id="e-l" maxlength="120">
      <label for="e-c">Per chi</label>
      <select id="e-c">${famiglie.map((c) => `<option value="${c.id}">${esc(c.nome)}</option>`).join("")}<option value="">Solo io (agenda personale)</option></select>
      <button class="btn ambra" style="margin-top:14px">Aggiungi</button>
    </form>`;
  document.body.appendChild(f);
  f.querySelectorAll("[data-chiudi]").forEach((x) => x.onclick = () => f.remove());
  f.querySelector("form").onsubmit = async (e) => {
    e.preventDefault();
    const v = (id) => f.querySelector("#" + id).value.trim();
    const { error } = await sb.from("eventi").insert({ titolo: v("e-t"), giorno: v("e-g"), ora: v("e-o") || null, luogo: v("e-l") || null, cerchia_id: v("e-c") || null, autore_id: state.io.id });
    if (error) { alert("Non salvato: " + error.message); return; }
    f.remove(); const g = v("e-g"); location.hash = `#/calendario?m=${g.slice(0, 4)}-${Number(g.slice(5, 7))}&g=${g}`;
  };
}
