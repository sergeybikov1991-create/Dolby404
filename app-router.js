import { prefetchRouteStylesheet } from "./shared/route-styles.mjs";

(() => {
  "use strict";

  const MODULES = Object.freeze({
    "music.html": () => import("./routes/music.js"),
    "friends.html": () => import("./routes/friends.js?v=20261124-10"),
    "portal.html": () => import("./routes/portal.js"),
    "home.html": () => import("./routes/home.js?v=20261124-10"),
    "public-profile.html": () => import("./routes/public-profile.js?v=20261124-10"),
    "messages.html": () => import("./routes/messages.js?v=20261124-13"),
    "profile.html": () => import("./routes/profile.js")
  });
  const modulePromises = new Map();
  const stylesheetPrefetches = new Set();
  const baseUrl = new URL("./", document.baseURI);
  let shell = null;
  let activeRoute = null;
  let activeDispose = null;
  let scrollSaveTimer = null;
  let pendingScrollRestore = null;
  try { history.scrollRestoration = "manual"; } catch (_) {}

  function saveScrollPosition() {
    if (scrollSaveTimer !== null) {
      clearTimeout(scrollSaveTimer);
      scrollSaveTimer = null;
    }
    if (!activeRoute) return;
    const state = history.state && typeof history.state === "object" ? history.state : {};
    history.replaceState({
      ...state,
      floustreamRoute: activeRoute,
      floustreamScrollY: window.scrollY
    }, "", location.href);
  }

  function cancelPendingScrollRestore() {
    if (pendingScrollRestore) pendingScrollRestore();
  }

  function restoreScrollPosition(value, renderId) {
    const targetY = Math.max(0, Math.round(Number(value) || 0));
    if (!targetY) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }
    cancelPendingScrollRestore();
    let observer = null;
    let timer = null;
    let finished = false;
    const cleanup = () => {
      if (finished) return;
      finished = true;
      observer?.disconnect();
      if (timer !== null) clearTimeout(timer);
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchstart", cancel);
      window.removeEventListener("keydown", cancel);
      if (pendingScrollRestore === cleanup) pendingScrollRestore = null;
    };
    const cancel = () => cleanup();
    const attempt = () => {
      if (renderId !== navigationId) {
        cleanup();
        return;
      }
      const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      if (maxY >= targetY) {
        window.scrollTo({ top: targetY, behavior: "auto" });
        cleanup();
      }
    };
    if (typeof ResizeObserver === "function") {
      observer = new ResizeObserver(attempt);
      observer.observe(document.documentElement);
    }
    pendingScrollRestore = cleanup;
    window.addEventListener("wheel", cancel, { once: true, passive: true });
    window.addEventListener("touchstart", cancel, { once: true, passive: true });
    window.addEventListener("keydown", cancel, { once: true });
    timer = setTimeout(() => {
      if (renderId === navigationId) window.scrollTo({ top: targetY, behavior: "auto" });
      cleanup();
    }, 1200);
    requestAnimationFrame(() => requestAnimationFrame(attempt));
  }

  window.addEventListener("scroll", () => {
    if (!activeRoute || scrollSaveTimer !== null) return;
    scrollSaveTimer = setTimeout(() => {
      scrollSaveTimer = null;
      saveScrollPosition();
    }, 120);
  }, { passive: true });
  window.addEventListener("pagehide", saveScrollPosition);
  let pendingController = null;
  let navigationId = 0;
  const routeMetrics = [];
  const runtimeErrors = [];
  const diagnostics = Object.freeze({
    getMetrics: () => routeMetrics.slice(),
    getErrors: () => runtimeErrors.slice(),
    clear: () => { routeMetrics.length = 0; runtimeErrors.length = 0; }
  });
  window.FloustreamPerformance = diagnostics;

  function recordRuntimeError(type, route) {
    runtimeErrors.push({ type, route: route || activeRoute || "unknown", at: Date.now() });
    if (runtimeErrors.length > 50) runtimeErrors.shift();
  }

  function recordRouteMetric(metric) {
    routeMetrics.push(metric);
    if (routeMetrics.length > 50) routeMetrics.shift();
    window.dispatchEvent(new CustomEvent("floustream:route-metric", { detail: metric }));
  }

  window.addEventListener("error", () => recordRuntimeError("window-error", activeRoute));
  window.addEventListener("unhandledrejection", () => recordRuntimeError("unhandled-rejection", activeRoute));

  function resolve(input) {
    let url;
    try { url = new URL(input, location.href); } catch (_) { return null; }
    if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return null;
    if (!url.pathname.startsWith(baseUrl.pathname)) return null;
    const route = url.pathname.slice(baseUrl.pathname.length);
    if (!Object.prototype.hasOwnProperty.call(MODULES, route)) return null;
    return { url, route };
  }

  function loadModule(route) {
    if (!modulePromises.has(route)) {
      modulePromises.set(route, MODULES[route]().catch(error => {
        modulePromises.delete(route);
        throw error;
      }));
    }
    return modulePromises.get(route);
  }

  function ensureShell() {
    if (shell) return shell;
    if (!document.getElementById("floustream-shell-style")) {
      const style = document.createElement("style");
      style.id = "floustream-shell-style";
      style.textContent = "html,body{min-height:100%;background:#090910}body{margin:0;background:radial-gradient(ellipse at 18% 0%,#20102f 0,transparent 42%),#090910;color:#f5f0ff}#floustream-app-shell{position:relative;width:100%;min-height:100vh;background:transparent}#floustream-route-view{width:100%;min-height:100vh;outline:none}#floustream-route-view.floustream-route-enter{animation:floustreamRouteEnter 220ms cubic-bezier(.2,.7,.25,1) both}@keyframes floustreamRouteEnter{from{opacity:.72;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}@media(prefers-reduced-motion:reduce){#floustream-route-view.floustream-route-enter{animation:none}}";
      document.head.appendChild(style);
    }
    shell = document.createElement("div");
    shell.id = "floustream-app-shell";
    shell.innerHTML = '<div id="floustream-route-view" role="main" tabindex="-1" aria-live="polite"></div>';
    return shell;
  }

  async function render(target, options = {}) {
    const navigationStartedAt = performance.now();
    const moduleWasCached = modulePromises.has(target.route);
    const moduleStartedAt = performance.now();
    const id = ++navigationId;
    cancelPendingScrollRestore();
    if (pendingController) pendingController.abort();
    let module;
    try {
      module = await loadModule(target.route);
    } catch (error) {
      recordRuntimeError("module-load", target.route);
      throw error;
    }
    const moduleLoadMs = performance.now() - moduleStartedAt;
    if (id !== navigationId) return false;

    // Keep the current route visible while the next route's CSS is fetched.
    // The same resolved stylesheet text is then reused by attachRouteStyles().
    const stylesheetStartedAt = performance.now();
    try {
      await prefetchRouteStylesheet(module.stylesheet);
    } catch (error) {
      console.warn("FLOUSTREAM route stylesheet preload:", target.route, error);
    }
    const stylesheetLoadMs = performance.now() - stylesheetStartedAt;
    if (id !== navigationId) return false;

    const rootShell = ensureShell();
    let viewHost = rootShell.querySelector("#floustream-route-view");
    const useShadow = module.shadow !== false;
    const previousDispose = activeDispose;
    activeDispose = null;
    if (previousDispose) {
      try { await previousDispose(); } catch (error) { console.warn("FLOUSTREAM route dispose:", error); }
    }
    if (id !== navigationId) return false;

    // A host with an attached ShadowRoot cannot display its light-DOM children.
    // The legacy profile route intentionally mounts in light DOM for page-level
    // styling, so give it a fresh host when arriving from a shadow-rendered route.
    if (!useShadow && viewHost.shadowRoot) {
      const replacement = viewHost.cloneNode(false);
      viewHost.replaceWith(replacement);
      viewHost = replacement;
    }
    const view = useShadow ? (viewHost.shadowRoot || viewHost.attachShadow({ mode: "open" })) : viewHost;

    const routeController = new AbortController();
    pendingController = routeController;
    if (!useShadow && !rootShell.isConnected) document.body.replaceChildren(rootShell);
    const previousTitle = document.title;
    const mountStartedAt = performance.now();
    try {
      const dispose = await module.mount(view, {
        url: target.url,
        signal: routeController.signal,
        navigate,
        prefetch
      });
      if (id !== navigationId) {
        routeController.abort();
        if (typeof dispose === "function") await dispose();
        if (pendingController === routeController) pendingController = null;
        return false;
      }
      if (pendingController === routeController) pendingController = null;
      activeRoute = target.route;
      activeDispose = async () => {
        routeController.abort();
        if (typeof dispose === "function") await dispose();
      };
      document.title = module.title || previousTitle;
      if (!rootShell.isConnected) document.body.replaceChildren(rootShell);
      if (!options.keepScroll) {
        if (options.popstate) restoreScrollPosition(options.restoreScrollY, id);
        else window.scrollTo({ top: 0, behavior: "auto" });
      }
      if (options.navigation || options.popstate) {
        viewHost.classList.remove("floustream-route-enter");
        void viewHost.offsetWidth;
        viewHost.classList.add("floustream-route-enter");
      }
      viewHost.focus({ preventScroll: true });
      const mountedAt = performance.now();
      recordRouteMetric({
        route: target.route,
        moduleLoadMs: Math.round(moduleLoadMs * 100) / 100,
        stylesheetLoadMs: Math.round(stylesheetLoadMs * 100) / 100,
        mountMs: Math.round((mountedAt - mountStartedAt) * 100) / 100,
        totalMs: Math.round((mountedAt - navigationStartedAt) * 100) / 100,
        moduleWasCached,
        navigationType: options.popstate ? "popstate" : (options.navigation ? "navigate" : "initial"),
        at: Date.now()
      });
      return true;
    } catch (error) {
      recordRuntimeError("route-mount", target.route);
      routeController.abort();
      if (pendingController === routeController) pendingController = null;
      console.error("FLOUSTREAM route mount failed:", error);
      if (options.popstate || options.navigation) location.reload();
      return false;
    }
  }

  async function navigate(input, options = {}) {
    const target = resolve(input);
    if (!target) {
      if (input instanceof URL || typeof input === "string") location.assign(String(input));
      return false;
    }
    if (target.url.href === location.href && activeRoute === target.route) return true;
    if (!options.popstate && !options.replace) {
      saveScrollPosition();
      history.pushState({ floustreamRoute: target.route, floustreamScrollY: 0 }, "", target.url.href);
    }
    if (options.replace) {
      history.replaceState({ floustreamRoute: target.route, floustreamScrollY: 0 }, "", target.url.href);
    }
    return render(target, { ...options, navigation: !options.popstate });
  }

  function canPrefetch() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return !(connection && (connection.saveData || connection.effectiveType === "2g" || connection.effectiveType === "slow-2g"));
  }

  function prefetchStylesheet(module) {
    const href = module && module.stylesheet;
    if (typeof href !== "string" || stylesheetPrefetches.has(href)) return;
    stylesheetPrefetches.add(href);
    prefetchRouteStylesheet(href).catch(error => {
      stylesheetPrefetches.delete(href);
      console.warn("FLOUSTREAM stylesheet prefetch:", error);
    });
  }

  function prefetch(input) {
    if (!canPrefetch()) return false;
    const target = resolve(input);
    if (!target) return false;
    loadModule(target.route).then(prefetchStylesheet).catch(error => console.warn("FLOUSTREAM route prefetch:", error));
    return true;
  }

  function findAnchor(event) {
    const path = typeof event.composedPath === "function" ? event.composedPath() : [];
    return path.find(node => node instanceof HTMLAnchorElement) ||
      (event.target && event.target.closest ? event.target.closest("a[href]") : null);
  }

  document.addEventListener("click", event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = findAnchor(event);
    if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return;
    const target = resolve(anchor.href);
    if (!target) return;
    event.preventDefault();
    navigate(target.url);
  });

  window.addEventListener("popstate", () => {
    const target = resolve(location.href);
    const state = history.state && typeof history.state === "object" ? history.state : {};
    if (target) render(target, {
      popstate: true,
      keepScroll: false,
      restoreScrollY: state.floustreamScrollY
    });
  });

  window.FloustreamRouter = Object.freeze({
    navigate,
    prefetch,
    resolve,
    get activeRoute() { return activeRoute; }
  });

  const initial = resolve(location.href);
  if (initial) {
    const state = history.state && typeof history.state === "object" ? history.state : {};
    history.replaceState({
      ...state,
      floustreamRoute: initial.route,
      floustreamScrollY: window.scrollY
    }, "", location.href);
    render(initial, { replace: true }).catch(error => console.error("FLOUSTREAM router startup:", error));
  }
})();