import { shuffledDeck } from '../engine/deck';
import {
  type Position,
  classifyStartingHand,
  shouldPlay,
  TIER_LABEL,
} from '../engine/startingHands';
import { type Drill, type Rng, shuffledOptions } from './types';

/** Level 7 — pre-flop starting-hand selection by position. */
export function generateStartingHandDrill(rng: Rng): Drill {
  const deck = shuffledDeck(rng);
  const hole = [deck[0], deck[1]];
  const hand = classifyStartingHand(hole[0], hole[1]);
  const askTier = rng() < 0.5;

  if (askTier) {
    const correct = TIER_LABEL[hand.tier];
    const distractors = (['premium', 'strong', 'playable', 'trash'] as const)
      .filter((t) => t !== hand.tier)
      .map((t) => TIER_LABEL[t]);
    const { options, correctIndex } = shuffledOptions(rng, correct, distractors);
    return {
      prompt: 'How strong is this starting hand?',
      visual: { hole },
      options,
      correctIndex,
      explanation: `${hand.code} is a ${correct.toLowerCase()} starting hand. Stronger hands play from anywhere; weaker ones only from late position (or not at all).`,
    };
  }

  // Play-or-fold by position.
  const position: Position = rng() < 0.5 ? 'early' : 'late';
  const play = shouldPlay(hand.tier, position);
  const posLabel =
    position === 'early' ? 'early position (UTG)' : 'late position (the button)';
  const correct = play ? 'Play (raise)' : 'Fold';
  const options = ['Play (raise)', 'Fold'];
  const reason = play
    ? `${hand.code} is a ${hand.tier} hand — strong enough to open from ${posLabel}.`
    : hand.tier === 'trash'
      ? `${hand.code} is a trash hand — fold it from any position.`
      : `${hand.code} is only ${hand.tier}; play it from late position, but fold from ${posLabel}.`;
  return {
    prompt: `You're first to act with this hand from ${posLabel}. Play or fold?`,
    visual: { hole },
    options,
    correctIndex: options.indexOf(correct),
    explanation: reason,
  };
}
