// Simple, readable bot opponents and a coaching helper for the human.
// Decisions reuse the starting-hand chart pre-flop and the hand evaluator
// post-flop, plus a little randomness so play isn't perfectly predictable.

import { type GameState, type Action, legalActions } from './game';
import { classifyStartingHand, type Tier } from './startingHands';
import { evaluateHand, HandCategory } from './handEvaluator';

const TIER_SCORE: Record<Tier, number> = { premium: 3, strong: 2, playable: 1, trash: 0 };

export type Difficulty = 'easy' | 'normal' | 'hard';

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard',
};

interface BotProfile {
  noise: number; // randomness added to the strength estimate
  foldThreshold: number; // fold to a bet below this strength (when the price is meaningful)
  raiseStrength: number; // raise/bet at or above this strength
  raiseFreq: number; // how often to raise when strong enough
  bluffFreq: number; // chance to bluff/bet a weak hand with no bet to face
}

const PROFILES: Record<Difficulty, BotProfile> = {
  // Loose-passive "calling station": calls too much, rarely raises — easy to beat.
  easy: { noise: 0.35, foldThreshold: 0.12, raiseStrength: 0.85, raiseFreq: 0.15, bluffFreq: 0 },
  // Balanced.
  normal: { noise: 0.2, foldThreshold: 0.3, raiseStrength: 0.65, raiseFreq: 0.5, bluffFreq: 0.05 },
  // Tight-aggressive: folds weak hands, value-raises often, bluffs sometimes.
  hard: { noise: 0.1, foldThreshold: 0.42, raiseStrength: 0.55, raiseFreq: 0.75, bluffFreq: 0.14 },
};

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

/** Decide a bot's action at the given difficulty. */
export function decideBotAction(
  state: GameState,
  rng: () => number = Math.random,
  difficulty: Difficulty = 'normal',
): Action {
  const profile = PROFILES[difficulty];
  const legal = legalActions(state);
  const strength = handStrength(state);
  const s = strength + (rng() - 0.5) * profile.noise;
  const raiseTo = () => botRaiseTarget(state, legal.minRaiseTo, legal.maxRaiseTo);

  // Facing a bet.
  if (legal.callAmount > 0) {
    const potOdds = legal.callAmount / (state.pot + legal.callAmount);
    if (s < profile.foldThreshold && potOdds > 0.12) return { type: 'fold' };
    if (s >= profile.raiseStrength && legal.canRaise && rng() < profile.raiseFreq) {
      return { type: 'raise', amount: raiseTo() };
    }
    return { type: 'call' };
  }

  // No bet to face: bet for value, occasionally bluff, otherwise check.
  if (s >= profile.raiseStrength && legal.canRaise && rng() < profile.raiseFreq) {
    return { type: 'raise', amount: raiseTo() };
  }
  if (s < 0.4 && legal.canRaise && rng() < profile.bluffFreq) {
    return { type: 'raise', amount: raiseTo() };
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
