// A compact No-Limit Texas Hold'em hand engine for single-table play vs. bots.
//
// Simplifications suitable for a learning trainer:
//  - One main pot (no side pots). All-ins are allowed; at showdown the best
//    non-folded hand takes the whole pot (split on ties).
// Everything else (blinds, streets, betting, min-raises, showdown) follows the
// real rules and reuses the tested hand evaluator.

import { type Card } from './card';
import { shuffledDeck } from './deck';
import { evaluateHand, compareScores, type HandResult } from './handEvaluator';

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'complete';

export interface Player {
  id: number;
  name: string;
  isHuman: boolean;
  chips: number;
  hole: Card[];
  folded: boolean;
  allIn: boolean;
  committed: number; // chips put in this street
  totalCommitted: number; // chips put in this hand
  hasActed: boolean; // acted since the last bet/raise this street
  lastAction?: string; // for display
}

export interface ShowdownEntry {
  playerId: number;
  result: HandResult | null; // null if folded
}

export interface HandOutcome {
  winners: number[]; // player ids
  amountEach: number;
  showdown: ShowdownEntry[]; // non-folded hands revealed (empty if won by folds)
  summary: string;
}

export interface GameState {
  players: Player[];
  buttonIndex: number;
  street: Street;
  board: Card[];
  deck: Card[];
  pot: number;
  currentBet: number; // highest `committed` this street
  minRaise: number; // minimum raise increment
  bigBlind: number;
  toAct: number; // index of the player to act, or -1 if the hand is over
  log: string[];
  outcome?: HandOutcome;
}

export type ActionType = 'fold' | 'check' | 'call' | 'raise' | 'allin';
export interface Action {
  type: ActionType;
  /** For 'raise': the total this player will have committed this street. */
  amount?: number;
}

export interface LegalActions {
  canFold: boolean;
  canCheck: boolean;
  callAmount: number; // chips needed to call (0 if can check)
  canRaise: boolean;
  minRaiseTo: number; // smallest legal raise target (total committed)
  maxRaiseTo: number; // all-in target (total committed)
}

const BOT_NAMES = ['Aki', 'Bo', 'Cy', 'Dee', 'Eun'];

/** Build players: one human plus `botCount` bots, each with `startingChips`. */
export function makePlayers(botCount: number, startingChips: number): Player[] {
  const players: Player[] = [
    blankPlayer(0, 'You', true, startingChips),
  ];
  for (let i = 0; i < botCount; i++) {
    players.push(blankPlayer(i + 1, BOT_NAMES[i] ?? `Bot ${i + 1}`, false, startingChips));
  }
  return players;
}

function blankPlayer(id: number, name: string, isHuman: boolean, chips: number): Player {
  return {
    id,
    name,
    isHuman,
    chips,
    hole: [],
    folded: false,
    allIn: false,
    committed: 0,
    totalCommitted: 0,
    hasActed: false,
  };
}

const activeIndexes = (s: GameState): number[] =>
  s.players.map((_, i) => i).filter((i) => !s.players[i].folded);

const nextSeat = (s: GameState, from: number): number => (from + 1) % s.players.length;

/** Start a new hand: reset players, deal hole cards, post blinds. */
export function startHand(
  players: Player[],
  buttonIndex: number,
  bigBlind: number,
  rng: () => number = Math.random,
): GameState {
  const deck = shuffledDeck(rng);
  const fresh = players.map((p) => ({
    ...p,
    hole: [] as Card[],
    folded: p.chips <= 0, // players with no chips sit out
    allIn: false,
    committed: 0,
    totalCommitted: 0,
    hasActed: false,
    lastAction: undefined,
  }));

  const state: GameState = {
    players: fresh,
    buttonIndex,
    street: 'preflop',
    board: [],
    deck,
    pot: 0,
    currentBet: 0,
    minRaise: bigBlind,
    bigBlind,
    toAct: -1,
    log: [],
  };

  // Deal two hole cards to each seated player.
  for (let r = 0; r < 2; r++) {
    for (const p of state.players) {
      if (!p.folded) p.hole.push(state.deck.shift()!);
    }
  }

  // Post blinds (heads-up uses button = small blind, but we keep it simple:
  // small blind is left of button, big blind next).
  const sbIndex = nextSeat(state, buttonIndex);
  const bbIndex = nextSeat(state, sbIndex);
  postBlind(state, sbIndex, Math.floor(bigBlind / 2), 'small blind');
  postBlind(state, bbIndex, bigBlind, 'big blind');
  state.currentBet = bigBlind;
  state.minRaise = bigBlind;

  // First to act pre-flop is left of the big blind.
  state.toAct = activeCanAct(state, nextSeat(state, bbIndex));
  return state;
}

