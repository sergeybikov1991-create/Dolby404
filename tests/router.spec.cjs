const { test, expect } = require("@playwright/test");

test("music route mounts inside the shared SPA shell", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto("/music.html");
  await expect(page.locator("#floustream-app-shell")).toBeVisible();
  await expect(page.locator(".fs-music-logo")).toHaveText("FLOUSTREAM");
  await expect(page.locator("#fs-home-player")).toHaveAttribute("src", /rutube\.ru\/play\/embed/);
  await expect(page.locator("#fs-music-status")).toContainText("Нажми");
  expect(pageErrors).toEqual([]);
});

test("route module lifecycle replaces the previous view and supports browser history", async ({ page }) => {
  await page.goto("/music.html");
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
  await expect(page.locator("#floustream-app-shell style")).toHaveCount(0);

  await page.goBack();
  await expect(page).toHaveURL(/music\.html$/);
  await expect(page.locator(".fs-music-logo")).toHaveCount(1);
  await expect(page.locator("#fs-home-player")).toHaveCount(1);
});

test("music controls remain functional after route mount", async ({ page }) => {
  await page.goto("/music.html");
  await page.getByRole("button", { name: "Продолжить — включить музыку" }).click();
  await expect(page.locator("#fs-music-status")).toContainText("Отправлена команда запуска");
});
