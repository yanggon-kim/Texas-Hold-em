import { shuffledDeck, draw } from '../engine/deck';
import { CATEGORY_NAME } from '../engine/handEvaluator';
import { boardNuts, flushPossible, isPaired } from '../engine/board';
import { type Drill, type Rng, shuffledOptions, sampleDistinct } from './types';
import { ALL_CATEGORIES, CATEGORY_HINT } from './categories';

/** 레벨 9 — 보드 읽기: 넛츠, 플러시 위협, 페어 보드. */
export function generateBoardDrill(rng: Rng): Drill {
  const board = draw(shuffledDeck(rng), 5).drawn;
  const variant = Math.floor(rng() * 3);

  // 1) 이 보드에서 누구든 가질 수 있는 가장 좋은 핸드는?
  if (variant === 0) {
    const nuts = boardNuts(board);
    const correct = CATEGORY_NAME[nuts.category];
    const distractors = sampleDistinct(rng, ALL_CATEGORIES, 3, [nuts.category]).map(
      (c) => CATEGORY_NAME[c],
    );
    const { options, correctIndex } = shuffledOptions(rng, correct, distractors);
    return {
      prompt: '이 보드에서 누구든 가질 수 있는 가장 좋은 핸드("넛츠")는 무엇인가요?',
      visual: { label: '커뮤니티 보드', board },
      options,
      correctIndex,
      explanation: `여기서 가능한 가장 강한 핸드는 ${correct}입니다 (${CATEGORY_HINT[nuts.category]}). 칩을 걸기 전에 무엇이 나를 이길 수 있는지 항상 따져 보세요.`,
    };
  }

  // 2) 이 보드로 누군가 플러시를 만들 수 있나?
  if (variant === 1) {
    const possible = flushPossible(board);
    const correct = possible ? '예' : '아니요';
    const options = ['예', '아니요'];
    return {
      prompt: '이 보드를 이용해 플러시를 만들 수 있는 플레이어가 있을까요?',
      visual: { label: '커뮤니티 보드', board },
      options,
      correctIndex: options.indexOf(correct),
      explanation: possible
        ? '예 — 보드에 같은 무늬가 3장 이상 있으므로, 그 무늬 2장을 가진 플레이어는 플러시입니다.'
        : '아니요 — 보드에 3장 이상 나온 무늬가 없으므로, 여기서는 플러시가 불가능합니다.',
    };
  }

  // 3) 페어 보드인가 (풀하우스·포카드가 가능해짐)?
  const paired = isPaired(board);
  const correct = paired ? '예' : '아니요';
  const options = ['예', '아니요'];
  return {
    prompt: '이 보드는 "페어 보드"인가요 (같은 랭크가 두 번 나옴)?',
    visual: { label: '커뮤니티 보드', board },
    options,
    correctIndex: options.indexOf(correct),
    explanation: paired
      ? '예 — 같은 랭크가 반복되면 풀하우스와 포카드가 가능해집니다. 조심하세요.'
      : '아니요 — 보드에 페어가 없으면 아직 아무도 풀하우스나 포카드를 가질 수 없습니다.',
  };
}
