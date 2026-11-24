import { createClient } from "npm:@supabase/supabase-js@2";
import { requireFloustreamUser, requireRecentEmailReverification, FloustreamAuthError } from "../../../_shared/floustream-auth.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json; charset=utf-8" },
  });

function decodeClaims(token: string): Record<string, unknown> {
  try {
    const part = token.split(".")[1];
    const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")));
  } catch {
    return {};
  }
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function removeOwnedStorage(userId: string) {
  // All application upload paths are rooted under the owning user's UUID.
  // Use the Storage API rather than querying storage.objects through PostgREST.
  const buckets = [
    "avatars", "message-media", "music-private", "music-public",
    "photo-albums", "posts", "private-albums",
    "private-video-albums", "video-albums",
  ];

  async function collectFiles(bucket: string, prefix: string, depth = 0): Promise<string[]> {
    if (depth > 8) throw new Error("storage_folder_depth_exceeded:" + bucket);
    const files: string[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await admin.storage.from(bucket).list(prefix, {
        limit: 1000,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) throw new Error("storage_inventory_failed:" + bucket + ":" + error.message);
      for (const item of data ?? []) {
        const path = prefix ? prefix + "/" + item.name : item.name;
        if (item.id === null) {
          files.push(...await collectFiles(bucket, path, depth + 1));
        } else {
          files.push(path);
        }
      }
      if (!data || data.length < 1000) break;
    }
    return files;
  }

  for (const bucket of buckets) {
    const paths = await collectFiles(bucket, userId);
    for (let i = 0; i < paths.length; i += 100) {
      const { error } = await admin.storage.from(bucket).remove(paths.slice(i, i + 100));
      if (error) throw new Error("storage_remove_failed:" + bucket + ":" + error.message);
    }
  }
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function finalizeUser(userId: string) {
  const { data: request, error: requestError } = await admin
    .from("account_deletion_requests")
    .select("status,scheduled_for")
    .eq("user_id", userId)
    .maybeSingle();
  if (requestError) throw requestError;
  if (!request || request.status !== "scheduled" || !request.scheduled_for ||
      new Date(request.scheduled_for).getTime() > Date.now()) {
    return { userId, skipped: true };
  }

  // Keep the text and timestamps of direct messages for both participants.
  // Only attachments sent by the account being removed are detached.
  const { data: sentMessages, error: messageReadError } = await admin
    .from("direct_messages")
    .select("id,attachment_path")
    .eq("sender_id", userId)
    .not("attachment_path", "is", null);
  if (messageReadError) throw messageReadError;

  const messagePaths = (sentMessages ?? [])
    .map((row) => row.attachment_path)
    .filter((path): path is string => typeof path === "string" && path.length > 0);
  if (messagePaths.length) {
    for (let i = 0; i < messagePaths.length; i += 100) {
      const { error } = await admin.storage.from("message-media").remove(messagePaths.slice(i, i + 100));
      if (error) throw new Error("message_attachment_remove_failed:" + error.message);
    }
  }

  const { error: detachError } = await admin
    .from("direct_messages")
    .update({ attachment_path: null, attachment_name: null, attachment_mime: null })
    .eq("sender_id", userId)
    .not("attachment_path", "is", null);
  if (detachError) throw detachError;

  // Remove all remaining objects owned by this user through the Storage API.
  await removeOwnedStorage(userId);

  // Delete user-authored and user-owned data. FK cascades remove authored posts
  // and their comments/reactions, while direct_messages deliberately remain.
  const deletions: Array<[string, string]> = [
    ["comments", "user_id"],
    ["likes", "user_id"],
    ["post_reactions", "user_id"],
    ["reposts", "user_id"],
    ["follows", "follower_id"],
    ["follows", "following_id"],
    ["friend_requests", "requester_id"],
    ["friend_requests", "recipient_id"],
    ["friend_requests", "user_low_id"],
    ["friend_requests", "user_high_id"],
    ["profile_visits", "visitor_id"],
    ["profile_visits", "visited_profile_id"],
    ["profile_photo_likes", "user_id"],
    ["profile_photo_likes", "profile_id"],
    ["music_tracks", "owner_id"],
    ["photo_album_photos", "owner_id"],
    ["private_album_photos", "owner_id"],
    ["private_photo_albums", "owner_id"],
    ["private_video_album_videos", "owner_id"],
    ["video_album_videos", "owner_id"],
    ["profile_privacy_settings", "owner_id"],
    ["scheduled_posts", "user_id"],
    ["posts", "user_id"],
  ];

  for (const [table, column] of deletions) {
    const { error } = await admin.from(table).delete().eq(column, userId);
    if (error) throw new Error("delete_failed:" + table + ":" + error.message);
  }

  // A tombstone is retained without email, name, or other direct identifiers.
  const { error: profileError } = await admin.from("profiles").delete().eq("id", userId);
  if (profileError) throw profileError;

  // Keep a non-PII tombstone before Auth removal. Retries continue idempotently
  // if Auth deletion temporarily fails; the ledger is not used as a skip flag.
  const { error: ledgerError } = await admin
    .from("account_deletion_ledger")
    .upsert({ user_id: userId, deleted_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (ledgerError) throw ledgerError;

  // Delete the Clerk identity first. A 404 is treated as success so retries
  // can finish the database cleanup after a partial network failure.
  const { data: identity, error: identityError } = await admin
    .from("app_users")
    .select("clerk_user_id")
    .eq("id", userId)
    .maybeSingle();
  if (identityError) throw identityError;

  if (identity?.clerk_user_id) {
    const clerkSecret = Deno.env.get("CLERK_SECRET_KEY");
    if (!clerkSecret) throw new Error("clerk_secret_key_missing");
    const clerkResponse = await fetch(
      "https://api.clerk.com/v1/users/" + encodeURIComponent(identity.clerk_user_id),
      {
        method: "DELETE",
        headers: { Authorization: "Bearer " + clerkSecret },
      },
    );
    if (!clerkResponse.ok && clerkResponse.status !== 404) {
      throw new Error("clerk_user_delete_failed:" + clerkResponse.status);
    }
  }

  // The matching shadow Auth user is removed before app_users. After the FK
  // migration it no longer owns application cascades; app_users does.
  const { error: authDeleteError } = await admin.auth.admin.deleteUser(userId);
  if (authDeleteError &&
      authDeleteError.code !== "user_not_found" &&
      authDeleteError.status !== 404 &&
      !/not found/i.test(authDeleteError.message ?? "")) {
    throw authDeleteError;
  }

  const { error: registryDeleteError } = await admin
    .from("app_users")
    .delete()
    .eq("id", userId);
  if (registryDeleteError) throw registryDeleteError;

  return { userId, finalized: true };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authorization = req.headers.get("Authorization") ?? "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    if (!token) return json({ error: "Authentication required" }, 401);

    const body = await req.json().catch(() => null) as { action?: string } | null;
    if (!body?.action) return json({ error: "Action is required" }, 400);

    if (body.action === "finalize_due") {
      const suppliedSecret = req.headers.get("x-cron-secret") ?? "";
      if (!suppliedSecret) return json({ error: "Forbidden" }, 403);
      const { data: cronAuth, error: cronAuthError } = await admin
        .from("account_lifecycle_cron_auth")
        .select("secret_hash")
        .eq("id", true)
        .maybeSingle();
      if (cronAuthError || !cronAuth ||
          !constantTimeEqual(await sha256Hex(suppliedSecret), cronAuth.secret_hash)) {
        return json({ error: "Forbidden" }, 403);
      }
      const { data, error } = await admin
        .from("account_deletion_requests")
        .select("user_id")
        .eq("status", "scheduled")
        .lte("scheduled_for", new Date().toISOString())
        .limit(100);
      if (error) throw error;
      const results = [];
      for (const row of data ?? []) {
        try {
          results.push(await finalizeUser(row.user_id));
        } catch (error) {
          console.error("account_deletion_finalize_failed", row.user_id, String(error));
          results.push({ userId: row.user_id, failed: true });
        }
      }
      return json({ processed: results.length, results });
    }

    if (body.action !== "request_delete" && body.action !== "restore") {
      return json({ error: "Unknown action" }, 400);
    }

    let identity;
    try {
      identity = await requireFloustreamUser(req, admin);
    } catch (error) {
      if (error instanceof FloustreamAuthError) {
        return json({ error: "Invalid or expired session" }, error.status);
      }
      throw error;
    }
    const userId = identity.userId;

    if (identity.provider === "clerk") {
      const verificationId = requireRecentEmailReverification(identity.claims ?? {});
      const { error: consumeError } = await admin.rpc("consume_account_lifecycle_reverification", {
        p_user_id: userId,
        p_verification_id: verificationId,
        p_action: body.action,
      });
      if (consumeError) {
        if (consumeError.message?.includes("reverification_already_used")) {
          return json({ error: "Повторная проверка уже использована. Запроси новый код." }, 403);
        }
        throw consumeError;
      }
    } else {
      const { data: authData, error: authError } = await admin.auth.getUser(token);
      if (authError || !authData.user) return json({ error: "Invalid session" }, 401);
      const claims = decodeClaims(token);
      const authTime = Number(claims.auth_time ?? 0);
      const amr = Array.isArray(claims.amr) ? claims.amr as Array<{ method?: string }> : [];
      const hasEmailOtpProof = amr.some((item) => item.method === "otp" || item.method === "magiclink");
      if (!authTime || Date.now() / 1000 - authTime > 15 * 60 || !hasEmailOtpProof) {
        return json({ error: "Для подтверждения действия запроси письмо-подтверждение, открой ссылку из письма и вернись сюда." }, 403);
      }
      if (!authData.user.email_confirmed_at) return json({ error: "Email ещё не подтверждён." }, 403);
    }

    if (body.action === "request_delete") {
      const { data: scheduled, error } = await admin.rpc("schedule_account_deletion", {
        p_user_id: userId,
      });
      if (error) throw error;
      return json({
        status: "pending_deletion",
        scheduled_for: scheduled,
        message: "Аккаунт деактивирован. Его можно восстановить в течение 30 дней.",
      });
    }

    if (body.action === "restore") {
      const { error } = await admin.rpc("restore_account_deletion", {
        p_user_id: userId,
      });
      if (error) throw error;
      return json({ status: "active", message: "Прежний аккаунт восстановлен." });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error("account_lifecycle_error", String(error));
    return json({ error: "Не удалось выполнить действие. Попробуй позже." }, 500);
  }
});