function postBlind(state: GameState, index: number, amount: number, label: string) {
  const p = state.players[index];
  const pay = Math.min(amount, p.chips);
  p.chips -= pay;
  p.committed += pay;
  p.totalCommitted += pay;
  state.pot += pay;
  if (p.chips === 0) p.allIn = true;
  state.log.push(`${p.name} posts ${label} ${pay}`);
}

/** From `start`, find the next seat that can act (not folded, not all-in). */
function activeCanAct(state: GameState, start: number): number {
  for (let k = 0; k < state.players.length; k++) {
    const i = (start + k) % state.players.length;
    const p = state.players[i];
    if (!p.folded && !p.allIn) return i;
  }
  return -1;
}

/** Whether the player at `toAct` still needs to act. */
function needsAction(state: GameState, i: number): boolean {
  const p = state.players[i];
  if (p.folded || p.allIn) return false;
  return !p.hasActed || p.committed < state.currentBet;
}

/** Legal actions for the player to act. */
export function legalActions(state: GameState): LegalActions {
  const p = state.players[state.toAct];
  const toCall = Math.max(0, state.currentBet - p.committed);
  const callAmount = Math.min(toCall, p.chips);
  const maxRaiseTo = p.committed + p.chips; // all-in total
  const minRaiseTo = state.currentBet + state.minRaise;
  return {
    canFold: true,
    canCheck: toCall === 0,
    callAmount,
    canRaise: p.chips > toCall, // has chips beyond a call
    minRaiseTo: Math.min(minRaiseTo, maxRaiseTo),
    maxRaiseTo,
  };
}

/** Apply an action for the current player and advance the hand. Returns new state. */
export function applyAction(prev: GameState, action: Action): GameState {
  const state = cloneState(prev);
  const i = state.toAct;
  if (i < 0) return state;
  const p = state.players[i];

  switch (action.type) {
    case 'fold':
      p.folded = true;
      p.hasActed = true;
      p.lastAction = 'Fold';
      state.log.push(`${p.name} folds`);
      break;
    case 'check':
      p.hasActed = true;
      p.lastAction = 'Check';
      state.log.push(`${p.name} checks`);
      break;
    case 'call': {
      const pay = Math.min(state.currentBet - p.committed, p.chips);
      commit(state, p, pay);
      p.hasActed = true;
      p.lastAction = pay > 0 ? `Call ${pay}` : 'Check';
      state.log.push(`${p.name} calls ${pay}`);
      break;
    }
    case 'raise':
    case 'allin': {
      const target =
        action.type === 'allin'
          ? p.committed + p.chips
          : Math.min(action.amount ?? 0, p.committed + p.chips);
      const pay = target - p.committed;
      const raiseSize = target - state.currentBet;
      commit(state, p, pay);
      if (raiseSize > 0) {
        state.minRaise = Math.max(state.minRaise, raiseSize);
        state.currentBet = target;
        // A raise reopens the action for everyone else.
        for (const other of state.players) {
          if (other !== p && !other.folded && !other.allIn) other.hasActed = false;
        }
      }
      p.hasActed = true;
      p.lastAction = p.allIn ? `All-in ${target}` : `Raise to ${target}`;
      state.log.push(`${p.name} ${p.lastAction.toLowerCase()}`);
      break;
    }
  }

  // Only one player left? They win immediately.
  if (activeIndexes(state).length === 1) {
    return finishHand(state);
  }

  // Find the next player who needs to act this street.
  let next = -1;
  for (let k = 1; k <= state.players.length; k++) {
    const idx = (i + k) % state.players.length;
    if (needsAction(state, idx)) {
      next = idx;
      break;
    }
  }

  if (next === -1) {
    return advanceStreet(state);
  }
  state.toAct = next;
  return state;
}

