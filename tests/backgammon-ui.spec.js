const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");

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
  expect(script).toContain('selected-checker');
  expect(script).toContain('position === "top" ? 0 : visible - 1');
  expect(script).toContain('stack.querySelector(".checker:first-child")');
  expect(html).toContain('.checker.selected-checker');
  expect(script).toContain('invokeAction("restart_vote"');
  expect(script).toContain('die-face');
  expect(script).toContain('die-cube');
  expect(script).toContain('3: "rotateX(90deg)');
  expect(script).toContain('4: "rotateX(-90deg)');
  expect(script).toContain('animateNextDice');
  expect(script).toContain('window.confirm("Предложить начать партию заново?")');
  expect(script).toContain('animateCheckerMove');
  expect(script).toContain("let realtimeWasConnected = false;");
  expect(script).toContain('.subscribe(async status =>');
  expect(script).toContain('"CHANNEL_ERROR", "TIMED_OUT", "CLOSED"');
  expect(script).toContain("Связь восстановлена. Состояние партии обновлено.");
});


test("backgammon dice render six 3D faces and settle on the confirmed result", () => {
  const html = fs.readFileSync(path.join(root, "backgammon.html"), "utf8");
  const script = fs.readFileSync(path.join(root, "backgammon.js"), "utf8");
  expect(html).toContain(".die-cube");
  expect(html).toContain(".die-face.front");
  expect(html).toContain(".die-face.back");
  expect(html).toContain("@keyframes cube-roll");
  expect(html).toContain("@keyframes die-shadow");
  expect(html).toContain(".die.rolling::after");
  expect(html).toContain("translateY(-17px)");
  expect(html).toContain("translateY(-11px)");
  expect(html).toContain("translateY(-6px)");
  expect(script).toContain("finalTransforms");
  expect(script).toContain("const randomTurn = ()");
  expect(script).toContain("`--roll-${axis}-${index + 1}`");
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
  const stub = `const match = ${JSON.stringify(match)}; let latestMatch = match;
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
        channel:()=>({on(){return this;},subscribe(callback){window.__flouRealtimeStatus=callback;return this;}}),
        removeChannel:async()=>({}),
        functions:{invoke:async(_name,options)=>{window.__flouActions=window.__flouActions||[];window.__flouActions.push(options.body);return {data:{status:"active",state:match.state,turn_number:1,revision:3,restart_request:null},error:null};}}
      };
    }`;
  await page.route("https://esm.sh/@supabase/supabase-js@2*", route => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    headers: { "Access-Control-Allow-Origin": "*" },
    body: stub,
  }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/backgammon.html", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Открыть" }).click();
  await expect(page.locator("#board .point")).toHaveCount(24);
  const hasHorizontalOverflow = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(hasHorizontalOverflow).toBe(false);
  await expect(page.locator("#dice .die-face")).toHaveCount(12);
  await expect(page.locator("#game-status")).toContainText("Твой ход");

  // Establish the first subscription before simulating a later reconnect.
  await page.evaluate(async () => await window.__flouRealtimeStatus("SUBSCRIBED"));
  await page.evaluate(() => window.__flouRealtimeStatus("CHANNEL_ERROR"));
  await expect(page.locator("#game-notice")).toContainText("Соединение с соперником прервано");
  await page.evaluate(async () => await window.__flouRealtimeStatus("SUBSCRIBED"));
  await expect(page.locator("#game-notice")).toContainText("Связь восстановлена. Состояние партии обновлено.");

  // Drag A's checker from point 24 to the legal point 21 using die 3.
  const source = page.locator('#board .point[data-index="23"]');
  const destination = page.locator('#board .point[data-index="20"]');
  await source.scrollIntoViewIfNeeded();
  await destination.scrollIntoViewIfNeeded();
  const sourceBox = await source.boundingBox();
  const destinationBox = await destination.boundingBox();
  expect(sourceBox).not.toBeNull();
  expect(destinationBox).not.toBeNull();
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(destinationBox.x + destinationBox.width / 2, destinationBox.y + destinationBox.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => window.__flouActions?.length || 0)).toBe(1);
  const submitted = await page.evaluate(() => window.__flouActions[0]);
  expect(submitted.action_type).toBe("move");
  expect(submitted.payload.move.from).toBe(23);
  expect(submitted.payload.move.to).toBe(20);
  expect(submitted.payload.move.die).toBe(3);
});

