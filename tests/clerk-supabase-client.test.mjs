import test from "node:test";
import assert from "node:assert/strict";

import {
  createClerkSupabaseClient,
  createThirdPartySupabaseClient
} from "../shared/supabase-client.mjs";

let previousWindow;

test.beforeEach(() => {
  previousWindow = globalThis.window;
});

test.afterEach(() => {
  if (previousWindow === undefined) delete globalThis.window;
  else globalThis.window = previousWindow;
});

function installSupabaseStub() {
  const calls = [];
  globalThis.window = {
    supabase: {
      createClient(url, key, options) {
        const client = { url, key, options };
        calls.push(client);
        return client;
      }
    }
  };
  return calls;
}

test("third-party client passes a fresh Clerk-compatible token callback", async () => {
  const calls = installSupabaseStub();
  let currentToken = "clerk-session-token-1";

  const client = await createThirdPartySupabaseClient(async () => currentToken);

  assert.equal(calls.length, 1);
  assert.equal(client.options.auth.persistSession, false);
  assert.equal(client.options.auth.autoRefreshToken, false);
  assert.equal(await client.options.accessToken(), "clerk-session-token-1");

  currentToken = "clerk-session-token-2";
  assert.equal(await client.options.accessToken(), "clerk-session-token-2");
});

test("third-party client returns null when no user token is available", async () => {
  installSupabaseStub();
  const client = await createThirdPartySupabaseClient(async () => null);
  assert.equal(await client.options.accessToken(), null);
});

test("Clerk bridge reads the currently active session on every request", async () => {
  installSupabaseStub();
  const clerk = {
    session: {
      async getToken() { return "first-session"; }
    }
  };

  const client = await createClerkSupabaseClient(clerk);
  assert.equal(await client.options.accessToken(), "first-session");

  clerk.session = {
    async getToken() { return "replacement-session"; }
  };
  assert.equal(await client.options.accessToken(), "replacement-session");
});

test("Clerk bridge refuses to initialize without Clerk", async () => {
  installSupabaseStub();
  await assert.rejects(
    () => createClerkSupabaseClient(null),
    /Clerk is not initialized/
  );
});
