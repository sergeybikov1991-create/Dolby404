"use strict";

const LONG_BACKGAMMON_RULES = Object.freeze({
  variant: "long-backgammon",
  checkersPerPlayer: 15,
  boardPoints: 24,
  headMoveLimit: 1,
  openingHeadException: Object.freeze({
    doubles: Object.freeze([3, 4, 6]),
    maxFromHead: 2
  }),
  home: Object.freeze({
    A: Object.freeze([18, 23]),
    B: Object.freeze([0, 5])
  }),
  forbidOpposingOccupiedPoint: true,
  // Kept disabled until the exact tournament-regulation interpretation
  // of the full-blockade restriction is locked and covered by fixtures.
  forbidFullBlockade: false
});

module.exports = { LONG_BACKGAMMON_RULES };
