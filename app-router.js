(() => {
  "use strict";

  const MODULES = Object.freeze({
    "music.html": () => import("./routes/music.js"),
    "friends.html": () => import("./routes/friends.js"),
    "portal.html": () => import("./routes/portal.js")
  });
  const modulePromises = new Map();
  const baseUrl = new URL("./", document.baseURI);
  let shell = null;
  let activeRoute = null;
  let activeDispose = null;
  let navigationId = 0;

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
    shell.innerHTML = '<main id="floustream-route-view" tabindex="-1" aria-live="polite"></main>';
    return shell;
  }

  async function render(target, options = {}) {
    const id = ++navigationId;
    const module = await loadModule(target.route);
    if (id !== navigationId) return false;

    const rootShell = ensureShell();
    const view = rootShell.querySelector("#floustream-route-view");
    const previousDispose = activeDispose;
    activeDispose = null;
    if (previousDispose) {
      try { await previousDispose(); } catch (error) { console.warn("FLOUSTREAM route dispose:", error); }
    }
    if (id !== navigationId) return false;

    const routeController = new AbortController();
    const previousTitle = document.title;
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
        return false;
      }
      activeRoute = target.route;
      activeDispose = async () => {
        routeController.abort();
        if (typeof dispose === "function") await dispose();
      };
      document.title = module.title || previousTitle;
      if (!rootShell.isConnected) document.body.replaceChildren(rootShell);
      if (!options.keepScroll) window.scrollTo({ top: 0, behavior: "auto" });
      view.focus({ preventScroll: true });
      return true;
    } catch (error) {
      routeController.abort();
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

  function prefetch(input) {
    const target = resolve(input);
    if (!target) return false;
    loadModule(target.route).catch(error => console.warn("FLOUSTREAM route prefetch:", error));
    return true;
  }

  document.addEventListener("click", event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target && event.target.closest ? event.target.closest("a[href]") : null;
    if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return;
    const target = resolve(anchor.href);
    if (!target) return;
    event.preventDefault();
    navigate(target.url);
  });

  document.addEventListener("pointerover", event => {
    if (event.pointerType === "touch") return;
    const anchor = event.target && event.target.closest ? event.target.closest("a[href]") : null;
    if (anchor && !anchor.contains(event.relatedTarget)) prefetch(anchor.href);
  }, { passive: true });
  document.addEventListener("focusin", event => {
    const anchor = event.target && event.target.closest ? event.target.closest("a[href]") : null;
    if (anchor) prefetch(anchor.href);
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