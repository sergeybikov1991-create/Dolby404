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
    A: Object.freeze([0, 5]),
    B: Object.freeze([12, 17])
  }),
  forbidOpposingOccupiedPoint: true,
  // Russian sport rules (Order No. 347, 30 Apr 2025), art. 20.5:
  // a move may not temporarily lock all 15 opposing checkers behind a six-point block.
  forbidFullBlockade: true
});

module.exports = { LONG_BACKGAMMON_RULES };
