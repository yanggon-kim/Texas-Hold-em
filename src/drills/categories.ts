import { HandCategory, CATEGORY_NAME } from '../engine/handEvaluator';

/** 약한 것 → 강한 것 순서의 족보 목록. */
export const ALL_CATEGORIES: HandCategory[] = [
  HandCategory.HighCard,
  HandCategory.OnePair,
  HandCategory.TwoPair,
  HandCategory.ThreeOfAKind,
  HandCategory.Straight,
  HandCategory.Flush,
  HandCategory.FullHouse,
  HandCategory.FourOfAKind,
  HandCategory.StraightFlush,
  HandCategory.RoyalFlush,
];

/** 모든 족보의 표시 이름, 약한 것 → 강한 것 순서. */
export const CATEGORY_NAMES: string[] = ALL_CATEGORIES.map((c) => CATEGORY_NAME[c]);

/** 족보별 한 줄 설명. 코치 해설에 사용합니다. */
export const CATEGORY_HINT: Record<HandCategory, string> = {
  [HandCategory.HighCard]: '페어 이상이 없어 가장 높은 카드로 순위를 정하는 핸드',
  [HandCategory.OnePair]: '같은 랭크의 카드 2장',
  [HandCategory.TwoPair]: '서로 다른 페어 2개',
  [HandCategory.ThreeOfAKind]: '같은 랭크의 카드 3장',
  [HandCategory.Straight]: '무늬가 섞인 연속된 숫자 5장',
  [HandCategory.Flush]: '연속되지 않은, 같은 무늬 5장',
  [HandCategory.FullHouse]: '트리플과 원 페어의 조합',
  [HandCategory.FourOfAKind]: '같은 랭크의 카드 4장',
  [HandCategory.StraightFlush]: '같은 무늬의 연속된 숫자 5장',
  [HandCategory.RoyalFlush]: '같은 무늬의 A-K-Q-J-10 — 가능한 가장 강한 핸드',
};
