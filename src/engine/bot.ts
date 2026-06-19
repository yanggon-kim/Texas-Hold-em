// Simple, readable bot opponents and a coaching helper for the human.
// Decisions reuse the starting-hand chart pre-flop and the hand evaluator
// post-flop, plus a little randomness so play isn't perfectly predictable.

import { type GameState, type Action, legalActions } from './game';
import { classifyStartingHand, type Tier } from './startingHands';
import { evaluateHand, HandCategory } from './handEvaluator';

const TIER_SCORE: Record<Tier, number> = { premium: 3, strong: 2, playable: 1, trash: 0 };

/** A rough 0..1 strength estimate for the player to act. */
function handStrength(state: GameState): number {
  const p = state.players[state.toAct];
  if (state.board.length === 0) {
    const tier = classifyStartingHand(p.hole[0], p.hole[1]).tier;
    return TIER_SCORE[tier] / 3; // 0, .33, .66, 1
  }
  const cat = evaluateHand([...p.hole, ...state.board]).category;
  // Map made-hand category to a strength bucket.
  if (cat >= HandCategory.Straight) return 1;
  if (cat === HandCategory.ThreeOfAKind || cat === HandCategory.TwoPair) return 0.8;
  if (cat === HandCategory.OnePair) return 0.55;
  return 0.25; // high card
}

/** Decide a bot's action. `rng` lets tests/UI stay deterministic if needed. */
export function decideBotAction(state: GameState, rng: () => number = Math.random): Action {
  const legal = legalActions(state);
  const strength = handStrength(state);
  const noise = (rng() - 0.5) * 0.2;
  const s = strength + noise;

  // Facing a bet.
  if (legal.callAmount > 0) {
    const potOdds = legal.callAmount / (state.pot + legal.callAmount);
    if (s < 0.3 && potOdds > 0.15) return { type: 'fold' };
    // Strong hands raise sometimes.
    if (s > 0.8 && legal.canRaise && rng() < 0.5) {
      return { type: 'raise', amount: botRaiseTarget(state, legal.minRaiseTo, legal.maxRaiseTo) };
    }
    return { type: 'call' };
  }

  // No bet to face: check or bet.
  if (s > 0.6 && legal.canRaise && rng() < 0.6) {
    return { type: 'raise', amount: botRaiseTarget(state, legal.minRaiseTo, legal.maxRaiseTo) };
  }
  return { type: 'check' };
}

function botRaiseTarget(state: GameState, minRaiseTo: number, maxRaiseTo: number): number {
  // Bet roughly half to two-thirds of the pot, clamped to legal bounds.
  const target = state.currentBet + Math.max(state.bigBlind, Math.round(state.pot * 0.6));
  return Math.max(minRaiseTo, Math.min(target, maxRaiseTo));
}

export interface CoachTip {
  suggestion: string; // e.g. "Call", "Fold", "Raise"
  reason: string;
}

/** A coaching suggestion for the human's current decision. */
export function coachTip(state: GameState): CoachTip {
  const legal = legalActions(state);
  const strength = handStrength(state);
  const p = state.players[state.toAct];

  if (state.board.length === 0) {
    const hand = classifyStartingHand(p.hole[0], p.hole[1]);
    if (hand.tier === 'trash' && legal.callAmount > 0) {
      return { suggestion: 'Fold', reason: `${hand.code} is a trash hand — fold to a bet.` };
    }
    if (hand.tier === 'premium' && legal.canRaise) {
      return { suggestion: 'Raise', reason: `${hand.code} is premium — raise for value.` };
    }
    if (legal.canCheck) return { suggestion: 'Check', reason: `${hand.code}: see a cheap flop.` };
    return { suggestion: 'Call', reason: `${hand.code} is playable here.` };
  }

  const made = evaluateHand([...p.hole, ...state.board]);
  if (legal.callAmount > 0) {
    const potOdds = Math.round((legal.callAmount / (state.pot + legal.callAmount)) * 100);
    if (strength < 0.3) {
      return { suggestion: 'Fold', reason: `Only ${made.name}; paying ${potOdds}% to call is too much.` };
    }
    if (strength > 0.8 && legal.canRaise) {
      return { suggestion: 'Raise', reason: `${made.name} is strong — raise for value.` };
    }
    return { suggestion: 'Call', reason: `${made.name} is worth a ${potOdds}% call.` };
  }
  if (strength > 0.6 && legal.canRaise) {
    return { suggestion: 'Bet', reason: `${made.name} is strong — bet for value.` };
  }
  return { suggestion: 'Check', reason: `${made.name}: keep the pot small.` };
}
