import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as engine from "./backgammon/engine.js";
import { LONG_BACKGAMMON_RULES } from "./backgammon/rules.js";

const SUPABASE_URL = "https://qhpobdktlbhdqsnajypr.supabase.co";
const SUPABASE_KEY = "sb_publishable_tzG1qVsbjaW8YE_LBVN87Q_v0CahKN5";

const $ = (id) => document.getElementById(id);
const client = createClient(SUPABASE_URL, SUPABASE_KEY);
let user = null;
let matches = [];
let currentMatch = null;
let selectedFrom = null;
let realtimeChannel = null;
let legalMoves = [];
let animateNextDice = false;

function setNotice(id, message, error = false) {
  const element = $(id);
  element.textContent = message || "";
  element.style.color = error ? "#ffb4c0" : "";
}

function sideFor(match) {
  if (match?.player_a === user?.id) return "A";
  if (match?.player_b === user?.id) return "B";
  return null;
}

function opponentId(match) {
  return sideFor(match) === "A" ? match.player_b : match.player_a;
}

function matchLabel(match) {
  const side = sideFor(match);
  const other = side === "A" ? match.player_b : match.player_a;
  const known = match._opponent_name;
  return known || `Соперник · ${other.slice(0, 8)}…`;
}

function statusLabel(match) {
  if (match.status === "waiting") return sideFor(match) === "A" ? "Ожидает ответа" : "Входящее приглашение";
  if (match.status === "awaiting_opening_roll") return "Начальный бросок";
  if (match.status === "finished") return "Партия завершена";
  if (match.status === "cancelled") return "Партия отменена";
  if (match.status === "active") {
    const player = match.state?.turn?.player;
    return player === sideFor(match) ? "Ваш ход" : "Ход соперника";
  }
  return match.status;
}

async function invokeAction(actionType, payload = {}) {
  if (!currentMatch) return;
  setNotice("game-notice", "Отправляем ход…");
  const { data, error } = await client.functions.invoke("backgammon-action", {
    body: {
      match_id: currentMatch.id,
      action_id: crypto.randomUUID(),
      action_type: actionType,
      expected_revision: Number(currentMatch.revision),
      payload,
    },
  });
  if (error) {
    let detail = error.message || "Сервер отклонил действие";
    try {
      const body = await error.context?.json?.();
      if (body?.error) detail = body.error;
    } catch {}
    setNotice("game-notice", detail, true);
    return false;
  }
  if (!data) {
    setNotice("game-notice", "Сервер не вернул состояние партии", true);
    return false;
  }
  const previousState = currentMatch.state;
  const previousState = currentMatch.state;
  currentMatch = {
    ...currentMatch,
    status: data.status,
    state: data.state,
    turn_number: data.turn_number,
    revision: data.revision,
    restart_request: data.restart_request ?? null,
  };
  selectedFrom = null;
  animateNextDice = actionType === "roll" || actionType === "opening_roll";
  renderGame(previousState);
  animateNextDice = false;
  setNotice("game-notice", "");
  await loadMatches();
  return true;
}

async function createMatch(opponent) {
  const matchId = crypto.randomUUID();
  setNotice("invite-notice", "Отправляем приглашение…");
  const { data, error } = await client.functions.invoke("backgammon-action", {
    body: {
      action_type: "create_match",
      match_id: matchId,
      opponent_id: opponent.id,
      match_mode: "casual",
    },
  });
  if (error) {
    let message = error.message || "Не удалось создать партию";
    try {
      const body = await error.context?.json?.();
      if (body?.error) message = body.error;
    } catch {}
    setNotice("invite-notice", message, true);
    return;
  }
  setNotice("invite-notice", `Приглашение отправлено: ${opponent.display_name || opponent.username}`);
  await loadMatches();
  if (data?.match) openMatch(data.match.id);
}

