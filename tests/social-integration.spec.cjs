const { test, expect } = require("@playwright/test");

test("authenticated home feed loads the next page when its sentinel enters view", async ({ page }) => {
  await page.addInitScript(() => {
    const viewer = { id: "viewer-1", email: "viewer@floustream.test" };
    const state = {
      posts: Array.from({ length: 7 }, (_, index) => ({
        id: index + 1,
        user_id: "author-1",
        content: "Integration post " + (index + 1),
        created_at: new Date(Date.UTC(2026, 10, 23, 10, index)).toISOString(),
        media: []
      })),
      profiles: [{ id: "author-1", username: "author", display_name: "Author", avatar_url: null }]
    };

    window.__socialFeedTestState = state;
    window.__feedObserverState = { observed: 0, disconnected: 0, callback: null };
    window.IntersectionObserver = class {
      constructor(callback) { window.__feedObserverState.callback = callback; }
      observe() { window.__feedObserverState.observed += 1; }
      disconnect() { window.__feedObserverState.disconnected += 1; }
    };

    function queryFor(table) {
      let filters = [];
      let orders = [];
      let action = "select";
      let payload = null;
      let range = null;
      let limit = null;
      let options = null;

      function rows() {
        return Array.isArray(state[table]) ? state[table] : [];
      }
      function matches(row) {
        return filters.every(filter => {
          if (filter.kind === "eq") return row[filter.column] === filter.value;
          if (filter.kind === "in") return filter.values.includes(row[filter.column]);
          return true;
        });
      }
      function execute(single) {
        let resultRows = rows().filter(matches);
        for (const order of orders.slice().reverse()) {
          resultRows = resultRows.slice().sort((a, b) => {
            const av = a[order.column], bv = b[order.column];
            const comparison = av === bv ? 0 : av > bv ? 1 : -1;
            return order.ascending ? comparison : -comparison;
          });
        }
        if (action === "insert") {
          const additions = Array.isArray(payload) ? payload : [payload];
          const inserted = additions.map((row, index) => ({
            id: row.id || table + "-" + (rows().length + index + 1),
            ...row
          }));
          rows().push(...inserted);
          resultRows = inserted;
        } else if (action === "update") {
          resultRows = resultRows.map(row => Object.assign(row, payload));
        } else if (action === "delete") {
          const removed = new Set(resultRows);
          state[table] = rows().filter(row => !removed.has(row));
          resultRows = [...removed];
        }
        const count = resultRows.length;
        if (range) resultRows = resultRows.slice(range[0], range[1] + 1);
        if (limit !== null) resultRows = resultRows.slice(0, limit);
        if (options?.head) return { data: null, count, error: null };
        if (single) return { data: resultRows[0] || null, error: null };
        return { data: resultRows, count, error: null };
      }

      const query = {
        select(_columns, nextOptions) { options = nextOptions || null; return query; },
        eq(column, value) { filters.push({ kind: "eq", column, value }); return query; },
        in(column, values) { filters.push({ kind: "in", column, values }); return query; },
        order(column, config = {}) { orders.push({ column, ascending: config.ascending !== false }); return query; },
        range(from, to) { range = [from, to]; return Promise.resolve(execute(false)); },
        limit(value) { limit = value; return query; },
        maybeSingle() { return Promise.resolve(execute(true)); },
        single() { return Promise.resolve(execute(true)); },
        insert(value) { action = "insert"; payload = value; return query; },
        update(value) { action = "update"; payload = value; return query; },
        delete() { action = "delete"; return query; },
        then(resolve, reject) { return Promise.resolve(execute(false)).then(resolve, reject); }
      };
      return query;
    }

    const client = {
      auth: {
        getSession: async () => ({ data: { session: { user: viewer, access_token: "test-token" } }, error: null }),
        getUser: async () => ({ data: { user: viewer }, error: null }),
        signOut: async () => ({ error: null })
      },
      from: queryFor,
      channel() {
        const channel = {
          on() { return channel; },
          subscribe(callback) { callback?.("SUBSCRIBED"); return channel; },
          track: async () => ({ error: null }),
          untrack: async () => ({ error: null }),
          presenceState: () => ({})
        };
        return channel;
      },
      removeChannel: async () => ({ error: null })
    };
    window.supabase = { createClient: () => client };
  });

  await page.goto("/home.html");
  await expect(page.locator(".fs-route-home #app")).toBeVisible();
  const messagesHref = await page.locator(".fs-route-home .nav a").filter({ hasText: "Сообщения" }).getAttribute("href");
  expect(messagesHref).toBe("messages.html");
  await expect(page.locator(".fs-route-home .tile[href=\"messages.html\"]")).toBeVisible();
  expect(await page.evaluate(href => window.FloustreamRouter.resolve(href)?.route, messagesHref)).toBe("messages.html");
  await expect(page.locator(".fs-route-home .post")).toHaveCount(5);
  await expect(page.locator(".fs-route-home #feed-error")).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.__feedObserverState.observed)).toBe(1);

  await page.evaluate(() => {
    window.__feedObserverState.callback([{ isIntersecting: true }]);
  });

  await expect(page.locator(".fs-route-home .post")).toHaveCount(7);
  await expect(page.locator(".fs-route-home #feed-error")).toBeHidden();
  await expect(page.locator(".fs-route-home #feed-loading")).toBeHidden();
});


