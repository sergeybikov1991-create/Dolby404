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
  expect(result.href).toContain("messages.html?with=peer-123");
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
