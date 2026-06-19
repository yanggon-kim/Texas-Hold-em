// Builds example hands of a *target* category, so drills can show real cards.
// Every constructor is verified with the real evaluator and retried on a miss,
// so the output category is always exactly what was requested.

import { type Card, type Suit, SUITS, cardId, rankForValue } from './card';
import { evaluateHand, HandCategory } from './handEvaluator';

type Rng = () => number;

const ri = (rng: Rng, lo: number, hi: number): number =>
  lo + Math.floor(rng() * (hi - lo + 1));

const pick = <T,>(rng: Rng, arr: readonly T[]): T => arr[ri(rng, 0, arr.length - 1)];

const card = (value: number, suit: Suit): Card => ({ rank: rankForValue(value), suit });

/** n distinct rank values sampled from 2..14. */
function distinctValues(rng: Rng, n: number): number[] {
  const pool = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = ri(rng, 0, i);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

/** Suits laid out so the run is never a flush (cycles through the 4 suits). */
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
      const high = ri(rng, 6, 13); // 14 would be a royal flush
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
      return distinctValues(rng, 5).map((v) => card(v, s)); // verify rejects straights
    }
    case HandCategory.Straight: {
      const high = ri(rng, 6, 14); // avoid the wheel for simplicity
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
      return vals.map((v, i) => card(v, suits[i])); // verify rejects straights
    }
  }
}

/** A verified 5-card hand of exactly the requested category. */
export function makeHandOfCategory(
  category: HandCategory,
  rng: Rng = Math.random,
): Card[] {
  for (let attempt = 0; attempt < 500; attempt++) {
    const cards = build(category, rng);
    if (evaluateHand(cards).category === category) return cards;
  }
  throw new Error(`Could not construct a ${HandCategory[category]} hand`);
}

function randomCardNotIn(used: Set<string>, rng: Rng): Card {
  for (;;) {
    const c = card(ri(rng, 2, 14), pick(rng, SUITS));
    if (!used.has(cardId(c))) return c;
  }
}

/**
 * Seven cards (2 hole + 5 board) whose best 5-card hand is exactly `category`.
 * Two filler cards are added and the whole thing is re-verified so the filler
 * never accidentally upgrades the hand.
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
      // Label any two as hole cards; evaluation is independent of the labels.
      return { hole: all.slice(0, 2), board: all.slice(2), all };
    }
  }
  throw new Error(`Could not construct a 7-card ${HandCategory[category]} hand`);
}
