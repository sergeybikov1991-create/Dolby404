"use strict";

function rollDie(random = Math.random) {
  const sample = random();
  if (typeof sample !== "number" || sample < 0 || sample >= 1) {
    throw new RangeError("random source must return a number in [0, 1)");
  }
  return Math.floor(sample * 6) + 1;
}

function rollDice(random = Math.random) {
  return [rollDie(random), rollDie(random)];
}

function expandDice(dice) {
  if (!Array.isArray(dice) || dice.length !== 2 ||
      dice.some(value => !Number.isInteger(value) || value < 1 || value > 6)) {
    throw new TypeError("dice must be an array of two integers from 1 to 6");
  }
  return dice[0] === dice[1] ? [dice[0], dice[0], dice[0], dice[0]] : dice.slice();
}

module.exports = { rollDie, rollDice, expandDice };
