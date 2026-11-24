import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  SignJWT,
} from "npm:jose@6";
import {
  FloustreamAuthError,
  verifyClerkJwt,
} from "./floustream-auth.ts";

const issuer = "https://floustream-test.clerk.accounts.dev";
const userId = "33333333-3333-4333-8333-333333333333";
const clerkUserId = "user_test123";

async function makeToken(overrides: Record<string, unknown> = {}) {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const jwk = await exportJWK(publicKey);
  jwk.kid = "floustream-test-key";
  jwk.alg = "RS256";
  jwk.use = "sig";

  const token = await new SignJWT({
    role: "authenticated",
    app_user_id: userId,
    ...overrides,
  })
    .setProtectedHeader({ alg: "RS256", kid: "floustream-test-key" })
    .setIssuer(issuer)
    .setSubject(clerkUserId)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(privateKey);

  return {
    token,
    jwks: createLocalJWKSet({ keys: [jwk] }),
  };
}

Deno.test("accepts a signed Clerk session with a stable UUID claim", async () => {
  const { token, jwks } = await makeToken();
  const identity = await verifyClerkJwt(token, { issuer, jwks });

  if (identity.userId !== userId) throw new Error("Unexpected FLOUSTREAM UUID");
  if (identity.clerkUserId !== clerkUserId) throw new Error("Unexpected Clerk subject");
});

Deno.test("rejects a Clerk token issued by another instance", async () => {
  const { token, jwks } = await makeToken();
  let rejected = false;
  try {
    await verifyClerkJwt(token, { issuer: "https://attacker.clerk.accounts.dev", jwks });
  } catch (error) {
    rejected = error instanceof FloustreamAuthError && error.status === 401;
  }
  if (!rejected) throw new Error("Token with wrong issuer was accepted");
});

Deno.test("rejects a token without the authenticated role", async () => {
  const { token, jwks } = await makeToken({ role: "anon" });
  let rejected = false;
  try {
    await verifyClerkJwt(token, { issuer, jwks });
  } catch (error) {
    rejected = error instanceof FloustreamAuthError && error.status === 401;
  }
  if (!rejected) throw new Error("Token without authenticated role was accepted");
});

Deno.test("rejects a malformed stable UUID claim", async () => {
  const { token, jwks } = await makeToken({ app_user_id: "not-a-uuid" });
  let rejected = false;
  try {
    await verifyClerkJwt(token, { issuer, jwks });
  } catch (error) {
    rejected = error instanceof FloustreamAuthError && error.status === 401;
  }
  if (!rejected) throw new Error("Malformed app_user_id was accepted");
});
