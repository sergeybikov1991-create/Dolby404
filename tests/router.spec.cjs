const { test, expect } = require("@playwright/test");

test("music route mounts inside the shared SPA shell", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto("/music.html", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#floustream-app-shell")).toBeVisible();
  await expect(page.locator(".fs-music-logo")).toHaveText("FLOUSTREAM");
  await expect(page.locator("#fs-home-player")).toHaveAttribute("src", /rutube\.ru\/play\/embed/);
  await expect(page.locator("#fs-music-status")).toContainText("Нажми");
  expect(pageErrors).toEqual([]);
});

test("route module lifecycle replaces the previous view and supports browser history", async ({ page }) => {
  await page.goto("/music.html", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#floustream-app-shell")).toBeVisible();

  const prefetchResult = await page.evaluate(() => ({
    known: window.FloustreamRouter.prefetch(new URL("music.html?track=home", location.href)),
    unknown: window.FloustreamRouter.resolve(new URL("not-a-route.html", location.href))
  }));
  expect(prefetchResult.known).toBe(true);
  expect(prefetchResult.unknown).toBeNull();

  await page.evaluate(() => window.FloustreamRouter.navigate(new URL("music.html?track=alternate", location.href)));
  await expect(page).toHaveURL(/music\.html\?track=alternate$/);
  await expect(page.locator(".fs-music-logo")).toHaveCount(1);
  await expect(page.locator("#floustream-app-shell > style")).toHaveCount(0);

  await page.goBack();
  await expect(page).toHaveURL(/music\.html$/);
  await expect(page.locator(".fs-music-logo")).toHaveCount(1);
  await expect(page.locator("#fs-home-player")).toHaveCount(1);
});

test("music controls remain functional after route mount", async ({ page }) => {
  await page.goto("/music.html", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Продолжить — включить музыку" }).click();
  await expect(page.locator("#fs-music-status")).toContainText("Отправлена команда запуска");
});

test("friends page mounts as an isolated route without duplicating legacy startup", async ({ page }) => {
  await page.addInitScript(() => {
    window.supabase = {
      createClient: () => ({
        auth: {
          getSession: async () => ({ data: { session: null }, error: null })
        }
      })
    };
  });
  await page.goto("/friends.html");
  await expect(page.locator("#floustream-app-shell")).toBeVisible();
  await expect(page.locator(".fs-route-friends .page-title")).toHaveText("Друзья");
  await expect(page.locator(".fs-route-friends #notice")).toContainText("Сессия не найдена");
  await expect(page.locator('style[data-floustream-route-style="friends"]')).toHaveCount(1);
});

test("music and friends route modules switch in-app and clean up the previous view", async ({ page }) => {
  await page.addInitScript(() => {
    window.supabase = {
      createClient: () => ({
        auth: {
          getSession: async () => ({ data: { session: null }, error: null })
        }
      })
    };
  });
  await page.goto("/music.html", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".fs-music-logo")).toBeVisible();

  await page.evaluate(() => window.FloustreamRouter.navigate(new URL("friends.html", location.href)));
  await expect(page).toHaveURL(/friends\.html$/);
  await expect(page.locator(".fs-route-friends .page-title")).toBeVisible();
  await expect(page.locator('style[data-floustream-route-style="music"]')).toHaveCount(0);
  await expect(page.locator('style[data-floustream-route-style="friends"]')).toHaveCount(1);

  await page.evaluate(() => window.FloustreamRouter.navigate(new URL("music.html", location.href)));
  await expect(page).toHaveURL(/music\.html$/);
  await expect(page.locator(".fs-music-logo")).toBeVisible();
  await expect(page.locator('style[data-floustream-route-style="friends"]')).toHaveCount(0);
  await expect(page.locator('style[data-floustream-route-style="music"]')).toHaveCount(1);

  await page.goBack();
  await expect(page).toHaveURL(/friends\.html$/);
  await expect(page.locator(".fs-route-friends .page-title")).toBeVisible();
  await expect(page.locator('style[data-floustream-route-style="music"]')).toHaveCount(0);
});

test("portal authentication screen is loaded as a route module from Music", async ({ page }) => {
  await page.addInitScript(() => {
    window.supabase = {
      createClient: () => ({
        auth: {
          getSession: async () => ({ data: { session: null }, error: null })
        }
      })
    };
  });
  await page.goto("/music.html", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".fs-music-logo")).toBeVisible();

  await page.locator(".fs-music-login").click();
  await expect(page).toHaveURL(/portal\.html$/);
  await expect(page.locator("#floustream-app-shell")).toBeVisible();
  await expect(page.locator(".fs-route-portal .logo")).toHaveText("FLOUSTREAM");
  await expect(page.locator("#register-button")).toBeEnabled();
  await expect(page.locator("#login-button")).toBeEnabled();
  await expect(page.locator("#auth-message")).toContainText("Система готова");

  await page.goBack();
  await expect(page).toHaveURL(/music\.html$/);
  await expect(page.locator(".fs-music-logo")).toBeVisible();
  await expect(page.locator('style[data-floustream-route-style="portal"]')).toHaveCount(0);
});

