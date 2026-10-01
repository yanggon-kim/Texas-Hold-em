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

describe('makeHandOfCategory는 요청한 족보를 정확히 만든다', () => {
  for (const category of ALL_CATEGORIES) {
    it(`${HandCategory[category]} (시드 50개)`, () => {
      for (let seed = 1; seed <= 50; seed++) {
        const cards = makeHandOfCategory(category, mulberry32(seed * 31 + category));
        expect(cards).toHaveLength(5);
        expect(new Set(cards.map(cardId)).size).toBe(5); // 중복 카드 없음
        expect(evaluateHand(cards).category).toBe(category);
      }
    });
  }
});

describe('make7OfCategory는 가장 좋은 핸드가 맞는 7장을 만든다', () => {
  for (const category of ALL_CATEGORIES) {
    it(`${HandCategory[category]} (시드 25개)`, () => {
      for (let seed = 1; seed <= 25; seed++) {
        const { hole, board, all } = make7OfCategory(category, mulberry32(seed * 17 + category));
        expect(hole).toHaveLength(2);
        expect(board).toHaveLength(5);
        expect(new Set(all.map(cardId)).size).toBe(7); // 7장 모두 서로 다름
        expect(evaluateHand(all).category).toBe(category);
      }
    });
  }
});
