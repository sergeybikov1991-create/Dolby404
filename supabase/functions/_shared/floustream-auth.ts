import { createRemoteJWKSet, jwtVerify } from "npm:jose@6";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class FloustreamAuthError extends Error {
  status: number;

  constructor(message = "Authentication required", status = 401) {
    super(message);
    this.name = "FloustreamAuthError";
    this.status = status;
  }
}

export type ClerkIdentity = {
  userId: string;
  clerkUserId: string;
  claims: Record<string, unknown>;
};

const remoteJwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getRemoteJwks(jwksUrl: string) {
  let jwks = remoteJwksCache.get(jwksUrl);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(jwksUrl));
    remoteJwksCache.set(jwksUrl, jwks);
  }
  return jwks;
}

export async function verifyClerkJwt(
  token: string,
  options: { issuer: string; jwksUrl?: string; jwks?: any },
): Promise<ClerkIdentity> {
  if (!token || !options.issuer) {
    throw new FloustreamAuthError("Clerk authentication is not configured", 503);
  }

  const jwksUrl = options.jwksUrl ??
    new URL("/.well-known/jwks.json", options.issuer).toString();
  const keySource = options.jwks ?? getRemoteJwks(jwksUrl);

  let payload: Record<string, unknown>;
  try {
    const verified = await jwtVerify(token, keySource, {
      issuer: options.issuer,
    });
    payload = verified.payload as Record<string, unknown>;
  } catch {
    throw new FloustreamAuthError("Invalid or expired Clerk session", 401);
  }

  const clerkUserId = typeof payload.sub === "string" ? payload.sub : "";
  const userId = typeof payload.app_user_id === "string" ? payload.app_user_id : "";

  if (
    payload.role !== "authenticated" ||
    !clerkUserId.startsWith("user_") ||
    !UUID_PATTERN.test(userId)
  ) {
    throw new FloustreamAuthError("Clerk session is missing a valid FLOUSTREAM identity", 401);
  }

  return { userId, clerkUserId, claims: payload };
}

type AdminAuthClient = {
  auth: {
    getUser(token: string): Promise<{
      data: { user: { id: string } | null };
      error: unknown;
    }>;
  };
  from(table: string): any;
};

export async function requireFloustreamUser(
  request: Request,
  admin: AdminAuthClient,
  options: {
    allowLegacySupabase?: boolean;
    clerkIssuer?: string;
    clerkJwksUrl?: string;
  } = {},
): Promise<{ userId: string; clerkUserId: string | null; provider: "clerk" | "supabase_legacy" }> {
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token) throw new FloustreamAuthError();

  const allowLegacy = options.allowLegacySupabase ??
    Deno.env.get("ALLOW_LEGACY_SUPABASE_AUTH") === "true";

  if (allowLegacy) {
    const { data, error } = await admin.auth.getUser(token);
    const legacyUserId = data?.user?.id;
    if (!error && legacyUserId && UUID_PATTERN.test(legacyUserId)) {
      const { data: mapping, error: mappingError } = await admin
        .from("app_users")
        .select("id,clerk_user_id")
        .eq("id", legacyUserId)
        .maybeSingle();

      if (mappingError) throw new FloustreamAuthError("Unable to resolve account identity", 503);
      if (!mapping) throw new FloustreamAuthError("Account identity is not registered", 403);

      return {
        userId: legacyUserId,
        clerkUserId: mapping.clerk_user_id ?? null,
        provider: "supabase_legacy",
      };
    }
  }

  const issuer = options.clerkIssuer ?? Deno.env.get("CLERK_ISSUER") ?? "";
  const jwksUrl = options.clerkJwksUrl ?? Deno.env.get("CLERK_JWKS_URL") ?? undefined;
  const identity = await verifyClerkJwt(token, { issuer, jwksUrl });

  const { data: mapping, error: mappingError } = await admin
    .from("app_users")
    .select("id")
    .eq("id", identity.userId)
    .eq("clerk_user_id", identity.clerkUserId)
    .maybeSingle();

  if (mappingError) throw new FloustreamAuthError("Unable to resolve account identity", 503);
  if (!mapping) throw new FloustreamAuthError("Clerk account is not linked to FLOUSTREAM", 403);

  return {
    userId: identity.userId,
    clerkUserId: identity.clerkUserId,
    provider: "clerk",
  };
}

export function requireRecentEmailReverification(
  claims: Record<string, unknown>,
  maxAgeMinutes = 10,
): string {
  const reverificationId = typeof claims.reverification_id === "string"
    ? claims.reverification_id
    : "";
  const factorAge = Array.isArray(claims.fva) ? Number(claims.fva[0]) : Number.NaN;

  if (
    !reverificationId ||
    !Number.isFinite(factorAge) ||
    factorAge < 0 ||
    factorAge > maxAgeMinutes
  ) {
    throw new FloustreamAuthError(
      "A recent email verification is required for this sensitive action",
      403,
    );
  }

  return reverificationId;
}
