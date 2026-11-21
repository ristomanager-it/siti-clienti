// Archivio: tutti i racconti che posso vedere, filtrabili per persona. Il filtro di visibilità lo fa il database.
import { sb, state, $app, esc, iniziali, quando } from "../app.js";

export default async function ({ params }) {
  const { data: ricordi } = await sb.from("ricordi")
    .select("id, tipo, titolo, testo, creato_il, autore_id, persone:autore_id(nome, soprannome)")
    .order("creato_il", { ascending: false }).limit(100);

  const autori = [...new Map((ricordi ?? []).map((r) => [r.autore_id, r.persone?.soprannome ?? r.persone?.nome])).entries()];
  let filtro = params.persona ?? null;

  const disegna = () => {
    const lista = (ricordi ?? []).filter((r) => !filtro || r.autore_id === filtro)
      .filter((r) => !params.famiglia || r.autore_id !== state.io.id);
    $app().innerHTML = `
      <header class="testa"><span class="logo" style="font-size:22px">Racconti</span><span></span></header>
      <div class="pad">${[["", "Tutti"], ...autori].map(([id, n]) =>
        `<button class="chip ${(filtro ?? "") === id ? "on" : ""}" data-p="${id}">${esc(n)}</button>`).join("")}</div>
      ${lista.map((r) => `
        <a class="card riga" href="#/ricordo/${r.id}" style="text-decoration:none;color:inherit">
          <div class="avatar">${iniziali(r.persone?.soprannome ?? r.persone?.nome)}</div>
          <div><b>${esc(r.titolo ?? (r.testo ?? "").slice(0, 60) ?? "Ricordo")}</b>
            <div class="tenue">${esc(r.persone?.soprannome ?? r.persone?.nome)} · ${quando(r.creato_il)}</div></div>
        </a>`).join("") || `<p class="tenue">Nessun racconto.</p>`}`;
    document.querySelectorAll(".chip").forEach((c) => c.onclick = () => { filtro = c.dataset.p || null; disegna(); });
  };
  disegna();
}
