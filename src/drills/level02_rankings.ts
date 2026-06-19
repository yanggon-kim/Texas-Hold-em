import { CATEGORY_NAME, evaluateHand, compareScores } from '../engine/handEvaluator';
import { makeHandOfCategory } from '../engine/handFactory';
import { type Drill, type Rng, shuffledOptions, sampleDistinct } from './types';
import { ALL_CATEGORIES, CATEGORY_HINT } from './categories';

/** Level 2 — recognise and compare the ten poker hand rankings. */
export function generateRankingDrill(rng: Rng): Drill {
  const askCompare = rng() < 0.5;

  if (!askCompare) {
    // "What hand is this?" — show 5 cards of a random category.
    const category = ALL_CATEGORIES[Math.floor(rng() * ALL_CATEGORIES.length)];
    const cards = makeHandOfCategory(category, rng);
    const correct = CATEGORY_NAME[category];
    const distractors = sampleDistinct(rng, ALL_CATEGORIES, 3, [category]).map(
      (c) => CATEGORY_NAME[c],
    );
    const { options, correctIndex } = shuffledOptions(rng, correct, distractors);
    return {
      prompt: 'What is the name of this hand?',
      visual: { cards },
      options,
      correctIndex,
      explanation: `This is a ${correct} — ${CATEGORY_HINT[category]}.`,
    };
  }

  // "Which hand is stronger?" — two different categories side by side.
  const [catA, catB] = sampleDistinct(rng, ALL_CATEGORIES, 2);
  const handA = makeHandOfCategory(catA, rng);
  const handB = makeHandOfCategory(catB, rng);
  const resA = evaluateHand(handA);
  const resB = evaluateHand(handB);
  const aWins = compareScores(resA.score, resB.score) > 0;
  const options = ['Hand A', 'Hand B'];
  const correctIndex = aWins ? 0 : 1;
  const winnerCat = aWins ? catA : catB;
  const loserCat = aWins ? catB : catA;
  return {
    prompt: 'Which hand is stronger?',
    visual: {
      hands: [
        { label: 'Hand A', cards: handA },
        { label: 'Hand B', cards: handB },
      ],
    },
    options,
    correctIndex,
    explanation: `${CATEGORY_NAME[winnerCat]} beats ${CATEGORY_NAME[loserCat]}, because it ranks higher in the hand order.`,
  };
}
