import { HandCategory, CATEGORY_NAME } from '../engine/handEvaluator';

/** Categories listed weakest → strongest. */
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

/** All category display names, weakest → strongest. */
export const CATEGORY_NAMES: string[] = ALL_CATEGORIES.map((c) => CATEGORY_NAME[c]);

/** One-line description of each category, used in Coach explanations. */
export const CATEGORY_HINT: Record<HandCategory, string> = {
  [HandCategory.HighCard]: 'no pair or better — ranked by its highest card',
  [HandCategory.OnePair]: 'two cards of the same rank',
  [HandCategory.TwoPair]: 'two different pairs',
  [HandCategory.ThreeOfAKind]: 'three cards of the same rank',
  [HandCategory.Straight]: 'five cards in a row (mixed suits)',
  [HandCategory.Flush]: 'five cards of one suit, not in sequence',
  [HandCategory.FullHouse]: 'three of a kind plus a pair',
  [HandCategory.FourOfAKind]: 'four cards of the same rank',
  [HandCategory.StraightFlush]: 'five cards in a row, all the same suit',
  [HandCategory.RoyalFlush]: 'A-K-Q-J-10 all of one suit — the best possible hand',
};