test("home feed mounts as a route module and releases presence on navigation", async ({ page }) => {
  await page.addInitScript(() => {
    const state = window.__homeTestState = { tracked: 0, untracked: 0, removed: 0, postsQueries: 0, clientFactoryCalls: 0 };
    const channel = {
      on() { return channel; },
      subscribe(callback) { callback("SUBSCRIBED"); return channel; },
      presenceState() { return {}; },
      track: async () => { state.tracked += 1; return {}; },
      untrack: async () => { state.untracked += 1; }
    };
    const client = {
      auth: {
        getSession: async () => ({ data: { session: { user: { id: "home-user", email: "home@example.test" } } }, error: null }),
        getUser: async () => ({ data: { user: { id: "home-user" } }, error: null }),
        signOut: async () => ({ error: null }),
        stopAutoRefresh: async () => {}
      },
      from(table) {
        if (table === "posts") state.postsQueries += 1;
        const query = {
          select() { return query; },
          order() { return query; },
          range: async () => ({ data: [], error: null })
        };
        return query;
      },
      channel() { return channel; },
      removeChannel: async () => { state.removed += 1; }
    };
    window.supabase = { createClient: () => { state.clientFactoryCalls += 1; return client; } };
  });

  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto("/home.html", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".fs-route-home #app")).toBeVisible();
  await expect(page.locator(".fs-route-home #status")).toContainText("Аккаунт подключён");
  await expect(page.locator(".fs-route-home #feed-empty")).toBeVisible();
  await expect(page.locator('style[data-floustream-route-style="home"]')).toHaveCount(1);

  await page.evaluate(() => window.FloustreamRouter.navigate(new URL("music.html", location.href)));
  await expect(page.locator(".fs-music-logo")).toBeVisible();
  await page.evaluate(() => window.FloustreamRouter.navigate(new URL("home.html", location.href)));
  await expect(page.locator(".fs-route-home #feed-empty")).toBeVisible();
  expect(await page.evaluate(() => window.__homeTestState.postsQueries)).toBe(1);

  await page.locator(".fs-route-home #logout-button").click();
  await expect(page).toHaveURL(/portal\.html$/);
  await expect(page.locator("#auth-message")).toContainText("Система готова");
  expect(await page.evaluate(() => window.__homeTestState.clientFactoryCalls)).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__homeTestState.removed)).toBe(2);
  await expect.poll(() => page.evaluate(() => window.__homeTestState.untracked)).toBe(2);
  await expect(page.locator('style[data-floustream-route-style="home"]')).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test("public profile mounts as an isolated route and cleans up on browser Back", async ({ page }) => {
  await page.addInitScript(() => {
    window.supabase = {
      createClient: () => ({
        auth: {
          getSession: async () => ({ data: { session: null }, error: null }),
          stopAutoRefresh: async () => {}
        }
      })
    };
  });
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.goto("/music.html", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".fs-music-logo")).toBeVisible();

  await page.evaluate(() => window.FloustreamRouter.navigate("public-profile.html"));
  await expect(page).toHaveURL(/public-profile\.html$/);
  await expect(page.locator("#floustream-app-shell")).toBeVisible();
  await expect(page.locator(".fs-route-public-profile #feed .status.error")).toContainText("Не указан профиль для просмотра");
  await expect(page.locator('style[data-floustream-route-style="public-profile"]')).toHaveCount(1);

  await page.goBack();
  await expect(page).toHaveURL(/music\.html$/);
  await expect(page.locator(".fs-music-logo")).toBeVisible();
  await expect(page.locator('style[data-floustream-route-style="public-profile"]')).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});




