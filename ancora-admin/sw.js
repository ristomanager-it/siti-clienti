// Ancora Gestione: riceve gli avvisi (nuovi iscritti, regali, Ancora+, assistenza). Separato dall'app Ancora.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("push", (e) => {
  let d = {}; try { d = e.data.json(); } catch { d = { titolo: "Ancora Gestione", testo: e.data?.text() ?? "" }; }
  e.waitUntil(self.registration.showNotification(d.titolo ?? "Ancora Gestione", {
    body: d.testo ?? "", icon: "icons/icon-192.png", badge: "icons/icon-192.png", data: { url: d.url ?? "./" }, tag: "gestione-" + Date.now(),
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url ?? "./";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((tutte) => {
    const aperta = tutte.find((c) => c.url.includes("/ancora-admin/"));
    return aperta ? aperta.focus() : self.clients.openWindow(url);
  }));
});
