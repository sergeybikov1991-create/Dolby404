import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  const messages = fs.readFileSync(path.join(__dirname, "../messages.html"), "utf8");

  expect(messages).toContain('event:"INSERT"');
  expect(messages).toContain('event:"UPDATE"');
  expect(messages).toContain('client.channel("floustream-direct-"');
  expect(messages).toContain("refreshAfterLoad");
  expect(messages).toContain("inboxRefreshAfterLoad");
  expect(messages).toContain("let wasSubscribed=false");
  expect(messages).toContain("if(wasSubscribed)onChange();");
  expect(messages).not.toMatch(/setInterval\s*\([^)]*(?:loadMessages|loadInbox)/s);
  expect(messages).not.toContain("},5000)");
});


test("messages page keeps the newest messages at the bottom and guards sends", async () => {
  const messages = fs.readFileSync(path.join(__dirname, "../messages.html"), "utf8");

  expect(messages).toContain(".bubble-row{display:flex;flex:0 0 auto}");
  expect(messages).toContain(".messages{display:flex;flex:1;min-height:0;flex-direction:column;");
  expect(messages).toContain("overflow-anchor:none");
  expect(messages).toContain('.order("created_at",{ascending:false}).order("id",{ascending:false}).limit(200)');
  expect(messages).toContain("function scrollToNewestMessage(host)");
  expect(messages).toContain("Date.parse(item.dataset.createdAt)");
  expect(messages).toContain("messageRect.bottom-hostRect.bottom");
  expect(messages).toContain("line.dataset.createdAt=row.created_at||\"\"");
  expect(messages).toContain("requestAnimationFrame(()=>requestAnimationFrame(()=>scrollToNewestMessage(host)));");
  expect(messages).toContain("return timeA-timeB||String(a.id||\"\").localeCompare(String(b.id||\"\")");
  expect(messages).toContain('finally{button.disabled=false;input.focus();}');
  expect(messages).toContain("attachment_path:path");
});

test("read receipt failures do not block rendering the conversation", async () => {
  const messages = fs.readFileSync(path.join(__dirname, "../messages.html"), "utf8");
  const renderAt = messages.indexOf('await renderMessages(rows)');
  const receiptAt = messages.indexOf('client.from("direct_messages").update({read_at:new Date().toISOString()})');
  expect(renderAt).toBeGreaterThan(-1);
  expect(receiptAt).toBeGreaterThan(renderAt);
  expect(messages).toContain('if(marked.error)console.warn("FLOUSTREAM read receipt update:",marked.error)');
  expect(messages).toContain('catch(markError){console.warn("FLOUSTREAM read receipt update:",markError);}');
});


test("FLOUSTREAM shell cache preloads pages without caching private API data", async () => {
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
  for (const page of ["portal.html", "profile.html", "public-profile.html", "messages.html", "friends.html", "home.html", "music.html"]) {
    const html = fs.readFileSync(path.join(__dirname, "../" + page), "utf8");
    expect(html).toContain('navigator.serviceWorker.register');
  }
  expect(worker).toContain('const CACHE_NAME = "floustream-shell-v2"');
});
