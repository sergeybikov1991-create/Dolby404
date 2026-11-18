/* FLOUSTREAM page-shell cache. Private Supabase data and uploaded media are never cached. */
const CACHE_NAME = "floustream-shell-v1";
const SHELL_PAGES = [
  "./", "./index.html", "./portal.html", "./profile.html",
  "./public-profile.html", "./messages.html", "./friends.html",
  "./home.html", "./music.html"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(SHELL_PAGES.map(async path => {
      try {
        const url = new URL(path, self.registration.scope);
        const response = await fetch(new Request(url.href, { cache: "reload" }));
        if (response.ok && response.type === "basic") {
          await cache.put(new Request(url.origin + url.pathname), response);
        }
      } catch (_) {
        // Cache other pages even if one route is temporarily unavailable.
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith("floustream-shell-") && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;

  if (request.mode === "navigate") {
    const key = new Request(url.origin + url.pathname);
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(key);
      const update = fetch(request).then(async response => {
        if (response.ok && response.type === "basic") await cache.put(key, response.clone());
        return response;
      });
      if (cached) {
        event.waitUntil(update.catch(() => {}));
        return cached;
      }
      return update;
    })());
    return;
  }

  // Only small same-origin code/style/font files; no API, media, or third-party data.
  if (/\.(?:js|css|woff2?)$/i.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      const update = fetch(request).then(async response => {
        if (response.ok && response.type === "basic") await cache.put(request, response.clone());
        return response;
      });
      if (cached) {
        event.waitUntil(update.catch(() => {}));
        return cached;
      }
      return update;
    })());
  }
});
