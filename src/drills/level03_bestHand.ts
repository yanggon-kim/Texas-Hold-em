import { CATEGORY_NAME, evaluateHand } from '../engine/handEvaluator';
import { make7OfCategory } from '../engine/handFactory';
import { handLabel } from '../engine/handEvaluator';
import { type Drill, type Rng, shuffledOptions, sampleDistinct } from './types';
import { ALL_CATEGORIES, CATEGORY_HINT } from './categories';

/**
 * Level 3 — make the best 5-card hand from 2 hole cards + 5 community cards.
 */
export function generateBestHandDrill(rng: Rng): Drill {
  const category = ALL_CATEGORIES[Math.floor(rng() * ALL_CATEGORIES.length)];
  const { hole, board, all } = make7OfCategory(category, rng);
  const best = evaluateHand(all);
  const correct = CATEGORY_NAME[best.category];

  const distractors = sampleDistinct(rng, ALL_CATEGORIES, 3, [best.category]).map(
    (c) => CATEGORY_NAME[c],
  );
  const { options, correctIndex } = shuffledOptions(rng, correct, distractors);

  return {
    prompt: 'Using your 2 hole cards and the 5 community cards, what is your best hand?',
    visual: { hole, board },
    options,
    correctIndex,
    explanation: `Your best five cards are ${handLabel(best.bestFive)} — a ${correct} (${CATEGORY_HINT[best.category]}). Remember: you pick the best 5 of the 7 available.`,
  };
}
