import test from "node:test";
import assert from "node:assert/strict";

import {
  beginEmailCodeReverification,
  completeEmailCodeReverification
} from "../shared/clerk-reverification.mjs";

test("starts first-factor email-code reverification for the verified primary email", async () => {
  const calls = [];
  const clerk = {
    user: { primaryEmailAddress: { id: "email_123", verification: { status: "verified" } } },
    session: {
      async startVerification(input) {
        calls.push(["start", input]);
        return { status: "needs_first_factor" };
      },
      async prepareFirstFactorVerification(input) {
        calls.push(["prepare", input]);
        return { status: "needs_first_factor", supportedFirstFactors: [{ strategy: "email_code" }] };
      }
    }
  };

  const result = await beginEmailCodeReverification(clerk);
  assert.equal(result.status, "needs_first_factor");
  assert.equal(result.supportedFirstFactors[0].strategy, "email_code");
  assert.deepEqual(calls, [
    ["start", { level: "first_factor" }],
    ["prepare", { strategy: "email_code", emailAddressId: "email_123", primary: true }]
  ]);
});

test("rejects reverification without a verified primary email", async () => {
  const clerk = { user: { primaryEmailAddress: { id: "email_123", verification: { status: "unverified" } } }, session: {} };
  await assert.rejects(() => beginEmailCodeReverification(clerk), /verified primary email/);
});

test("refreshes the session token after successful email-code reverification", async () => {
  const calls = [];
  const clerk = {
    session: {
      async attemptFirstFactorVerification(input) {
        calls.push(["attempt", input]);
        return { status: "complete" };
      },
      clearCache() { calls.push(["clearCache"]); },
      async getToken(input) { calls.push(["getToken", input]); return "fresh-session-token"; }
    }
  };

  const result = await completeEmailCodeReverification(clerk, "123456");
  assert.deepEqual(result, { complete: true, token: "fresh-session-token" });
  assert.deepEqual(calls, [
    ["attempt", { strategy: "email_code", code: "123456" }],
    ["clearCache"],
    ["getToken", { skipCache: true }]
  ]);
});

test("does not request a token when reverification remains incomplete", async () => {
  const clerk = {
    session: {
      async attemptFirstFactorVerification() { return { status: "needs_first_factor" }; },
      clearCache() { throw new Error("must not clear cache"); },
      async getToken() { throw new Error("must not get token"); }
    }
  };
  const result = await completeEmailCodeReverification(clerk, "123456");
  assert.deepEqual(result, { complete: false, status: "needs_first_factor" });
});

test("rejects malformed email codes", async () => {
  const clerk = { session: { async attemptFirstFactorVerification() { throw new Error("must not attempt"); } } };
  await assert.rejects(() => completeEmailCodeReverification(clerk, "abc"), /verification code/);
});
