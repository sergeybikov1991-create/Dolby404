const { test, expect } = require("@playwright/test");

const supabaseBrowserStub = `
  window.supabase = {
    createClient: () => ({
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
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


test("profile redirects signed-out visitors to the portal", async ({ page }) => {
  await mockSupabaseCdn(page);
  await page.goto("/profile.html");
  await expect(page).toHaveURL(/\/portal\.html$/);
  await expect(page.locator(".logo")).toHaveText("FLOUSTREAM");
});

test("video album keeps public and private players, native controls and swipe navigation", async () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const profile = fs.readFileSync(path.join(__dirname, "../profile.html"), "utf8");

  expect(profile).toContain('id="video-album-player" controls playsinline');
  expect(profile).toContain('id="private-video-player" controls playsinline');
  expect(profile).toContain('id="video-album-viewer"');
  expect(profile).toContain('id="private-video-viewer"');
  expect(profile).toContain('bindVideoSwipe("video-album-viewer","video-album-player",false)');
  expect(profile).toContain('bindVideoSwipe("private-video-viewer","private-video-player",true)');
  expect(profile).toContain('stage.addEventListener("touchstart"');
  expect(profile).toContain('stage.addEventListener("touchend"');
  expect(profile).not.toContain("video-album-playmark");
  expect(profile).not.toContain("video-viewer-thumb-mark");
});


test("messages page uses Supabase Realtime instead of five-second polling", async () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const messages = fs.readFileSync(path.join(__dirname, "../messages.html"), "utf8");

  expect(messages).toContain('event:"INSERT"');
  expect(messages).toContain('event:"UPDATE"');
  expect(messages).toContain('client.channel("floustream-direct-"');
  expect(messages).toContain("refreshAfterLoad");
  expect(messages).toContain("inboxRefreshAfterLoad");
  expect(messages).not.toMatch(/setInterval\s*\([^)]*(?:loadMessages|loadInbox)/s);
  expect(messages).not.toContain("},5000)");
});


test("messages page keeps the newest messages at the bottom and guards sends", async () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const messages = fs.readFileSync(path.join(__dirname, "../messages.html"), "utf8");

  expect(messages).toContain(".bubble-row{display:flex;flex:0 0 auto}");
  expect(messages).toContain('.order("created_at",{ascending:false}).order("id",{ascending:false}).limit(200)');
  expect(messages).toContain("requestAnimationFrame(()=>{host.scrollTop=host.scrollHeight;});");
  expect(messages).toContain('finally{button.disabled=false;input.focus();}');
  expect(messages).toContain("attachment_path:path");
});


test("FLOUSTREAM shell cache preloads pages without caching private API data", async () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const worker = fs.readFileSync(path.join(__dirname, "../service-worker.js"), "utf8");
  for (const page of ["portal.html", "profile.html", "public-profile.html", "messages.html", "friends.html", "home.html", "music.html"]) {
    expect(worker).toContain("./" + page);
  }
  expect(worker).toContain('request.mode === "navigate"');
  expect(worker).toContain('request.method !== "GET"');
  expect(worker).toContain('response.type === "basic"');
  expect(worker).toContain('self.skipWaiting()');
  expect(worker).toContain('self.clients.claim()');
  expect(worker).not.toContain("supabase.co");
  for (const page of ["profile.html", "public-profile.html", "messages.html"]) {
    const html = fs.readFileSync(path.join(__dirname, "../" + page), "utf8");
    expect(html).toContain('service-worker.js');
  }
});
