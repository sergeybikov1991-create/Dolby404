const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

test("profile entry uses the shared SPA router and keeps application code in a route module", () => {
  const html = fs.readFileSync(path.resolve(__dirname, "..", "profile.html"), "utf8");
  const route = fs.readFileSync(path.resolve(__dirname, "..", "routes", "profile.js"), "utf8");
  expect(html).toContain('src="./app-router.js?v=1"');
  expect(html).not.toContain("const SUPABASE_URL");
  expect(html).not.toMatch(/<style\b/);
  expect(route).toContain("export const shadow = false;");
  expect(route).toContain("export async function mount(");
  expect(route).toContain("profileObservers.forEach");
  expect(route).toContain("profileTimerKinds.clear()");
});


test("profile video album is a lazy feature module", () => {
  const profile = fs.readFileSync(path.resolve(__dirname, "..", "routes", "profile.js"), "utf8");
  const videoModulePath = path.resolve(__dirname, "..", "routes", "profile", "video-album.mjs");
  expect(profile).toContain('import("./profile/video-album.mjs")');
  expect(profile).not.toContain("function loadVideoAlbum(");
  expect(fs.existsSync(videoModulePath)).toBe(true);
  const videoModule = fs.readFileSync(videoModulePath, "utf8");
  expect(videoModule).toContain("export function initProfileVideoAlbum");
  expect(videoModule).toContain("dispose()");
});


test("profile photo albums are a lazy feature module", () => {
  const profile = fs.readFileSync(path.resolve(__dirname, "..", "routes", "profile.js"), "utf8");
  const photoModulePath = path.resolve(__dirname, "..", "routes", "profile", "photo-album.mjs");
  expect(profile).toContain('import("./profile/photo-album.mjs")');
  expect(profile).not.toContain("async function loadPhotoAlbum(");
  expect(fs.existsSync(photoModulePath)).toBe(true);
  const photoModule = fs.readFileSync(photoModulePath, "utf8");
  expect(photoModule).toContain("export function initProfilePhotoAlbum");
  expect(photoModule).toContain("dispose()");
});



test("profile quick navigation opens the shared messages route", () => {
  const route = fs.readFileSync(path.resolve(__dirname, "..", "routes", "profile.js"), "utf8");
  const start = route.indexOf("quick-nav");
  const end = route.indexOf("</nav>", start);
  const quickNav = route.slice(start, end);
  const messagesItem = quickNav.split("\n").find(line => line.includes("Сообщения"));
  expect(messagesItem).toContain("messages.html?v=20261119-realtime-2");
  expect(messagesItem).toContain("</a>");
  expect(messagesItem).not.toContain("data-soon");
});
