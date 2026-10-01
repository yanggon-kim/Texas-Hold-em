import { type Card, type Suit, cardId } from './card';
import { makeDeck } from './deck';
import { type HandResult, evaluateHand, compareScores } from './handEvaluator';

/** 보드에서 한 무늬가 나온 최대 개수. */
export function maxSuitCount(board: Card[]): number {
  const counts = new Map<Suit, number>();
  let max = 0;
  for (const c of board) {
    const n = (counts.get(c.suit) ?? 0) + 1;
    counts.set(c.suit, n);
    if (n > max) max = n;
  }
  return max;
}

/** 보드에 같은 랭크가 두 번 이상 나오면 true. */
export function isPaired(board: Card[]): boolean {
  const seen = new Set<string>();
  for (const c of board) {
    if (seen.has(c.rank)) return true;
    seen.add(c.rank);
  }
  return false;
}

/** 보드에 한 무늬가 3장 이상 있으면 누군가 플러시를 만들 수 있습니다. */
export function flushPossible(board: Card[]): boolean {
  return maxSuitCount(board) >= 3;
}

/**
 * "넛츠": 이 보드에서 누구든 가질 수 있는 가장 좋은 5장 핸드.
 * 남은 카드의 모든 2장 조합을 홀 카드로 넣어 보며 찾습니다.
 */
export function boardNuts(board: Card[]): HandResult {
  const used = new Set(board.map(cardId));
  const rest = makeDeck().filter((c) => !used.has(cardId(c)));
  let best: HandResult | null = null;
  for (let i = 0; i < rest.length; i++) {
    for (let j = i + 1; j < rest.length; j++) {
      const res = evaluateHand([...board, rest[i], rest[j]]);
      if (best === null || compareScores(res.score, best.score) > 0) best = res;
    }
  }
  return best!;
}
