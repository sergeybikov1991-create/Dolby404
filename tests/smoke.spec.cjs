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

async function mockAuthenticatedChat(page, options = {}) {
  await page.addInitScript(config => {
    const state = window.__chatTestState = {
      messages: config.initialMessages || [], signedBatches: [], inserts: [], removed: [], uploads: [],
      previousUploads: [], resumedUploads: 0, startedUploads: 0, insertHandler: null, updateHandler: null, micRequests: 0, micStopped: 0, recorderStarts: 0
    };
    const profile = { id: "peer-1", username: "peer", display_name: "Peer", avatar_url: null };
    const client = {
      auth: {
        getSession: async () => ({ data: { session: { access_token: "test-access-token" } }, error: null }),
        getUser: async () => ({ data: { user: { id: "sender-1" } }, error: null })
      },
      from(table) {
        let selectedId = null;
        const query = {
          select() { return query; },
          or() { return query; },
          order() { return query; },
          limit() { return Promise.resolve({ data: state.messages.slice(), error: null }); },
          eq(column, value) { if (column === "id") selectedId = value; return query; },
          maybeSingle() {
            if (table === "profiles") return Promise.resolve({ data: profile, error: null });
            if (config.failConfirmationFirst && !state.confirmationFailed) {
              state.confirmationFailed = true;
              return Promise.resolve({ data: null, error: { message: "simulated confirmation unavailable" } });
            }
            return Promise.resolve({ data: state.messages.find(row => row.id === selectedId) || null, error: null });
          },
          update() { return query; },
          is() { return Promise.resolve({ error: null }); },
          insert(row) {
            state.inserts.push(row);
            if (state.messages.some(existing => existing.id === row.id)) return Promise.resolve({ error: { message: "duplicate key", status: 409 } });
            state.messages.push({ ...row, id: row.id || "generated-" + (state.messages.length + 1), created_at: new Date().toISOString() });
            return Promise.resolve({ error: config.ambiguousInsert ? { message: "simulated response lost" } : null });
          }
        };
        return query;
      },
      storage: { from() { return {
        createSignedUrls(paths) {
          state.signedBatches.push(paths.slice());
          return Promise.resolve({ data: paths.map(path => ({ path, signedUrl: "https://media.test/" + encodeURIComponent(path) })), error: null });
        },
        remove(paths) { state.removed.push(paths.slice()); return Promise.resolve({ error: null }); }
      }; } },
      channel() {
        const channel = {
          on(_type, filter, callback) { if (filter.event === "INSERT") state.insertHandler = callback; if (filter.event === "UPDATE") state.updateHandler = callback; return channel; },
          subscribe(callback) { callback("SUBSCRIBED"); return channel; }
        };
        return channel;
      },
      removeChannel: async () => ({ error: null })
    };
    window.supabase = { createClient: () => client };
    window.__FLOUSTREAM_TEST_HOLD_MS = config.voiceHoldMs || 3000;
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: {
      getUserMedia: async () => {
        state.micRequests += 1;
        if (config.micPermissionDenied) throw new Error("Permission denied by test");
        const track = { stop: () => { state.micStopped += 1; } };
        return { getTracks: () => [track] };
      }
    } });
    window.MediaRecorder = class {
      static isTypeSupported(type) { return type.startsWith("audio/webm") || type === "audio/mp4"; }
      constructor(stream, recorderOptions) { this.stream = stream; this.mimeType = recorderOptions?.mimeType || "audio/webm"; this.state = "inactive"; this.ondataavailable = null; this.onstop = null; this.onerror = null; }
      start() {
        this.state = "recording"; state.recorderStarts += 1;
        setTimeout(() => { if (this.state === "recording") this.ondataavailable?.({ data: new Blob([new Uint8Array(512)], { type: this.mimeType }) }); }, 10);
      }
      stop() {
        if (this.state === "inactive") return;
        this.state = "inactive"; this.ondataavailable?.({ data: new Blob([new Uint8Array(512)], { type: this.mimeType }) });
        setTimeout(() => this.onstop?.(), 0);
      }
    };
    window.tus = { Upload: class {
      constructor(file, tusOptions) { this.file = file; this.options = tusOptions; this.resumed = false; state.uploads.push(this); state.lastTusOptions = tusOptions; }
      findPreviousUploads() { return Promise.resolve(state.previousUploads.slice()); }
      resumeFromPreviousUpload(previous) { this.resumed = true; state.resumedUploads += 1; this.previous = previous; }
      start() {
        state.startedUploads += 1;
        if (config.emitDuplicateChange && state.startedUploads === 2) document.getElementById("attachment-input").dispatchEvent(new Event("change", { bubbles: true }));
        if (config.failFirstUpload && state.startedUploads === 1) {
          state.previousUploads = [{ metadata: this.options.metadata, creationTime: new Date().toISOString(), uploadUrl: "https://upload.test/resume" }];
          this.options.onError(new Error("simulated network interruption"));
          return;
        }
        this.options.onProgress(this.file.size, this.file.size);
        setTimeout(() => this.options.onSuccess({}), config.uploadDelay || 30);
      }
      abort() { return Promise.resolve(); }
    } };
    state.emitInsert = row => { state.messages.push(row); if (state.insertHandler) state.insertHandler({ new: row }); };
  }, options);
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
  await expect(page).toHaveURL(/\/portal\.html\?reauth=1$/);
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

