import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyClerkSession, FloustreamAuthError } from "../../../_shared/floustream-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanText(value: unknown, maxLength = 80): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, maxLength);
}

function randomPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(48));
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

async function clerkRequest(path: string, method = "GET", body?: unknown) {
  const secret = Deno.env.get("CLERK_SECRET_KEY");
  if (!secret) throw new Error("clerk_secret_key_missing");
  const response = await fetch("https://api.clerk.com/v1" + path, {
    method,
    headers: {
      Authorization: "Bearer " + secret,
      "Content-Type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error("clerk_api_" + response.status + ":" + message.slice(0, 240));
  }
  return response.status === 204 ? null : await response.json();
}

async function findAuthUserByEmail(admin: any, email: string) {
  const perPage = 1000;
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    const found = users.find((user: any) => user.email?.toLowerCase() === email);
    if (found) return found;
    if (users.length < perPage) return null;
  }
  throw new Error("auth_user_lookup_page_limit");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authorization = req.headers.get("Authorization") ?? "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token) return json({ error: "Authentication required" }, 401);

  let clerkIdentity;
  try {
    const issuer = Deno.env.get("CLERK_ISSUER") ?? "";
    const jwksUrl = Deno.env.get("CLERK_JWKS_URL") ?? undefined;
    clerkIdentity = await verifyClerkSession(token, { issuer, jwksUrl });
  } catch (error) {
    if (error instanceof FloustreamAuthError) return json({ error: error.message }, error.status);
    return json({ error: "Unable to verify Clerk session" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Server configuration unavailable" }, 503);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const clerkUser = await clerkRequest(
      "/users/" + encodeURIComponent(clerkIdentity.clerkUserId),
    ) as any;

    if (clerkUser.id !== clerkIdentity.clerkUserId) {
      return json({ error: "Clerk identity mismatch" }, 403);
    }

    const primaryEmailId = clerkUser.primary_email_address_id;
    const primaryEmail = (clerkUser.email_addresses ?? []).find(
      (entry: any) => entry.id === primaryEmailId,
    );
    if (!primaryEmail || primaryEmail.verification?.status !== "verified") {
      return json({ error: "A verified primary email is required" }, 403);
    }

    const email = cleanText(primaryEmail.email_address, 254).toLowerCase();
    if (!email || !email.includes("@")) return json({ error: "Invalid primary email" }, 400);

    const metadata = clerkUser.unsafe_metadata ?? {};
    let firstName = cleanText(metadata.first_name ?? clerkUser.first_name, 60);
    let lastName = cleanText(metadata.last_name ?? clerkUser.last_name, 60);
    let countryCode = cleanText(metadata.country_code, 5).toUpperCase();
    let preferredLanguage = cleanText(metadata.preferred_language, 12).toLowerCase();
    let username = cleanText(metadata.username, 24);

    const { data: existingLink, error: linkError } = await admin
      .from("app_users")
      .select("id")
      .eq("clerk_user_id", clerkIdentity.clerkUserId)
      .maybeSingle();
    if (linkError) throw linkError;

    let userId = existingLink?.id ??
      (typeof clerkUser.external_id === "string" ? clerkUser.external_id : "");
    if (existingLink?.id && clerkUser.external_id &&
        clerkUser.external_id !== existingLink.id) {
      return json({ error: "Clerk and FLOUSTREAM identity mappings do not match" }, 409);
    }
    if (userId && !UUID_PATTERN.test(userId)) {
      return json({ error: "Clerk external identity is not a valid FLOUSTREAM UUID" }, 409);
    }

    let registrationRisk: any = { risk: "low", reason: "existing_account" };

    if (userId) {
      const { data: shadow, error: shadowError } = await admin.auth.admin.getUserById(userId);
      if (shadowError || !shadow?.user) {
        return json({ error: "The linked Supabase identity is missing" }, 409);
      }
      if (shadow.user.email?.toLowerCase() !== email) {
        const { error: emailSyncError } = await admin.auth.admin.updateUserById(userId, {
          email,
          email_confirm: true,
        });
        if (emailSyncError) throw emailSyncError;
      }
    } else {
      const existingAuthUser = await findAuthUserByEmail(admin, email);
      if (existingAuthUser) {
        userId = existingAuthUser.id;
      } else {
        const riskResult = await admin.functions.invoke("registration-risk", {
          body: { email },
        });
        if (riskResult.error) throw riskResult.error;
        registrationRisk = riskResult.data;
        if (!registrationRisk?.allowed || !["low", "review"].includes(registrationRisk.risk)) {
          return json({ error: "This email address cannot be used for registration" }, 403);
        }

        const { data: created, error: createError } = await admin.auth.admin.createUser({
          email,
          password: randomPassword(),
          email_confirm: true,
          user_metadata: {
            first_name: firstName,
            last_name: lastName,
            country_code: countryCode,
            preferred_language: preferredLanguage,
            display_name: firstName + " " + lastName,
            registration_risk: registrationRisk.risk,
            registration_risk_reason: cleanText(registrationRisk.reason, 240),
          },
        });
        if (createError || !created?.user?.id) throw createError ?? new Error("shadow_user_creation_failed");
        userId = created.user.id;
      }

      await clerkRequest(
        "/users/" + encodeURIComponent(clerkIdentity.clerkUserId),
        "PATCH",
        { external_id: userId },
      );
    }

    if (!userId || !UUID_PATTERN.test(userId)) {
      throw new Error("stable_floustream_user_id_missing");
    }

    // Imported Supabase users may have profile fields that were never copied
    // into auth.users metadata. Prefer the existing FLOUSTREAM profile so the
    // first Clerk sign-in does not force users to re-enter their details.
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("first_name,last_name,display_name,country_code,preferred_language,username")
      .eq("id", userId)
      .maybeSingle();
    if (profileError) throw profileError;

    const displayParts = cleanText(profile?.display_name, 120).split(/\s+/).filter(Boolean);
    firstName ||= cleanText(profile?.first_name, 60) || displayParts[0] || "";
    lastName ||= cleanText(profile?.last_name, 60) || displayParts.slice(1).join(" ");
    countryCode ||= cleanText(profile?.country_code, 5).toUpperCase();
    preferredLanguage ||= cleanText(profile?.preferred_language, 12).toLowerCase();
    username ||= cleanText(profile?.username, 24);

    // Existing profiles are authoritative. Fallbacks only satisfy the trusted
    // provisioning RPC's required arguments; ON CONFLICT keeps stored fields.
    if (profile) {
      firstName ||= "FLOUSTREAM";
      lastName ||= "User";
      countryCode ||= "OTHER";
      preferredLanguage ||= "en";
    } else if (!firstName || !lastName || !/^[A-Z]{2,5}$/.test(countryCode) ||
               !["ru", "en"].includes(preferredLanguage)) {
      return json({ error: "Required profile details are missing" }, 400);
    }

    if (!["ru", "en"].includes(preferredLanguage)) {
      if (profile) preferredLanguage = "en";
      else return json({ error: "Invalid preferred language" }, 400);
    }
    if (username && !/^[a-z0-9_]{3,24}$/.test(username.toLowerCase())) {
      if (profile) username = "";
      else return json({ error: "Invalid username" }, 400);
    } else if (username) {
      username = username.toLowerCase();
    }

    if (clerkUser.external_id !== userId) {
      await clerkRequest(
        "/users/" + encodeURIComponent(clerkIdentity.clerkUserId),
        "PATCH",
        { external_id: userId },
      );
    }

    const { error: provisionError } = await admin.rpc("provision_clerk_user", {
      p_user_id: userId,
      p_clerk_user_id: clerkIdentity.clerkUserId,
      p_email: email,
      p_first_name: firstName,
      p_last_name: lastName,
      p_country_code: countryCode,
      p_preferred_language: preferredLanguage,
      p_username: username || null,
      p_registration_risk: registrationRisk.risk,
      p_registration_risk_reason: cleanText(registrationRisk.reason, 240) || null,
    });
    if (provisionError) throw provisionError;

    return json({ userId, provisioned: true });
  } catch (error) {
    // Do not log tokens, passwords, email addresses, or provider secrets.
    console.error("clerk_provision_failed");
    return json({ error: "Unable to prepare the FLOUSTREAM account. Please retry." }, 500);
  }
});
