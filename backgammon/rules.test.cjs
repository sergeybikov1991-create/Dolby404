"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const rules = require("../backgammon/rules.cjs");

test("initial position places 15 checkers on each player's own head", () => {
  const state = rules.createInitialState();
  assert.equal(state.board[0][0], 15);
  assert.equal(state.board[12][1], 15);
  assert.equal(rules.countOnBoard(state.board, 0), 15);
  assert.equal(rules.countOnBoard(state.board, 1), 15);
});

test("players move in opposite directions around the shared board", () => {
  assert.equal(rules.toGlobalPoint(0, 1), 1);
  assert.equal(rules.toGlobalPoint(1, 1), 11);
  assert.equal(rules.toProgressPoint(1, 11), 1);
});

test("a player cannot land on a point occupied by the opponent", () => {
  const state = rules.createInitialState();
  state.board[1][1] = 1;
  assert.equal(rules.canMove(state, 0, 0, 1), false);
  assert.deepEqual(rules.legalMoves(state, 0, 1), []);
});

test("a player may land on an empty point or stack on own checkers", () => {
  const state = rules.createInitialState();
  assert.equal(rules.canMove(state, 0, 0, 2), true);
  state.board[2][0] = 2;
  const next = rules.applyMove(state, { player: 0, from: 0, to: 2, die: 2 });
  assert.equal(next.board[2][0], 3);
  assert.equal(next.board[0][0], 14);
});

test("moving from the head is limited to one checker per ordinary turn", () => {
  const state = rules.createInitialState();
  state.headMovesUsed = 1;
  assert.equal(rules.canMove(state, 0, 0, 3), false);
});

test("an opponent's checker is never hit or removed", () => {
  const state = rules.createInitialState();
  state.board[2][1] = 1;
  assert.throws(
    () => rules.applyMove(state, { player: 0, from: 0, to: 2, die: 2 }),
    /illegal move/
  );
  assert.equal(state.board[2][1], 1);
});

test("bearing off is unavailable until all remaining checkers reach home", () => {
  const state = rules.createInitialState();
  state.board = Array.from({ length: 24 }, () => [0, 0]);
  state.off = [14, 0];
  state.board[23][0] = 1;
  state.board[12][1] = 15;
  assert.equal(rules.canMove(state, 0, 23, 1), false);
});

test("a checker may bear off from home with the exact die", () => {
  const state = rules.createInitialState();
  state.board = Array.from({ length: 24 }, () => [0, 0]);
  state.off = [14, 0];
  state.board[23][0] = 1;
  state.board[12][1] = 15;
  assert.equal(rules.canMove(state, 0, 23, 1), true);
  const next = rules.applyMove(state, { player: 0, from: 23, to: null, die: 1, bearOff: true });
  assert.equal(next.off[0], 15);
  assert.equal(next.status, "finished");
});