test("messenger uses realtime subscriptions instead of five-second polling", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const messages = fs.readFileSync(path.join(__dirname, "../messages.html"), "utf8");

  expect(messages).toContain('floustream-inbox-');
  expect(messages).toContain('floustream-direct-');
  expect(messages).toContain('.on("postgres_changes"');
  expect(messages).toContain('pendingMessageReload');
  expect(messages).not.toContain('setInterval(()=>{if(!document.hidden)loadInbox();},5000);');
  expect(messages).not.toContain('setInterval(()=>{if(!document.hidden)loadMessages(true);},5000);');
});

test("public profile permits guests without an Auth session and prefers the public avatar copy", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const profile = fs.readFileSync(path.join(__dirname, "../public-profile.html"), "utf8");
  expect(profile).toContain('if(stored.data?.session)');
  expect(profile).toContain('else viewer=null;');
  expect(profile).toContain('client.auth.getUser()');
  expect(profile).toContain('const publicAvatar=safeUrl(profile.avatar_url);');
  expect(profile).toContain('if(publicAvatar)return publicAvatar;');
});

test("chat photos have no message frame and open in a closable fullscreen viewer", async ({ page }) => {
  await mockSupabaseCdn(page);
  await page.goto("/messages.html?with=photo-viewer-test");
  const source = await page.evaluate(() => ({ styles: [...document.querySelectorAll("style")].map(node => node.textContent).join("\n"), scripts: [...document.scripts].map(node => node.textContent).join("\n") }));
  expect(source.styles).toContain(".bubble:has(.message-media-image){padding:0;border:0;background:transparent;box-shadow:none}");
  expect(source.scripts).toContain('media.addEventListener("click",()=>openPhotoViewer(media.currentSrc||url,media.alt))');

  await page.evaluate(() => window.openPhotoViewer("data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=", "Тестовое фото"));
  await expect(page.locator("#photo-viewer")).toBeVisible();
  await expect(page.locator("#photo-viewer-image")).toHaveAttribute("alt", "Тестовое фото");
  await page.keyboard.press("Escape");
  await expect(page.locator("#photo-viewer")).toBeHidden();

  await page.evaluate(() => window.openPhotoViewer("data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=", "Тестовое фото"));
  await page.locator("#photo-viewer").click({ position: { x: 5, y: 5 } });
  await expect(page.locator("#photo-viewer")).toBeHidden();
});