test("all SPA routes keep their styles in separate cacheable assets", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const routes = ["home", "portal", "friends", "messages", "profile", "public-profile", "music"];
  for (const route of routes) {
    const modulePath = path.resolve(__dirname, "..", "routes", route + ".js");
    const stylePath = path.resolve(__dirname, "..", "routes", "styles", route + ".css");
    const source = fs.readFileSync(modulePath, "utf8");
    const stylesheet = fs.readFileSync(stylePath, "utf8");
    expect(source).toMatch(new RegExp(`export const stylesheet = new URL\\("\\./styles/${route}\\.css\\?v=[^"]+", import.meta\\.url\\)\\.href;`));
    expect(source).toContain("attachRouteStyles(");
    expect(source).not.toContain("const STYLE =");
    expect(source).not.toContain("const STYLES =");
    expect(stylesheet.trim().length).toBeGreaterThan(0);
  }
});

test("browser Back restores the previous SPA route scroll position", async ({ page }) => {
  await page.addInitScript(() => {
    const client = { auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null })
    } };
    window.supabase = { createClient: () => client };
  });
  await page.goto("/portal.html");
  await expect(page.locator("#auth-message")).toContainText("Система готова");
  await page.evaluate(() => { document.body.style.minHeight = "2200px"; });
  await page.evaluate(() => window.FloustreamRouter.navigate(new URL("music.html", location.href)));
  await page.evaluate(() => window.scrollTo(0, 480));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(480);
  await page.evaluate(() => window.FloustreamRouter.navigate(new URL("friends.html", location.href)));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.evaluate(() => history.back());
  await expect(page).toHaveURL(/music\.html$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(480);
});

test("router exposes local route timing and error diagnostics without remote telemetry", async ({ page }) => {
  await page.addInitScript(() => {
    const client = { auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null })
    } };
    window.supabase = { createClient: () => client };
  });
  await page.goto("/portal.html", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#auth-message")).toContainText("Система готова");
  await page.evaluate(() => window.FloustreamPerformance.clear());
  await page.evaluate(() => window.FloustreamRouter.navigate(new URL("music.html", location.href)));
  await page.evaluate(() => window.FloustreamRouter.navigate(new URL("friends.html", location.href)));
  const result = await page.evaluate(() => ({
    metrics: window.FloustreamPerformance.getMetrics(),
    errors: window.FloustreamPerformance.getErrors()
  }));
  expect(result.metrics.slice(-2).map(item => item.route)).toEqual(["music.html", "friends.html"]);
  for (const metric of result.metrics.slice(-2)) {
    expect(metric.moduleLoadMs).toBeGreaterThanOrEqual(0);
    expect(metric.mountMs).toBeGreaterThanOrEqual(0);
    expect(metric.totalMs).toBeGreaterThanOrEqual(0);
    expect(metric.navigationType).toBe("navigate");
  }
  expect(result.errors).toEqual([]);
});

