import { describe, it, expect } from 'vitest';
import {
  evaluateHand,
  compareScores,
  parseCard,
  HandCategory,
} from '../src/engine/handEvaluator';
import type { Card } from '../src/engine/card';

const hand = (labels: string): Card[] => labels.split(' ').map(parseCard);

describe('evaluateHand — categories (5 cards)', () => {
  const cases: Array<[string, HandCategory]> = [
    ['A♠ K♠ Q♠ J♠ 10♠', HandCategory.RoyalFlush],
    ['9♥ 8♥ 7♥ 6♥ 5♥', HandCategory.StraightFlush],
    ['A♠ 2♠ 3♠ 4♠ 5♠', HandCategory.StraightFlush], // steel wheel
    ['Q♣ Q♦ Q♥ Q♠ 3♦', HandCategory.FourOfAKind],
    ['K♣ K♦ K♥ 7♠ 7♦', HandCategory.FullHouse],
    ['A♣ J♣ 8♣ 5♣ 2♣', HandCategory.Flush],
    ['8♦ 7♣ 6♠ 5♥ 4♦', HandCategory.Straight],
    ['A♥ 2♣ 3♦ 4♠ 5♥', HandCategory.Straight], // wheel
    ['5♣ 5♦ 5♠ K♥ 2♦', HandCategory.ThreeOfAKind],
    ['J♣ J♦ 4♠ 4♥ 9♦', HandCategory.TwoPair],
    ['10♣ 10♦ A♠ 7♥ 3♦', HandCategory.OnePair],
    ['A♣ Q♦ 9♠ 6♥ 3♦', HandCategory.HighCard],
  ];

  for (const [labels, category] of cases) {
    it(`${labels} → ${HandCategory[category]}`, () => {
      expect(evaluateHand(hand(labels)).category).toBe(category);
    });
  }
});

describe('evaluateHand — best 5 of 7', () => {
  it('finds a flush among 7 cards', () => {
    const result = evaluateHand(hand('A♠ K♠ Q♠ 2♠ 7♠ 3♦ 9♣'));
    expect(result.category).toBe(HandCategory.Flush);
  });

  it('finds a full house from two pair + trips on the board', () => {
    // hole K♦ K♣ + board K♠ 7♥ 7♦ 2♣ 9♠ → kings full of sevens
    const result = evaluateHand(hand('K♦ K♣ K♠ 7♥ 7♦ 2♣ 9♠'));
    expect(result.category).toBe(HandCategory.FullHouse);
  });

  it('detects a wheel straight using the ace low among 7', () => {
    const result = evaluateHand(hand('A♦ 2♣ 3♠ 4♥ 5♦ K♣ Q♠'));
    expect(result.category).toBe(HandCategory.Straight);
    expect(result.score[1]).toBe(5); // high card of the wheel is 5
  });
});

describe('compareScores — tie-breaking', () => {
  it('higher pair beats lower pair', () => {
    const aces = evaluateHand(hand('A♦ A♣ 5♠ 8♥ 2♦'));
    const kings = evaluateHand(hand('K♦ K♣ 5♠ 8♥ 2♦'));
    expect(compareScores(aces.score, kings.score)).toBeGreaterThan(0);
  });

  it('kicker decides equal pairs', () => {
    const aceKicker = evaluateHand(hand('Q♦ Q♣ A♠ 8♥ 2♦'));
    const kingKicker = evaluateHand(hand('Q♥ Q♠ K♠ 8♦ 2♣'));
    expect(compareScores(aceKicker.score, kingKicker.score)).toBeGreaterThan(0);
  });

  it('full house compares trips before pair', () => {
    const aaaKK = evaluateHand(hand('A♦ A♣ A♠ K♥ K♦'));
    const kkkAA = evaluateHand(hand('K♣ K♠ K♦ A♥ A♠'));
    expect(compareScores(aaaKK.score, kkkAA.score)).toBeGreaterThan(0);
  });

  it('identical hands tie', () => {
    const a = evaluateHand(hand('A♦ K♣ Q♠ J♥ 9♦'));
    const b = evaluateHand(hand('A♣ K♦ Q♥ J♠ 9♣'));
    expect(compareScores(a.score, b.score)).toBe(0);
  });
});
