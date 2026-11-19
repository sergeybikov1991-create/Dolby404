"use strict";

const PLAYER_A = "A";
const PLAYER_B = "B";
const BOARD_POINTS = 24;
const CHECKERS_PER_PLAYER = 15;

function otherPlayer(player) {
  return player === PLAYER_A ? PLAYER_B : PLAYER_A;
}

function direction() {
  // Both players travel counterclockwise along the same shared 24-point path.
  return -1;
}

function headPoint(player) {
  // A starts on point 24; B starts on point 12 (zero-based indexes 23 and 11).
  return player === PLAYER_A ? 23 : 11;
}

function isHomePoint(player, point, rules) {
  const home = rules.home[player];
  return point >= home[0] && point <= home[1];
}

function cloneState(state) {
  return {
    ...state,
    players: { ...state.players },
    points: [...state.points],
    borneOff: { ...state.borneOff },
    turn: {
      ...state.turn,
      dice: [...(state.turn.dice || [])],
      remainingDice: [...(state.turn.remainingDice || [])],
      movesApplied: [...(state.turn.movesApplied || [])]
    },
    opening: { ...state.opening }
  };
}

function assertRules(rules) {
  if (!rules || !rules.home || !rules.home.A || !rules.home.B) {
    throw new TypeError("A complete long-backgammon rules object is required");
  }
}

function createInitialState(config = {}, rules) {
  assertRules(rules);
  const firstPlayer = config.firstPlayer || PLAYER_A;
  if (![PLAYER_A, PLAYER_B].includes(firstPlayer)) {
    throw new TypeError("firstPlayer must be A or B");
  }

  const points = Array(BOARD_POINTS).fill(0);
  points[headPoint(PLAYER_A)] = CHECKERS_PER_PLAYER;
  points[headPoint(PLAYER_B)] = -CHECKERS_PER_PLAYER;

  const secondPlayer = otherPlayer(firstPlayer);
  const state = {
    schemaVersion: 1,
    matchId: config.matchId || null,
    players: {
      A: config.players?.A || null,
      B: config.players?.B || null
    },
    points,
    borneOff: { A: 0, B: 0 },
    turn: {
      player: firstPlayer,
      phase: "awaiting_roll",
      dice: [],
      remainingDice: [],
      movesApplied: [],
      headMovesApplied: 0,
      headMovesLimit: rules.headMoveLimit
    },
    opening: {
      firstPlayer,
      secondPlayer,
      secondPlayerFirstTurnPending: true
    },
    winner: null
  };

  validateState(state, rules);
  return state;
}

function validateState(state, rules) {
  assertRules(rules);
  const errors = [];
  if (!state || state.schemaVersion !== 1) errors.push("Unsupported schemaVersion");
  if (!Array.isArray(state?.points) || state.points.length !== BOARD_POINTS) {
    errors.push("points must contain exactly 24 entries");
  } else {
    for (const value of state.points) {
      if (!Number.isInteger(value) || Math.abs(value) > CHECKERS_PER_PLAYER) {
        errors.push("Each point must be an integer from -15 to 15");
        break;
      }
    }
  }

  if (!state?.borneOff || !Number.isInteger(state.borneOff.A) ||
      !Number.isInteger(state.borneOff.B) || state.borneOff.A < 0 ||
      state.borneOff.B < 0 || state.borneOff.A > 15 || state.borneOff.B > 15) {
    errors.push("borneOff must contain valid A and B counts");
  }

  if (Array.isArray(state?.points) && state.points.length === BOARD_POINTS &&
      state?.borneOff && Number.isInteger(state.borneOff.A) &&
      Number.isInteger(state.borneOff.B)) {
    const onBoardA = state.points.reduce((sum, n) => sum + Math.max(0, n), 0);
    const onBoardB = state.points.reduce((sum, n) => sum + Math.max(0, -n), 0);
    if (onBoardA + state.borneOff.A !== CHECKERS_PER_PLAYER) {
      errors.push("Player A checker count must remain 15");
    }
    if (onBoardB + state.borneOff.B !== CHECKERS_PER_PLAYER) {
      errors.push("Player B checker count must remain 15");
    }
  }

  if (!state?.turn || ![PLAYER_A, PLAYER_B].includes(state.turn.player)) {
    errors.push("turn.player must be A or B");
  }
  if (!["awaiting_roll", "moving", "finished"].includes(state?.turn?.phase)) {
    errors.push("Invalid turn phase");
  }
  if (state?.turn?.phase === "moving") {
    if (!Array.isArray(state.turn.remainingDice) ||
        state.turn.remainingDice.some(d => !Number.isInteger(d) || d < 1 || d > 6)) {
      errors.push("remainingDice must contain values from 1 to 6");
    }
  }
  if (state?.winner !== null && ![PLAYER_A, PLAYER_B].includes(state.winner)) {
    errors.push("winner must be A, B, or null");
  }

  return { valid: errors.length === 0, errors };
}

