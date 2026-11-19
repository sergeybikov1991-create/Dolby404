"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const rules = require("../backgammon/rules").LONG_BACKGAMMON_RULES;
const engine = require("../backgammon/engine");

function stateWith(points, player = "A", borneOff = { A: 0, B: 0 }) {
  return {
    schemaVersion: 1,
    matchId: "test",
    players: { A: "a", B: "b" },
    points,
    borneOff: { ...borneOff },
    turn: {
      player,
      phase: "awaiting_roll",
      dice: [],
      remainingDice: [],
      movesApplied: [],
      headMovesApplied: 0,
      headMovesLimit: 1
    },
    opening: {
      firstPlayer: "A",
      secondPlayer: "B",
      secondPlayerFirstTurnPending: false
    },
    winner: null
  };
}

test("creates the official long-nardy heads at points 24 and 12", () => {
  const state = engine.createInitialState({}, rules);
  assert.equal(state.points.length, 24);
  assert.equal(state.points[23], 15);
  assert.equal(state.points[11], -15);
  assert.equal(engine.validateState(state, rules).valid, true);
});

test("rejects a state with a broken checker count", () => {
  const state = engine.createInitialState({}, rules);
  state.points[23] = 14;
  assert.equal(engine.validateState(state, rules).valid, false);
});

test("A moves counterclockwise toward lower point indexes", () => {
  const points = Array(24).fill(0);
  points[5] = 15;
  points[11] = -15;
  const moving = engine.startTurn(stateWith(points), [2, 4], rules);
  const moves = engine.getLegalMoves(moving, moving.turn.remainingDice, rules);
  assert.ok(moves.every(move => move.to === "off" || move.to < move.from));
});

test("B moves in the same counterclockwise direction as A", () => {
  const points = Array(24).fill(0);
  points[23] = 15;
  points[18] = -15;
  const moving = engine.startTurn(stateWith(points, "B"), [2, 4], rules);
  const moves = engine.getLegalMoves(moving, moving.turn.remainingDice, rules);
  assert.ok(moves.every(move => move.to === "off" || move.to < move.from));
});

test("B's path wraps from point 1 to point 24 before reaching its home", () => {
  const points = Array(24).fill(0);
  points[11] = 15;
  points[0] = -15;
  const moving = engine.startTurn(stateWith(points, "B"), [1, 2], rules);
  const moves = engine.getLegalMoves(moving, moving.turn.remainingDice, rules);
  assert.ok(moves.some(move => move.from === 0 && move.to === 23));
});

test("an opposing checker closes a point even when alone", () => {
  const points = Array(24).fill(0);
  points[8] = 15;
  points[6] = -1;
  points[11] = -14;
  const moving = engine.startTurn(stateWith(points), [2, 3], rules);
  const moves = engine.getLegalMoves(moving, moving.turn.remainingDice, rules);
  assert.ok(!moves.some(move => move.from === 8 && move.to === 6));
});

test("a checker may stack on its own point", () => {
  const points = Array(24).fill(0);
  points[6] = 14;
  points[4] = 1;
  points[11] = -15;
  const moving = engine.startTurn(stateWith(points), [2, 3], rules);
  const moves = engine.getLegalMoves(moving, moving.turn.remainingDice, rules);
  assert.ok(moves.some(move => move.from === 6 && move.to === 4));
});

test("only one checker may leave A's head in a normal turn", () => {
  const points = Array(24).fill(0);
  points[23] = 15;
  points[11] = -15;
  let moving = engine.startTurn(stateWith(points), [1, 2], rules);
  const first = engine.getLegalMoves(moving, moving.turn.remainingDice, rules)
    .find(move => move.from === 23);
  moving = engine.applyMove(moving, first, rules);
  const nextMoves = engine.getLegalMoves(moving, moving.turn.remainingDice, rules);
  assert.ok(!nextMoves.some(move => move.from === 23));
});

test("the opening exception allows B two head moves on 3-3, 4-4 or 6-6", () => {
  const points = Array(24).fill(0);
  points[23] = 15;
  points[11] = -15;
  const state = stateWith(points, "B");
  state.opening.secondPlayerFirstTurnPending = true;
  let moving = engine.startTurn(state, [4, 4], rules);
  const first = engine.getLegalMoves(moving, moving.turn.remainingDice, rules)
    .find(move => move.from === 11);
  moving = engine.applyMove(moving, first, rules);
  const nextMoves = engine.getLegalMoves(moving, moving.turn.remainingDice, rules);
  assert.ok(nextMoves.some(move => move.from === 11));
});