test("chat media upload resumes after interruption and prevents duplicate message rows", async ({ page }) => {
  await mockAuthenticatedChat(page, { failFirstUpload: true, ambiguousInsert: true, failConfirmationFirst: true, emitDuplicateChange: true, uploadDelay: 800 });
  await page.goto("/messages.html?with=peer-1");
  const file = { name: "clip.mp4", mimeType: "video/mp4", lastModified: 1700000000000, buffer: Buffer.alloc(7 * 1024 * 1024) };
  await page.locator("#attachment-input").setInputFiles(file);
  await expect(page.locator("#notice")).toContainText("simulated network interruption");
  await page.locator("#attachment-input").setInputFiles(file);
  await expect(page.locator("#notice")).toContainText("Не удалось проверить запись сообщения");
  await page.locator("#attachment-input").setInputFiles(file);
  await expect(page.locator("#notice")).toHaveText("Вложение отправлено.");
  const state = await page.evaluate(() => ({
    uploads: window.__chatTestState.uploads.length, started: window.__chatTestState.startedUploads, resumed: window.__chatTestState.resumedUploads,
    inserts: window.__chatTestState.inserts, messages: window.__chatTestState.messages, removed: window.__chatTestState.removed,
    pendingKeys: Object.keys(sessionStorage), pendingValues: Object.keys(sessionStorage).map(key => sessionStorage.getItem(key)),
    endpoint: window.__chatTestState.lastTusOptions.endpoint, chunkSize: window.__chatTestState.lastTusOptions.chunkSize,
    retryDelays: window.__chatTestState.lastTusOptions.retryDelays, hasAuth: !!window.__chatTestState.lastTusOptions.headers.authorization,
    hasApiKey: !!window.__chatTestState.lastTusOptions.headers.apikey
  }));
  expect(state.uploads, JSON.stringify({ started: state.started, resumed: state.resumed, inserts: state.inserts, pendingKeys: state.pendingKeys, pendingValues: state.pendingValues })).toBe(2);
  expect(state.resumed).toBe(1);
  expect(state.inserts).toHaveLength(2);
  expect(state.messages).toHaveLength(1);
  expect(state.pendingKeys).toHaveLength(0);
  expect(state.messages[0].id).toBe(state.inserts[0].id);
  expect(state.inserts[1].id).toBe(state.inserts[0].id);
  expect(state.messages[0].attachment_path).toContain("sender-1/");
  expect(state.removed).toHaveLength(0);
  expect(state.endpoint).toContain(".storage.supabase.co/storage/v1/upload/resumable");
  expect(state.chunkSize).toBe(6 * 1024 * 1024);
  expect(state.retryDelays).toEqual([0, 3000, 5000, 10000, 20000]);
  expect(state.hasAuth).toBe(true);
  expect(state.hasApiKey).toBe(true);
  await expect(page.locator("#upload-progress")).toBeHidden();
});

test("chat attachment previews are signed in one batch and existing video nodes survive realtime inserts", async ({ page }) => {
  const initialMessages = [
    { id: "photo-1", sender_id: "peer-1", recipient_id: "sender-1", content: "", attachment_path: "peer-1/photo.jpg", attachment_name: "photo.jpg", attachment_mime: "image/jpeg", created_at: "2026-11-22T10:00:00Z" },
    { id: "video-1", sender_id: "peer-1", recipient_id: "sender-1", content: "", attachment_path: "peer-1/video.mp4", attachment_name: "video.mp4", attachment_mime: "video/mp4", created_at: "2026-11-22T10:01:00Z" }
  ];
  await mockAuthenticatedChat(page, { initialMessages });
  await page.goto("/messages.html?with=peer-1");
  await expect(page.locator(".message-media-image")).toHaveCount(1);
  await expect(page.locator(".message-media-video")).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => window.__chatTestState.signedBatches.length)).toBe(1);
  const video = await page.locator(".message-media-video").elementHandle();
  await page.evaluate(() => window.__chatTestState.emitInsert({ id: "photo-2", sender_id: "peer-1", recipient_id: "sender-1", content: "", attachment_path: "peer-1/photo-2.jpg", attachment_name: "photo-2.jpg", attachment_mime: "image/jpeg", created_at: "2026-11-22T10:02:00Z" }));
  await expect(page.locator(".bubble-row")).toHaveCount(3);
  await expect.poll(() => page.evaluate(() => window.__chatTestState.signedBatches.length)).toBe(2);
  const batches = await page.evaluate(() => window.__chatTestState.signedBatches);
  expect(batches[0]).toHaveLength(2);
  expect(batches[1]).toEqual(["peer-1/photo-2.jpg"]);
  expect(await video.evaluate(node => node.isConnected)).toBe(true);
});