function allCheckersInHome(state, player, rules) {
  for (let point = 0; point < BOARD_POINTS; point += 1) {
    const count = state.points[point] * (player === PLAYER_A ? 1 : -1);
    if (count > 0 && !isHomePoint(player, point, rules)) return false;
  }
  return true;
}

function canBearOffFrom(state, player, from, die, rules) {
  if (!isHomePoint(player, from, rules) || !allCheckersInHome(state, player, rules)) {
    return false;
  }

  // Point 1 (A) and point 13 (B) are the respective exits from home.
  const distance = player === PLAYER_A ? from + 1 : from - 11;
  if (die === distance) return true;
  if (die < distance) return false;

  // An oversized die may bear off only when no checker remains farther
  // from the exit (at a higher point index) in that player's home.
  const homeEnd = rules.home[player][1];
  for (let point = from + 1; point <= homeEnd; point += 1) {
    const count = state.points[point] * (player === PLAYER_A ? 1 : -1);
    if (count > 0) return false;
  }
  return true;
}

function currentHeadLimit(state, rules) {
  const opening = state.opening || {};
  const isExceptionTurn =
    opening.secondPlayerFirstTurnPending === true &&
    state.turn.player === opening.secondPlayer;
  const dice = state.turn.dice || [];
  const isExceptionDouble = dice.length === 2 &&
    dice[0] === dice[1] &&
    rules.openingHeadException?.doubles?.includes(dice[0]);

  return isExceptionTurn && isExceptionDouble
    ? rules.openingHeadException.maxFromHead
    : rules.headMoveLimit;
}

function generateMoves(state, die, rules) {
  const player = state.turn.player;
  const sign = player === PLAYER_A ? 1 : -1;
  const step = direction(player);
  const head = headPoint(player);
  const headLimit = state.turn.headMovesLimit ?? currentHeadLimit(state, rules);
  const moves = [];

  for (let from = 0; from < BOARD_POINTS; from += 1) {
    if (state.points[from] * sign <= 0) continue;
    if (from === head && state.turn.headMovesApplied >= headLimit) continue;

    const rawTo = from + step * die;
    const crossesHomeExit = player === PLAYER_A
      ? rawTo < 0
      : from >= rules.home.B[0] && rawTo < rules.home.B[0];

    if (crossesHomeExit) {
      if (canBearOffFrom(state, player, from, die, rules)) {
        moves.push({ player, from, to: "off", die, bearOff: true });
      }
      continue;
    }

    // B's route crosses point 1 -> point 24 before reaching its home.
    const to = player === PLAYER_B && rawTo < 0
      ? rawTo + BOARD_POINTS
      : rawTo;
    if (to < 0 || to >= BOARD_POINTS || state.points[to] * sign < 0) continue;

    const move = { player, from, to, die, bearOff: false };
    if (rules.forbidFullBlockade &&
        createsFullBlockade(applyMoveUnchecked(state, move), player, rules)) {
      continue;
    }
    moves.push(move);
  }

  return moves;
}

