"use strict";

/**
 * FLOUSTREAM — long backgammon rules core.
 * Board points are stored in one shared clockwise coordinate system (0..23).
 * Player 0 starts at point 0 and moves clockwise; player 1 starts at point 12
 * and moves counter-clockwise. A point may contain checkers of only one player.
 * There are no hits and no bar in long backgammon.
 */

const PLAYERS = Object.freeze([0, 1]);
const POINT_COUNT = 24;
const CHECKERS_PER_PLAYER = 15;
const HOME_LENGTH = 6;

function assertPlayer(player) {
  if (!PLAYERS.includes(player)) throw new RangeError("player must be 0 or 1");
}

function createInitialBoard() {
  const board = Array.from({ length: POINT_COUNT }, () => [0, 0]);
  board[0][0] = CHECKERS_PER_PLAYER;
  board[12][1] = CHECKERS_PER_PLAYER;
  return board;
}

function createInitialState() {
  return {
    board: createInitialBoard(),
    off: [0, 0],
    currentPlayer: 0,
    dice: [],
    headMovesUsed: 0,
    status: "playing"
  };
}

function toGlobalPoint(player, progressPoint) {
  assertPlayer(player);
  if (!Number.isInteger(progressPoint) || progressPoint < 0 || progressPoint >= POINT_COUNT) {
    throw new RangeError("progressPoint must be an integer from 0 to 23");
  }
  return player === 0 ? progressPoint : (12 - progressPoint + POINT_COUNT) % POINT_COUNT;
}

function toProgressPoint(player, globalPoint) {
  assertPlayer(player);
  if (!Number.isInteger(globalPoint) || globalPoint < 0 || globalPoint >= POINT_COUNT) {
    throw new RangeError("globalPoint must be an integer from 0 to 23");
  }
  return player === 0 ? globalPoint : (12 - globalPoint + POINT_COUNT) % POINT_COUNT;
}

function countOnBoard(board, player) {
  assertPlayer(player);
  return board.reduce((sum, point) => sum + point[player], 0);
}

function allInHome(board, off, player) {
  assertPlayer(player);
  for (let global = 0; global < POINT_COUNT; global += 1) {
    const count = board[global][player];
    if (count && toProgressPoint(player, global) < POINT_COUNT - HOME_LENGTH) return false;
  }
  return off[player] + countOnBoard(board, player) === CHECKERS_PER_PLAYER;
}

function canBearOff(board, off, player, fromGlobal, die) {
  if (!allInHome(board, off, player)) return false;
  const fromProgress = toProgressPoint(player, fromGlobal);
  const distance = POINT_COUNT - fromProgress;
  if (die === distance) return true;
  if (die < distance) return false;

  // An oversized die may bear off only the furthest checker from the exit.
  for (let global = 0; global < POINT_COUNT; global += 1) {
    if (board[global][player] > 0 &&
        toProgressPoint(player, global) < fromProgress) return false;
  }
  return true;
}

function canMove(state, player, fromGlobal, die, options = {}) {
  assertPlayer(player);
  if (!state || !Array.isArray(state.board) || state.board.length !== POINT_COUNT) {
    throw new TypeError("state.board must contain 24 points");
  }
  if (!Number.isInteger(fromGlobal) || fromGlobal < 0 || fromGlobal >= POINT_COUNT) return false;
  if (!Number.isInteger(die) || die < 1 || die > 6) return false;
  if (state.board[fromGlobal][player] <= 0) return false;

  const fromProgress = toProgressPoint(player, fromGlobal);
  const headLimit = options.headLimit ?? 1;
  const headMovesUsed = options.headMovesUsed ?? state.headMovesUsed ?? 0;
  if (fromProgress === 0 && headMovesUsed >= headLimit) return false;

  const targetProgress = fromProgress + die;
  if (targetProgress >= POINT_COUNT) {
    return canBearOff(state.board, state.off || [0, 0], player, fromGlobal, die);
  }

  const targetGlobal = toGlobalPoint(player, targetProgress);
  // Long backgammon: an opponent's point is blocked. Never hit or remove it.
  return state.board[targetGlobal][1 - player] === 0;
}

function legalMoves(state, player, die, options = {}) {
  assertPlayer(player);
  const moves = [];
  for (let fromGlobal = 0; fromGlobal < POINT_COUNT; fromGlobal += 1) {
    if (!canMove(state, player, fromGlobal, die, options)) continue;
    const fromProgress = toProgressPoint(player, fromGlobal);
    const targetProgress = fromProgress + die;
    moves.push({
      player,
      from: fromGlobal,
      to: targetProgress >= POINT_COUNT ? null : toGlobalPoint(player, targetProgress),
      die,
      bearOff: targetProgress >= POINT_COUNT
    });
  }
  return moves;
}

function applyMove(state, move) {
  if (!move || !PLAYERS.includes(move.player)) throw new TypeError("invalid move");
  const { player, from, to, die, bearOff } = move;
  if (!canMove(state, player, from, die, {
    headMovesUsed: state.headMovesUsed,
    headLimit: state.headLimit ?? 1
  })) throw new Error("illegal move");

  const next = {
    ...state,
    board: state.board.map(point => point.slice()),
    off: (state.off || [0, 0]).slice()
  };
  next.board[from][player] -= 1;
  if (bearOff || to === null) {
    next.off[player] += 1;
  } else {
    if (next.board[to][1 - player] > 0) throw new Error("cannot move onto an opponent point");
    next.board[to][player] += 1;
  }
  if (toProgressPoint(player, from) === 0) next.headMovesUsed += 1;
  if (next.off[player] === CHECKERS_PER_PLAYER) next.status = "finished";
  return next;
}

module.exports = {
  PLAYERS,
  POINT_COUNT,
  CHECKERS_PER_PLAYER,
  createInitialBoard,
  createInitialState,
  toGlobalPoint,
  toProgressPoint,
  countOnBoard,
  allInHome,
  canBearOff,
  canMove,
  legalMoves,
  applyMove
};
