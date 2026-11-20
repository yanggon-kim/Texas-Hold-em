// 시뮬레이션용 빠른 핸드 평가기. 카드를 0..51 정수로 다루고, 비교 가능한 숫자 점수를
// 돌려줍니다. 결과는 handEvaluator.ts의 evaluateHand와 같아야 하며(테스트로 확인),
// 승률·족보 확률처럼 수천 번 평가해야 하는 곳에서만 씁니다.

import { type Card, RANK_VALUE, SUITS } from './card';
import { HandCategory } from './handEvaluator';

/** 카드 → 0..51 정수 (랭크 0..12 × 4 + 무늬 0..3). */
export function cardToInt(card: Card): number {
  return (RANK_VALUE[card.rank] - 2) * 4 + SUITS.indexOf(card.suit);
}

const BASE = 16;
const CAT_MULT = BASE ** 5;

/** 점수에서 족보 종류를 꺼냅니다. */
export function categoryOf(score: number): HandCategory {
  return Math.floor(score / CAT_MULT) as HandCategory;
}

function encode(cat: number, kickers: number[]): number {
  let s = cat * CAT_MULT;
  for (let i = 0; i < 5; i++) s += (kickers[i] ?? 0) * BASE ** (4 - i);
  return s;
}

/** 랭크 비트마스크에서 가장 높은 스트레이트의 꼭대기 랭크(0..12), 없으면 -1. */
function straightTop(mask: number): number {
  for (let top = 12; top >= 4; top--) {
    if (((mask >> (top - 4)) & 0b11111) === 0b11111) return top;
  }
  // 휠: A-2-3-4-5 (꼭대기 = 5, 랭크 인덱스 3)
  if ((mask & 0b1000000001111) === 0b1000000001111) return 3;
  return -1;
}

/** 마스크에서 높은 랭크부터 최대 n개. */
function topRanks(mask: number, n: number): number[] {
  const out: number[] = [];
  for (let r = 12; r >= 0 && out.length < n; r--) if (mask & (1 << r)) out.push(r);
  return out;
}

/**
 * 1~7장(정수 카드)의 점수. 5장 미만이면 페어류만 판정합니다(보드 일부 평가용).
 * 점수가 클수록 강한 핸드입니다.
 */
export function evalInts(cards: readonly number[]): number {
  const rankCount = new Array<number>(13).fill(0);
  const suitMask = [0, 0, 0, 0];
  const suitCount = [0, 0, 0, 0];
  let rankMask = 0;
  for (const c of cards) {
    const r = c >> 2;
    const s = c & 3;
    rankCount[r]++;
    suitMask[s] |= 1 << r;
    suitCount[s]++;
    rankMask |= 1 << r;
  }

  // 스트레이트 플러시 / 플러시
  let flushSuit = -1;
  for (let s = 0; s < 4; s++) if (suitCount[s] >= 5) flushSuit = s;
  if (flushSuit >= 0) {
    const sf = straightTop(suitMask[flushSuit]);
    if (sf >= 0) return encode(sf === 12 ? HandCategory.RoyalFlush : HandCategory.StraightFlush, [sf]);
  }

  const quads: number[] = [];
  const trips: number[] = [];
  const pairs: number[] = [];
  for (let r = 12; r >= 0; r--) {
    if (rankCount[r] === 4) quads.push(r);
    else if (rankCount[r] === 3) trips.push(r);
    else if (rankCount[r] === 2) pairs.push(r);
  }

  if (quads.length) {
    const q = quads[0];
    return encode(HandCategory.FourOfAKind, [q, ...topRanks(rankMask & ~(1 << q), 1)]);
  }
  if (trips.length && (trips.length >= 2 || pairs.length)) {
    const t = trips[0];
    const p = Math.max(trips[1] ?? -1, pairs[0] ?? -1);
    return encode(HandCategory.FullHouse, [t, p]);
  }
  if (flushSuit >= 0) return encode(HandCategory.Flush, topRanks(suitMask[flushSuit], 5));
  const st = straightTop(rankMask);
  if (st >= 0) return encode(HandCategory.Straight, [st]);
  if (trips.length) {
    const t = trips[0];
    return encode(HandCategory.ThreeOfAKind, [t, ...topRanks(rankMask & ~(1 << t), 2)]);
  }
  if (pairs.length >= 2) {
    const [a, b] = pairs;
    return encode(HandCategory.TwoPair, [a, b, ...topRanks(rankMask & ~(1 << a) & ~(1 << b), 1)]);
  }
  if (pairs.length === 1) {
    const p = pairs[0];
    return encode(HandCategory.OnePair, [p, ...topRanks(rankMask & ~(1 << p), 3)]);
  }
  return encode(HandCategory.HighCard, topRanks(rankMask, 5));
}
