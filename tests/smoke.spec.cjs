const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

function readProfileSources() {
  const route = fs.readFileSync(path.join(__dirname, "../routes/profile.js"), "utf8");
  const match = route.match(/^const MARKUP = (".*");$/m);
  if (!match) throw new Error("Profile route markup constant not found");
  const photoAlbum = fs.readFileSync(path.join(__dirname, "../routes/profile/photo-album.mjs"), "utf8");
  return { route, markup: JSON.parse(match[1]), photoAlbum };
}

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


async function waitForChatReady(page) {
  await expect(page.locator(".fs-route-messages")).toBeVisible();
  await expect.poll(() => page.evaluate(() => !!window.__chatTestState?.insertHandler)).toBe(true);
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
      getUserMedia: async constraints => {
        state.micRequests += 1;
        if (constraints?.video) {
          const preview = document.querySelector("#camera-preview");
          if (preview) { Object.defineProperty(preview, "videoWidth", { configurable: true, value: 640 }); Object.defineProperty(preview, "videoHeight", { configurable: true, value: 480 }); }
        }
        if (config.micPermissionDenied) throw new Error("Permission denied by test");
        const track = { stop: () => { state.micStopped += 1; } };
        if (constraints?.video) { const stream = new MediaStream(); stream.getTracks = () => [track]; return stream; }
        return { getTracks: () => [track] };
      }
    } });
    window.MediaRecorder = class {
      static isTypeSupported(type) { return type.startsWith("audio/webm") || type === "audio/mp4" || type.startsWith("video/webm") || type === "video/mp4"; }
      constructor(stream, recorderOptions) { this.stream = stream; this.mimeType = recorderOptions?.mimeType || "audio/webm"; this.state = "inactive"; this.ondataavailable = null; this.onstop = null; this.onerror = null; this.listeners = {}; }
      addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); }
      start() {
        this.state = "recording"; state.recorderStarts += 1;
        setTimeout(() => { if (this.state === "recording") this.ondataavailable?.({ data: new Blob([new Uint8Array(512)], { type: this.mimeType }) }); }, 10);
      }
      stop() {
        if (this.state === "inactive") return;
        this.state = "inactive"; this.ondataavailable?.({ data: new Blob([new Uint8Array(512)], { type: this.mimeType }) });
        setTimeout(() => { this.onstop?.(); (this.listeners.stop || []).forEach(callback => callback()); }, 0);
      }
    };
    window.tus = { Upload: class {
      constructor(file, tusOptions) { this.file = file; this.options = tusOptions; this.resumed = false; state.uploads.push(this); state.lastTusOptions = tusOptions; }
      findPreviousUploads() { return Promise.resolve(state.previousUploads.slice()); }
      resumeFromPreviousUpload(previous) { this.resumed = true; state.resumedUploads += 1; this.previous = previous; }
      start() {
        state.startedUploads += 1;
        if (config.emitDuplicateChange && state.startedUploads === 2) {
          const host = document.querySelector("#floustream-app-shell #floustream-route-view");
          const input = host?.shadowRoot?.querySelector("#attachment-input") || document.getElementById("attachment-input");
          input?.dispatchEvent(new Event("change", { bubbles: true }));
        }
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

async function mockPublicProfile(page, options = {}) {
  await page.route("**/message-notifications.js", route => route.fulfill({ contentType: "application/javascript", body: "" }));
  await page.route("**/friend-notifications.js", route => route.fulfill({ contentType: "application/javascript", body: "" }));
  await page.route("https://images.test/avatar.png", route => route.fulfill({ status: 200, contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/S2sAAAAASUVORK5CYII=", "base64") }));
  await page.addInitScript(config => {
    const storageKey = "floustream-test-profile-photo-likes";
    const state = window.__publicProfileTestState = { likes: JSON.parse(localStorage.getItem(storageKey) || "[]"), inserts: JSON.parse(localStorage.getItem(storageKey + "-inserts") || "[]"), deletes: JSON.parse(localStorage.getItem(storageKey + "-deletes") || "[]"), visits: [] };
    const profile = { id: "profile-1", username: "profile", display_name: "Profile Owner", bio: "Profile bio", avatar_url: "https://images.test/avatar.png", avatar_photo_id: null, cover_url: null, last_activity_at: null, time_zone: "UTC" };
    const viewer = config.signedIn ? { id: "viewer-1" } : null;
    const client = {
      auth: { getSession: async () => ({ data: { session: viewer ? { access_token: "test-token" } : null }, error: null }), getUser: async () => ({ data: { user: viewer }, error: null }) },
      from(table) {
        let action = "select"; const filters = {};
        const query = {
          select() { action = "select"; return query; },
          eq(key, value) { filters[key] = value; return query; },
          in(key, value) { filters[key] = value; return query; },
          order() { return query; },
          limit() { return Promise.resolve({ data: [], error: null }); },
          maybeSingle() {
            if (table === "profiles") return Promise.resolve({ data: profile, error: null });
            return Promise.resolve({ data: null, error: null });
          },
          upsert(row) { state.visits.push(row); return Promise.resolve({ error: null }); },
          insert(row) {
            if (table === "profile_photo_likes") {
              state.inserts.push(row); localStorage.setItem(storageKey + "-inserts", JSON.stringify(state.inserts));
              if (state.likes.some(item => item.profile_id === row.profile_id && item.user_id === row.user_id)) return Promise.resolve({ error: { code: "23505", message: "duplicate like" } });
              state.likes.push(row); localStorage.setItem(storageKey, JSON.stringify(state.likes));
            }
            return Promise.resolve({ error: null });
          },
          delete() { action = "delete"; return query; },
          then(resolve, reject) {
            if (table === "profile_photo_likes" && action === "delete") {
              state.deletes.push({ ...filters }); localStorage.setItem(storageKey + "-deletes", JSON.stringify(state.deletes));
              state.likes = state.likes.filter(item => !(item.profile_id === filters.profile_id && item.user_id === filters.user_id));
              localStorage.setItem(storageKey, JSON.stringify(state.likes));
              return Promise.resolve({ data: null, error: null }).then(resolve, reject);
            }
            if (table === "profile_photo_likes") {
              const rows = state.likes.filter(item => !filters.profile_id || item.profile_id === filters.profile_id);
              return Promise.resolve({ data: rows, error: null }).then(resolve, reject);
            }
            return Promise.resolve({ data: [], error: null }).then(resolve, reject);
          }
        };
        return query;
      },
      channel() { const channel = { on() { return channel; }, subscribe(callback) { callback("SUBSCRIBED"); return channel; }, presenceState() { return {}; } }; return channel; },
      removeChannel: async () => ({ error: null }),
      storage: { from() { return { createSignedUrl: async () => ({ data: { signedUrl: "https://images.test/avatar.png" }, error: null }), createSignedUrls: async paths => ({ data: paths.map(path => ({ path, signedUrl: "https://images.test/" + path })), error: null }) }; } }
    };
    window.supabase = { createClient: () => client };
    window.initFloustreamMessageNotifications = () => {};
    window.initFloustreamFriendNotifications = () => {};
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
  const { route: profile, markup: profileMarkup } = readProfileSources();
  const videoModule = fs.readFileSync(path.join(__dirname, "../routes/profile/video-album.mjs"), "utf8");

  expect(profileMarkup).toContain('id="video-album-player" controls playsinline');
  expect(profileMarkup).toContain('id="private-video-player" controls playsinline');
  expect(profileMarkup).toContain('id="video-album-viewer"');
  expect(profileMarkup).toContain('id="private-video-viewer"');
  expect(videoModule).toContain('bindVideoSwipe("video-album-viewer","video-album-player",false)');
  expect(videoModule).toContain('bindVideoSwipe("private-video-viewer","private-video-player",true)');
  expect(videoModule).toContain('stage.addEventListener("touchstart"');
  expect(videoModule).toContain('stage.addEventListener("touchend"');
  expect(videoModule).not.toContain("video-album-playmark");
  expect(videoModule).not.toContain("video-viewer-thumb-mark");
});

test("messenger uses realtime subscriptions instead of five-second polling", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const messages = fs.readFileSync(path.join(__dirname, "../routes/messages.js"), "utf8");

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
  const profile = fs.readFileSync(path.join(__dirname, "../routes/public-profile.js"), "utf8");
  expect(profile).toContain('if(stored.data?.session)');
  expect(profile).toContain('else viewer=null;');
  expect(profile).toContain('client.auth.getUser()');
  expect(profile).toContain('const publicAvatar=safeUrl(profile.avatar_url);');
  expect(profile).toContain('if(publicAvatar)return publicAvatar;');
});

test("chat photos have no message frame and open in a closable fullscreen viewer", async ({ page }) => {
  await mockSupabaseCdn(page);
  await page.goto("/messages.html?with=photo-viewer-test");
  await expect(page.locator(".fs-route-messages")).toBeVisible();
  const source = await page.evaluate(() => {
    const view = document.querySelector("#floustream-app-shell #floustream-route-view")?.shadowRoot;
    return view?.querySelector('style[data-floustream-route-style="messages"]')?.textContent || "";
  });
  expect(source).toContain(".bubble:has(.message-media-image){padding:0;border:0;background:transparent;box-shadow:none}");
  const fs = require("node:fs"), path = require("node:path");
  const routeCode = fs.readFileSync(path.join(__dirname, "../routes/messages.js"), "utf8");
  expect(routeCode).toContain('media.addEventListener("click",()=>openPhotoViewer(media.currentSrc||url,media.alt))');

  await page.evaluate(() => window.openPhotoViewer("data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=", "Тестовое фото"));
  await expect(page.locator("#photo-viewer")).toBeVisible();
  await expect(page.locator("#photo-viewer-image")).toHaveAttribute("alt", "Тестовое фото");
  await page.keyboard.press("Escape");
  await expect(page.locator("#photo-viewer")).toBeHidden();

  await page.evaluate(() => window.openPhotoViewer("data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=", "Тестовое фото"));
  await page.locator("#photo-viewer").click({ position: { x: 5, y: 5 } });
  await expect(page.locator("#photo-viewer")).toBeHidden();
});

test("grouped chat attachments resume uploads and create one message row", async ({ page }) => {
  await mockAuthenticatedChat(page, { failFirstUpload: true, ambiguousInsert: true, failConfirmationFirst: true, emitDuplicateChange: true, uploadDelay: 50 });
  await page.goto("/messages.html?with=peer-1");
  const file = { name: "clip.mp4", mimeType: "video/mp4", lastModified: 1700000000000, buffer: Buffer.alloc(7 * 1024 * 1024) };
  await page.locator("#attachment-input").setInputFiles(file);
  await expect(page.locator("#attachment-preview")).toBeVisible();
  await page.locator("#send").click();
  await expect(page.locator("#notice")).toContainText("simulated network interruption");
  await page.locator("#send").click();
  await expect(page.locator("#notice")).toContainText("Не удалось проверить запись сообщения");
  await page.locator("#send").click();
  await expect(page.locator("#notice")).toHaveText("Сообщение отправлено.");
  const state = await page.evaluate(() => ({
    uploads: window.__chatTestState.uploads.length, started: window.__chatTestState.startedUploads, resumed: window.__chatTestState.resumedUploads,
    inserts: window.__chatTestState.inserts, messages: window.__chatTestState.messages, removed: window.__chatTestState.removed,
    pendingKeys: Object.keys(sessionStorage), endpoint: window.__chatTestState.lastTusOptions.endpoint,
    chunkSize: window.__chatTestState.lastTusOptions.chunkSize, retryDelays: window.__chatTestState.lastTusOptions.retryDelays,
    hasAuth: !!window.__chatTestState.lastTusOptions.headers.authorization, hasApiKey: !!window.__chatTestState.lastTusOptions.headers.apikey
  }));
  expect(state.uploads).toBe(2);
  expect(state.resumed).toBe(1);
  expect(state.inserts).toHaveLength(2);
  expect(state.messages).toHaveLength(1);
  expect(state.pendingKeys).toHaveLength(0);
  expect(state.messages[0].id).toBe(state.inserts[0].id);
  expect(state.inserts[1].id).toBe(state.inserts[0].id);
  expect(state.messages[0].attachments).toHaveLength(1);
  expect(state.messages[0].attachments[0].path).toContain("sender-1/");
  expect(state.removed).toHaveLength(0);
  expect(state.endpoint).toContain(".storage.supabase.co/storage/v1/upload/resumable");
  expect(state.chunkSize).toBe(6 * 1024 * 1024);
  expect(state.retryDelays).toEqual([0, 3000, 5000, 10000, 20000]);
  expect(state.hasAuth).toBe(true);
  expect(state.hasApiKey).toBe(true);
  await expect(page.locator("#upload-progress")).toBeHidden();
});

test("gallery selection stays attached, supports caption and multiple media in one message", async ({ page }) => {
  await mockAuthenticatedChat(page);
  await page.goto("/messages.html?with=peer-1");
  await page.locator("#attach").click();
  await expect(page.locator("#attachment-menu")).toBeVisible();
  await page.locator('[data-attachment-source="gallery"]').click();
  await page.locator("#attachment-input").setInputFiles([
    { name: "photo.jpg", mimeType: "image/jpeg", buffer: Buffer.from("photo") },
    { name: "clip.mp4", mimeType: "video/mp4", buffer: Buffer.from("video") }
  ]);
  await expect(page.locator("#attachment-preview")).toBeVisible();
  await expect(page.locator(".composer-preview-item")).toHaveCount(2);
  await page.locator("#message-input").fill("Подпись к фото и видео");
  await expect(page.locator(".bubble-row")).toHaveCount(0);
  await page.locator("#send").click();
  await expect(page.locator(".bubble-row")).toHaveCount(1);
  const state = await page.evaluate(() => window.__chatTestState.messages[0]);
  expect(state.content).toBe("Подпись к фото и видео");
  expect(state.attachments).toHaveLength(2);
  expect(state.attachment_path).toBeUndefined();
});

test("chat media previews load in one signed batch and preserve existing video nodes", async ({ page }) => {
  const initialMessages = [
    { id: "group-1", sender_id: "peer-1", recipient_id: "sender-1", content: "Смотри", attachments: [
      { path: "peer-1/photo.jpg", name: "photo.jpg", mime: "image/jpeg" },
      { path: "peer-1/video.mp4", name: "video.mp4", mime: "video/mp4" }
    ], created_at: "2026-11-22T10:00:00Z" }
  ];
  await mockAuthenticatedChat(page, { initialMessages });
  await page.goto("/messages.html?with=peer-1");
  await expect(page.locator(".message-media-image")).toHaveCount(1);
  await expect(page.locator(".message-media-video")).toHaveCount(1);
  await expect(page.locator(".message-caption")).toHaveText("Смотри");
  await expect.poll(() => page.evaluate(() => window.__chatTestState.signedBatches.length)).toBe(1);
  const video = await page.locator(".message-media-video").elementHandle();
  await page.evaluate(() => window.__chatTestState.emitInsert({ id: "photo-2", sender_id: "peer-1", recipient_id: "sender-1", content: "", attachment_path: "peer-1/photo-2.jpg", attachment_name: "photo-2.jpg", attachment_mime: "image/jpeg", created_at: "2026-11-22T10:02:00Z" }));
  await expect(page.locator(".bubble-row")).toHaveCount(2);
  await expect.poll(() => page.evaluate(() => window.__chatTestState.signedBatches.length)).toBe(2);
  const batches = await page.evaluate(() => window.__chatTestState.signedBatches);
  expect(batches[0]).toHaveLength(2);
  expect(batches[1]).toEqual(["peer-1/photo-2.jpg"]);
  expect(await video.evaluate(node => node.isConnected)).toBe(true);
});

test("send button sends text normally without requesting microphone access", async ({ page }) => {
  await mockAuthenticatedChat(page);
  await page.goto("/messages.html?with=peer-1");
  await page.locator("#message-input").fill("Привет");
  await page.locator("#send").click();
  await expect(page.locator(".bubble-row")).toHaveCount(1);
  const state = await page.evaluate(() => ({ message: window.__chatTestState.messages[0], micRequests: window.__chatTestState.micRequests, recorderStarts: window.__chatTestState.recorderStarts }));
  expect(state.message.content).toBe("Привет");
  expect(state.micRequests).toBe(0);
  expect(state.recorderStarts).toBe(0);
});

test("microphone recording is attached for preview and only sent after pressing the arrow", async ({ page }) => {
  await mockAuthenticatedChat(page, { uploadDelay: 30 });
  await page.goto("/messages.html?with=peer-1");
  await waitForChatReady(page);
  await page.locator("#mic").click();
  await expect(page.locator("#notice")).toContainText("Запись");
  await page.locator("#mic").click();
  await expect(page.locator("#attachment-preview")).toBeVisible();
  await expect(page.locator(".composer-preview-audio")).toBeVisible();
  await expect(page.locator(".bubble-row")).toHaveCount(0);
  const beforeSend = await page.evaluate(() => ({ micRequests: window.__chatTestState.micRequests, recorderStarts: window.__chatTestState.recorderStarts, uploads: window.__chatTestState.uploads.length }));
  expect(beforeSend.micRequests).toBe(1);
  expect(beforeSend.recorderStarts).toBe(1);
  expect(beforeSend.uploads).toBe(0);
  await page.locator("#send").click();
  await expect(page.locator(".bubble-row")).toHaveCount(1);
  const state = await page.evaluate(() => window.__chatTestState.messages[0]);
  expect(state.attachments).toHaveLength(1);
  expect(state.attachments[0].mime).toBe("audio/webm");
  expect(state.attachments[0].name).toMatch(/^voice-message-/);
});

test("composer keeps one microphone and the plus menu exposes all four attachment sources", async ({ page }) => {
  await mockAuthenticatedChat(page);
  await page.goto("/messages.html?with=peer-1");
  await waitForChatReady(page);
  await expect(page.locator("#mic")).toHaveCount(1);
  await expect(page.locator("#voice-mode-launch")).toHaveCount(0);
  await page.locator("#attach").click();
  await expect(page.locator("#attachment-menu [data-attachment-source]")).toHaveCount(4);
  await expect(page.locator('[data-attachment-source="gallery"]')).toContainText("Галерея");
  await expect(page.locator('[data-attachment-source="camera"]')).toContainText("Камера");
  await expect(page.locator('[data-attachment-source="files"]')).toContainText("Файлы");
  await page.locator('[data-attachment-source="video"]').click();
  await expect(page.locator("#video-input")).toHaveAttribute("accept", "video/*");
  await page.locator("#video-input").setInputFiles({ name: "selected-video.mp4", mimeType: "video/mp4", buffer: Buffer.from("video-test") });
  await expect(page.locator("#attachment-preview")).toBeVisible();
  await expect(page.locator(".composer-preview-item")).toHaveCount(1);
});

test("camera captures a photo and records a video into the attachment preview", async ({ page }) => {
  await mockAuthenticatedChat(page);
  await page.addInitScript(() => {
    Object.defineProperty(HTMLVideoElement.prototype, "readyState", { configurable: true, get: () => 4 });
    HTMLCanvasElement.prototype.getContext = () => ({ drawImage() {} });
    HTMLCanvasElement.prototype.toBlob = callback => callback(new Blob(["camera-photo"], { type: "image/jpeg" }));
  });
  await page.goto("/messages.html?with=peer-1");
  await waitForChatReady(page);
  await page.locator("#attach").click();
  await page.locator('[data-attachment-source="camera"]').click();
  await expect(page.locator("#camera-capture")).toBeVisible();
  await page.locator("#camera-shutter").click();
  await expect(page.locator(".composer-preview-thumb")).toHaveCount(1);
  await expect(page.locator(".composer-preview-thumb").first()).toHaveJSProperty("tagName", "IMG");
  await page.locator(".composer-preview-remove").click();
  await page.locator('[data-camera-mode="video"]').click();
  await page.locator("#camera-shutter").click();
  await expect(page.locator("#camera-status")).toContainText("Идёт запись видео");
  await page.locator("#camera-shutter").click();
  await expect(page.locator(".composer-preview-thumb")).toHaveCount(1);
  await expect(page.locator(".composer-preview-thumb").first()).toHaveJSProperty("tagName", "VIDEO");
  await expect(page.locator("#camera-status")).toContainText("Видео добавлено");
});

test("voice mode records and attaches audio without sending it automatically", async ({ page }) => {
  await mockAuthenticatedChat(page);
  await page.goto("/messages.html?with=peer-1");
  await waitForChatReady(page);
  await page.locator("#mic").dispatchEvent("contextmenu");
  await expect(page.locator("#voice-mode")).toBeVisible();
  await page.locator("#voice-mode-action").click();
  await expect(page.locator("#voice-mode-status")).toContainText("Запись");
  await page.locator("#voice-mode-action").click();
  await expect(page.locator("#attachment-preview")).toBeVisible();
  await expect(page.locator(".bubble-row")).toHaveCount(0);
  await expect(page.locator("#voice-mode-status")).toContainText("прикреплено");
  const state = await page.evaluate(() => ({ uploads: window.__chatTestState.uploads.length, messages: window.__chatTestState.messages.length }));
  expect(state.uploads).toBe(0);
  expect(state.messages).toBe(0);
});

test("microphone permission denial does not send an empty voice message", async ({ page }) => {
  await mockAuthenticatedChat(page, { micPermissionDenied: true });
  await page.goto("/messages.html?with=peer-1");
  await waitForChatReady(page);
  await page.locator("#mic").click();
  await expect(page.locator("#notice")).toContainText("Permission denied by test");
  const state = await page.evaluate(() => ({ micRequests: window.__chatTestState.micRequests, uploads: window.__chatTestState.uploads.length, messages: window.__chatTestState.messages.length }));
  expect(state.micRequests).toBe(1);
  expect(state.uploads).toBe(0);
  expect(state.messages).toBe(0);
});

test("public profile avatar opens fullscreen and its like toggles persist across reloads", async ({ page }) => {
  await mockPublicProfile(page, { signedIn: true });
  await page.goto("/public-profile.html?id=profile-1");
  await expect(page.locator("#avatar")).toHaveClass(/has-original/);
  await expect(page.locator("#avatar")).toHaveAttribute("role", "button");
  await page.locator("#avatar").click();
  await expect(page.locator("#photo-lightbox")).toHaveClass(/is-open/);
  await expect(page.locator("#photo-lightbox-image")).toHaveAttribute("src", "https://images.test/avatar.png");
  await expect(page.locator("#avatar-photo-actions")).toBeVisible();
  await expect(page.locator("#avatar-photo-like-count")).toHaveText("0 лайков");
  await expect(page.locator("#photo-lightbox > *")).toHaveCount(3);
  const like = page.locator("#avatar-photo-like");
  await like.click();
  await expect(page.locator("#avatar-photo-like-count")).toHaveText("1 лайк");
  await expect(like).toHaveText("♥ Нравится");
  await expect(like).toHaveClass(/liked/);
  await page.reload();
  await page.locator("#avatar").click();
  await expect(page.locator("#avatar-photo-like-count")).toHaveText("1 лайк");
  await expect(page.locator("#avatar-photo-like")).toHaveText("♥ Нравится");
  await page.locator("#avatar-photo-like").click();
  await expect(page.locator("#avatar-photo-like-count")).toHaveText("0 лайков");
  await expect(page.locator("#avatar-photo-like")).toHaveText("♡ Нравится");
  const state = await page.evaluate(() => window.__publicProfileTestState);
  expect(state.inserts).toHaveLength(1);
  expect(state.deletes).toHaveLength(1);
  expect(state.likes).toHaveLength(0);
  await page.locator("#photo-lightbox-close").click();
  await expect(page.locator("#photo-lightbox")).not.toHaveClass(/is-open/);
});

test("guest can open another users avatar but cannot like it", async ({ page }) => {
  await mockPublicProfile(page, { signedIn: false });
  await page.goto("/public-profile.html?id=profile-1");
  await page.locator("#avatar").click();
  await expect(page.locator("#photo-lightbox")).toHaveClass(/is-open/);
  await expect(page.locator("#avatar-photo-actions")).toBeVisible();
  await expect(page.locator("#avatar-photo-like")).toBeDisabled();
  await expect(page.locator("#avatar-photo-like-note")).toHaveText("Войдите, чтобы поставить лайк");
  const state = await page.evaluate(() => window.__publicProfileTestState);
  expect(state.inserts).toHaveLength(0);
  expect(state.deletes).toHaveLength(0);
  await page.keyboard.press("Escape");
  await expect(page.locator("#photo-lightbox")).not.toHaveClass(/is-open/);
});

test("photo albums are private by default and are not displayed on public profiles", () => {
  const { route: profile, markup: profileMarkup, photoAlbum } = readProfileSources();
  const publicProfile = fs.readFileSync(path.join(__dirname, "..", "public-profile.html"), "utf8");
  const publicProfileRoute = fs.readFileSync(path.join(__dirname, "..", "routes", "public-profile.js"), "utf8");
  const migration = fs.readFileSync(path.join(__dirname, "..", "supabase", "migrations", "20261122170000_private_photo_album.sql"), "utf8");
  const uploadStart = photoAlbum.indexOf('$("album-upload-button").addEventListener("click"');
  const uploadEnd = photoAlbum.indexOf("\n});", uploadStart);
  const uploadHandler = photoAlbum.slice(uploadStart, uploadEnd);
  const publicLoadStart = publicProfileRoute.indexOf("async function loadPublicAlbums(){");
  const publicLoadEnd = publicProfileRoute.indexOf("\n\nasync function start(){", publicLoadStart);
  const publicLoad = publicProfileRoute.slice(publicLoadStart, publicLoadEnd);
  expect(profileMarkup).not.toContain('id="album-private"');
  expect(profileMarkup).toContain('id="album-privacy-note">Все фотографии сохраняются в личный альбом');
  expect(uploadHandler).toContain('const bucket="photo-albums"');
  expect(uploadHandler).toContain('const table="photo_album_photos"');
  expect(uploadHandler).not.toContain('from("posts")');
  expect(publicProfile).not.toContain('id="public-photos-section"');
  expect(publicLoad).not.toContain("photo_album_photos");
  expect(publicLoad).toContain("video_album_videos");
  expect(migration).toContain('drop policy if exists "Public album photos are viewable by permanent users"');
  expect(migration).toContain('drop policy if exists "Public album photos are readable by permanent users"');
  expect(migration).toContain('create policy "Owners read own photo album files"');
  expect(migration).toContain("when 'album' then false");
  expect(migration).not.toMatch(/delete\s+from\s+(public\.)?photo_album_photos/i);
  expect(migration).not.toMatch(/delete\s+from\s+storage\.objects/i);
});

test("photos from both owner-only albums are shared to direct chats, never to the feed", () => {
  const { markup: profileMarkup, photoAlbum } = readProfileSources();
  expect(profileMarkup).toContain('id="private-album-share"');
  expect(photoAlbum).toContain('openAlbumShare({item:albumViewerItems[albumViewerIndex],bucket:"photo-albums"})');
  expect(photoAlbum).toContain('openAlbumShare({item:privateAlbumItems[privateAlbumIndex],bucket:"private-albums"})');
  const shareStart = photoAlbum.indexOf('$("album-share-send").addEventListener("click"');
  const shareEnd = photoAlbum.indexOf("\n});", shareStart);
  const shareHandler = photoAlbum.slice(shareStart, shareEnd);
  expect(shareHandler).toContain("client.storage.from(share.bucket).download(item.object_path)");
  expect(shareHandler).toContain('client.storage.from("message-media").upload');
  expect(shareHandler).toContain('client.from("direct_messages").insert');
  expect(shareHandler).not.toContain('client.from("posts").insert');
});

test("privacy settings no longer expose photo visibility and keep other controls intact", () => {
  const { route: profile, markup: profileMarkup } = readProfileSources();
  expect(profileMarkup).not.toContain('id="privacy-public-album"');
  expect(profile).not.toContain("public_album_visible");
  expect(profileMarkup).toContain('id="privacy-video-visible"');
  expect(profileMarkup).toContain('id="privacy-comments-visible"');
  expect(profileMarkup).toContain('id="privacy-feed-visible"');
  expect(profile).toContain("video_album_visible:");
  expect(profile).toContain("comments_visible:");
  expect(profile).toContain("feed_posts_visible:");
  expect(profile).toContain("Фотоальбомы всегда доступны только владельцу.");
});

test("chat photos have zero frame and open fullscreen without changing the video player", async ({ page }) => {
  const created = new Date().toISOString();
  await mockAuthenticatedChat(page, { initialMessages: [
    { id: "photo-1", sender_id: "peer-1", recipient_id: "sender-1", content: "", attachment_path: "peer-1/photo.jpg", attachment_name: "photo.jpg", attachment_mime: "image/jpeg", created_at: created },
    { id: "video-1", sender_id: "peer-1", recipient_id: "sender-1", content: "", attachment_path: "peer-1/video.mp4", attachment_name: "video.mp4", attachment_mime: "video/mp4", created_at: new Date(Date.now() + 1000).toISOString() }
  ] });
  await page.route("https://media.test/**", route => route.fulfill({ status: 200, contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/S2sAAAAASUVORK5CYII=", "base64") }));
  await page.goto("/messages.html?with=peer-1");
  await expect(page.locator(".message-media-image")).toBeVisible();
  await expect(page.locator(".message-media-video")).toHaveCount(1);
  const styles = await page.evaluate(() => {
    const view = document.querySelector("#floustream-app-shell #floustream-route-view").shadowRoot;
    const image = view.querySelector(".message-media-image");
    const photoBubble = image.closest(".bubble");
    const video = view.querySelector(".message-media-video");
    const videoBubble = video.closest(".bubble");
    const imageStyle = getComputedStyle(image);
    const photoStyle = getComputedStyle(photoBubble);
    const videoStyle = getComputedStyle(video);
    return {
      photoClass: photoBubble.classList.contains("photo-message"),
      photoBorder: photoStyle.borderTopWidth, photoPadding: photoStyle.paddingTop, photoBackground: photoStyle.backgroundColor, photoShadow: photoStyle.boxShadow,
      imageBorder: imageStyle.borderTopWidth, imageOutline: imageStyle.outlineWidth, imagePadding: imageStyle.paddingTop, imageBackground: imageStyle.backgroundColor, imageShadow: imageStyle.boxShadow, imageRadius: imageStyle.borderRadius, imageMaxWidth: imageStyle.maxWidth, imageMaxHeight: imageStyle.maxHeight, imageFit: imageStyle.objectFit,
      videoHasPhotoClass: videoBubble.classList.contains("photo-message"), videoRadius: videoStyle.borderRadius, videoBackground: videoStyle.backgroundColor, videoMaxWidth: videoStyle.maxWidth, videoMaxHeight: videoStyle.maxHeight
    };
  });
  expect(styles.photoClass).toBe(true);
  expect(styles.photoBorder).toBe("0px");
  expect(styles.photoPadding).toBe("0px");
  expect(styles.photoBackground).toBe("rgba(0, 0, 0, 0)");
  expect(styles.photoShadow).toBe("none");
  expect(styles.imageBorder).toBe("0px");
  expect(styles.imageOutline).toBe("0px");
  expect(styles.imagePadding).toBe("0px");
  expect(styles.imageBackground).toBe("rgba(0, 0, 0, 0)");
  expect(styles.imageShadow).toBe("none");
  expect(styles.imageRadius).toBe("11px");
  expect(styles.imageMaxWidth).toBe("420px");
  expect(styles.imageMaxHeight).toBe("360px");
  expect(styles.imageFit).toBe("contain");
  expect(styles.videoHasPhotoClass).toBe(false);
  expect(styles.videoRadius).toBe("11px");
  expect(styles.videoBackground).toBe("rgb(5, 5, 9)");
  expect(styles.videoMaxWidth).toBe("420px");
  expect(styles.videoMaxHeight).toBe("360px");
  await page.locator(".message-media-image").click();
  await expect(page.locator("#photo-viewer")).toBeVisible();
  await expect(page.locator("#photo-viewer-image")).toHaveAttribute("src", /^(blob:|https:\/\/media\.test\/)/);
  await page.keyboard.press("Escape");
  await expect(page.locator("#photo-viewer")).toBeHidden();
});

test("chat photos, videos and voice messages persist in the account-scoped local cache across reloads", async ({ page }) => {
  const initialMessages = [
    { id: "cached-photo-1", sender_id: "peer-1", recipient_id: "sender-1", content: "", attachment_path: "peer-1/cached-photo.jpg", attachment_name: "cached-photo.jpg", attachment_mime: "image/jpeg", created_at: new Date().toISOString() },
    { id: "cached-video-1", sender_id: "peer-1", recipient_id: "sender-1", content: "", attachment_path: "peer-1/cached-video.mp4", attachment_name: "cached-video.mp4", attachment_mime: "video/mp4", created_at: new Date(Date.now() + 1000).toISOString() },
    { id: "cached-audio-1", sender_id: "peer-1", recipient_id: "sender-1", content: "", attachment_path: "peer-1/cached-audio.m4a", attachment_name: "cached-audio.m4a", attachment_mime: "audio/mp4", created_at: new Date(Date.now() + 2000).toISOString() }
  ];
  let mediaFetches = 0;
  await mockAuthenticatedChat(page, { initialMessages });
  await page.route("https://media.test/**", route => {
    mediaFetches += 1;
    const url = route.request().url();
    const contentType = url.endsWith(".mp4") ? "video/mp4" : url.endsWith(".m4a") ? "audio/mp4" : "image/png";
    return route.fulfill({
      status: 200,
      contentType,
      headers: { "access-control-allow-origin": "*" },
      body: Buffer.from("FLOUSTREAM test media payload")
    });
  });
  await page.goto("/messages.html?with=peer-1");
  await expect(page.locator(".message-media-image")).toBeVisible();
  await expect(page.locator(".message-media-video")).toHaveCount(1);
  await expect(page.locator(".voice-player")).toHaveCount(1);
  await expect.poll(() => page.evaluate(async () => {
    const name = (await caches.keys()).find(key => key.startsWith("floustream-chat-media-v1-"));
    if (!name) return 0;
    return (await (await caches.open(name)).keys()).length;
  })).toBe(3);
  expect(mediaFetches).toBe(3);

  await page.reload();
  await expect(page.locator(".message-media-image")).toBeVisible();
  await expect(page.locator(".message-media-video")).toHaveCount(1);
  await expect(page.locator(".voice-player")).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => window.__chatTestState.signedBatches.length)).toBe(0);
  expect(mediaFetches).toBe(3);
  await expect(page.locator(".message-media-image")).toHaveAttribute("src", /^blob:/);
  await expect(page.locator(".message-media-video")).toHaveAttribute("src", /^blob:/);
  await expect(page.locator(".message-media-audio")).toHaveAttribute("src", /^blob:/);
});

test("all incoming and outgoing audio attachments share one frameless player, even without voice filename or duration", async ({ page }) => {
  const initialMessages = [
    { id: "voice-incoming", sender_id: "peer-1", recipient_id: "sender-1", content: "", attachment_path: "peer-1/recording.m4a", attachment_name: "recording.m4a", attachment_mime: "audio/mp4", created_at: new Date().toISOString() },
    { id: "voice-outgoing", sender_id: "sender-1", recipient_id: "peer-1", content: "00:12", attachment_path: "sender-1/recording.webm", attachment_name: "recording.webm", attachment_mime: "audio/webm", created_at: new Date(Date.now() + 1000).toISOString() }
  ];
  await mockAuthenticatedChat(page, { initialMessages });
  await page.goto("/messages.html?with=peer-1");
  await expect(page.locator(".voice-player")).toHaveCount(2);
  await expect(page.locator(".voice-player")).toHaveCount(2);
  await expect(page.locator(".voice-total").first()).toHaveText("0:00");
  await expect(page.locator(".message-media-audio[controls]")).toHaveCount(0);
  const frameStyles = await page.locator(".voice-player").first().evaluate(player => {
    const bubble = player.closest(".bubble");
    const playerStyle = getComputedStyle(player), bubbleStyle = getComputedStyle(bubble);
    return {
      playerBorder: playerStyle.borderTopWidth, playerOutline: playerStyle.outlineWidth, playerShadow: playerStyle.boxShadow,
      bubbleBorder: bubbleStyle.borderTopWidth, bubbleOutline: bubbleStyle.outlineWidth, bubbleShadow: bubbleStyle.boxShadow
    };
  });
  expect(frameStyles).toEqual({ playerBorder: "0px", playerOutline: "0px", playerShadow: "none", bubbleBorder: "0px", bubbleOutline: "0px", bubbleShadow: "none" });

  await page.evaluate(() => {
    const audio = document.querySelector("#floustream-app-shell #floustream-route-view").shadowRoot.querySelector(".message-media-audio");
    let playing = false;
    Object.defineProperty(audio, "paused", { configurable: true, get: () => !playing });
    Object.defineProperty(audio, "duration", { configurable: true, get: () => 18 });
    Object.defineProperty(audio, "currentTime", { configurable: true, writable: true, value: 9 });
    audio.play = () => { playing = true; audio.dispatchEvent(new Event("play")); return Promise.resolve(); };
    audio.pause = () => { playing = false; audio.dispatchEvent(new Event("pause")); };
    audio.dispatchEvent(new Event("loadedmetadata"));
    audio.dispatchEvent(new Event("timeupdate"));
  });
  await expect(page.locator(".voice-current").first()).toHaveText("0:09");
  await expect(page.locator(".voice-wave .played").first()).not.toHaveCount(0);
  const play = page.locator(".voice-play").first();
  await play.click();
  await expect(play).toHaveText("Ⅱ");
  await play.click();
  await expect(play).toHaveText("▶");
});
test("gallery picker stages multiple media, supports removing/reselecting, and sends one grouped message on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockAuthenticatedChat(page);
  await page.goto("/messages.html?with=peer-1");
  await waitForChatReady(page);
  const picker = page.locator("#attachment-input");
  await expect(picker).toHaveAttribute("multiple", "");
  const files = [
    { name: "gallery-photo.png", mimeType: "image/png", buffer: Buffer.from("photo-test") },
    { name: "gallery-video.mp4", mimeType: "video/mp4", buffer: Buffer.from("video-test") }
  ];

  await picker.setInputFiles(files);
  await expect(page.locator("#attachment-preview")).toBeVisible();
  await expect(page.locator(".composer-preview-item")).toHaveCount(2);
  await expect(page.locator("#attachment-preview-count")).toContainText("2 вложений");
  await expect.poll(() => page.evaluate(() => window.__chatTestState.inserts.length)).toBe(0);

  await page.getByRole("button", { name: "Убрать gallery-photo.png" }).click();
  await expect(page.locator(".composer-preview-item")).toHaveCount(1);
  await page.getByRole("button", { name: "Убрать gallery-video.mp4" }).click();
  await expect(page.locator("#attachment-preview")).toBeHidden();

  await picker.setInputFiles(files);
  await expect(page.locator("#attachment-preview")).toBeVisible();
  await expect(page.locator(".composer-preview-item")).toHaveCount(2);
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);

  await page.locator("#message-input").fill("Подпись к фото и видео");
  await page.locator("#send").click();
  await expect.poll(() => page.evaluate(() => window.__chatTestState.inserts.length)).toBe(1);
  await expect(page.locator("#attachment-preview")).toBeHidden();
  const state = await page.evaluate(() => ({
    row: window.__chatTestState.inserts[0],
    messages: window.__chatTestState.messages.length,
    uploads: window.__chatTestState.uploads.length
  }));
  expect(state.row.content).toBe("Подпись к фото и видео");
  expect(state.row.attachments).toHaveLength(2);
  expect(state.row.attachments.map(item => item.name)).toEqual(["gallery-photo.png", "gallery-video.mp4"]);
  expect(state.messages).toBe(1);
  expect(state.uploads).toBe(2);
});