function createsFullBlockade(state, blockOwner, rules) {
  if (!rules.forbidFullBlockade) return false;

  const opponent = otherPlayer(blockOwner);
  const ownerSign = blockOwner === PLAYER_A ? 1 : -1;
  const opponentSign = -ownerSign;
  const pointAtOpponentPath = pathIndex => {
    if (opponent === PLAYER_A) return BOARD_POINTS - 1 - pathIndex;
    // B starts at point 12, crosses 1 -> 24, and finishes at point 13.
    return pathIndex <= 11 ? 11 - pathIndex : 35 - pathIndex;
  };

  // Opponent path is linear from its head to its home. A block is six
  // consecutive points on that path; it is forbidden only when all 15
  // opposing checkers are still behind that block.
  for (let start = 0; start <= BOARD_POINTS - 6; start += 1) {
    let completeBlock = true;
    for (let offset = 0; offset < 6; offset += 1) {
      const point = pointAtOpponentPath(start + offset);
      if (state.points[point] * ownerSign <= 0) {
        completeBlock = false;
        break;
      }
    }
    if (!completeBlock) continue;

    let opposingCheckersBehind = 0;
    for (let pathIndex = 0; pathIndex < start; pathIndex += 1) {
      const point = pointAtOpponentPath(pathIndex);
      opposingCheckersBehind += Math.max(0, state.points[point] * opponentSign);
    }
    if (opposingCheckersBehind === CHECKERS_PER_PLAYER) return true;
  }

  return false;
}

function applyMoveUnchecked(state, move) {
  const next = cloneState(state);
  const sign = move.player === PLAYER_A ? 1 : -1;
  next.points[move.from] -= sign;
  if (move.bearOff) {
    next.borneOff[move.player] += 1;
  } else {
    next.points[move.to] += sign;
  }

  if (move.from === headPoint(move.player)) {
    next.turn.headMovesApplied += 1;
  }
  next.turn.movesApplied.push({ ...move });
  const dieIndex = next.turn.remainingDice.indexOf(move.die);
  if (dieIndex >= 0) next.turn.remainingDice.splice(dieIndex, 1);
  next.turn.phase = "moving";
  if (next.borneOff[move.player] === CHECKERS_PER_PLAYER) {
    next.winner = move.player;
    next.turn.phase = "finished";
  }
  return next;
}

function normalizeDice(dice) {
  if (!Array.isArray(dice) || dice.length !== 2 ||
      dice.some(d => !Number.isInteger(d) || d < 1 || d > 6)) {
    throw new TypeError("dice must be an array of two integers from 1 to 6");
  }
  return dice[0] === dice[1]
    ? [dice[0], dice[0], dice[0], dice[0]]
    : [...dice];
}

function moveKey(move) {
  return [move.player, move.from, move.to, move.die, move.bearOff].join(":");
}

