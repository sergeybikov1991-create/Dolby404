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

// Intentionally no fetch handler: HTML, scripts, styles, auth/session data,
// Supabase API responses and media are never cached by this service worker.
