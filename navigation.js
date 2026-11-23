(function () {
  "use strict";

  const ROUTES = new Set([
    "portal.html",
    "home.html",
    "profile.html",
    "messages.html",
    "friends.html",
    "public-profile.html",
    "music.html",
    "backgammon.html"
  ]);
  const MAX_PREFETCHES = 4;
  const PREFETCH_DELAY_MS = 90;
  const prefetched = new Set();
  const pending = new WeakMap();
  const baseUrl = new URL("./", document.baseURI);

  function isNetworkConstrained() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return Boolean(connection && (connection.saveData || /^(slow-)?2g$/.test(connection.effectiveType || "")));
  }

  function findAnchor(event) {
    const path = typeof event.composedPath === "function" ? event.composedPath() : [];
    return path.find(node => node instanceof HTMLAnchorElement) ||
      (event.target && event.target.closest ? event.target.closest("a[href]") : null);
  }

  function resolveRoute(anchor) {
    if (!(anchor instanceof HTMLAnchorElement)) return null;
    if (anchor.hasAttribute("download") || anchor.target && anchor.target !== "_self") return null;
    if (anchor.relList.contains("external") || anchor.hasAttribute("data-no-prefetch")) return null;

    let url;
    try {
      url = new URL(anchor.href, document.baseURI);
    } catch (_) {
      return null;
    }
    if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return null;
    if (!url.pathname.startsWith(baseUrl.pathname)) return null;

    const route = url.pathname.slice(baseUrl.pathname.length).split("/")[0];
    if (!ROUTES.has(route) || url.pathname.slice(baseUrl.pathname.length).includes("/")) return null;
    if (url.href === location.href || (url.pathname === location.pathname && url.search === location.search)) return null;
    return { url, route };
  }

  function prefetch(anchor) {
    if (isNetworkConstrained() || prefetched.size >= MAX_PREFETCHES) return false;
    const resolved = resolveRoute(anchor);
    if (!resolved) return false;

    const isSpaRoute = resolved.route !== "backgammon.html" &&
      window.FloustreamRouter &&
      typeof window.FloustreamRouter.prefetch === "function";
    const key = isSpaRoute ? `spa:${resolved.route}` : resolved.url.href;
    if (prefetched.has(key)) return true;
    prefetched.add(key);

    if (isSpaRoute) {
      const accepted = window.FloustreamRouter.prefetch(resolved.url);
      if (!accepted) prefetched.delete(key);
      return accepted;
    }

    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = key;
    link.dataset.floustreamPrefetch = "true";
    link.addEventListener("error", () => {
      prefetched.delete(key);
      link.remove();
    }, { once: true });
    document.head.appendChild(link);
    return true;
  }

  function schedule(anchor, immediate) {
    const oldTimer = pending.get(anchor);
    if (oldTimer) clearTimeout(oldTimer);
    if (immediate) {
      prefetch(anchor);
      return;
    }
    pending.set(anchor, setTimeout(() => {
      pending.delete(anchor);
      prefetch(anchor);
    }, PREFETCH_DELAY_MS));
  }

  document.addEventListener("pointerover", event => {
    if (event.pointerType === "touch") return;
    const anchor = findAnchor(event);
    if (anchor && !anchor.contains(event.relatedTarget)) schedule(anchor, false);
  }, { passive: true });

  document.addEventListener("focusin", event => {
    const anchor = findAnchor(event);
    if (anchor) schedule(anchor, true);
  });

  document.addEventListener("pointerdown", event => {
    const anchor = findAnchor(event);
    if (anchor) schedule(anchor, true);
  }, { passive: true });

  document.addEventListener("touchstart", event => {
    const anchor = findAnchor(event);
    if (anchor) schedule(anchor, true);
  }, { passive: true });

  window.FloustreamNavigation = Object.freeze({
    routes: Object.freeze(Array.from(ROUTES)),
    prefetch,
    resolveRoute
  });
})();
