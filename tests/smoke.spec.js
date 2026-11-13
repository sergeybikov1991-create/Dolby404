const { test, expect } = require("@playwright/test");

const supabaseBrowserStub = `
  window.supabase = {
    createClient: () => ({
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        signUp: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({ data: { session: null }, error: null })
      }
    })
  };
`;

async function mockSupabaseCdn(page) {
  await page.route("**/npm/@supabase/supabase-js@2", route =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: supabaseBrowserStub
    })
  );
}

test("portal loads and enables authentication controls", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await mockSupabaseCdn(page);

  await page.goto("/portal.html");
  await expect(page.locator(".logo")).toHaveText("FLOUSTREAM");
  await expect(page.locator("#email")).toBeVisible();
  await expect(page.locator("#password")).toBeVisible();
  await expect(page.locator("#register-button")).toBeEnabled();
  await expect(page.locator("#login-button")).toBeEnabled();
  await expect(page.locator("#auth-message")).toContainText("Система готова");
  expect(pageErrors).toEqual([]);
});

test("portal validates an empty login without contacting Supabase", async ({ page }) => {
  await mockSupabaseCdn(page);
  await page.goto("/portal.html");

  const login = page.locator("#login-button");
  await expect(login).toBeEnabled();
  await login.click();
  await expect(page.locator("#auth-message")).toHaveText("Введи Email и пароль.");
});

test("entry page routes a signed-out visitor to the portal", async ({ page }) => {
  await mockSupabaseCdn(page);
  await page.goto("/");
  await expect(page).toHaveURL(/\/portal\.html$/);
  await expect(page.locator(".logo")).toHaveText("FLOUSTREAM");
});

test("portal fits a mobile viewport without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSupabaseCdn(page);
  await page.goto("/portal.html");
  await expect(page.locator(".logo")).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
});
