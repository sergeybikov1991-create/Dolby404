"use strict";

const { test, expect } = require("@playwright/test");
const rules = require("../backgammon/rules.cjs");

test("long backgammon starts with fifteen checkers on each head", () => {
  const state = rules.createInitialState();
  expect(state.board[0][0]).toBe(15);
  expect(state.board[12][1]).toBe(15);
});

test("players progress in opposite directions", () => {
  expect(rules.toGlobalPoint(0, 1)).toBe(1);
  expect(rules.toGlobalPoint(1, 1)).toBe(11);
});

test("opponent-occupied point is blocked; no hitting is possible", () => {
  const state = rules.createInitialState();
  state.board[1][1] = 1;
  expect(rules.canMove(state, 0, 0, 1)).toBe(false);
  expect(rules.legalMoves(state, 0, 1)).toEqual([]);
  expect(state.board[1][1]).toBe(1);
});

test("empty points and own points are valid destinations", () => {
  const state = rules.createInitialState();
  state.board[2][0] = 2;
  const next = rules.applyMove(state, { player: 0, from: 0, to: 2, die: 2 });
  expect(next.board[2][0]).toBe(3);
  expect(next.board[0][0]).toBe(14);
});

test("ordinary turn permits only one checker to leave the head", () => {
  const state = rules.createInitialState();
  state.headMovesUsed = 1;
  expect(rules.canMove(state, 0, 0, 4)).toBe(false);
});

test("bearing off requires every remaining checker to be in the home board", () => {
  const state = rules.createInitialState();
  state.board = Array.from({ length: 24 }, () => [0, 0]);
  state.off = [13, 0];
  state.board[17][0] = 1;
  state.board[23][0] = 1;
  state.board[12][1] = 15;
  expect(rules.canMove(state, 0, 23, 1)).toBe(false);
});

test("last checker can bear off and finish the game", () => {
  const state = rules.createInitialState();
  state.board = Array.from({ length: 24 }, () => [0, 0]);
  state.off = [14, 0];
  state.board[23][0] = 1;
  state.board[12][1] = 15;
  const next = rules.applyMove(state, { player: 0, from: 23, to: null, die: 1, bearOff: true });
  expect(next.off[0]).toBe(15);
  expect(next.status).toBe("finished");
});