test("both players reveal the same server-confirmed opening dice from Realtime", async ({ browser }) => {
  const match = {
    id: "10000000-0000-4000-8000-000000000010",
    player_a: "00000000-0000-4000-8000-000000000001",
    player_b: "00000000-0000-4000-8000-000000000002",
    match_mode: "casual",
    status: "awaiting_opening_roll",
    revision: 1,
    turn_number: 0,
    restart_request: null,
    state: {
      schemaVersion: 1,
      matchId: "10000000-0000-4000-8000-000000000010",
      players: { A: "00000000-0000-4000-8000-000000000001", B: "00000000-0000-4000-8000-000000000002" },
      points: Array.from({ length: 24 }, (_, i) => i === 23 ? 15 : i === 11 ? -15 : 0),
      borneOff: { A: 0, B: 0 },
      turn: { player: "A", phase: "awaiting_roll", dice: [], remainingDice: [], movesApplied: [], headMovesApplied: 0, headMovesLimit: 1 },
      opening: { firstPlayer: "A", secondPlayer: "B", secondPlayerFirstTurnPending: true },
      winner: null
    }
  };
  const updated = {
    ...match,
    status: "active",
    revision: 2,
    turn_number: 1,
    state: {
      ...match.state,
      turn: { ...match.state.turn, player: "A", phase: "moving", dice: [4, 6], remainingDice: [4, 6] }
    }
  };
  const stub = `const match = ${JSON.stringify(match)}; let latestMatch = match;
    export function createClient(){
      const query = table => ({
        select(){return this;}, or(){return this;}, order(){return this;}, limit(){return this;}, eq(){return this;},
        maybeSingle(){return Promise.resolve({data:latestMatch,error:null});},
        in(){return Promise.resolve({data:[],error:null});},
        then(resolve,reject){return Promise.resolve({data:table === "backgammon_matches" ? [latestMatch] : [],error:null}).then(resolve,reject);}
      });
      return {
        auth:{getSession:async()=>({data:{session:{user:{id:window.__testUserId,email:"player@floustream.local"}}},error:null})},
        from:query,
        channel:()=>({on(_event,_filter,handler){window.__flouMatchUpdate=payload=>{latestMatch=payload.new;return handler(payload);};return this;},subscribe(callback){window.__flouRealtimeStatus=callback;return this;}}),
        removeChannel:async()=>({})
      };
    }`;
  const pages = [];
  for (const userId of [match.player_a, match.player_b]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.addInitScript(id => { window.__testUserId = id; }, userId);
    await page.route("https://esm.sh/@supabase/supabase-js@2*", route => route.fulfill({
      status: 200, contentType: "application/javascript",
      headers: { "Access-Control-Allow-Origin": "*" }, body: stub
    }));
    await page.goto("/backgammon.html", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Открыть" }).click();
    await expect(page.locator("#game")).toBeVisible();
    pages.push({ page, context });
  }

  for (const { page } of pages) {
    await page.evaluate(async row => {
      await window.__flouMatchUpdate({ new: row });
    }, updated);
    await expect(page.locator("#dice .dice-result")).toHaveText("4 + 6");
    await expect(page.locator("#dice .die")).toHaveCount(2);
  }
  const values = await Promise.all(pages.map(({ page }) => page.locator("#dice .dice-result").textContent()));
  expect(values).toEqual(["4 + 6", "4 + 6"]);

  const moved = {
    ...updated,
    revision: 3,
    state: {
      ...updated.state,
      points: updated.state.points.map((count, index) =>
        index === 23 ? 14 : index === 19 ? 1 : count
      ),
      turn: {
        ...updated.state.turn,
        remainingDice: [6],
        movesApplied: [{ player: "A", from: 23, to: 19, die: 4, bearOff: false }],
        headMovesApplied: 1
      }
    }
  };
  for (const { page } of pages) {
    await page.evaluate(async row => {
      await window.__flouMatchUpdate({ new: row });
    }, moved);
    await expect(page.locator('#board .point[data-index="23"] .checker-count')).toHaveText("14");
    await expect(page.locator('#board .point[data-index="19"] .checker')).toHaveCount(1);
  }
  await Promise.all(pages.map(({ context }) => context.close()));
});

test("a direct conversation can switch into an embedded game and return without losing chat", () => {
  const messages = fs.readFileSync(path.join(root, "messages.html"), "utf8");
  const gamePage = fs.readFileSync(path.join(root, "backgammon.html"), "utf8");
  const gameScript = fs.readFileSync(path.join(root, "backgammon.js"), "utf8");
  expect(messages).toContain('id="game-toggle"');
  expect(messages).toContain('id="game-frame"');
  expect(messages).toContain('backgammon.html?embed=1&opponent=');
  expect(messages).toContain('gameToggle.textContent=opening?"Вернуться в чат":"Играть"');
  expect(gamePage).toContain("body.embed .shell>aside{display:none}");
  expect(gamePage).toContain("body.embed .game-panel{display:flex");
  expect(gamePage).toContain("body.embed .board-wrap{display:flex;flex:1");
  expect(gamePage).not.toContain('id="close-match"');
  expect(gameScript).not.toContain('close-match');
  expect(gameScript).toContain('get("opponent")');
  expect(gameScript).toContain("const reusable = matches.find");
  expect(gameScript).toContain("await createMatch(opponent)");
  expect(gameScript).toContain('await invokeAction("accept_match")');
});

test("opening rolls advance the match-wide turn number after a mutual restart", () => {
  const edge = fs.readFileSync(path.join(root, "supabase/functions/backgammon-action/index.ts"), "utf8");
  const opening = edge.slice(edge.indexOf('case "opening_roll"'), edge.indexOf('case "roll"'));
  expect(opening).toContain("nextTurnNumber = match.turn_number + 1;");
  expect(opening).not.toContain("nextTurnNumber = 1;");
});


test("3D board enlarges only the selected top checker and gives the board more room", () => {
  const html = fs.readFileSync(path.join(root, "backgammon.html"), "utf8");
  const script = fs.readFileSync(path.join(root, "backgammon.js"), "utf8");
  expect(html).toContain(".board-wrap{\n  position:relative;");
  expect(html).toContain("min-height:500px;");
  expect(html).toContain("width:min(90%,30px)");
  expect(html).toContain("transform:translateY(-6px) scale(1.3)");
  expect(html).toContain("body.embed .board-wrap");
  expect(script).toContain('checker.classList.add("selected-checker")');
  expect(script).toContain('if (selectedFrom === index) button.classList.add("selected")');
  expect(script).toContain('position === "top" ? 0 : visible - 1');
});