test("SPA route modules are prefetched on hover intent", async ({ page }) => {
  await page.goto("/music.html", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".fs-music-logo")).toBeVisible();
  const request = page.waitForRequest(request => request.url().includes("/routes/public-profile.js"));
  await page.evaluate(() => {
    const root = document.querySelector("#floustream-app-shell #floustream-route-view").shadowRoot;
    const link = document.createElement("a");
    link.href = new URL("public-profile.html", location.href).href;
    link.textContent = "Public profile prefetch probe";
    root.append(link);
    link.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, composed: true, pointerType: "mouse" }));
  });
  await request;
});

test("SPA route module prefetch respects Save-Data", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: { saveData: true, effectiveType: "4g" }
    });
  });
  await page.goto("/music.html", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".fs-music-logo")).toBeVisible();
  let requested = false;
  page.on("request", request => {
    if (request.url().includes("/routes/public-profile.js")) requested = true;
  });
  await page.evaluate(() => {
    const root = document.querySelector("#floustream-app-shell #floustream-route-view").shadowRoot;
    const link = document.createElement("a");
    link.href = new URL("public-profile.html", location.href).href;
    root.append(link);
    link.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, composed: true, pointerType: "mouse" }));
  });
  await page.waitForTimeout(180);
  expect(requested).toBe(false);
});


test("aborted profile route mount restores shared view visibility before the next route", async ({ page }) => {
  await page.addInitScript(() => {
    window.supabase = {
      createClient: () => ({
        auth: {
          getSession: async () => ({ data: { session: null }, error: null })
        }
      })
    };
  });
  await page.goto("/music.html", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".fs-music-logo")).toBeVisible();

  let releaseStyles;
  const stylesGate = new Promise(resolve => { releaseStyles = resolve; });
  await page.route("**/routes/styles/profile.css**", async route => {
    await stylesGate;
    await route.continue();
  });

  const profileStylesRequested = page.waitForRequest(request => request.url().includes("/routes/styles/profile.css"));
  await page.evaluate(() => {
    window.__profileNavigationPromise = window.FloustreamRouter.navigate(
      new URL("profile.html", location.href)
    );
  });
  await profileStylesRequested;

  await page.evaluate(() =>
    window.FloustreamRouter.navigate(new URL("music.html", location.href))
  );
  releaseStyles();
  await page.evaluate(() => window.__profileNavigationPromise);

  await expect(page.locator(".fs-music-logo")).toBeVisible();
  await expect(page.locator("#floustream-route-view")).toHaveCSS("visibility", "visible");
  await expect(page.locator('style[data-floustream-route-style="profile"]')).toHaveCount(0);
});