async function loadMatches() {
  const { data, error } = await client
    .from("backgammon_matches")
    .select("*")
    .or(`player_a.eq.${user.id},player_b.eq.${user.id}`)
    .order("updated_at", { ascending: false })
    .limit(30);
  if (error) {
    $("matches").innerHTML = "";
    const item = document.createElement("div");
    item.className = "subtle";
    item.textContent = /backgammon_matches|schema cache|does not exist/i.test(error.message)
      ? "Игровая схема ещё не подключена к серверу. Код и миграция готовы, ожидается установка на бесплатный проект."
      : `Не удалось загрузить партии: ${error.message}`;
    $("matches").append(item);
    return;
  }
  matches = data || [];
  await hydrateOpponentNames(matches);
  renderMatches();
  if (currentMatch) {
    const latest = matches.find(match => match.id === currentMatch.id);
    if (latest && latest.revision !== currentMatch.revision) {
      currentMatch = latest;
      selectedFrom = null;
      renderGame();
    }
  }
}

async function hydrateOpponentNames(items) {
  const ids = [...new Set(items.map(opponentId).filter(Boolean))];
  if (!ids.length) return;
  const { data } = await client.from("profiles").select("id,username,display_name").in("id", ids);
  const profiles = new Map((data || []).map(profile => [profile.id, profile]));
  items.forEach(match => {
    const profile = profiles.get(opponentId(match));
    match._opponent_name = profile?.display_name || profile?.username || null;
  });
}

function renderMatches() {
  const container = $("matches");
  container.replaceChildren();
  if (!matches.length) {
    const empty = document.createElement("div");
    empty.className = "subtle";
    empty.textContent = "Пока нет партий. Пригласи игрока по username.";
    container.append(empty);
    return;
  }
  matches.forEach(match => {
    const item = document.createElement("article");
    item.className = "match-item" + (currentMatch?.id === match.id ? " active" : "");
    const title = document.createElement("div");
    title.className = "match-title";
    title.textContent = matchLabel(match);
    const meta = document.createElement("div");
    meta.className = "match-meta";
    meta.textContent = statusLabel(match);
    const actions = document.createElement("div");
    actions.className = "match-actions";
    const open = document.createElement("button");
    open.className = "ghost";
    open.type = "button";
    open.textContent = "Открыть";
    open.addEventListener("click", () => openMatch(match.id));
    actions.append(open);
    if (match.status === "waiting" && sideFor(match) === "B") {
      const accept = document.createElement("button");
      accept.className = "primary";
      accept.type = "button";
      accept.textContent = "Принять";
      accept.addEventListener("click", async () => {
        openMatch(match.id);
        await invokeAction("accept_match");
      });
      const decline = document.createElement("button");
      decline.className = "danger";
      decline.type = "button";
      decline.textContent = "Отклонить";
      decline.addEventListener("click", async () => {
        openMatch(match.id);
        await invokeAction("decline_match");
      });
      actions.append(accept, decline);
    }
    item.append(title, meta, actions);
    container.append(item);
  });
}

async function openMatch(matchId) {
  const { data, error } = await client
    .from("backgammon_matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();
  if (error || !data) {
    setNotice("game-notice", error?.message || "Партия не найдена", true);
    return;
  }
  currentMatch = data;
  await hydrateOpponentNames([currentMatch]);
  selectedFrom = null;
  renderGame();
  renderMatches();
}

function makeDie(value, rolling = false) {
  const die = document.createElement("div");
  die.className = "die" + (rolling ? " rolling" : "");
  die.setAttribute("role", "img");
  die.setAttribute("aria-label", `Кость ${value}`);
  const finalTransforms = {
    1: "rotateX(0deg) rotateY(0deg) rotateZ(0deg)",
    2: "rotateX(0deg) rotateY(-90deg) rotateZ(0deg)",
    3: "rotateX(90deg) rotateY(0deg) rotateZ(0deg)",
    4: "rotateX(-90deg) rotateY(0deg) rotateZ(0deg)",
    5: "rotateX(0deg) rotateY(90deg) rotateZ(0deg)",
    6: "rotateX(0deg) rotateY(180deg) rotateZ(0deg)",
  };
  die.style.setProperty("--die-final-transform", finalTransforms[value] || finalTransforms[1]);

  const faces = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };
  const cube = document.createElement("span");
  cube.className = "die-cube";
  const faceOrder = [
    { value: 1, side: "front" },
    { value: 6, side: "back" },
    { value: 2, side: "right" },
    { value: 5, side: "left" },
    { value: 3, side: "top" },
    { value: 4, side: "bottom" },
  ];
  faceOrder.forEach(({ value: faceValue, side }) => {
    const face = document.createElement("span");
    face.className = `die-face ${side}`;
    face.setAttribute("aria-hidden", "true");
    for (let position = 0; position < 9; position += 1) {
      const pip = document.createElement("span");
      pip.className = "die-pip" + (faces[faceValue].includes(position) ? " active" : "");
      face.append(pip);
    }
    cube.append(face);
  });
  die.append(cube);
  return die;
}
function renderDice(state) {
  const container = $("dice");
  container.replaceChildren();
  const values = state?.turn?.dice || [];
  values.slice(0, 2).forEach(value => container.append(makeDie(value, animateNextDice)));
  if (!values.length) {
    const label = document.createElement("span");
    label.className = "subtle";
    label.textContent = "Кости появятся после броска";
    container.append(label);
  }
  if (state?.turn?.phase === "moving" && state.turn.remainingDice?.length) {
    const remaining = document.createElement("span");
    remaining.className = "subtle";
    remaining.textContent = `Осталось ходов по костям: ${state.turn.remainingDice.join(" · ")}`;
    container.append(remaining);
  }
}

