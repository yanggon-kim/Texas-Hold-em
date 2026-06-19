// Simple beginner-facing odds helpers (used by later levels; kept minimal for v0.1).

/**
 * Approximate equity of a draw using the "Rule of 2 and 4":
 *  - With two cards to come (on the flop): equity ≈ outs × 4%
 *  - With one card to come (on the turn):  equity ≈ outs × 2%
 */
export function ruleOfTwoAndFour(outs: number, cardsToCome: 1 | 2): number {
  const pct = cardsToCome === 2 ? outs * 4 : outs * 2;
  return Math.min(pct, 100);
}

/**
 * Pot odds as the share of the final pot you must contribute to call.
 * Returns a percentage. If this is below your equity, calling is profitable.
 */
export function potOddsPercent(potBeforeCall: number, callAmount: number): number {
  const finalPot = potBeforeCall + callAmount;
  if (finalPot <= 0) return 0;
  return (callAmount / finalPot) * 100;
}
