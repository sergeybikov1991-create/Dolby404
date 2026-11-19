"use strict";

const rules = require("./rules.cjs");
const diceLogic = require("./dice.cjs");
const turns = require("./turn.cjs");

function createGame() {
  return {
    ...rules.createInitialState(),
    turnNumber: 1,
    winner: null,
    rolledDice: null,
    legalTurnOptions: []
  };
}

function rollCurrentTurn(state, random = Math.random) {
  if (state.status !== "playing") throw new Error("game is already finished");
  if (state.rolledDice) throw new Error("dice have already been rolled for this turn");
  const rolledDice = diceLogic.rollDice(random);
  const legalTurnOptions = turns.getTurnOptions(state, state.currentPlayer, rolledDice);
  return { ...state, rolledDice, legalTurnOptions };
}

function sameSequence(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length &&
    a.every((move, index) =>
      move.player === b[index].player &&
      move.from === b[index].from &&
      move.to === b[index].to &&
      move.die === b[index].die &&
      Boolean(move.bearOff) === Boolean(b[index].bearOff)
    );
}

function completeTurn(state, selectedSequence) {
  if (state.status !== "playing") throw new Error("game is already finished");
  if (!state.rolledDice) throw new Error("roll the dice before moving");
  const selected = state.legalTurnOptions.find(option => sameSequence(option, selectedSequence));
  if (!selected) throw new Error("selected sequence is not legal");

  const next = turns.applyTurnSequence(state, state.currentPlayer, selected);
  if (next.status === "finished" || next.off[next.currentPlayer] === rules.CHECKERS_PER_PLAYER) {
    return { ...next, status: "finished", winner: state.currentPlayer, rolledDice: null, legalTurnOptions: [] };
  }

  return {
    ...next,
    currentPlayer: 1 - state.currentPlayer,
    turnNumber: state.turnNumber + 1,
    rolledDice: null,
    legalTurnOptions: [],
    headMovesUsed: 0
  };
}

function restartGame() {
  return createGame();
}

module.exports = { createGame, rollCurrentTurn, completeTurn, restartGame };