function renderPoint(index, position, state) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `point ${position}`;
  button.dataset.index = String(index);
  button.setAttribute("aria-label", `Пункт ${index + 1}`);
  const number = document.createElement("span");
  number.className = "point-number";
  number.textContent = String(index + 1);
  button.append(number);

  const count = state.points[index];
  const amount = Math.abs(count);
  const stack = document.createElement("span");
  stack.className = "stack";
  const visible = Math.min(amount, 5);
  for (let i = 0; i < visible; i += 1) {
    const checker = document.createElement("span");
    checker.className = "checker" + (count < 0 ? " b" : "");
    stack.append(checker);
  }
  button.append(stack);
  if (amount > 5) {
    const badge = document.createElement("span");
    badge.className = "checker-count";
    badge.textContent = String(amount);
    button.append(badge);
  }
  if (selectedFrom === index) button.classList.add("selected");
  if (selectedFrom !== null && legalMoves.some(move => move.from === selectedFrom && !move.bearOff && move.to === index)) {
    button.classList.add("legal-target");
  }
  button.addEventListener("click", () => handlePointClick(index));
  return button;
}

function renderBoard(state) {
  const top = $("board-top");
  const bottom = $("board-bottom");
  top.replaceChildren();
  bottom.replaceChildren();
  for (let index = 12; index <= 23; index += 1) top.append(renderPoint(index, "top", state));
  for (let index = 11; index >= 0; index -= 1) bottom.append(renderPoint(index, "bottom", state));
  $("off-a").textContent = String(state.borneOff.A);
  $("off-b").textContent = String(state.borneOff.B);
}

async function handlePointClick(index) {
  if (!currentMatch || currentMatch.status !== "active") return;
  const state = currentMatch.state;
  const side = sideFor(currentMatch);
  if (state.turn.phase !== "moving" || state.turn.player !== side) return;
  if (selectedFrom !== null) {
    const candidate = legalMoves.find(move => move.from === selectedFrom && !move.bearOff && move.to === index);
    if (candidate) {
      await invokeAction("move", { move: candidate });
      return;
    }
  }
  const sign = side === "A" ? 1 : -1;
  if (state.points[index] * sign > 0 && legalMoves.some(move => move.from === index)) {
    selectedFrom = selectedFrom === index ? null : index;
  } else {
    selectedFrom = null;
  }
  renderGame();
}

function addControl(container, label, action, style = "primary") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = style;
  button.textContent = label;
  button.addEventListener("click", action);
  container.append(button);
  return button;
}

