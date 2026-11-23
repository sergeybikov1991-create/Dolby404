import test from "node:test";
import assert from "node:assert/strict";
import { cachedRequest, clearRequestCache, invalidateCachedRequests } from "../shared/request-cache.mjs";

test("deduplicates concurrent requests for the same key", async () => {
  clearRequestCache();
  let calls = 0;
  const loader = async () => {
    calls += 1;
    await Promise.resolve();
    return { value: 42 };
  };
  const [first, second] = await Promise.all([
    cachedRequest("same", loader, { ttlMs: 1000 }),
    cachedRequest("same", loader, { ttlMs: 1000 })
  ]);
  assert.equal(calls, 1);
  assert.strictEqual(first, second);
});

test("reuses successful results until the TTL expires", async () => {
  clearRequestCache();
  let calls = 0;
  const loader = async () => ++calls;
  assert.equal(await cachedRequest("ttl", loader, { ttlMs: 1000 }), 1);
  assert.equal(await cachedRequest("ttl", loader, { ttlMs: 1000 }), 1);
  assert.equal(calls, 1);
});

test("does not cache rejected requests and permits retry", async () => {
  clearRequestCache();
  let calls = 0;
  await assert.rejects(cachedRequest("retry", async () => {
    calls += 1;
    throw new Error("temporary");
  }, { ttlMs: 1000 }), /temporary/);
  assert.equal(await cachedRequest("retry", async () => {
    calls += 1;
    return "recovered";
  }, { ttlMs: 1000 }), "recovered");
  assert.equal(calls, 2);
});

test("invalidates matching keys without clearing other users' entries", async () => {
  clearRequestCache();
  await cachedRequest("home-feed:user-a:0:5", async () => "a", { ttlMs: 1000 });
  await cachedRequest("home-feed:user-b:0:5", async () => "b", { ttlMs: 1000 });
  assert.equal(invalidateCachedRequests("home-feed:user-a:"), 1);
  assert.equal(await cachedRequest("home-feed:user-b:0:5", async () => "new-b", { ttlMs: 1000 }), "b");
  assert.equal(await cachedRequest("home-feed:user-a:0:5", async () => "new-a", { ttlMs: 1000 }), "new-a");
});
