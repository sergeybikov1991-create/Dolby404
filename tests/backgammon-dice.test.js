"use strict";

import test from "node:test";
import assert from "node:assert/strict";
import { secureDie, rollDice, rollOpeningDice } from "../backgammon/dice.js";

function byteStream(values) {
  let index = 0;
  return {
    getRandomValues(target) {
      for (let i = 0; i < target.length; i += 1) {
        target[i] = values[index % values.length];
        index += 1;
      }
      return target;
    }
  };
}

function queuedBytes(values) {
  let index = 0;
  return {
    getRandomValues(target) {
      target.fill(255);
      target[0] = values[index++];
      return target;
    }
  };
}

test("secureDie rejects biased tail bytes instead of applying modulo to them", () => {
  const crypto = byteStream([255, 252, 251]);
  assert.equal(secureDie(crypto), 6);
});

test("all six faces receive exactly 42 accepted byte values", () => {
  const counts = [0, 0, 0, 0, 0, 0];
  for (let byte = 0; byte < 252; byte += 1) {
    const face = secureDie(byteStream([byte]));
    counts[face - 1] += 1;
  }
  assert.deepEqual(counts, [42, 42, 42, 42, 42, 42]);
});

test("rollDice returns two independent die values and expands doubles to four moves", () => {
  const nonDouble = rollDice(queuedBytes([0, 1]));
  assert.deepEqual(nonDouble.dice, [1, 2]);
  assert.equal(nonDouble.isDouble, false);
  assert.deepEqual(nonDouble.moves, [1, 2]);

  const double = rollDice(queuedBytes([17, 17]));
  assert.deepEqual(double.dice, [6, 6]);
  assert.equal(double.isDouble, true);
  assert.deepEqual(double.moves, [6, 6, 6, 6]);
  assert.ok(Object.isFrozen(double));
  assert.ok(Object.isFrozen(double.dice));
});

test("secure dice fail closed when Web Crypto is unavailable", () => {
  assert.throws(() => secureDie(null), /Web Crypto provider/);
});


test("opening roll rerolls ties and awards the first turn to the higher die", () => {
  const opening = rollOpeningDice(queuedBytes([0, 0, 2, 4]));
  assert.deepEqual(opening.dice, [3, 5]);
  assert.equal(opening.firstPlayer, "B");
  assert.ok(Object.isFrozen(opening));
  assert.ok(Object.isFrozen(opening.dice));
});


test("all 36 ordered two-die outcomes have equal representation across the accepted byte domain", () => {
  const counts = Array.from({ length: 6 }, () => Array(6).fill(0));
  for (let first = 0; first < 252; first += 1) {
    for (let second = 0; second < 252; second += 1) {
      const result = rollDice(queuedBytes([first, second]));
      counts[result.dice[0] - 1][result.dice[1] - 1] += 1;
    }
  }
  for (const row of counts) {
    for (const count of row) assert.equal(count, 1764);
  }
});