test("short tap on the send button continues to send text normally", async ({ page }) => {
  await mockAuthenticatedChat(page);
  await page.goto("/messages.html?with=peer-1");
  await page.locator("#message-input").fill("Привет");
  await page.locator("#send").click();
  await expect(page.locator(".bubble-row")).toHaveCount(1);
  const state = await page.evaluate(() => ({ message: window.__chatTestState.messages[0], micRequests: window.__chatTestState.micRequests, recorderStarts: window.__chatTestState.recorderStarts, uploads: window.__chatTestState.uploads.length }));
  expect(state.message.content).toBe("Привет");
  expect(state.micRequests).toBe(0);
  expect(state.recorderStarts).toBe(0);
  expect(state.uploads).toBe(0);
});

test("holding the existing send button records and automatically sends a voice message", async ({ page }) => {
  await mockAuthenticatedChat(page, { voiceHoldMs: 35, uploadDelay: 30 });
  await page.goto("/messages.html?with=peer-1");
  const send = page.locator("#send");
  await send.dispatchEvent("pointerdown", { pointerId: 1, pointerType: "touch", isPrimary: true, button: 0, clientX: 100, clientY: 100 });
  await expect(page.locator("#notice")).toContainText("Запись 00:00");
  await send.dispatchEvent("pointerup", { pointerId: 1, pointerType: "touch", isPrimary: true, button: 0, clientX: 100, clientY: 100 });
  await expect(page.locator("#notice")).toHaveText("Голосовое сообщение отправлено.");
  await expect(page.locator(".message-media-audio")).toHaveCount(1);
  const state = await page.evaluate(() => ({ message: window.__chatTestState.messages[0], micRequests: window.__chatTestState.micRequests, micStopped: window.__chatTestState.micStopped, recorderStarts: window.__chatTestState.recorderStarts, uploads: window.__chatTestState.uploads.length }));
  expect(state.micRequests).toBe(1);
  expect(state.micStopped).toBe(1);
  expect(state.recorderStarts).toBe(1);
  expect(state.uploads).toBe(1);
  expect(state.message.attachment_mime).toBe("audio/webm");
  expect(state.message.attachment_name).toMatch(/^voice-message-/);
  expect(state.message.content).toMatch(/^00:0[1-9]$/);
});

test("swiping sideways cancels a voice recording and releases the microphone", async ({ page }) => {
  await mockAuthenticatedChat(page, { voiceHoldMs: 35 });
  await page.goto("/messages.html?with=peer-1");
  const send = page.locator("#send");
  await send.dispatchEvent("pointerdown", { pointerId: 2, pointerType: "touch", isPrimary: true, button: 0, clientX: 100, clientY: 100 });
  await expect(page.locator("#notice")).toContainText("Запись 00:00");
  await send.dispatchEvent("pointermove", { pointerId: 2, pointerType: "touch", isPrimary: true, button: 0, clientX: 220, clientY: 100 });
  await expect(page.locator("#notice")).toHaveText("Запись отменена.");
  await send.dispatchEvent("pointerup", { pointerId: 2, pointerType: "touch", isPrimary: true, button: 0, clientX: 220, clientY: 100 });
  const state = await page.evaluate(() => ({ micStopped: window.__chatTestState.micStopped, uploads: window.__chatTestState.uploads.length, inserts: window.__chatTestState.inserts.length, messages: window.__chatTestState.messages.length }));
  expect(state.micStopped).toBe(1);
  expect(state.uploads).toBe(0);
  expect(state.inserts).toBe(0);
  expect(state.messages).toBe(0);
});

test("microphone permission denial does not send a text or empty voice message", async ({ page }) => {
  await mockAuthenticatedChat(page, { voiceHoldMs: 35, micPermissionDenied: true });
  await page.goto("/messages.html?with=peer-1");
  const send = page.locator("#send");
  await send.dispatchEvent("pointerdown", { pointerId: 3, pointerType: "touch", isPrimary: true, button: 0, clientX: 100, clientY: 100 });
  await expect(page.locator("#notice")).toContainText("Permission denied by test");
  await send.dispatchEvent("pointerup", { pointerId: 3, pointerType: "touch", isPrimary: true, button: 0, clientX: 100, clientY: 100 });
  const state = await page.evaluate(() => ({ micRequests: window.__chatTestState.micRequests, uploads: window.__chatTestState.uploads.length, messages: window.__chatTestState.messages.length }));
  expect(state.micRequests).toBe(1);
  expect(state.uploads).toBe(0);
  expect(state.messages).toBe(0);
});