test("a friend request sent from a public profile appears in the friends inbox across SPA routes", async ({ page }) => {
  await page.addInitScript(() => {
    const viewer = { id: "viewer-1", email: "viewer@floustream.test" };
    const peer = { id: "peer-1", username: "peer", display_name: "Peer User", avatar_url: null, bio: "Test profile", last_activity_at: null, time_zone: "UTC" };
    const state = window.__friendFlowState = {
      profiles: [viewer, peer],
      friend_requests: [],
      posts: [],
      reposts: [],
      video_album_videos: [],
      profile_visits: [],
      clientFactories: 0
    };

    window.initFloustreamMessageNotifications = () => {};
    window.initFloustreamFriendNotifications = () => {};

    function makeQuery(table) {
      let filters = [];
      let orFilters = [];
      let orders = [];
      let action = "select";
      let payload = null;
      let selected = "";
      let limit = null;
      let conflict = null;

      function sourceRows() {
        return Array.isArray(state[table]) ? state[table] : [];
      }
      function matches(row) {
        const direct = filters.every(item => item._in ? item.values.includes(row[item.column]) : row[item.column] === item.value);
        const alternatives = !orFilters.length || orFilters.some(group =>
          group.some(item => row[item.column] === item.value)
        );
        return direct && alternatives;
      }
      function hydrate(row) {
        const copy = { ...row };
        if (table === "friend_requests" && selected.includes("requester:profiles")) {
          copy.requester = state.profiles.find(profile => profile.id === row.requester_id) || null;
        }
        if (table === "friend_requests" && selected.includes("recipient:profiles")) {
          copy.recipient = state.profiles.find(profile => profile.id === row.recipient_id) || null;
        }
        return copy;
      }
      function execute(single) {
        let result = sourceRows().filter(matches);
        for (const order of orders.slice().reverse()) {
          result = result.slice().sort((a, b) => {
            const av = a[order.column], bv = b[order.column];
            const compared = av === bv ? 0 : av > bv ? 1 : -1;
            return order.ascending ? compared : -compared;
          });
        }
        if (action === "insert") {
          const values = Array.isArray(payload) ? payload : [payload];
          result = values.map((row, index) => ({
            id: row.id || table + "-" + (sourceRows().length + index + 1),
            created_at: new Date().toISOString(),
            status: table === "friend_requests" ? "pending" : undefined,
            ...row
          }));
          sourceRows().push(...result);
        } else if (action === "upsert") {
          const values = Array.isArray(payload) ? payload : [payload];
          result = values.map(row => {
            const keys = String(conflict || "").split(",").filter(Boolean);
            const existing = sourceRows().find(item => keys.length && keys.every(key => item[key] === row[key]));
            if (existing) return Object.assign(existing, row);
            const inserted = { id: table + "-" + (sourceRows().length + 1), ...row };
            sourceRows().push(inserted);
            return inserted;
          });
        } else if (action === "update") {
          result = result.map(row => Object.assign(row, payload));
        } else if (action === "delete") {
          const removed = new Set(result);
          state[table] = sourceRows().filter(row => !removed.has(row));
          result = [...removed];
        }
        if (limit !== null) result = result.slice(0, limit);
        result = result.map(hydrate);
        return { data: single ? result[0] || null : result, error: null, count: result.length };
      }

      const query = {
        select(columns) { selected = columns || ""; return query; },
        eq(column, value) { filters.push({ column, value }); return query; },
        in(column, values) { filters.push({ column, values, _in: true }); return query; },
        or(expression) {
          orFilters.push(String(expression).split(",").map(part => {
            const [column, , value] = part.split(".");
            return { column, value };
          }));
          return query;
        },
        order(column, config = {}) { orders.push({ column, ascending: config.ascending !== false }); return query; },
        limit(value) { limit = value; return query; },
        maybeSingle() { return Promise.resolve(execute(true)); },
        single() { return Promise.resolve(execute(true)); },
        insert(value) { action = "insert"; payload = value; return query; },
        update(value) { action = "update"; payload = value; return query; },
        delete() { action = "delete"; return query; },
        upsert(value, config = {}) { action = "upsert"; payload = value; conflict = config.onConflict; return query; },
        then(resolve, reject) { return Promise.resolve(execute(false)).then(resolve, reject); }
      };
      return query;
    }

    const client = {
      auth: {
        getSession: async () => ({ data: { session: { user: viewer, access_token: "test-token" } }, error: null }),
        getUser: async () => ({ data: { user: viewer }, error: null }),
        signOut: async () => ({ error: null })
      },
      from: makeQuery,
      channel() {
        const channel = {
          on() { return channel; },
          subscribe(callback) { callback?.("SUBSCRIBED"); return channel; },
          track: async () => ({ error: null }),
          untrack: async () => ({ error: null }),
          presenceState: () => ({})
        };
        return channel;
      },
      removeChannel: async () => ({ error: null })
    };
    window.supabase = { createClient: () => { state.clientFactories += 1; return client; } };
  });

  await page.goto("/public-profile.html?id=peer-1");
  await expect(page.locator("#display-name")).toHaveText("Peer User");
  await expect(page.locator("#friend-cta-label")).toHaveText("В друзья");
  await expect(page.locator("#contact-cta")).toHaveAttribute("href", "messages.html?with=peer-1");

  await page.locator("#friend-cta").click();
  await expect(page.locator("#friend-cta-label")).toHaveText("Заявка отправлена");
  await expect.poll(() => page.evaluate(() => window.__friendFlowState.friend_requests.length)).toBe(1);

  await page.evaluate(() => window.FloustreamRouter.navigate("friends.html"));
  await expect(page.locator(".fs-route-friends")).toBeVisible();
  await expect(page.locator(".fs-route-friends #outgoing-list .person")).toHaveCount(1);
  await expect(page.locator(".fs-route-friends #outgoing-list .name")).toHaveText("Peer User");
  await expect(page.locator(".fs-route-friends #outgoing-count")).toHaveText("1");
  expect(await page.evaluate(() => window.__friendFlowState.clientFactories)).toBe(1);
});

test("home fallback and SPA markup both route messages to the real chat page", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const homeHtml = fs.readFileSync(path.resolve(__dirname, "..", "home.html"), "utf8");
  const homeRoute = fs.readFileSync(path.resolve(__dirname, "..", "routes", "home.js"), "utf8");
  const homeStyles = fs.readFileSync(path.resolve(__dirname, "..", "routes", "styles", "home.css"), "utf8");

  expect(homeHtml).toContain('<a href="messages.html">✉ Сообщения</a>');
  expect(homeHtml).toContain('<a class="tile" href="messages.html">');
  expect(homeHtml).not.toContain('href="#messages" data-soon="Сообщения"');
  expect(homeRoute).toContain('href=\\"messages.html\\");
  expect(homeRoute).toContain('class=\\"tile\\" href=\\"messages.html\\");
  expect(homeRoute).not.toContain('href=\\"#messages\\" data-soon=\\"Сообщения\\");
  expect(homeStyles).toContain('.tile{display:block;color:inherit;text-decoration:none;');
});
