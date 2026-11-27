// Service worker: cache dell'app e notifiche push (gratuite, a differenza di WhatsApp)
const CACHE = "ancora-v178";
const FILE = ["./", "index.html", "css/app.css", "js/app.js", "manifest.webmanifest"];

self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILE))); });
self.addEventListener("activate", (e) => e.waitUntil(
  caches.keys().then((k) => Promise.all(k.filter((x) => x !== CACHE).map((x) => caches.delete(x)))).then(() => self.clients.claim()),
));
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  // sempre la versione più nuova (il telefono non tiene file vecchi); offline, quella salvata
  e.respondWith(fetch(e.request, { cache: "no-cache" }).catch(() => caches.match(e.request)));
});

self.addEventListener("push", (e) => {
  const d = e.data ? e.data.json() : {};
  e.waitUntil((async () => {
    await self.registration.showNotification(d.titolo ?? "Ancora", { body: d.testo ?? "", icon: "icons/icon-192.png", badge: "icons/favicon-32.png", data: { url: d.url ?? "./#/" } });
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
