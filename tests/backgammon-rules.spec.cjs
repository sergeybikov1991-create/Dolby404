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

test("dice roll produces two values from one through six", () => {
  const dice = require("../backgammon/dice.cjs");
  expect(dice.rollDice(() => 0)).toEqual([1, 1]);
  expect(dice.rollDice(() => 0.999999)).toEqual([6, 6]);
});

test("doubles grant four moves; different dice grant two", () => {
  const dice = require("../backgammon/dice.cjs");
  expect(dice.expandDice([4, 4])).toEqual([4, 4, 4, 4]);
  expect(dice.expandDice([2, 5])).toEqual([2, 5]);
});


test("turn engine finds sequences that use the maximum number of dice", () => {
  const turn = require("../backgammon/turn.cjs");
  const state = rules.createInitialState();
  const options = turn.getTurnOptions(state, 0, [1, 2]);
  expect(options.length).toBeGreaterThan(0);
  expect(options.every(sequence => sequence.length === 2)).toBe(true);
});

test("doubles provide up to four moves and allow two checkers from the head", () => {
  const turn = require("../backgammon/turn.cjs");
  const state = rules.createInitialState();
  const options = turn.getTurnOptions(state, 0, [2, 2]);
  expect(options.length).toBeGreaterThan(0);
  expect(options.every(sequence => sequence.length === 4)).toBe(true);
});

test("turn engine enforces the higher die when only one die can be played", () => {
  const turn = require("../backgammon/turn.cjs");
  const state = rules.createInitialState();
  state.board = Array.from({ length: 24 }, () => [0, 0]);
  state.board[0][0] = 1;
  state.board[1][1] = 1;
  state.board[2][1] = 1;
  state.board[4][1] = 1;
  state.board[12][1] = 10;
  const options = turn.getTurnOptions(state, 0, [1, 3]);
  expect(options.length).toBeGreaterThan(0);
  expect(options.every(sequence => sequence[0].die === 3)).toBe(true);
});


test("game alternates turns after a legal sequence", () => {
  const game = require("../backgammon/game.cjs");
  let state = game.createGame();
  state = game.rollCurrentTurn(state, () => 0.1);
  const chosen = state.legalTurnOptions[0];
  state = game.completeTurn(state, chosen);
  expect(state.currentPlayer).toBe(1);
  expect(state.turnNumber).toBe(2);
  expect(state.rolledDice).toBeNull();
});

test("game rejects a move sequence that was not offered as legal", () => {
  const game = require("../backgammon/game.cjs");
  let state = game.createGame();
  state = game.rollCurrentTurn(state, () => 0.1);
  expect(() => game.completeTurn(state, [{ player: 0, from: 0, to: 23, die: 1 }])).toThrow(/not legal/);
});

test("restart restores the original board and first player's turn", () => {
  const game = require("../backgammon/game.cjs");
  let state = game.createGame();
  state = game.rollCurrentTurn(state, () => 0.3);
  state = game.completeTurn(state, state.legalTurnOptions[0]);
  const restarted = game.restartGame();
  expect(restarted.currentPlayer).toBe(0);
  expect(restarted.turnNumber).toBe(1);
  expect(restarted.board[0][0]).toBe(15);
  expect(restarted.board[12][1]).toBe(15);
});