function commit(state: GameState, p: Player, pay: number) {
  const amount = Math.max(0, Math.min(pay, p.chips));
  p.chips -= amount;
  p.committed += amount;
  p.totalCommitted += amount;
  state.pot += amount;
  if (p.chips === 0) p.allIn = true;
}

/** Move to the next street (dealing board cards) or to showdown. */
function advanceStreet(state: GameState): GameState {
  // Reset street betting.
  for (const p of state.players) {
    p.committed = 0;
    p.hasActed = false;
  }
  state.currentBet = 0;
  state.minRaise = state.bigBlind;

  const deal = (n: number) => {
    state.deck.shift(); // burn
    for (let k = 0; k < n; k++) state.board.push(state.deck.shift()!);
  };

  if (state.street === 'preflop') {
    state.street = 'flop';
    deal(3);
  } else if (state.street === 'flop') {
    state.street = 'turn';
    deal(1);
  } else if (state.street === 'turn') {
    state.street = 'river';
    deal(1);
  } else {
    return finishHand(state);
  }
  state.log.push(`--- ${state.street} ---`);

  // Who acts first post-flop: first active player left of the button.
  const first = activeCanAct(state, nextSeat(state, state.buttonIndex));

  // If fewer than two players can act, run out the board to showdown.
  const canActCount = state.players.filter((p) => !p.folded && !p.allIn).length;
  if (first === -1 || canActCount < 2) {
    return advanceStreet(state);
  }
  state.toAct = first;
  return state;
}

/** Settle the hand: award the pot and reveal hands at showdown. */
function finishHand(state: GameState): GameState {
  state.toAct = -1;
  const contenders = activeIndexes(state);

  let winners: number[];
  let showdown: ShowdownEntry[] = [];

  if (contenders.length === 1) {
    winners = [state.players[contenders[0]].id];
  } else {
    // Showdown: evaluate each remaining hand.
    const scored = contenders.map((i) => ({
      i,
      result: evaluateHand([...state.players[i].hole, ...state.board]),
    }));
    showdown = scored.map((s) => ({ playerId: state.players[s.i].id, result: s.result }));
    let best = scored[0];
    for (const s of scored) if (compareScores(s.result.score, best.result.score) > 0) best = s;
    winners = scored
      .filter((s) => compareScores(s.result.score, best.result.score) === 0)
      .map((s) => state.players[s.i].id);
  }

  const amountEach = Math.floor(state.pot / winners.length);
  const remainder = state.pot - amountEach * winners.length;
  for (const p of state.players) {
    if (winners.includes(p.id)) p.chips += amountEach;
  }
  // Odd chip(s) from a split go to the first winner.
  if (remainder > 0) {
    const first = state.players.find((p) => p.id === winners[0]);
    if (first) first.chips += remainder;
  }

  const winnerNames = winners.map((id) => state.players.find((p) => p.id === id)!.name);
  const summary =
    showdown.length > 0
      ? `${winnerNames.join(' & ')} win ${amountEach} with ${
          showdown.find((s) => s.playerId === winners[0])?.result?.name ?? 'the best hand'
        }`
      : `${winnerNames.join(' & ')} win ${state.pot} (everyone else folded)`;

  state.outcome = { winners, amountEach, showdown, summary };
  state.street = 'complete';
  state.log.push(summary);
  return state;
}

function cloneState(s: GameState): GameState {
  return {
    ...s,
    players: s.players.map((p) => ({ ...p, hole: [...p.hole] })),
    board: [...s.board],
    deck: [...s.deck],
    log: [...s.log],
  };
}
