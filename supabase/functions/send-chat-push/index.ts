const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8" },
});

function base64url(input: Uint8Array | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function createFirebaseAccessToken(account: {
  client_email: string;
  private_key: string;
}) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(JSON.stringify({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = header + "." + claim;
  const pem = account.private_key
    .replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const keyBytes = Uint8Array.from(atob(pem), (char) => char.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyBytes,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  ));
  const assertion = unsigned + "." + base64url(signature);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const result = await response.json();
  if (!response.ok || !result.access_token) {
    throw new Error("Firebase OAuth token request failed");
  }
  return String(result.access_token);
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const expectedSecret = Deno.env.get("PUSH_WEBHOOK_SECRET");
  const suppliedSecret = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!expectedSecret || suppliedSecret !== expectedSecret) {
    return json({ error: "Unauthorized webhook" }, 401);
  }

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const accountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
  if (!serviceKey || !supabaseUrl || !accountJson) {
    return json({ error: "Push delivery is not configured yet" }, 503);
  }

  try {
    const payload = await req.json();
    const record = payload?.record;
    if (payload?.type !== "INSERT" || payload?.table !== "direct_messages" ||
        payload?.schema !== "public" || !record?.recipient_id || !record?.sender_id) {
      return json({ ignored: true, reason: "not_a_direct_message_insert" });
    }

    const account = JSON.parse(accountJson);
    const projectId = String(account.project_id ?? "");
    if (!projectId || !account.client_email || !account.private_key) {
      return json({ error: "Firebase service account JSON is incomplete" }, 503);
    }

    const restHeaders = { apikey: serviceKey, Authorization: "Bearer " + serviceKey };
    const tokensUrl = new URL("/rest/v1/device_push_tokens", supabaseUrl);
    tokensUrl.searchParams.set("user_id", "eq." + record.recipient_id);
    tokensUrl.searchParams.set("select", "token");
    const tokensResponse = await fetch(tokensUrl, { headers: restHeaders });
    if (!tokensResponse.ok) throw new Error("Could not load recipient device tokens");
    const tokens = await tokensResponse.json() as Array<{ token: string }>;
    if (!tokens.length) return json({ sent: 0, reason: "recipient_has_no_registered_devices" });

    const senderUrl = new URL("/rest/v1/profiles", supabaseUrl);
    senderUrl.searchParams.set("id", "eq." + record.sender_id);
    senderUrl.searchParams.set("select", "display_name,username,first_name,last_name");
    const senderResponse = await fetch(senderUrl, { headers: restHeaders });
    const senderRows = senderResponse.ok ? await senderResponse.json() : [];
    const sender = senderRows?.[0] ?? {};
    const title = String(sender.display_name ||
      [sender.first_name, sender.last_name].filter(Boolean).join(" ") ||
      (sender.username ? "@" + sender.username : "FLOUSTREAM")).slice(0, 80);
    const body = String(record.attachment_name
      ? "📎 " + record.attachment_name
      : record.content || "Новое сообщение").slice(0, 180);

    const accessToken = await createFirebaseAccessToken(account);
    const endpoint = "https://fcm.googleapis.com/v1/projects/" +
      encodeURIComponent(projectId) + "/messages:send";
    let sent = 0;
    const staleTokens: string[] = [];

    for (const device of tokens) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token: device.token,
            data: { title, body, sender_id: String(record.sender_id) },
            android: { priority: "HIGH" },
          },
        }),
      });
      if (response.ok) {
        sent++;
      } else {
        const errorBody = await response.text();
        if (response.status === 404 || errorBody.includes("UNREGISTERED")) {
          staleTokens.push(device.token);
        }
      }
    }

    if (staleTokens.length) {
      const deleteUrl = new URL("/rest/v1/device_push_tokens", supabaseUrl);
      deleteUrl.searchParams.set("token", "in.(" + staleTokens.map((token) => '"' + token.replace(/"/g, '""') + '"').join(",") + ")");
      await fetch(deleteUrl, { method: "DELETE", headers: restHeaders });
    }

    return json({ sent, total_devices: tokens.length });
  } catch {
    return json({ error: "Push delivery failed" }, 500);
  }
});
