import { type Card, type Rank, RANK_VALUE, cardShortName } from './card';

/** 족보 종류. 가장 약한 것(0) → 가장 강한 것(9) 순서입니다. */
export enum HandCategory {
  HighCard = 0,
  OnePair = 1,
  TwoPair = 2,
  ThreeOfAKind = 3,
  Straight = 4,
  Flush = 5,
  FullHouse = 6,
  FourOfAKind = 7,
  StraightFlush = 8,
  RoyalFlush = 9,
}

export const CATEGORY_NAME: Record<HandCategory, string> = {
  [HandCategory.HighCard]: '하이 카드',
  [HandCategory.OnePair]: '원 페어',
  [HandCategory.TwoPair]: '투 페어',
  [HandCategory.ThreeOfAKind]: '트리플',
  [HandCategory.Straight]: '스트레이트',
  [HandCategory.Flush]: '플러시',
  [HandCategory.FullHouse]: '풀하우스',
  [HandCategory.FourOfAKind]: '포카드',
  [HandCategory.StraightFlush]: '스트레이트 플러시',
  [HandCategory.RoyalFlush]: '로열 플러시',
};

export interface HandResult {
  /** 가장 좋은 핸드의 족보 종류. */
  category: HandCategory;
  /** 사람이 읽는 족보 이름, 예: "풀하우스". */
  name: string;
  /**
   * 동점 판정용 벡터. 두 HandResult는 `score` 배열을 사전식으로 비교합니다
   * (첫 번째 원소가 족보 종류입니다).
   */
  score: number[];
  /** 가장 좋은 핸드를 이루는 정확한 5장 (표시·강조용). */
  bestFive: Card[];
}

/** 주어진 배열에서 k개를 고르는 모든 조합. */
function combinations<T>(items: T[], k: number): T[][] {
  const result: T[][] = [];
  const combo: T[] = [];
  const recurse = (start: number) => {
    if (combo.length === k) {
      result.push(combo.slice());
      return;
    }
    for (let i = start; i < items.length; i++) {
      combo.push(items[i]);
      recurse(i + 1);
      combo.pop();
    }
  };
  recurse(0);
  return result;
}

/**
 * 서로 다른 랭크 값들에서 스트레이트를 찾습니다.
 * 스트레이트의 가장 높은 카드 값을 돌려주며, 없으면 null입니다.
 * 에이스가 낮게 쓰이고 가장 높은 카드가 5인 휠(A-2-3-4-5)도 처리합니다.
 */
function straightHigh(distinctValues: number[]): number | null {
  const values = [...new Set(distinctValues)].sort((a, b) => b - a);
  // 에이스(14)를 1로도 취급해 휠 A-2-3-4-5를 찾습니다 (가장 높은 카드는 5).
  if (values.includes(14)) values.push(1);
  let run = 1;
  for (let i = 1; i < values.length; i++) {
    if (values[i] === values[i - 1] - 1) {
      run++;
      // 값이 내림차순이므로 5개 연속의 시작이 가장 높은 카드입니다.
      if (run === 5) return values[i - 4];
    } else {
      run = 1;
    }
  }
  return null;
}

/** 정확히 5장을 비교 가능한 HandResult로 평가합니다. */
function evaluate5(cards: Card[]): HandResult {
  if (cards.length !== 5) {
    throw new Error(`evaluate5는 5장이 필요하지만 ${cards.length}장을 받았습니다`);
  }

  const values = cards.map((c) => RANK_VALUE[c.rank]).sort((a, b) => b - a);
  const isFlush = cards.every((c) => c.suit === cards[0].suit);
  const high = straightHigh(values);
  const isStraight = high !== null;

  // 각 랭크 값이 몇 번 나오는지 셉니다.
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);

  // (개수 내림차순, 값 내림차순)으로 정렬한 그룹 — 표준 동점 판정 순서입니다.
  const groups = [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return b[0] - a[0];
  });
  const countPattern = groups.map((g) => g[1]).join(''); // 예: "32" = 풀하우스
  const groupValues = groups.map((g) => g[0]);

  const make = (category: HandCategory, scoreTail: number[]): HandResult => ({
    category,
    name: CATEGORY_NAME[category],
    score: [category, ...scoreTail],
    bestFive: cards.slice(),
  });

  if (isStraight && isFlush) {
    const cat = high === 14 ? HandCategory.RoyalFlush : HandCategory.StraightFlush;
    return make(cat, [high!]);
  }
  if (countPattern === '41') return make(HandCategory.FourOfAKind, groupValues);
  if (countPattern === '32') return make(HandCategory.FullHouse, groupValues);
  if (isFlush) return make(HandCategory.Flush, values);
  if (isStraight) return make(HandCategory.Straight, [high!]);
  if (countPattern === '311') return make(HandCategory.ThreeOfAKind, groupValues);
  if (countPattern === '221') return make(HandCategory.TwoPair, groupValues);
  if (countPattern === '2111') return make(HandCategory.OnePair, groupValues);
  return make(HandCategory.HighCard, values);
}

/** 두 점수 벡터를 사전식으로 비교합니다. a가 이기면 0보다 큽니다. */
export function compareScores(a: number[], b: number[]): number {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/**
 * 5·6·7장(예: 홀 카드 2장 + 보드 5장)에서 가장 좋은 5장 핸드를 평가합니다.
 */
export function evaluateHand(cards: Card[]): HandResult {
  if (cards.length < 5 || cards.length > 7) {
    throw new Error(`evaluateHand는 5~7장이 필요하지만 ${cards.length}장을 받았습니다`);
  }
  if (cards.length === 5) return evaluate5(cards);

  let best: HandResult | null = null;
  for (const combo of combinations(cards, 5)) {
    const result = evaluate5(combo);
    if (best === null || compareScores(result.score, best.score) > 0) {
      best = result;
    }
  }
  return best!;
}

/** 편의 함수: "A♠", "10♥" 같은 표기로 카드를 만듭니다. */
export function parseCard(label: string): Card {
  const suit = label.slice(-1) as Card['suit'];
  const rank = label.slice(0, -1) as Rank;
  if (!(rank in RANK_VALUE)) throw new Error(`"${label}"의 랭크가 잘못되었습니다`);
  return { rank, suit };
}

/** 카드 목록을 한국어로 보기 좋게 출력합니다: "♠에이스 ♠킹 ♠퀸 ♠잭 ♠10". */
export function handLabel(cards: Card[]): string {
  return cards.map(cardShortName).join(' ');
}
