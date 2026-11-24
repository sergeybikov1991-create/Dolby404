import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const forward = readFileSync(
  new URL("../docs/auth/drafts/clerk_identity_bridge_and_rls_draft.sql", import.meta.url),
  "utf8"
);
const rollback = readFileSync(
  new URL("../docs/auth/drafts/clerk_identity_bridge_rollback_draft.sql", import.meta.url),
  "utf8"
);

test("forward draft preserves the audited 22 application foreign keys", () => {
  assert.equal((forward.match(/DROP CONSTRAINT/g) || []).length, 22);
  assert.equal((forward.match(/ADD CONSTRAINT/g) || []).length, 22);
  assert.match(forward, /REFERENCES public\.app_users\(id\)/);
  assert.match(forward, /REFERENCES public\.app_users\(id\)[\s\S]*ON DELETE CASCADE/);
});

test("forward draft replaces all 104 auth.uid policies without dropping policy semantics", () => {
  assert.equal((forward.match(/DROP POLICY IF EXISTS/g) || []).length, 104);
  assert.equal((forward.match(/CREATE POLICY/g) || []).length, 104);
  assert.match(forward, /CREATE OR REPLACE FUNCTION public\.floustream_user_id\(\)/);
  assert.match(forward, /u\.clerk_user_id = subject/);
  assert.match(forward, /WITH CHECK/);
  assert.match(forward, /AS RESTRICTIVE/);
});

test("new Clerk provisioning is service-role only and requires a shadow auth identity", () => {
  assert.match(forward, /CREATE OR REPLACE FUNCTION public\.provision_clerk_user/);
  assert.match(forward, /matching Supabase Auth shadow identity is required/);
  assert.match(forward, /GRANT EXECUTE ON FUNCTION public\.provision_clerk_user[\s\S]*TO service_role/);
  assert.match(forward, /CREATE TRIGGER floustream_register_legacy_auth_identity/);
});

test("rollback is guarded and restores all 22 foreign keys to auth.users", () => {
  assert.match(rollback, /Rollback blocked: one or more FLOUSTREAM identities/);
  assert.equal((rollback.match(/DROP CONSTRAINT/g) || []).length, 22);
  assert.equal((rollback.match(/ADD CONSTRAINT/g) || []).length, 22);
  assert.equal((rollback.match(/REFERENCES auth\.users\(id\)/g) || []).length, 22);
  assert.match(rollback, /DROP TABLE public\.app_users/);
});
