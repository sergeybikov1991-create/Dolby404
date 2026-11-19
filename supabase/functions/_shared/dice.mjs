"use strict";

/**
 * Cryptographically secure, unbiased dice for long backgammon.
 * Compatible with Web Crypto in modern browsers, Node.js 20+ and Deno.
 *
 * This module deliberately does not persist rolls or authorize turns. The
 * trusted game server must call it only after authenticating the active player
 * and must persist the returned roll atomically with the turn transition.
 */
function secureDie(cryptoProvider = globalThis.crypto) {
  if (!cryptoProvider || typeof cryptoProvider.getRandomValues !== "function") {
    throw new Error("A Web Crypto provider is required for secure dice");
  }

  // 256 is not divisible by 6. Reject 252..255 so every face has
  // exactly 42 accepted byte values and modulo reduction is unbiased.
  const bytes = new Uint8Array(32);
  for (;;) {
    cryptoProvider.getRandomValues(bytes);
    for (const byte of bytes) {
      if (byte < 252) return (byte % 6) + 1;
    }
  }
}

function rollDice(cryptoProvider = globalThis.crypto) {
  const first = secureDie(cryptoProvider);
  const second = secureDie(cryptoProvider);
  return Object.freeze({
    dice: Object.freeze([first, second]),
    isDouble: first === second,
    moves: Object.freeze(first === second ? [first, first, first, first] : [first, second])
  });
}

// The opening roll uses one die per player. Ties are rerolled; the winner
// starts and uses both values as the first turn's dice.
function rollOpeningDice(cryptoProvider = globalThis.crypto) {
  let dieA;
  let dieB;
  do {
    dieA = secureDie(cryptoProvider);
    dieB = secureDie(cryptoProvider);
  } while (dieA === dieB);

  return Object.freeze({
    firstPlayer: dieA > dieB ? "A" : "B",
    dice: Object.freeze([dieA, dieB])
  });
}

export { secureDie, rollDice, rollOpeningDice };
