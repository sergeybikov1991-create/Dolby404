/* FLOUSTREAM: page caching disabled. Always load current pages from GitHub Pages. */
self.addEventListener("install", event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith("floustream-shell-"))
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

// Open the exact conversation associated with a clicked message notification.
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "messages.html", self.registration.scope);
  if (target.origin !== self.location.origin) return;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if (typeof client.navigate === "function") await client.navigate(target.href);
      await client.focus();
      return;
    }
    await self.clients.openWindow(target.href);
  })());
});

// Intentionally no fetch handler: HTML, scripts, styles, auth/session data,
// Supabase API responses and media are never cached by this service worker.