function getLegalTurnSequences(state, dice, rules) {
  assertRules(rules);
  if (state.turn.phase === "finished") return [];
  const availableDice = state.turn.phase === "moving"
    ? [...state.turn.remainingDice]
    : normalizeDice(dice);
  const startingState = state.turn.phase === "awaiting_roll"
    ? cloneState(state)
    : state;
  if (startingState.turn.phase === "awaiting_roll") {
    startingState.turn.dice = [...dice];
    startingState.turn.headMovesLimit = currentHeadLimit(startingState, rules);
  }

  const results = [];
  const seen = new Set();

  function walk(position, remaining, sequence) {
    if (position.winner) {
      const key = sequence.map(moveKey).join("|");
      if (!seen.has(key)) {
        seen.add(key);
        results.push(sequence);
      }
      return;
    }

    let foundMove = false;
    for (let i = 0; i < remaining.length; i += 1) {
      const die = remaining[i];
      const candidates = generateMoves(position, die, rules);
      for (const move of candidates) {
        foundMove = true;
        const next = applyMoveUnchecked(position, move);
        const nextRemaining = [...remaining];
        nextRemaining.splice(i, 1);
        walk(next, nextRemaining, [...sequence, move]);
      }
    }

    if (!foundMove) {
      const key = sequence.map(moveKey).join("|");
      if (!seen.has(key)) {
        seen.add(key);
        results.push(sequence);
      }
    }
  }

  walk(startingState, availableDice, []);

  const maxMoves = Math.max(0, ...results.map(sequence => sequence.length));
  let filtered = results.filter(sequence => sequence.length === maxMoves);

  if (availableDice.length === 2 && availableDice[0] !== availableDice[1] &&
      maxMoves === 1) {
    const canUse = availableDice.map(die => generateMoves(state, die, rules).length > 0);
    if (canUse[0] && canUse[1]) {
      const higher = Math.max(...availableDice);
      filtered = filtered.filter(sequence => sequence[0]?.die === higher);
    }
  }

  return filtered;
}

function getLegalMoves(state, dice, rules) {
  const sequences = getLegalTurnSequences(state, dice, rules);
  const unique = new Map();
  for (const sequence of sequences) {
    if (sequence.length > 0) unique.set(moveKey(sequence[0]), sequence[0]);
  }
  return [...unique.values()];
}

function startTurn(state, dice, rules) {
  assertRules(rules);
  if (state.turn.phase !== "awaiting_roll") {
    throw new Error("A roll can only start while awaiting_roll");
  }
  const next = cloneState(state);
  next.turn.dice = [...dice];
  next.turn.remainingDice = normalizeDice(dice);
  next.turn.headMovesApplied = 0;
  next.turn.headMovesLimit = currentHeadLimit(
    { ...next, turn: { ...next.turn, dice: [...dice] } }, rules
  );
  next.turn.movesApplied = [];
  next.turn.phase = "moving";
  return next;
}

function applyMove(state, move, rules) {
  assertRules(rules);
  if (state.turn.phase !== "moving") throw new Error("The game is not in moving phase");
  const legal = getLegalMoves(state, state.turn.remainingDice, rules);
  const candidate = legal.find(item => moveKey(item) === moveKey(move));
  if (!candidate) throw new Error("Illegal move");
  return applyMoveUnchecked(state, candidate);
}

function finishTurn(state, rules) {
  assertRules(rules);
  if (state.turn.phase !== "moving") throw new Error("No active turn to finish");
  if (state.winner) return state;
  const sequences = getLegalTurnSequences(state, state.turn.remainingDice, rules);
  const hasMoves = sequences.some(sequence => sequence.length > 0);
  if (state.turn.remainingDice.length > 0 && hasMoves) {
    throw new Error("All mandatory legal dice must be played before finishing");
  }

  const next = cloneState(state);
  next.turn.player = otherPlayer(state.turn.player);
  next.turn.phase = "awaiting_roll";
  next.turn.dice = [];
  next.turn.remainingDice = [];
  next.turn.movesApplied = [];
  next.turn.headMovesApplied = 0;
  next.turn.headMovesLimit = rules.headMoveLimit;

  if (next.opening.secondPlayer === state.turn.player) {
    next.opening.secondPlayerFirstTurnPending = false;
  }
  return next;
}

function getWinner(state) {
  if (state.borneOff.A === CHECKERS_PER_PLAYER) return PLAYER_A;
  if (state.borneOff.B === CHECKERS_PER_PLAYER) return PLAYER_B;
  return null;
}

module.exports = {
  BOARD_POINTS,
  CHECKERS_PER_PLAYER,
  createInitialState,
  validateState,
  startTurn,
  getLegalTurnSequences,
  getLegalMoves,
  applyMove,
  finishTurn,
  getWinner,
  allCheckersInHome
};
