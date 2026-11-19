"use strict";

const rules = require("./rules.cjs");
const diceLogic = require("./dice.cjs");

function sameMove(a, b) {
  return a.player === b.player && a.from === b.from && a.to === b.to &&
    a.die === b.die && Boolean(a.bearOff) === Boolean(b.bearOff);
}

function getTurnOptions(state, player, rolledDice) {
  const dice = diceLogic.expandDice(rolledDice);
  const headLimit = rolledDice[0] === rolledDice[1] ? 2 : 1;
  const initial = {
    ...state,
    board: state.board.map(point => point.slice()),
    off: (state.off || [0, 0]).slice(),
    headMovesUsed: 0,
    headLimit
  };

  function walk(current, remaining, sequence) {
    if (!remaining.length) return [sequence];
    const results = [];
    const seen = new Set();

    for (let index = 0; index < remaining.length; index += 1) {
      const die = remaining[index];
      const rest = remaining.filter((_, i) => i !== index);
      const moves = rules.legalMoves(current, player, die, {
        headMovesUsed: current.headMovesUsed,
        headLimit
      });
      for (const move of moves) {
        const key = [move.from, move.to, move.die, move.bearOff].join(":");
        if (seen.has(key)) continue;
        seen.add(key);
        const next = rules.applyMove({ ...current, headLimit }, move);
        results.push(...walk(next, rest, sequence.concat(move)));
      }
    }

    return results.length ? results : [sequence];
  }

  let sequences = walk(initial, dice, []);
  const maxMoves = Math.max(...sequences.map(sequence => sequence.length));
  sequences = sequences.filter(sequence => sequence.length === maxMoves);

  // If only one of two different dice can be used, the higher die is mandatory
  // whenever at least one legal move with that higher die exists.
  if (rolledDice[0] !== rolledDice[1] && maxMoves === 1) {
    const high = Math.max(...rolledDice);
    const highCanPlay = rules.legalMoves(initial, player, high, {
      headMovesUsed: 0,
      headLimit
    }).length > 0;
    if (highCanPlay) sequences = sequences.filter(sequence => sequence[0].die === high);
  }

  // Remove duplicate sequences caused by identical dice or identical checkers.
  const unique = new Map();
  for (const sequence of sequences) {
    const key = sequence.map(move => [move.from, move.to, move.die, move.bearOff ? 1 : 0].join(",")).join("|");
    if (!unique.has(key)) unique.set(key, sequence);
  }
  return [...unique.values()];
}

function applyTurnSequence(state, player, sequence) {
  let next = {
    ...state,
    board: state.board.map(point => point.slice()),
    off: (state.off || [0, 0]).slice(),
    headMovesUsed: 0
  };
  for (const move of sequence) {
    if (move.player !== player) throw new Error("move belongs to another player");
    next = rules.applyMove({ ...next, headLimit: state.headLimit ?? 1 }, move);
  }
  return next;
}

module.exports = { getTurnOptions, applyTurnSequence };
