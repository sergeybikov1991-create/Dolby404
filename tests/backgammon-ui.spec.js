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
  expect(fs.existsSync(path.join(root, ".nojekyll"))).toBe(true);
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


test("authenticated game room renders 24 points and server-confirmed 3D dice", async ({ page }) => {
  const match = {
    id: "10000000-0000-4000-8000-000000000001",
    player_a: "00000000-0000-4000-8000-000000000001",
    player_b: "00000000-0000-4000-8000-000000000002",
    match_mode: "casual",
    status: "active",
    revision: 2,
    turn_number: 1,
    restart_request: null,
    state: {
      schemaVersion: 1,
      matchId: "10000000-0000-4000-8000-000000000001",
      players: {
        A: "00000000-0000-4000-8000-000000000001",
        B: "00000000-0000-4000-8000-000000000002"
      },
      points: Array.from({ length: 24 }, (_, i) => i === 23 ? 15 : i === 11 ? -15 : 0),
      borneOff: { A: 0, B: 0 },
      turn: {
        player: "A",
        phase: "moving",
        dice: [3, 5],
        remainingDice: [3, 5],
        movesApplied: [],
        headMovesApplied: 0,
        headMovesLimit: 1
      },
      opening: {
        firstPlayer: "A",
        secondPlayer: "B",
        secondPlayerFirstTurnPending: true
      },
      winner: null
    }
  };
  const stub = `const match = ${JSON.stringify(match)};
    export function createClient(){
      const query = (table) => ({
        select(){ return this; },
        or(){ return this; },
        order(){ return this; },
        limit(){ return this; },
        eq(){ return this; },
        maybeSingle(){ return Promise.resolve({data:match,error:null}); },
        in(){ return Promise.resolve({data:[],error:null}); },
        then(resolve,reject){
          return Promise.resolve({data:table === "backgammon_matches" ? [match] : [],error:null}).then(resolve,reject);
        }
      });
      return {
        auth:{getSession:async()=>({data:{session:{user:{id:match.player_a,email:"test@floustream.local"}}},error:null})},
        from:query,
        channel:()=>({on(){return this;},subscribe(){return this;}}),
        removeChannel:async()=>({}),
        functions:{invoke:async()=>({data:null,error:null})}
      };
    }`;
  await page.route("https://esm.sh/@supabase/supabase-js@2*", route => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    headers: { "Access-Control-Allow-Origin": "*" },
    body: stub,
  }));
  await page.goto("/backgammon.html", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Открыть" }).click();
  await expect(page.locator("#board .point")).toHaveCount(24);
  await expect(page.locator("#dice .die-face")).toHaveCount(12);
  await expect(page.locator("#game-status")).toContainText("Твой ход");
});
