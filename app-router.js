(() => {
  "use strict";

  const MODULES = Object.freeze({
    "music.html": () => import("./routes/music.js"),
    "friends.html": () => import("./routes/friends.js"),
    "portal.html": () => import("./routes/portal.js"),
    "home.html": () => import("./routes/home.js"),
    "public-profile.html": () => import("./routes/public-profile.js"),
    "messages.html": () => import("./routes/messages.js"),
    "profile.html": () => import("./routes/profile.js")
  });
  const modulePromises = new Map();
  const baseUrl = new URL("./", document.baseURI);
  let shell = null;
  let activeRoute = null;
  let activeDispose = null;
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
      style.textContent = "body{margin:0}#floustream-app-shell{width:100%;min-height:100vh}#floustream-route-view{width:100%;min-height:100vh;outline:none}";
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

    const rootShell = ensureShell();
    const viewHost = rootShell.querySelector("#floustream-route-view");
    const useShadow = module.shadow !== false;
    const view = useShadow ? (viewHost.shadowRoot || viewHost.attachShadow({ mode: "open" })) : viewHost;
    const previousDispose = activeDispose;
    activeDispose = null;
    if (previousDispose) {
      try { await previousDispose(); } catch (error) { console.warn("FLOUSTREAM route dispose:", error); }
    }
    if (id !== navigationId) return false;

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
      if (!options.keepScroll) window.scrollTo({ top: 0, behavior: "auto" });
      viewHost.focus({ preventScroll: true });
      const mountedAt = performance.now();
      recordRouteMetric({
        route: target.route,
        moduleLoadMs: Math.round(moduleLoadMs * 100) / 100,
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
    if (!options.popstate && !options.replace) history.pushState({ floustreamRoute: target.route }, "", target.url.href);
    if (options.replace) history.replaceState({ floustreamRoute: target.route }, "", target.url.href);
    return render(target, { ...options, navigation: !options.popstate });
  }

  function canPrefetch() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return !(connection && (connection.saveData || connection.effectiveType === "2g" || connection.effectiveType === "slow-2g"));
  }

  function prefetch(input) {
    if (!canPrefetch()) return false;
    const target = resolve(input);
    if (!target) return false;
    loadModule(target.route).catch(error => console.warn("FLOUSTREAM route prefetch:", error));
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
    if (target) render(target, { popstate: true, keepScroll: false });
  });

  window.FloustreamRouter = Object.freeze({
    navigate,
    prefetch,
    resolve,
    get activeRoute() { return activeRoute; }
  });

  const initial = resolve(location.href);
  if (initial) render(initial, { replace: true }).catch(error => console.error("FLOUSTREAM router startup:", error));
})();