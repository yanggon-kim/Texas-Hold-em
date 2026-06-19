import { describe, it, expect } from 'vitest';
import { makeHandOfCategory, make7OfCategory } from '../src/engine/handFactory';
import { evaluateHand, HandCategory } from '../src/engine/handEvaluator';
import { mulberry32 } from '../src/engine/deck';
import { cardId } from '../src/engine/card';

const ALL_CATEGORIES = [
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

describe('makeHandOfCategory builds exactly the requested category', () => {
  for (const category of ALL_CATEGORIES) {
    it(`${HandCategory[category]} (50 seeds)`, () => {
      for (let seed = 1; seed <= 50; seed++) {
        const cards = makeHandOfCategory(category, mulberry32(seed * 31 + category));
        expect(cards).toHaveLength(5);
        expect(new Set(cards.map(cardId)).size).toBe(5); // no duplicate cards
        expect(evaluateHand(cards).category).toBe(category);
      }
    });
  }
});

describe('make7OfCategory builds 7 cards with the right best hand', () => {
  for (const category of ALL_CATEGORIES) {
    it(`${HandCategory[category]} (25 seeds)`, () => {
      for (let seed = 1; seed <= 25; seed++) {
        const { hole, board, all } = make7OfCategory(category, mulberry32(seed * 17 + category));
        expect(hole).toHaveLength(2);
        expect(board).toHaveLength(5);
        expect(new Set(all.map(cardId)).size).toBe(7); // all 7 distinct
        expect(evaluateHand(all).category).toBe(category);
      }
    });
  }
});
