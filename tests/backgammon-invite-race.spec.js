const { test, expect } = require("@playwright/test");

const match = {
  id: "10000000-0000-4000-8000-000000000021",
  player_a: "00000000-0000-4000-8000-000000000001",
  player_b: "00000000-0000-4000-8000-000000000002",
  match_mode: "casual",
  status: "waiting",
  revision: 0,
  turn_number: 0,
  restart_request: null,
  state: {
    schemaVersion: 1,
    matchId: "10000000-0000-4000-8000-000000000021",
    players: {
      A: "00000000-0000-4000-8000-000000000001",
      B: "00000000-0000-4000-8000-000000000002"
    },
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

const supabaseStub = `const match = ${JSON.stringify(match)};
export function createClient() {
  const query = table => ({
    select() { return this; },
    or() { return this; },
    order() { return this; },
    limit() { return this; },
    eq() { return this; },
    maybeSingle() {
      return new Promise(resolve =>
        setTimeout(() => resolve({ data: match, error: null }), 180)
      );
    },
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
      invoke: async (_name, options) => {
        window.__submittedActions = window.__submittedActions || [];
        window.__submittedActions.push(options.body);
        const accepted = options.body.action_type === "accept_match";
        return {
          data: {
            status: accepted ? "awaiting_opening_roll" : "cancelled",
            state: match.state,
            turn_number: 0,
            revision: 1,
            restart_request: null
          },
          error: null
        };
      }
    }
  };
}`;

async function openIncomingInvite(page) {
  await page.route("https://esm.sh/@supabase/supabase-js@2*", route => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    headers: { "Access-Control-Allow-Origin": "*" },
    body: supabaseStub
  }));
  await page.goto("/backgammon.html", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Принять", exact: true })).toBeVisible();
}

test("accepting an incoming match waits for its authoritative snapshot", async ({ page }) => {
  await openIncomingInvite(page);
  await page.getByRole("button", { name: "Принять", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__submittedActions?.length || 0)).toBe(1);
  const action = await page.evaluate(() => window.__submittedActions[0]);
  expect(action.action_type).toBe("accept_match");
  expect(action.match_id).toBe(match.id);
});

test("declining an incoming match waits for its authoritative snapshot", async ({ page }) => {
  await openIncomingInvite(page);
  await page.getByRole("button", { name: "Отклонить", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__submittedActions?.length || 0)).toBe(1);
  const action = await page.evaluate(() => window.__submittedActions[0]);
  expect(action.action_type).toBe("decline_match");
  expect(action.match_id).toBe(match.id);
});
