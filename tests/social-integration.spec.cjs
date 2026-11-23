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
