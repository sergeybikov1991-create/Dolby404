const { test, expect } = require("@playwright/test");

const playerA = "00000000-0000-4000-8000-000000000001";
const playerB = "00000000-0000-4000-8000-000000000002";
const match = {
  id: "10000000-0000-4000-8000-000000000031",
  player_a: playerA,
  player_b: playerB,
  match_mode: "casual",
  status: "active",
  revision: 3,
  turn_number: 2,
  restart_request: {
    id: "20000000-0000-4000-8000-000000000031",
    initiator_id: playerA,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 1800).toISOString(),
    votes: { A: true, B: false }
  },
  state: {
    schemaVersion: 1,
    matchId: "10000000-0000-4000-8000-000000000031",
    players: { A: playerA, B: playerB },
    points: Array.from({ length: 24 }, (_, index) =>
      index === 23 ? 15 : index === 11 ? -15 : 0
    ),
    borneOff: { A: 0, B: 0 },
    turn: {
      player: "A",
      phase: "awaiting_roll",
      dice: [],
      remainingDice: [],
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

const supabaseStub = \`const match = \${JSON.stringify(match)};
export function createClient() {
  const query = table => ({
    select() { return this; },
    or() { return this; },
    order() { return this; },
    limit() { return this; },
    eq() { return this; },
    maybeSingle() { return Promise.resolve({ data: match, error: null }); },
    in() { return Promise.resolve({ data: [], error: null }); },
    then(resolve, reject) {
      return Promise.resolve({
        data: table === "backgammon_matches" ? [match] : [],
        error: null
      }).then(resolve, reject);
    }
  });
  return {
    auth: {
      getSession: async () => ({
        data: { session: { user: { id: match.player_b, email: "player-b@floustream.local" } } },
        error: null
      })
    },
    from: query,
    channel: () => ({
      on() { return this; },
      subscribe(callback) { callback("SUBSCRIBED"); return this; }
    }),
    removeChannel: async () => ({}),
    functions: {
      invoke: async () => ({ data: null, error: null })
    }
  };
}\`;

test("an open restart request expires on screen and allows a fresh proposal", async ({ page }) => {
  await page.route("https://esm.sh/@supabase/supabase-js@2*", route => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    headers: { "Access-Control-Allow-Origin": "*" },
    body: supabaseStub
  }));
  await page.goto("/backgammon.html", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Открыть" }).click();

  await expect(page.locator("#restart-box")).toContainText("Соперник предлагает начать партию заново.");
  await expect(page.getByRole("button", { name: "Согласиться" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Отказаться" })).toBeVisible();

  await expect(page.locator("#restart-box")).toContainText(
    "Время предложения истекло. Можно предложить рестарт снова.",
    { timeout: 4000 }
  );
  await expect(page.getByRole("button", { name: "Предложить рестарт" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Согласиться" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Отказаться" })).toHaveCount(0);
});
