import { CATEGORY_NAME, evaluateHand } from '../engine/handEvaluator';
import { make7OfCategory } from '../engine/handFactory';
import { handLabel } from '../engine/handEvaluator';
import { type Drill, type Rng, shuffledOptions, sampleDistinct } from './types';
import { ALL_CATEGORIES, CATEGORY_HINT } from './categories';

/**
 * 레벨 3 — 홀 카드 2장 + 커뮤니티 카드 5장으로 가장 좋은 5장 핸드를 만듭니다.
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
    prompt: '홀 카드 2장과 커뮤니티 카드 5장을 사용할 때, 나의 가장 좋은 핸드는 무엇인가요?',
    visual: { hole, board },
    options,
    correctIndex,
    explanation: `가장 좋은 5장은 ${handLabel(best.bestFive)}, 족보는 ${correct}입니다 (${CATEGORY_HINT[best.category]}). 기억하세요: 7장 중에서 가장 좋은 5장을 고릅니다.`,
  };
}
