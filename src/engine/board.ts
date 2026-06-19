import { type Card, type Suit, cardId } from './card';
import { makeDeck } from './deck';
import { type HandResult, evaluateHand, compareScores } from './handEvaluator';

/** The highest count of any single suit on the board. */
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

/** True if any rank appears two or more times on the board. */
export function isPaired(board: Card[]): boolean {
  const seen = new Set<string>();
  for (const c of board) {
    if (seen.has(c.rank)) return true;
    seen.add(c.rank);
  }
  return false;
}

/** A flush is possible for someone when 3+ of one suit are on the board. */
export function flushPossible(board: Card[]): boolean {
  return maxSuitCount(board) >= 3;
}

/**
 * The "nuts": the best possible 5-card hand anyone could hold on this board,
 * found by trying every pair of remaining cards as hole cards.
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
