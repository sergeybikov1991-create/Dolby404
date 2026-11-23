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
