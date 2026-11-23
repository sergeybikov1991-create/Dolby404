const { test, expect } = require("@playwright/test");

test("migrated SPA routes interoperate through one router, shared Supabase client and isolated styles", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.addInitScript(() => {
    const state = window.__architectureIntegration = { clientFactories: 0 };
    const client = {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null })
      }
    };
    window.supabase = {
      createClient: () => {
        state.clientFactories += 1;
        return client;
      }
    };
  });

  async function expectRouteStyle(route) {
    const result = await page.evaluate(name => {
      const host = document.querySelector("#floustream-app-shell #floustream-route-view");
      const style = host?.shadowRoot?.querySelector(`style[data-floustream-route-style="${name}"]`);
      return { count: style ? 1 : 0, cssLength: style?.textContent.length || 0 };
    }, route);
    expect(result.count, `stylesheet for ${route}`).toBe(1);
    expect(result.cssLength, `loaded CSS for ${route}`).toBeGreaterThan(100);
  }

  await page.goto("/portal.html");
  await expect(page.locator("#auth-message")).toContainText("Система готова");
  await expectRouteStyle("portal");

  await page.evaluate(() => window.FloustreamRouter.navigate("music.html"));
  await expect(page.locator(".fs-music-logo")).toHaveText("FLOUSTREAM");
  await expectRouteStyle("music");
  await expect(page.locator('style[data-floustream-route-style="portal"]')).toHaveCount(0);

  await page.evaluate(() => window.FloustreamRouter.navigate("friends.html"));
  await expect(page.locator(".fs-route-friends .page-title")).toHaveText("Друзья");
  await expect(page.locator(".fs-route-friends #notice")).toContainText("Сессия не найдена");
  await expectRouteStyle("friends");
  await expect(page.locator('style[data-floustream-route-style="music"]')).toHaveCount(0);

  await page.evaluate(() => window.FloustreamRouter.navigate("messages.html"));
  await expect(page.locator("#floustream-app-shell")).toBeVisible();
  await expectRouteStyle("messages");
  await expect(page.locator('style[data-floustream-route-style="friends"]')).toHaveCount(0);

  await page.evaluate(() => window.FloustreamRouter.navigate("public-profile.html"));
  await expect(page.locator(".fs-route-public-profile .status.error")).toContainText("Не указан профиль для просмотра");
  await expectRouteStyle("public-profile");
  await expect(page.locator('style[data-floustream-route-style="messages"]')).toHaveCount(0);

  await page.evaluate(() => window.FloustreamRouter.navigate("home.html"));
  await expect(page).toHaveURL(/portal\.html$/);
  await expect(page.locator("#auth-message")).toContainText("Система готова");

  await page.evaluate(() => window.FloustreamRouter.navigate("profile.html"));
  await expect(page).toHaveURL(/portal\.html\?reauth=1$/);
  await expect(page.locator("#auth-message")).toContainText("Система готова");

  const finalState = await page.evaluate(() => {
    const host = document.querySelector("#floustream-app-shell #floustream-route-view");
    return {
    clientFactories: window.__architectureIntegration.clientFactories,
    activeRoute: window.FloustreamRouter.activeRoute,
    profileStyles: document.head.querySelectorAll('style[data-floustream-route-style="profile"]').length,
    leakedRouteStyles: host?.shadowRoot?.querySelectorAll('style[data-floustream-route-style]').length || 0
    };
  });
  expect(finalState.clientFactories).toBe(1);
  expect(finalState.activeRoute).toBe("portal.html");
  expect(finalState.profileStyles).toBe(0);
  expect(finalState.leakedRouteStyles).toBe(1);
  expect(pageErrors).toEqual([]);
});
