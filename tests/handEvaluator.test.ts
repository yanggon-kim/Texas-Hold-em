import { describe, it, expect } from 'vitest';
import {
  evaluateHand,
  compareScores,
  parseCard,
  HandCategory,
} from '../src/engine/handEvaluator';
import type { Card } from '../src/engine/card';

const hand = (labels: string): Card[] => labels.split(' ').map(parseCard);

describe('evaluateHand — 족보 판정 (5장)', () => {
  const cases: Array<[string, HandCategory]> = [
    ['A♠ K♠ Q♠ J♠ 10♠', HandCategory.RoyalFlush],
    ['9♥ 8♥ 7♥ 6♥ 5♥', HandCategory.StraightFlush],
    ['A♠ 2♠ 3♠ 4♠ 5♠', HandCategory.StraightFlush], // 스틸 휠
    ['Q♣ Q♦ Q♥ Q♠ 3♦', HandCategory.FourOfAKind],
    ['K♣ K♦ K♥ 7♠ 7♦', HandCategory.FullHouse],
    ['A♣ J♣ 8♣ 5♣ 2♣', HandCategory.Flush],
    ['8♦ 7♣ 6♠ 5♥ 4♦', HandCategory.Straight],
    ['A♥ 2♣ 3♦ 4♠ 5♥', HandCategory.Straight], // 휠
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

describe('evaluateHand — 7장 중 가장 좋은 5장', () => {
  it('7장 중에서 플러시를 찾는다', () => {
    const result = evaluateHand(hand('A♠ K♠ Q♠ 2♠ 7♠ 3♦ 9♣'));
    expect(result.category).toBe(HandCategory.Flush);
  });

  it('보드의 투 페어 + 트리플로 풀하우스를 찾는다', () => {
    // 홀 K♦ K♣ + 보드 K♠ 7♥ 7♦ 2♣ 9♠ → K 풀하우스 (7 페어)
    const result = evaluateHand(hand('K♦ K♣ K♠ 7♥ 7♦ 2♣ 9♠'));
    expect(result.category).toBe(HandCategory.FullHouse);
  });

  it('7장 중에서 에이스를 낮게 쓰는 휠 스트레이트를 찾는다', () => {
    const result = evaluateHand(hand('A♦ 2♣ 3♠ 4♥ 5♦ K♣ Q♠'));
    expect(result.category).toBe(HandCategory.Straight);
    expect(result.score[1]).toBe(5); // 휠의 가장 높은 카드는 5
  });
});

describe('compareScores — 동점 판정', () => {
  it('높은 페어가 낮은 페어를 이긴다', () => {
    const aces = evaluateHand(hand('A♦ A♣ 5♠ 8♥ 2♦'));
    const kings = evaluateHand(hand('K♦ K♣ 5♠ 8♥ 2♦'));
    expect(compareScores(aces.score, kings.score)).toBeGreaterThan(0);
  });

  it('같은 페어는 키커로 승부를 가린다', () => {
    const aceKicker = evaluateHand(hand('Q♦ Q♣ A♠ 8♥ 2♦'));
    const kingKicker = evaluateHand(hand('Q♥ Q♠ K♠ 8♦ 2♣'));
    expect(compareScores(aceKicker.score, kingKicker.score)).toBeGreaterThan(0);
  });

  it('풀하우스는 페어보다 트리플을 먼저 비교한다', () => {
    const aaaKK = evaluateHand(hand('A♦ A♣ A♠ K♥ K♦'));
    const kkkAA = evaluateHand(hand('K♣ K♠ K♦ A♥ A♠'));
    expect(compareScores(aaaKK.score, kkkAA.score)).toBeGreaterThan(0);
  });

  it('똑같은 핸드는 비긴다', () => {
    const a = evaluateHand(hand('A♦ K♣ Q♠ J♥ 9♦'));
    const b = evaluateHand(hand('A♣ K♦ Q♥ J♠ 9♣'));
    expect(compareScores(a.score, b.score)).toBe(0);
  });
});
