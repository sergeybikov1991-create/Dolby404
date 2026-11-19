"use strict";

import test from "node:test";
import assert from "node:assert/strict";
import { secureDie, rollDice, rollOpeningDice, recordOpeningRoll } from "../backgammon/dice.js";

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


test("opening rolls are submitted independently by each player and higher die starts", () => {
  const first = recordOpeningRoll({}, "A", 2);
  assert.deepEqual(first.rolls, { A: 2 });
  assert.equal(first.result, null);
  const second = recordOpeningRoll(first, "B", 5);
  assert.deepEqual(second.result, { firstPlayer: "B", dice: [2, 5] });
});

test("opening roll ties reset both player submissions for a fresh round", () => {
  const first = recordOpeningRoll({}, "B", 4);
  const tied = recordOpeningRoll(first, "A", 4);
  assert.deepEqual(tied.rolls, {});
  assert.deepEqual(tied.tie, { A: 4, B: 4 });
  const nextA = recordOpeningRoll({ rolls: {} }, "A", 1);
  const resolved = recordOpeningRoll(nextA, "B", 6);
  assert.deepEqual(resolved.result, { firstPlayer: "B", dice: [1, 6] });
});

test("a player cannot submit a second opening die while waiting for the opponent", () => {
  const first = recordOpeningRoll({}, "A", 3);
  assert.throws(() => recordOpeningRoll(first, "A", 6), /already rolled/);
});
