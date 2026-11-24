const { test, expect } = require("@playwright/test");

async function openPortal(page) {
  await page.route("**/npm/@supabase/supabase-js@2", route => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: "window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null},error:null}),getUser:async()=>({data:{user:null},error:null})}})};"
  }));
  await page.goto("/portal.html");
  await page.waitForFunction(() => Boolean(window.FloustreamNavigation));
}

test("navigation registry exposes the supported first-party routes", async ({ page }) => {
  await openPortal(page);
  const routes = await page.evaluate(() => window.FloustreamNavigation.routes);
  expect(routes).toEqual(expect.arrayContaining([
    "portal.html", "home.html", "profile.html", "messages.html",
    "friends.html", "public-profile.html", "music.html", "backgammon.html"
  ]));
});

test("navigation prefetch preserves route query parameters", async ({ page }) => {
  await openPortal(page);
  const result = await page.evaluate(() => {
    const anchor = document.createElement("a");
    anchor.href = new URL("messages.html?with=peer-123", document.baseURI).href;
    document.body.appendChild(anchor);
    const accepted = window.FloustreamNavigation.prefetch(anchor);
    return {
      accepted,
      href: document.querySelector('link[rel="prefetch"][data-floustream-prefetch="true"]')?.href
    };
  });
  expect(result.accepted).toBe(true);
  expect(result.href).toBeUndefined();
  expect(await page.evaluate(() => typeof window.FloustreamRouter?.prefetch)).toBe("function");
});


test("native backgammon page keeps document prefetch outside the SPA router", async ({ page }) => {
  await openPortal(page);
  const result = await page.evaluate(() => {
    const anchor = document.createElement("a");
    anchor.href = new URL("backgammon.html?embed=1", document.baseURI).href;
    document.body.appendChild(anchor);
    const accepted = window.FloustreamNavigation.prefetch(anchor);
    return {
      accepted,
      href: document.querySelector('link[rel="prefetch"][data-floustream-prefetch="true"]')?.href
    };
  });
  expect(result.accepted).toBe(true);
  expect(result.href).toContain("backgammon.html?embed=1");
});

test("SPA prefetch is coordinated by one intent listener", async () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const router = fs.readFileSync(path.resolve(__dirname, "..", "app-router.js"), "utf8");
  const navigation = fs.readFileSync(path.resolve(__dirname, "..", "navigation.js"), "utf8");
  expect(router).not.toContain('document.addEventListener("pointerover"');
  expect(router).not.toContain('document.addEventListener("focusin"');
  expect(navigation).toContain("window.FloustreamRouter.prefetch(resolved.url)");
});

test("navigation prefetch rejects external and unknown routes", async ({ page }) => {
  await openPortal(page);
  const result = await page.evaluate(() => {
    const external = document.createElement("a");
    external.href = "https://example.com/profile.html";
    const unknown = document.createElement("a");
    unknown.href = new URL("admin.html", document.baseURI).href;
    return {
      external: window.FloustreamNavigation.resolveRoute(external),
      unknown: window.FloustreamNavigation.resolveRoute(unknown)
    };
  });
  expect(result.external).toBeNull();
  expect(result.unknown).toBeNull();
});

test("navigation prefetch respects data saver and constrained connections", async ({ page }) => {
  await openPortal(page);
  const accepted = await page.evaluate(() => {
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: { saveData: true, effectiveType: "4g" }
    });
    const anchor = document.createElement("a");
    anchor.href = new URL("home.html", document.baseURI).href;
    return window.FloustreamNavigation.prefetch(anchor);
  });
  expect(accepted).toBe(false);
  await expect(page.locator('link[rel="prefetch"][data-floustream-prefetch="true"]')).toHaveCount(0);
});

test("supported pages load the shared navigation layer without enabling service-worker page caching", async () => {
  const fs = require("node:fs");
  const path = require("node:path");
  for (const page of [
    "portal.html", "profile.html", "home.html", "messages.html",
    "friends.html", "public-profile.html", "music.html", "backgammon.html"
  ]) {
    const html = fs.readFileSync(path.resolve(__dirname, "..", page), "utf8");
    expect(html).toContain('src="./navigation.js?v=1" defer');
  }
  const worker = fs.readFileSync(path.resolve(__dirname, "..", "service-worker.js"), "utf8");
  expect(worker).toContain("Intentionally no fetch handler");
  expect(worker).not.toContain('addEventListener("fetch"');
});


test("Main 0.9 atmospheric stylesheet is loaded by every first-party page", async () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const pages = ["index.html", "home.html", "portal.html", "profile.html", "public-profile.html", "friends.html", "messages.html", "music.html", "backgammon.html"];
  for (const page of pages) {
    const html = fs.readFileSync(path.resolve(__dirname, "..", page), "utf8");
    expect(html, page).toContain('atmosphere.css?v=20261124-09');
  }
  const css = fs.readFileSync(path.resolve(__dirname, "..", "shared", "atmosphere.css"), "utf8");
  expect(css).toContain("body::before");
  expect(css).toContain("body::after");
  expect(css).toContain(".fs-route-messages");
  expect(css).toContain(".fs-route-profile");
  expect(css).toContain("prefers-reduced-motion");
});
