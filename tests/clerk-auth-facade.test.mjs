import test from "node:test";
import assert from "node:assert/strict";

import { createClerkAuthFacade } from "../shared/clerk-auth.mjs";

const userId = "33333333-3333-4333-8333-333333333333";
const token = "eyJhbGciOiJSUzI1NiJ9." + Buffer.from(JSON.stringify({ exp: 1900000000 })).toString("base64url") + ".signature";

function createHarness() {
  const calls = [];
  const session = {
    async getToken(options) {
      calls.push(["getToken", options ?? null]);
      return token;
    }
  };
  const clerk = {
    session: null,
    user: {
      id: "user_test_123",
      firstName: "Test",
      lastName: "User",
      fullName: "Test User",
      unsafeMetadata: { country_code: "LV", preferred_language: "ru" },
      primaryEmailAddress: {
        emailAddress: "test@example.com",
        verification: { status: "verified" }
      },
      async reload() { calls.push(["user.reload"]); },
      async updatePassword(input) { calls.push(["updatePassword", input]); },
      async update(input) { calls.push(["user.update", input]); },
      async updateMetadata(input) { calls.push(["updateMetadata", input]); }
    },
    client: {},
    async setActive(input) { calls.push(["setActive", input]); this.session = session; },
    async signOut() { calls.push(["signOut"]); this.session = null; },
    addListener(listener) { this.listener = listener; return () => calls.push(["removeListener"]); }
  };

  const signUp = {
    status: "missing_requirements",
    async password(input) { calls.push(["signUp.password", input]); return { error: null }; },
    verifications: {
      async sendEmailCode() { calls.push(["signUp.sendEmailCode"]); return { error: null }; },
      async verifyEmailCode(input) {
        calls.push(["signUp.verifyEmailCode", input]);
        signUp.status = "complete";
        signUp.createdSessionId = "sess_signup";
        return { error: null };
      }
    },
    async finalize() {
      calls.push(["signUp.finalize"]);
      clerk.session = session;
      return { createdSessionId: "sess_signup" };
    }
  };

  const signIn = {
    status: "complete",
    async password(input) { calls.push(["signIn.password", input]); return { error: null }; },
    async create(input) { calls.push(["signIn.create", input]); return { error: null }; },
    emailCode: {
      async sendCode() { calls.push(["signIn.sendCode"]); return { error: null }; },
      async verifyCode(input) {
        calls.push(["signIn.verifyCode", input]);
        signIn.status = "complete";
        signIn.createdSessionId = "sess_signin";
        return { error: null };
      }
    },
    async finalize() {
      calls.push(["signIn.finalize"]);
      clerk.session = session;
      return { createdSessionId: "sess_signin" };
    }
  };
  clerk.client.signUp = signUp;
  clerk.client.signIn = signIn;

  const supabase = {
    async rpc(name) {
      calls.push(["rpc", name]);
      return { data: userId, error: null };
    },
    functions: {
      async invoke(name, options) {
        calls.push(["invoke", name, options]);
        return { data: { userId }, error: null };
      }
    }
  };
  return { clerk, supabase, calls, auth: createClerkAuthFacade(clerk, supabase) };
}

test("Clerk auth facade exposes the stable FLOUSTREAM UUID in getSession/getUser", async () => {
  const { clerk, auth } = createHarness();
  clerk.session = { getToken: async () => token };
  const session = await auth.getSession();
  const user = await auth.getUser();
  assert.equal(session.data.session.user.id, userId);
  assert.equal(user.data.user.id, userId);
  assert.equal(session.data.session.user.email, "test@example.com");
});

test("Clerk sign-up requires an email code and provisions the stable identity", async () => {
  const { auth, calls } = createHarness();
  const started = await auth.signUp({
    email: "test@example.com",
    password: "StrongPassword123!",
    options: { data: { first_name: "Test", last_name: "User", country_code: "LV", preferred_language: "ru" } }
  });
  assert.equal(started.data.verificationPending, true);
  assert.ok(calls.some(call => call[0] === "signUp.sendEmailCode"));

  const verified = await auth.verifySignUpEmailCode("123456");
  assert.equal(verified.data.session.user.id, userId);
  assert.ok(calls.some(call => call[0] === "signUp.verifyEmailCode"));
  assert.ok(calls.some(call => call[0] === "invoke" && call[1] === "clerk-provision-user"));
  assert.ok(calls.some(call => call[0] === "user.reload"));
});

test("Clerk password sign-in activates the session and resolves the stable UUID", async () => {
  const { auth, calls } = createHarness();
  const result = await auth.signInWithPassword({ email: "test@example.com", password: "StrongPassword123!" });
  assert.equal(result.data.session.user.id, userId);
  assert.ok(calls.some(call => call[0] === "signIn.password"));
  assert.ok(calls.some(call => call[0] === "signIn.finalize"));
});

test("Clerk email-code sign-in supports account recovery", async () => {
  const { auth, calls } = createHarness();
  const started = await auth.signInWithOtp({ email: "test@example.com" });
  assert.equal(started.data.verificationPending, true);
  const verified = await auth.verifySignInEmailCode("123456");
  assert.equal(verified.data.session.user.id, userId);
  assert.ok(calls.some(call => call[0] === "signIn.sendCode"));
  assert.ok(calls.some(call => call[0] === "signIn.verifyCode"));
});

test("Clerk auth facade updates passwords and signs out", async () => {
  const { auth, clerk, calls } = createHarness();
  clerk.session = { getToken: async () => token };
  const update = await auth.updateUser({ password: "NewStrongPassword123!" });
  assert.equal(update.data.user.id, userId);
  assert.ok(calls.some(call => call[0] === "updatePassword"));
  const signedOut = await auth.signOut();
  assert.equal(signedOut.error, null);
  assert.equal(clerk.session, null);
});
