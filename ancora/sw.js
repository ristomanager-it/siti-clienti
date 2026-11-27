// Service worker: cache dell'app e notifiche push (gratuite, a differenza di WhatsApp)
const CACHE = "ancora-v194";
const FILE = ["./", "index.html", "css/app.css", "js/app.js", "manifest.webmanifest"];

self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILE))); });
self.addEventListener("activate", (e) => e.waitUntil(
  caches.keys().then((k) => Promise.all(k.filter((x) => x !== CACHE).map((x) => caches.delete(x)))).then(() => self.clients.claim()),
));
self.addEventListener("fetch", (e) => {
  // condiviso dentro Ancora da un'altra app (Android): foto, video o un link → la pagina "Racconta" già pronta
  const u = new URL(e.request.url);
  if (e.request.method === "POST" && u.origin === location.origin && u.pathname.endsWith("/condividi")) {
    e.respondWith((async () => {
      const d = await e.request.formData();
      const c = await caches.open("ancora-condivisi");
      for (const k of await c.keys()) await c.delete(k);
      const testo = [d.get("title"), d.get("text"), d.get("url")].filter((x) => x && String(x).trim()).join("\n");
      await c.put("condivisi/testo", new Response(testo));
      let i = 0;
      for (const f of d.getAll("media")) {
        if (!(f instanceof File) || !f.size) continue;
        await c.put(`condivisi/${i++}`, new Response(f, { headers: { "Content-Type": f.type, "X-Nome": encodeURIComponent(f.name || `file-${i}`) } }));
      }
      return Response.redirect(`./#/racconta?condivisi=1`, 303);
    })());
    return;
  }
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  // si apre all'istante: i file dell'app arrivano dal telefono, e intanto si aggiornano in sottofondo.
  // Una versione nuova la prende l'app stessa (versione.txt), che svuota questa cache e ricarica.
  if (u.pathname.endsWith("versione.txt")) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const salvata = await c.match(e.request, { ignoreSearch: false });
    const rete = fetch(e.request, { cache: "no-cache" }).then((r) => { if (r.ok && r.type === "basic") c.put(e.request, r.clone()); return r; });
    if (salvata) { e.waitUntil(rete.catch(() => {})); return salvata; }
    return rete.catch(() => caches.match(e.request));
  })());
});

self.addEventListener("push", (e) => {
  const d = e.data ? e.data.json() : {};
  e.waitUntil((async () => {
    await self.registration.showNotification(d.titolo ?? "Ancora", { body: d.testo ?? "", icon: "icons/icon-192.png", badge: "icons/favicon-32.png", data: { url: d.url ?? "./#/" },
      // i giochi, se scelto "poche": senza suono e al posto della precedente (non si accumulano)
      ...(d.silenziosa ? { silent: true } : {}), ...(d.tag ? { tag: d.tag, renotify: false } : {}) });
    // numerino rosso sull'icona dell'app: quante notifiche non ancora aperte
    const n = (await self.registration.getNotifications()).length;
    try { await self.navigator.setAppBadge?.(n || 1); } catch { /* non supportato */ }
  })());
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  self.registration.getNotifications().then((l) => { try { l.length ? self.navigator.setAppBadge?.(l.length) : self.navigator.clearAppBadge?.(); } catch { /* niente */ } });
  e.waitUntil(clients.openWindow(e.notification.data.url));
});
