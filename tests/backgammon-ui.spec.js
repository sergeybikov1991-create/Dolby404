import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("long backgammon room redirects signed-out visitors to FLOUSTREAM auth", async ({ page }) => {
  await page.route("https://esm.sh/@supabase/supabase-js@2*", route => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    headers: { "Access-Control-Allow-Origin": "*" },
    body: `export function createClient(){return {auth:{getSession:async()=>({data:{session:null},error:null})}}}`,
  }));
  await page.goto("/backgammon.html", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/portal\.html$/, { timeout: 8000 });
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
  expect(script).toContain('die-face');
  expect(script).toContain('die-cube');
  expect(script).toContain('3: "rotateX(90deg)');
  expect(script).toContain('4: "rotateX(-90deg)');
  expect(script).toContain('animateNextDice');
  expect(script).toContain('window.confirm("Предложить начать партию заново?")');
  expect(script).toContain('animateCheckerMove');
});


test("backgammon dice render six 3D faces and settle on the confirmed result", () => {
  const html = fs.readFileSync(path.join(root, "backgammon.html"), "utf8");
  const script = fs.readFileSync(path.join(root, "backgammon.js"), "utf8");
  expect(html).toContain(".die-cube");
  expect(html).toContain(".die-face.front");
  expect(html).toContain(".die-face.back");
  expect(html).toContain("@keyframes cube-roll");
  expect(script).toContain("finalTransforms");
  expect(script).toContain('side: "bottom"');
  expect(script).toContain('side: "top"');
});

test("checker movement animation is shared by local and Realtime state updates", () => {
  const script = fs.readFileSync(path.join(root, "backgammon.js"), "utf8");
  expect(script).toContain("function captureCheckerMove");
  expect(script).toContain("function animateCheckerMove");
  expect(script).toContain("piece.animate(");
  expect(script).toContain('"(prefers-reduced-motion: reduce)"');
  expect(script).toContain("renderGame(previousState)");
});
