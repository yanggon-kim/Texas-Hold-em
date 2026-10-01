import { CATEGORY_NAME, evaluateHand, compareScores } from '../engine/handEvaluator';
import { makeHandOfCategory } from '../engine/handFactory';
import { type Drill, type Rng, shuffledOptions, sampleDistinct } from './types';
import { ALL_CATEGORIES, CATEGORY_HINT } from './categories';
import { josa } from '../engine/josa';

/** 레벨 2 — 포커 족보 10가지를 알아보고 비교합니다. */
export function generateRankingDrill(rng: Rng): Drill {
  const askCompare = rng() < 0.5;

  if (!askCompare) {
    // "이 핸드는 무엇인가?" — 무작위 족보의 카드 5장을 보여 줍니다.
    const category = ALL_CATEGORIES[Math.floor(rng() * ALL_CATEGORIES.length)];
    const cards = makeHandOfCategory(category, rng);
    const correct = CATEGORY_NAME[category];
    const distractors = sampleDistinct(rng, ALL_CATEGORIES, 3, [category]).map(
      (c) => CATEGORY_NAME[c],
    );
    const { options, correctIndex } = shuffledOptions(rng, correct, distractors);
    return {
      prompt: '이 핸드의 족보 이름은 무엇인가요?',
      visual: { cards },
      options,
      correctIndex,
      explanation: `이 핸드는 ${correct}입니다 — ${CATEGORY_HINT[category]}.`,
    };
  }

  // "어느 핸드가 더 강한가?" — 서로 다른 족보 2개를 나란히 보여 줍니다.
  const [catA, catB] = sampleDistinct(rng, ALL_CATEGORIES, 2);
  const handA = makeHandOfCategory(catA, rng);
  const handB = makeHandOfCategory(catB, rng);
  const resA = evaluateHand(handA);
  const resB = evaluateHand(handB);
  const aWins = compareScores(resA.score, resB.score) > 0;
  const options = ['핸드 A', '핸드 B'];
  const correctIndex = aWins ? 0 : 1;
  const winnerCat = aWins ? catA : catB;
  const loserCat = aWins ? catB : catA;
  return {
    prompt: '어느 핸드가 더 강한가요?',
    visual: {
      hands: [
        { label: '핸드 A', cards: handA },
        { label: '핸드 B', cards: handB },
      ],
    },
    options,
    correctIndex,
    explanation: `족보 순위에서 더 높기 때문에 ${josa(CATEGORY_NAME[winnerCat], '이/가')} ${josa(CATEGORY_NAME[loserCat], '을/를')} 이깁니다.`,
  };
}