test("navigation from another user's public profile back to My profile renders the light-DOM route", async ({ page }) => {
  await page.addInitScript(() => {
    const makeChannel = () => ({
      on() { return this; },
      subscribe() { return this; },
      presenceState() { return {}; },
      track: async () => ({}),
      untrack: async () => ({})
    });
    const client = {
      auth: {
        getSession: async () => ({ data: { session: { user: { id: "viewer" } } }, error: null }),
        getUser: async () => ({ data: { user: { id: "viewer" } }, error: null }),
        signOut: async () => ({ error: null }),
        stopAutoRefresh: async () => {}
      },
      from(table) {
        const filters = {};
        const result = () => table === "profiles"
          ? { data: { id: filters.id || "other-user", username: "viewer", display_name: "Мой профиль", avatar_photo_id: "existing-avatar" }, error: null }
          : { data: [], error: null };
        const query = {
          select() { return query; },
          eq(key, value) { filters[key] = value; return query; },
          in() { return query; },
          order() { return query; },
          limit: async () => result(),
          range: async () => result(),
          maybeSingle: async () => result(),
          upsert: async () => ({ data: null, error: null }),
          insert: async () => ({ data: null, error: null }),
          update() { return query; },
          delete() { return query; },
          then(resolve, reject) { return Promise.resolve(result()).then(resolve, reject); }
        };
        return query;
      },
      channel() { return makeChannel(); },
      removeChannel: async () => ({})
    };
    window.supabase = { createClient: () => client };
    window.initFloustreamMessageNotifications = () => {};
    window.initFloustreamFriendNotifications = () => {};
  });
  await page.route("**/floustream-player.js**", route => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: "window.FloustreamPlayer = window.FloustreamPlayer || {};"
  }));

  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto("/music.html", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".fs-music-logo")).toBeVisible();

  await page.evaluate(() => window.FloustreamRouter.navigate(
    new URL("public-profile.html?id=other-user", location.href)
  ));
  await expect(page.locator(".fs-route-public-profile")).toBeVisible();
  expect(await page.evaluate(() =>
    !!document.querySelector("#floustream-route-view")?.shadowRoot
  )).toBe(true);

  await page.locator("#floustream-route-view").locator("#drawer-menu-button").click();
  await page.getByRole("link", { name: /Мой профиль/ }).click();

  await expect(page).toHaveURL(/profile\.html$/);
  await expect(page.locator(".fs-route-profile")).toBeVisible();
  await expect(page.locator("#display-name")).toBeVisible();
  expect(await page.evaluate(() => {
    const host = document.querySelector("#floustream-route-view");
    return !!host && !host.shadowRoot && !!host.querySelector(".fs-route-profile");
  })).toBe(true);
  expect(pageErrors).toEqual([]);
});


test("persistent shell background stays visible while the next route stylesheet loads", async ({ page }) => {
  await page.goto("/music.html", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".fs-music-logo")).toBeVisible();

  let releaseStyles;
  const stylesGate = new Promise(resolve => { releaseStyles = resolve; });
  let stylesheetRequests = 0;
  await page.route("**/routes/styles/friends.css**", async route => {
    stylesheetRequests += 1;
    await stylesGate;
    await route.continue();
  });

  const stylesheetRequested = page.waitForRequest(request =>
    request.url().includes("/routes/styles/friends.css")
  );
  const navigation = page.evaluate(() =>
    window.FloustreamRouter.navigate(new URL("friends.html", location.href))
  );
  await stylesheetRequested;

  // The old route remains mounted while the new route's CSS is in flight.
  await expect(page.locator(".fs-music-logo")).toBeVisible();
  const background = await page.evaluate(() => {
    const smoke = getComputedStyle(document.body, "::before");
    const haze = getComputedStyle(document.body, "::after");
    return {
      bodyColor: getComputedStyle(document.body).backgroundColor,
      image: smoke.backgroundImage,
      position: smoke.position,
      pointerEvents: smoke.pointerEvents,
      hazeImage: haze.backgroundImage,
      shellStyle: !!document.getElementById("floustream-shell-style")
    };
  });
  expect(background.bodyColor).toBe("rgba(0, 0, 0, 0)");
  expect(background.image).toContain("radial-gradient");
  expect(background.position).toBe("fixed");
  expect(background.pointerEvents).toBe("none");
  expect(background.hazeImage).toContain("radial-gradient");
  expect(background.shellStyle).toBe(true);

  releaseStyles();
  await navigation;
  await expect(page.locator(".fs-route-friends .page-title")).toBeVisible();
  expect(stylesheetRequests).toBe(1);
  await expect(page.locator("#floustream-route-view")).toHaveCSS(
    "animation-name",
    "floustreamRouteEnter"
  );
  expect(await page.evaluate(() => window.FloustreamPerformance.getErrors())).toEqual([]);
});

test("all SPA entry documents paint the persistent background before JavaScript starts", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const routes = ["music", "friends", "portal", "home", "messages", "profile", "public-profile"];
  for (const route of routes) {
    const html = fs.readFileSync(path.resolve(__dirname, "..", route + ".html"), "utf8");
    expect(html).toContain('id="floustream-critical-shell-style"');
    expect(html).toContain("background:#090910");
  }
});