function renderRestart(match) {
  const box = $("restart-box");
  box.classList.add("hidden");
  box.replaceChildren();
  if (!["active", "finished"].includes(match.status) || match.match_mode !== "casual") return;
  const request = match.restart_request;
  if (!request) {
    box.classList.remove("hidden");
    addControl(box, "Предложить рестарт", () => {
      if (window.confirm("Предложить начать партию заново?")) {
        invokeAction("restart_request");
      }
    }, "ghost");
    return;
  }
  box.classList.remove("hidden");
  const message = document.createElement("div");
  message.textContent = request.initiator_id === user.id
    ? "Запрос на рестарт отправлен. Ждём согласия соперника."
    : "Соперник предлагает начать партию заново.";
  box.append(message);
  if (request.initiator_id !== user.id) {
    addControl(box, "Согласиться", () => invokeAction("restart_vote", { request_id: request.id, accept: true }));
    addControl(box, "Отказаться", () => invokeAction("restart_vote", { request_id: request.id, accept: false }), "danger");
  } else {
    addControl(box, "Отменить запрос", () => invokeAction("restart_cancel", { request_id: request.id }), "ghost");
  }
}

function renderControls(match) {
  const container = $("controls");
  container.replaceChildren();
  const state = match.state;
  const side = sideFor(match);
  const isMyTurn = state.turn?.player === side;

  if (match.status === "waiting") {
    $("game-status").textContent = side === "A" ? "Приглашение отправлено. Ждём ответа соперника." : "Тебя пригласили сыграть. Прими партию в списке слева.";
    return;
  }
  if (match.status === "awaiting_opening_roll") {
    $("game-status").textContent = "Партия принята. Каждый игрок получает по одной кости; равенство перебрасывается.";
    addControl(container, "Бросить на начало", () => invokeAction("opening_roll"));
    return;
  }
  if (match.status === "finished") {
    $("game-status").textContent = state.winner === side ? "Ты выиграл партию!" : "Партия завершена. Победил соперник.";
    return;
  }
  if (match.status !== "active") {
    $("game-status").textContent = "Партия отменена.";
    return;
  }

  if (state.turn.phase === "awaiting_roll") {
    $("game-status").textContent = isMyTurn ? "Твой ход. Бросай кости." : "Сейчас ход соперника.";
    if (isMyTurn) addControl(container, "Бросить кости", () => invokeAction("roll"));
    return;
  }
  if (state.turn.phase === "moving") {
    $("game-status").textContent = isMyTurn ? "Выбери свою шашку, затем пункт назначения." : "Соперник перемещает шашки.";
    if (!isMyTurn) return;
    if (legalMoves.length === 0) {
      addControl(container, "Завершить ход", () => invokeAction("finish_turn"));
    }
    if (selectedFrom !== null) {
      const bearOff = legalMoves.find(move => move.from === selectedFrom && move.bearOff);
      if (bearOff) addControl(container, "Снять шашку", () => invokeAction("move", { move: bearOff }));
    }
  }
}

