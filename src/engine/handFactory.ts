// *원하는* 족보의 예시 핸드를 만들어, 연습 문제에서 실제 카드를 보여 줍니다.
// 모든 생성 결과는 실제 평가기로 검증하고, 빗나가면 다시 시도하므로
// 결과 족보는 항상 요청한 것과 정확히 같습니다.

import { type Card, type Suit, SUITS, cardId, rankForValue } from './card';
import { evaluateHand, HandCategory } from './handEvaluator';

type Rng = () => number;

const ri = (rng: Rng, lo: number, hi: number): number =>
  lo + Math.floor(rng() * (hi - lo + 1));

const pick = <T,>(rng: Rng, arr: readonly T[]): T => arr[ri(rng, 0, arr.length - 1)];

const card = (value: number, suit: Suit): Card => ({ rank: rankForValue(value), suit });

/** 2..14에서 뽑은 서로 다른 랭크 값 n개. */
function distinctValues(rng: Rng, n: number): number[] {
  const pool = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = ri(rng, 0, i);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

/** 연속된 카드가 플러시가 되지 않도록 배치한 무늬 (4가지 무늬를 돌아가며 사용). */
function mixedSuits(rng: Rng, n: number): Suit[] {
  const start = ri(rng, 0, 3);
  return Array.from({ length: n }, (_, i) => SUITS[(start + i) % 4]);
}

function build(category: HandCategory, rng: Rng): Card[] {
  switch (category) {
    case HandCategory.RoyalFlush: {
      const s = pick(rng, SUITS);
      return [14, 13, 12, 11, 10].map((v) => card(v, s));
    }
    case HandCategory.StraightFlush: {
      const s = pick(rng, SUITS);
      const high = ri(rng, 6, 13); // 14면 로열 플러시가 됩니다
      return [0, 1, 2, 3, 4].map((d) => card(high - d, s));
    }
    case HandCategory.FourOfAKind: {
      const [quad, kicker] = distinctValues(rng, 2);
      return [...SUITS.map((s) => card(quad, s)), card(kicker, pick(rng, SUITS))];
    }
    case HandCategory.FullHouse: {
      const [trip, pair] = distinctValues(rng, 2);
      const tripSuits = mixedSuits(rng, 3);
      const pairSuits = mixedSuits(rng, 2);
      return [
        ...tripSuits.map((s) => card(trip, s)),
        ...pairSuits.map((s) => card(pair, s)),
      ];
    }
    case HandCategory.Flush: {
      const s = pick(rng, SUITS);
      return distinctValues(rng, 5).map((v) => card(v, s)); // 검증 단계에서 스트레이트는 걸러집니다
    }
    case HandCategory.Straight: {
      const high = ri(rng, 6, 14); // 단순하게 하려고 휠은 피합니다
      const suits = mixedSuits(rng, 5);
      return [0, 1, 2, 3, 4].map((d) => card(high - d, suits[d]));
    }
    case HandCategory.ThreeOfAKind: {
      const [trip, k1, k2] = distinctValues(rng, 3);
      return [
        ...mixedSuits(rng, 3).map((s) => card(trip, s)),
        card(k1, pick(rng, SUITS)),
        card(k2, pick(rng, SUITS)),
      ];
    }
    case HandCategory.TwoPair: {
      const [a, b, kicker] = distinctValues(rng, 3);
      return [
        ...mixedSuits(rng, 2).map((s) => card(a, s)),
        ...mixedSuits(rng, 2).map((s) => card(b, s)),
        card(kicker, pick(rng, SUITS)),
      ];
    }
    case HandCategory.OnePair: {
      const [p, k1, k2, k3] = distinctValues(rng, 4);
      return [
        ...mixedSuits(rng, 2).map((s) => card(p, s)),
        card(k1, pick(rng, SUITS)),
        card(k2, pick(rng, SUITS)),
        card(k3, pick(rng, SUITS)),
      ];
    }
    case HandCategory.HighCard:
    default: {
      const vals = distinctValues(rng, 5);
      const suits = mixedSuits(rng, 5);
      return vals.map((v, i) => card(v, suits[i])); // 검증 단계에서 스트레이트는 걸러집니다
    }
  }
}

/** 요청한 족보와 정확히 같은, 검증된 5장 핸드. */
export function makeHandOfCategory(
  category: HandCategory,
  rng: Rng = Math.random,
): Card[] {
  for (let attempt = 0; attempt < 500; attempt++) {
    const cards = build(category, rng);
    if (evaluateHand(cards).category === category) return cards;
  }
  throw new Error(`${HandCategory[category]} 핸드를 만들 수 없습니다`);
}

function randomCardNotIn(used: Set<string>, rng: Rng): Card {
  for (;;) {
    const c = card(ri(rng, 2, 14), pick(rng, SUITS));
    if (!used.has(cardId(c))) return c;
  }
}

/**
 * 가장 좋은 5장 핸드가 정확히 `category`인 7장 (홀 카드 2장 + 보드 5장).
 * 채움 카드 2장을 더한 뒤 전체를 다시 검증하므로, 채움 카드가 실수로
 * 핸드를 더 높은 족보로 올리는 일은 없습니다.
 */
export function make7OfCategory(
  category: HandCategory,
  rng: Rng = Math.random,
): { hole: Card[]; board: Card[]; all: Card[] } {
  for (let attempt = 0; attempt < 500; attempt++) {
    const five = makeHandOfCategory(category, rng);
    const used = new Set(five.map(cardId));
    const extra: Card[] = [];
    while (extra.length < 2) {
      const c = randomCardNotIn(used, rng);
      used.add(cardId(c));
      extra.push(c);
    }
    const all = [...five, ...extra];
    if (evaluateHand(all).category === category) {
      // 아무 2장이나 홀 카드로 지정합니다. 평가는 지정 방식과 무관합니다.
      return { hole: all.slice(0, 2), board: all.slice(2), all };
    }
  }
  throw new Error(`7장짜리 ${HandCategory[category]} 핸드를 만들 수 없습니다`);
}
