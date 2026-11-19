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

test("creates a balanced initial position with 15 checkers on each head", () => {
  const state = engine.createInitialState({}, rules);
  assert.equal(state.points.length, 24);
  assert.equal(state.points[0], 15);
  assert.equal(state.points[23], -15);
  assert.equal(engine.validateState(state, rules).valid, true);
});

test("rejects a state with a broken checker count", () => {
  const state = engine.createInitialState({}, rules);
  state.points[0] = 14;
  assert.equal(engine.validateState(state, rules).valid, false);
});

test("A moves only toward higher point indexes", () => {
  const points = Array(24).fill(0);
  points[5] = 15;
  points[23] = -15;
  const state = stateWith(points);
  const moving = engine.startTurn(state, [2, 4], rules);
  const moves = engine.getLegalMoves(moving, moving.turn.remainingDice, rules);
  assert.ok(moves.every(move => move.to > move.from));
});

test("B moves only toward lower point indexes", () => {
  const points = Array(24).fill(0);
  points[0] = 15;
  points[18] = -15;
  const state = stateWith(points, "B");
  const moving = engine.startTurn(state, [2, 4], rules);
  const moves = engine.getLegalMoves(moving, moving.turn.remainingDice, rules);
  assert.ok(moves.every(move => move.to < move.from));
});

test("an opposing checker closes a point even when alone", () => {
  const points = Array(24).fill(0);
  points[4] = 15;
  points[6] = -1;
  points[23] = -14;
  const state = engine.startTurn(stateWith(points), [2, 3], rules);
  const moves = engine.getLegalMoves(state, state.turn.remainingDice, rules);
  assert.ok(!moves.some(move => move.from === 4 && move.to === 6));
});

test("a checker may stack on its own point", () => {
  const points = Array(24).fill(0);
  points[4] = 14;
  points[6] = 1;
  points[23] = -15;
  const state = engine.startTurn(stateWith(points), [2, 3], rules);
  const moves = engine.getLegalMoves(state, state.turn.remainingDice, rules);
  assert.ok(moves.some(move => move.from === 4 && move.to === 6));
});

test("only one checker may leave the head in a normal turn", () => {
  const points = Array(24).fill(0);
  points[0] = 15;
  points[23] = -15;
  let state = engine.startTurn(stateWith(points), [1, 2], rules);
  const first = engine.getLegalMoves(state, state.turn.remainingDice, rules)
    .find(move => move.from === 0);
  state = engine.applyMove(state, first, rules);
  const nextMoves = engine.getLegalMoves(state, state.turn.remainingDice, rules);
  assert.ok(!nextMoves.some(move => move.from === 0));
});

test("the opening exception allows two head moves for B on 3-3, 4-4 or 6-6", () => {
  const points = Array(24).fill(0);
  points[0] = 15;
  points[23] = -15;
  const state = stateWith(points, "B");
  state.opening.secondPlayerFirstTurnPending = true;
  let moving = engine.startTurn(state, [4, 4], rules);
  const first = engine.getLegalMoves(moving, moving.turn.remainingDice, rules)
    .find(move => move.from === 23);
  moving = engine.applyMove(moving, first, rules);
  const nextMoves = engine.getLegalMoves(moving, moving.turn.remainingDice, rules);
  assert.ok(nextMoves.some(move => move.from === 23));
});

test("a double supplies four moves when the route remains open", () => {
  const points = Array(24).fill(0);
  points[2] = 15;
  points[23] = -15;
  const moving = engine.startTurn(stateWith(points), [1, 1], rules);
  const sequences = engine.getLegalTurnSequences(moving, moving.turn.remainingDice, rules);
  assert.ok(sequences.some(sequence => sequence.length === 4));
});

test("overshooting bear-off requires no checker farther from the exit", () => {
  const points = Array(24).fill(0);
  points[22] = 14;
  points[23] = 1;
  points[5] = -15;
  const moving = engine.startTurn(stateWith(points), [6, 2], rules);
  const moves = engine.getLegalMoves(moving, moving.turn.remainingDice, rules);
  assert.ok(moves.some(move => move.from === 23 && move.bearOff));
  assert.ok(!moves.some(move => move.from === 22 && move.bearOff && move.die === 6));
});

test("applyMove is immutable and keeps the checker total", () => {
  const points = Array(24).fill(0);
  points[4] = 15;
  points[23] = -15;
  const state = engine.startTurn(stateWith(points), [1, 2], rules);
  const before = JSON.stringify(state);
  const move = engine.getLegalMoves(state, state.turn.remainingDice, rules)[0];
  const next = engine.applyMove(state, move, rules);
  assert.equal(JSON.stringify(state), before);
  assert.equal(engine.validateState(next, rules).valid, true);
});

test("finishTurn refuses to skip available mandatory dice", () => {
  const points = Array(24).fill(0);
  points[4] = 15;
  points[23] = -15;
  const state = engine.startTurn(stateWith(points), [1, 2], rules);
  assert.throws(() => engine.finishTurn(state, rules), /mandatory legal dice/);
});


test("cannot create a six-point block that traps all 15 opposing checkers", () => {
  const points = Array(24).fill(0);
  points[1] = 9;
  points[9] = 1;
  for (let point = 10; point <= 14; point += 1) points[point] = 1;
  points[23] = -15;

  const moving = engine.startTurn(stateWith(points), [6, 1], rules);
  const moves = engine.getLegalMoves(moving, moving.turn.remainingDice, rules);
  assert.ok(!moves.some(move => move.from === 9 && move.to === 15 && move.die === 6));
});

test("six-point block is allowed when even one opposing checker has passed it", () => {
  const points = Array(24).fill(0);
  points[1] = 9;
  points[9] = 1;
  for (let point = 10; point <= 14; point += 1) points[point] = 1;
  points[23] = -14;
  points[0] = -1;

  const moving = engine.startTurn(stateWith(points), [6, 1], rules);
  const moves = engine.getLegalMoves(moving, moving.turn.remainingDice, rules);
  assert.ok(moves.some(move => move.from === 9 && move.to === 15 && move.die === 6));
});