function captureCheckerMove(previousState, nextState) {
  if (!previousState?.points || !nextState?.points) return null;
  let from = -1;
  let to = -1;
  let sign = 0;
  for (let index = 0; index < 24; index += 1) {
    const before = previousState.points[index];
    const after = nextState.points[index];
    if (before === after) continue;
    if (before !== 0 && Math.abs(before) === Math.abs(after) + 1 &&
        Math.sign(before) === Math.sign(after || before)) {
      if (from !== -1) return null;
      from = index;
      sign = Math.sign(before);
    } else if (after !== 0 && Math.abs(after) === Math.abs(before) + 1) {
      if (to !== -1) return null;
      to = index;
    } else {
      return null;
    }
  }
  if (from < 0 || to < 0 || Math.sign(nextState.points[to]) !== sign) return null;
  const source = document.querySelector(`.point[data-index="${from}"] .stack .checker:last-child`);
  const rect = source?.getBoundingClientRect();
  if (!rect || !rect.width || !rect.height) return null;
  return { to, sign, rect };
}
function animateCheckerMove(transition) {
  if (!transition || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
  const target = document.querySelector(`.point[data-index="${transition.to}"] .stack .checker:last-child`);
  if (!target || typeof Element.prototype.animate !== "function") return;
  const destination = target.getBoundingClientRect();
  if (!destination.width || !destination.height) return;

  const piece = document.createElement("span");
  piece.className = "checker" + (transition.sign < 0 ? " b" : "");
  piece.setAttribute("aria-hidden", "true");
  Object.assign(piece.style, {
    position: "fixed",
    left: `${transition.rect.left}px`,
    top: `${transition.rect.top}px`,
    width: `${transition.rect.width}px`,
    height: `${transition.rect.height}px`,
    margin: "0",
    zIndex: "1000",
    pointerEvents: "none",
  });
  document.body.append(piece);
  target.style.visibility = "hidden";
  const dx = destination.left - transition.rect.left;
  const dy = destination.top - transition.rect.top;
  const animation = piece.animate(
    [
      { transform: "translate3d(0,0,0) scale(1)" },
      { transform: `translate3d(${dx}px,${dy}px,0) scale(1.08)` },
    ],
    { duration: 390, easing: "cubic-bezier(.2,.78,.25,1)", fill: "forwards" }
  );
  animation.onfinish = () => {
    piece.remove();
    target.style.visibility = "";
  };
  animation.oncancel = () => {
    piece.remove();
    target.style.visibility = "";
  };
}

function renderGame(previousState = null) {
  const hasMatch = !!currentMatch;
  $("empty-game").classList.toggle("hidden", hasMatch);
  $("game").classList.toggle("hidden", !hasMatch);
  $("close-match").hidden = !hasMatch;
  if (!hasMatch) return;
  const state = currentMatch.state;
  const checkerTransition = captureCheckerMove(previousState, state);
  $("game-title").textContent = `Партия с ${matchLabel(currentMatch)}`;
  legalMoves = currentMatch.status === "active" && state.turn.phase === "moving" &&
    state.turn.player === sideFor(currentMatch)
    ? engine.getLegalMoves(state, state.turn.remainingDice, LONG_BACKGAMMON_RULES)
    : [];
  renderDice(state);
  renderControls(currentMatch);
  renderRestart(currentMatch);
  renderBoard(state);
  animateCheckerMove(checkerTransition);
}

async function startRealtime() {
  if (realtimeChannel) await client.removeChannel(realtimeChannel);
  realtimeChannel = client.channel(`floustream-backgammon-${user.id}`);
  const refresh = async (payload) => {
    const row = payload.new;
    if (row?.id === currentMatch?.id) {
      const previousState = currentMatch.state;
      animateNextDice = previousState?.turn?.phase === "awaiting_roll" &&
        row.state?.turn?.phase === "moving";
      currentMatch = row;
      await hydrateOpponentNames([currentMatch]);
      selectedFrom = null;
      renderGame(previousState);
      animateNextDice = false;
    }
    await loadMatches();
  };
  realtimeChannel
    .on("postgres_changes", {
      event: "*", schema: "public", table: "backgammon_matches",
      filter: `player_a=eq.${user.id}`,
    }, refresh)
    .on("postgres_changes", {
      event: "*", schema: "public", table: "backgammon_matches",
      filter: `player_b=eq.${user.id}`,
    }, refresh)
    .subscribe();
}

$("invite-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = $("opponent-username").value.trim().replace(/^@/, "").toLowerCase();
  if (!username) return;
  const { data: opponent, error } = await client
    .from("profiles")
    .select("id,username,display_name,account_status")
    .eq("username", username)
    .maybeSingle();
  if (error) {
    setNotice("invite-notice", error.message, true);
    return;
  }
  if (!opponent || opponent.account_status !== "active") {
    setNotice("invite-notice", "Пользователь не найден или его аккаунт недоступен.", true);
    return;
  }
  if (opponent.id === user.id) {
    setNotice("invite-notice", "Нельзя пригласить самого себя.", true);
    return;
  }
  await createMatch(opponent);
});

$("close-match").addEventListener("click", () => {
  currentMatch = null;
  selectedFrom = null;
  renderGame();
  renderMatches();
});

async function start() {
  try {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (!data.session) {
      window.location.replace("portal.html");
      return;
    }
    user = data.session.user;
    $("account-label").textContent = user.email || "Мой аккаунт";
    $("loading").hidden = true;
    $("app").hidden = false;
    await loadMatches();
    await startRealtime();
  } catch (error) {
    $("loading").textContent = `Не удалось подключить игровой зал: ${error.message}`;
  }
}

start();
