import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("long backgammon room redirects signed-out visitors to FLOUSTREAM auth", async ({ page }) => {
  await page.route("https://esm.sh/@supabase/supabase-js@2*", route => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: `export function createClient(){return {auth:{getSession:async()=>({data:{session:null},error:null})}}}`,
  }));
  await page.goto("/backgammon.html");
  await expect(page).toHaveURL(/\/portal\.html$/);
});

test("long backgammon room exposes the real board and server action controls", () => {
  const html = fs.readFileSync(path.join(root, "backgammon.html"), "utf8");
  const script = fs.readFileSync(path.join(root, "backgammon.js"), "utf8");
  expect(html).toContain('id="board-top"');
  expect(html).toContain('id="board-bottom"');
  expect(html).toContain('id="invite-form"');
  expect(html).toContain('id="restart-box"');
  expect(script).toContain('client.functions.invoke("backgammon-action"');
  expect(script).toContain('engine.getLegalMoves');
  expect(script).toContain('invokeAction("restart_vote"');
});
