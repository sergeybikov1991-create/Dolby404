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
    const state = window.__homeTestState = { tracked: 0, untracked: 0, removed: 0, postsQueries: 0 };
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
    window.supabase = { createClient: () => client };
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
  await expect.poll(() => page.evaluate(() => window.__homeTestState.removed)).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__homeTestState.untracked)).toBe(1);
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

test("SPA route modules are prefetched on hover intent", async ({ page }) => {
  await page.goto("/music.html", { waitUntil: "domcontentloaded" });
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