test("a double supplies four moves when the route remains open", () => {
  const points = Array(24).fill(0);
  points[2] = 15;
  points[11] = -15;
  const moving = engine.startTurn(stateWith(points), [1, 1], rules);
  const sequences = engine.getLegalTurnSequences(moving, moving.turn.remainingDice, rules);
  assert.ok(sequences.some(sequence => sequence.length === 4));
});

test("overshooting bear-off requires no checker farther from A's exit", () => {
  const points = Array(24).fill(0);
  points[4] = 14;
  points[5] = 1;
  points[11] = -15;
  const moving = engine.startTurn(stateWith(points), [6, 2], rules);
  const moves = engine.getLegalMoves(moving, moving.turn.remainingDice, rules);
  assert.ok(moves.some(move => move.from === 5 && move.bearOff));
  assert.ok(!moves.some(move => move.from === 4 && move.bearOff && move.die === 6));
});

test("B can bear off from the first point of its home", () => {
  const points = Array(24).fill(0);
  points[23] = 15;
  points[12] = -15;
  const moving = engine.startTurn(stateWith(points, "B"), [1, 2], rules);
  const moves = engine.getLegalMoves(moving, moving.turn.remainingDice, rules);
  assert.ok(moves.some(move => move.from === 12 && move.bearOff && move.die === 1));
});

test("applyMove is immutable and keeps the checker total", () => {
  const points = Array(24).fill(0);
  points[4] = 15;
  points[11] = -15;
  const moving = engine.startTurn(stateWith(points), [1, 2], rules);
  const before = JSON.stringify(moving);
  const move = engine.getLegalMoves(moving, moving.turn.remainingDice, rules)[0];
  const next = engine.applyMove(moving, move, rules);
  assert.equal(JSON.stringify(moving), before);
  assert.equal(engine.validateState(next, rules).valid, true);
});

test("finishTurn refuses to skip available mandatory dice", () => {
  const points = Array(24).fill(0);
  points[4] = 15;
  points[11] = -15;
  const moving = engine.startTurn(stateWith(points), [1, 2], rules);
  assert.throws(() => engine.finishTurn(moving, rules), /mandatory legal dice/);
});

test("cannot temporarily create a six-point block trapping all 15 opponents", () => {
  const points = Array(24).fill(0);
  points[1] = 9;
  points[10] = 1;
  for (let point = 5; point <= 9; point += 1) points[point] = 1;
  points[11] = -15;

  // The second die could move 4 -> 3 and break the block, but the temporary
  // full blockade is illegal immediately after the first die.
  const moving = engine.startTurn(stateWith(points), [6, 1], rules);
  const moves = engine.getLegalMoves(moving, moving.turn.remainingDice, rules);
  assert.ok(!moves.some(move => move.from === 10 && move.to === 4 && move.die === 6));
});

test("six-point block is allowed when one opposing checker has passed it", () => {
  const points = Array(24).fill(0);
  points[1] = 9;
  points[10] = 1;
  for (let point = 5; point <= 9; point += 1) points[point] = 1;
  points[11] = -14;
  points[3] = -1;

  const moving = engine.startTurn(stateWith(points), [6, 1], rules);
  const moves = engine.getLegalMoves(moving, moving.turn.remainingDice, rules);
  assert.ok(moves.some(move => move.from === 10 && move.to === 4 && move.die === 6));
});


test("the full-blockade rule is symmetric when B builds the block", () => {
  const points = Array(24).fill(0);
  points[23] = 15;
  points[22] = -1;
  for (let point = 17; point <= 21; point += 1) points[point] = -1;
  points[12] = -9;

  const moving = engine.startTurn(stateWith(points, "B"), [6, 1], rules);
  const moves = engine.getLegalMoves(moving, moving.turn.remainingDice, rules);
  assert.ok(!moves.some(move => move.from === 22 && move.to === 16 && move.die === 6));
});

test("B may build the same block after an A checker has passed it", () => {
  const points = Array(24).fill(0);
  points[23] = 14;
  points[15] = 1;
  points[22] = -1;
  for (let point = 17; point <= 21; point += 1) points[point] = -1;
  points[12] = -9;

  const moving = engine.startTurn(stateWith(points, "B"), [6, 1], rules);
  const moves = engine.getLegalMoves(moving, moving.turn.remainingDice, rules);
  assert.ok(moves.some(move => move.from === 22 && move.to === 16 && move.die === 6));
});
