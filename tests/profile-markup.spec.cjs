const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

test("profile entry uses the shared SPA router and keeps application code in a route module", () => {
  const html = fs.readFileSync(path.resolve(__dirname, "..", "profile.html"), "utf8");
  const route = fs.readFileSync(path.resolve(__dirname, "..", "routes", "profile.js"), "utf8");
  expect(html).toContain('src="./app-router.js?v=1"');
  expect(html).not.toContain("const SUPABASE_URL");
  expect(html).not.toMatch(/<style\\b/);
  expect(route).toContain("export const shadow = false;");
  expect(route).toContain("export async function mount(");
  expect(route).toContain("profileObservers.forEach");
  expect(route).toContain("profileTimerKinds.clear()");
});
