import { type Card, type Rank, RANK_VALUE, cardLabel } from './card';

/** Hand categories, ordered weakest (0) → strongest (9). */
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
  [HandCategory.HighCard]: 'High Card',
  [HandCategory.OnePair]: 'One Pair',
  [HandCategory.TwoPair]: 'Two Pair',
  [HandCategory.ThreeOfAKind]: 'Three of a Kind',
  [HandCategory.Straight]: 'Straight',
  [HandCategory.Flush]: 'Flush',
  [HandCategory.FullHouse]: 'Full House',
  [HandCategory.FourOfAKind]: 'Four of a Kind',
  [HandCategory.StraightFlush]: 'Straight Flush',
  [HandCategory.RoyalFlush]: 'Royal Flush',
};

export interface HandResult {
  /** The category of the best hand. */
  category: HandCategory;
  /** Human-readable category name, e.g. "Full House". */
  name: string;
  /**
   * Tie-break vector. Compare two HandResults by comparing `score` arrays
   * lexicographically (category is the first element).
   */
  score: number[];
  /** The exact 5 cards that make the best hand (for display/highlighting). */
  bestFive: Card[];
}

/** All k-combinations of the given array. */
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
 * Detect a straight from a set of distinct rank values.
 * Returns the high-card value of the straight, or null if none.
 * Handles the wheel (A-2-3-4-5) where the Ace plays low and the high card is 5.
 */
function straightHigh(distinctValues: number[]): number | null {
  const values = [...new Set(distinctValues)].sort((a, b) => b - a);
  // Treat Ace (14) as also 1 so the wheel A-2-3-4-5 is detected (high card 5).
  if (values.includes(14)) values.push(1);
  let run = 1;
  for (let i = 1; i < values.length; i++) {
    if (values[i] === values[i - 1] - 1) {
      run++;
      // Values descend, so the start of a 5-long run is the high card.
      if (run === 5) return values[i - 4];
    } else {
      run = 1;
    }
  }
  return null;
}

/** Evaluate exactly five cards into a comparable HandResult. */
function evaluate5(cards: Card[]): HandResult {
  if (cards.length !== 5) {
    throw new Error(`evaluate5 expects 5 cards, got ${cards.length}`);
  }

  const values = cards.map((c) => RANK_VALUE[c.rank]).sort((a, b) => b - a);
  const isFlush = cards.every((c) => c.suit === cards[0].suit);
  const high = straightHigh(values);
  const isStraight = high !== null;

  // Count occurrences of each rank value.
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);

  // Groups sorted by (count desc, value desc) — the canonical tie-break order.
  const groups = [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return b[0] - a[0];
  });
  const countPattern = groups.map((g) => g[1]).join(''); // e.g. "32" = full house
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

/** Compare two score vectors lexicographically: >0 if a beats b. */
export function compareScores(a: number[], b: number[]): number {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/**
 * Evaluate the best 5-card hand from 5, 6, or 7 cards (e.g. 2 hole + 5 board).
 */
export function evaluateHand(cards: Card[]): HandResult {
  if (cards.length < 5 || cards.length > 7) {
    throw new Error(`evaluateHand expects 5–7 cards, got ${cards.length}`);
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

/** Convenience: build a Card from a label like "A♠" or "10♥". */
export function parseCard(label: string): Card {
  const suit = label.slice(-1) as Card['suit'];
  const rank = label.slice(0, -1) as Rank;
  if (!(rank in RANK_VALUE)) throw new Error(`Bad rank in "${label}"`);
  return { rank, suit };
}

/** Pretty-print a list of cards: "A♠ K♠ Q♠ J♠ 10♠". */
export function handLabel(cards: Card[]): string {
  return cards.map(cardLabel).join(' ');
}
