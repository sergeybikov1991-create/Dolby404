import { createClient } from "npm:@supabase/supabase-js@2";
import * as engine from "../_shared/engine.mjs";
import { LONG_BACKGAMMON_RULES as rules } from "../_shared/rules.mjs";
import { rollDice, rollOpeningDice } from "../_shared/dice.mjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function getPublishableKey(): string | null {
  const keysJson = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (keysJson) {
    try {
      const keys = JSON.parse(keysJson);
      if (typeof keys.default === "string" && keys.default.length > 0) return keys.default;
    } catch {
      // Fall back to the legacy key name when the optional key map is malformed.
    }
  }
  return Deno.env.get("SUPABASE_ANON_KEY") ?? null;
}

function getSecretKey(): string | null {
  const keysJson = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (keysJson) {
    try {
      const keys = JSON.parse(keysJson);
      if (typeof keys.default === "string" && keys.default.length > 0) return keys.default;
    } catch {
      // Fall back to the legacy server-only service role key.
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? null;
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value).sort().map(key =>
      `${JSON.stringify(key)}:${stableStringify(value[key])}`
    ).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function playerSide(match: { player_a: string; player_b: string }, userId: string) {
  if (match.player_a === userId) return "A";
  if (match.player_b === userId) return "B";
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function rpcErrorStatus(message: string): number {
  if (/revision conflict|turn number conflict|unique/i.test(message)) return 409;
  if (/not a match participant|belongs to another actor/i.test(message)) return 403;
  if (/match not found/i.test(message)) return 404;
  if (/invalid|unsupported|reused with different/i.test(message)) return 400;
  return 500;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const requestId = crypto.randomUUID();
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token) return json({ error: "Authentication required" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const publishableKey = getPublishableKey();
    const secretKey = getSecretKey();
    if (!supabaseUrl || !publishableKey || !secretKey) {
      console.error("backgammon_config_missing", requestId);
      return json({ error: "Game service is not configured", requestId }, 503);
    }

    const authClient = createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !authData.user) return json({ error: "Invalid session" }, 401);
    const actorId = authData.user.id;

    const rawBody = await req.text();
    if (rawBody.length > 16000) return json({ error: "Request is too large" }, 413);
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }
    if (!isRecord(body)) return json({ error: "Invalid request body" }, 400);

    const admin = createClient(supabaseUrl, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (body.action_type === "create_match") {
      const requestedMatchId = body.match_id;
      const opponentId = body.opponent_id;
      if (!isUuid(requestedMatchId) || !isUuid(opponentId)) {
        return json({ error: "Valid match_id and opponent_id are required" }, 400);
      }
      if (opponentId === actorId) return json({ error: "You cannot invite yourself" }, 400);
      if (body.match_mode !== undefined &&
          body.match_mode !== "casual" && body.match_mode !== "tournament") {
        return json({ error: "match_mode must be casual or tournament" }, 400);
      }
      const matchMode = body.match_mode === "tournament" ? "tournament" : "casual";
      const { data: opponent, error: opponentError } = await admin
        .from("profiles")
        .select("id, account_status")
        .eq("id", opponentId)
        .maybeSingle();
      if (opponentError) throw opponentError;
      if (!opponent || opponent.account_status !== "active") {
        return json({ error: "Opponent is unavailable" }, 404);
      }

      // Reuse the current unfinished game between this pair. The matching
      // partial unique index below is the race-safe backstop if both players
      // open the chat's game switch at the same time.
      const findOpenMatch = () => admin
        .from("backgammon_matches")
        .select("*")
        .in("status", ["waiting", "awaiting_opening_roll", "active"])
        .or(`and(player_a.eq.${actorId},player_b.eq.${opponentId}),and(player_a.eq.${opponentId},player_b.eq.${actorId})`)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const { data: openMatch, error: openMatchError } = await findOpenMatch();
      if (openMatchError) throw openMatchError;
      if (openMatch) return json({ match: openMatch });

      const initialState = engine.createInitialState({
        matchId: requestedMatchId,
        players: { A: actorId, B: opponentId },
      }, rules);
      const row = {
        id: requestedMatchId,
        player_a: actorId,
        player_b: opponentId,
        match_mode: matchMode,
        status: "waiting",
        state: initialState,
        turn_number: 0,
        revision: 0,
      };
      const { data: inserted, error: insertError } = await admin
        .from("backgammon_matches")
        .insert(row)
        .select("*")
        .single();
      if (!insertError) return json({ match: inserted }, 201);

      // A repeated create request with the same client-generated match UUID is
      // idempotent only when it names exactly the same participants and mode.
      const { data: existing, error: existingError } = await admin
        .from("backgammon_matches")
        .select("*")
        .eq("id", requestedMatchId)
        .maybeSingle();
      if (existingError) throw existingError;
      if (existing && existing.player_a === actorId &&
          existing.player_b === opponentId && existing.match_mode === matchMode) {
        return json({ match: existing });
      }
      const { data: racedOpenMatch, error: racedOpenMatchError } = await findOpenMatch();
      if (racedOpenMatchError) throw racedOpenMatchError;
      if (racedOpenMatch) return json({ match: racedOpenMatch });
      return json({ error: "Could not create match" }, 409);
    }

    const matchId = body.match_id;
    const actionId = body.action_id;
    const actionType = body.action_type;
    const expectedRevision = body.expected_revision;
    const payload = isRecord(body.payload) ? body.payload : {};

    if (!isUuid(matchId) || !isUuid(actionId)) {
      return json({ error: "Valid match_id and action_id are required" }, 400);
    }
    if (!Number.isSafeInteger(expectedRevision) || Number(expectedRevision) < 0) {
      return json({ error: "expected_revision must be a non-negative integer" }, 400);
    }
    const allowedActions = new Set([
      "accept_match", "decline_match", "opening_roll", "roll", "move",
      "finish_turn", "restart_request", "restart_vote", "restart_cancel",
    ]);
    if (typeof actionType !== "string" || !allowedActions.has(actionType)) {
      return json({ error: "Unsupported action_type" }, 400);
    }

    const requestHash = await sha256(stableStringify({
      match_id: matchId,
      action_type: actionType,
      expected_revision: expectedRevision,
      payload,
    }));

    const { data: previous, error: previousError } = await admin.rpc(
      "backgammon_get_action_result",
      {
        p_match_id: matchId,
        p_action_id: actionId,
        p_actor_id: actorId,
        p_request_hash: requestHash,
      },
    );
    if (previousError) throw previousError;
    if (previous) return json(previous);

    const { data: match, error: matchError } = await admin
      .from("backgammon_matches")
      .select("*")
      .eq("id", matchId)
      .maybeSingle();
    if (matchError) throw matchError;
    if (!match) return json({ error: "Match not found" }, 404);

    const side = playerSide(match, actorId);
    if (!side) return json({ error: "You are not a participant in this match" }, 403);
    if (Number(match.revision) !== expectedRevision) {
      const { data: racedResult, error: racedError } = await admin.rpc(
        "backgammon_get_action_result",
        {
          p_match_id: matchId,
          p_action_id: actionId,
          p_actor_id: actorId,
          p_request_hash: requestHash,
        },
      );
      if (racedError) throw racedError;
      if (racedResult) return json(racedResult);
      return json({ error: "Revision conflict", revision: match.revision }, 409);
    }

    let nextState = match.state;
    let nextStatus = match.status;
    let nextTurnNumber = match.turn_number;
    let nextRestartRequest = match.restart_request;
    const now = Date.now();

    switch (actionType) {
      case "accept_match":
        if (side !== "B" || match.status !== "waiting") {
          return json({ error: "Only the invited player can accept a waiting match" }, 409);
        }
        nextStatus = "awaiting_opening_roll";
        break;

      case "decline_match":
        if (side !== "B" || match.status !== "waiting") {
          return json({ error: "Only the invited player can decline a waiting match" }, 409);
        }
        nextStatus = "cancelled";
        break;

      case "opening_roll": {
        if (match.status !== "awaiting_opening_roll") {
          return json({ error: "Match is not waiting for an opening roll" }, 409);
        }
        const opening = rollOpeningDice();
        nextState = engine.createInitialState({
          matchId,
          players: { A: match.player_a, B: match.player_b },
          firstPlayer: opening.firstPlayer,
        }, rules);
        nextState = engine.startTurn(nextState, opening.dice, rules);
        nextStatus = "active";
        // Opening roll occupies the current match-wide turn number. This
        // keeps the one-roll-per-turn ledger monotonic after a mutual restart.
        nextTurnNumber = match.turn_number + 1;
        break;
      }

      case "roll": {
        if (match.status !== "active" || match.state.turn.phase !== "awaiting_roll") {
          return json({ error: "The match is not awaiting a dice roll" }, 409);
        }
        if (match.state.turn.player !== side) {
          return json({ error: "It is not your turn" }, 403);
        }
        nextState = engine.startTurn(match.state, rollDice().dice, rules);
        break;
      }

      case "move": {
        if (match.status !== "active" || match.state.turn.phase !== "moving") {
          return json({ error: "The match is not accepting moves" }, 409);
        }
        if (match.state.turn.player !== side) return json({ error: "It is not your turn" }, 403);
        if (!isRecord(payload.move)) return json({ error: "A move is required" }, 400);
        nextState = engine.applyMove(match.state, payload.move, rules);
        if (nextState.winner) {
          nextStatus = "finished";
        } else {
          const remainingSequences = engine.getLegalTurnSequences(
            nextState,
            nextState.turn.remainingDice,
            rules,
          );
          if (nextState.turn.remainingDice.length === 0 ||
              !remainingSequences.some((sequence: unknown[]) => sequence.length > 0)) {
            nextState = engine.finishTurn(nextState, rules);
            nextTurnNumber += 1;
          }
        }
        break;
      }

      case "finish_turn":
        if (match.status !== "active" || match.state.turn.phase !== "moving") {
          return json({ error: "There is no active turn to finish" }, 409);
        }
        if (match.state.turn.player !== side) return json({ error: "It is not your turn" }, 403);
        nextState = engine.finishTurn(match.state, rules);
        nextTurnNumber += 1;
        break;

      case "restart_request": {
        if (match.match_mode !== "casual") {
          return json({ error: "Restart is available only in casual matches" }, 403);
        }
        if (match.status !== "active" && match.status !== "finished") {
          return json({ error: "Match is not active or finished" }, 409);
        }
        if (match.restart_request && Date.parse(match.restart_request.expires_at) > now) {
          return json({ error: "A restart request is already pending" }, 409);
        }
        nextRestartRequest = {
          id: actionId,
          initiator_id: actorId,
          created_at: new Date(now).toISOString(),
          expires_at: new Date(now + 60_000).toISOString(),
          votes: { A: side === "A", B: side === "B" },
        };
        break;
      }

      case "restart_vote": {
        const request = match.restart_request;
        if (match.match_mode !== "casual" || !request ||
            request.id !== payload.request_id || Date.parse(request.expires_at) <= now) {
          return json({ error: "Restart request is missing or expired" }, 409);
        }
        if (request.initiator_id === actorId) {
          return json({ error: "The other player must answer the restart request" }, 403);
        }
        if (typeof payload.accept !== "boolean") {
          return json({ error: "accept must be true or false" }, 400);
        }
        if (!payload.accept) {
          nextRestartRequest = null;
        } else {
          nextRestartRequest = {
            ...request,
            votes: { ...request.votes, [side]: true },
          };
          if (nextRestartRequest.votes.A && nextRestartRequest.votes.B) {
            nextState = engine.createInitialState({
              matchId,
              players: { A: match.player_a, B: match.player_b },
            }, rules);
            nextStatus = "awaiting_opening_roll";
            // Keep the match-wide turn sequence monotonic across a restart so
            // the one-roll-per-turn ledger never collides with the prior game.
            nextTurnNumber = match.turn_number + 1;
            nextRestartRequest = null;
          }
        }
        break;
      }

      case "restart_cancel":
        if (!match.restart_request || match.restart_request.id !== payload.request_id) {
          return json({ error: "Restart request is missing" }, 409);
        }
        if (match.restart_request.initiator_id !== actorId) {
          return json({ error: "Only the initiator can cancel this request" }, 403);
        }
        nextRestartRequest = null;
        break;
    }

    const { data: committed, error: commitError } = await admin.rpc(
      "backgammon_commit_action",
      {
        p_match_id: matchId,
        p_action_id: actionId,
        p_actor_id: actorId,
        p_action_type: actionType,
        p_turn_number: match.turn_number,
        p_expected_revision: expectedRevision,
        p_request_hash: requestHash,
        p_next_state: nextState,
        p_next_status: nextStatus,
        p_next_turn_number: nextTurnNumber,
        p_next_restart_request: nextRestartRequest,
      },
    );
    if (commitError) {
      const status = rpcErrorStatus(commitError.message ?? "");
      return json({ error: status === 409 ? "Revision conflict" : "Action rejected", details: commitError.message }, status);
    }
    return json(committed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown game error";
    console.error("backgammon_action_failed", requestId, message);
    if (/Illegal move|mandatory legal dice|moving phase|awaiting_roll/i.test(message)) {
      return json({ error: message }, 400);
    }
    return json({ error: "Game action failed", requestId }, 500);
  }
});
