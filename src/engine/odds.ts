// 초보자용 간단한 확률 도우미 (후반 레벨에서 사용, v0.1에서는 최소한으로 유지).

/**
 * "2와 4의 법칙"으로 드로우의 에퀴티(승률)를 어림합니다:
 *  - 카드 2장이 남았을 때 (플랍에서): 에퀴티 ≈ 아웃츠 × 4%
 *  - 카드 1장이 남았을 때 (턴에서):   에퀴티 ≈ 아웃츠 × 2%
 */
export function ruleOfTwoAndFour(outs: number, cardsToCome: 1 | 2): number {
  const pct = cardsToCome === 2 ? outs * 4 : outs * 2;
  return Math.min(pct, 100);
}

/**
 * 팟 오즈: 콜하기 위해 최종 팟 중 내가 내야 하는 비율.
 * 백분율로 돌려줍니다. 이 값이 내 에퀴티보다 낮으면 콜이 이득입니다.
 */
export function potOddsPercent(potBeforeCall: number, callAmount: number): number {
  const finalPot = potBeforeCall + callAmount;
  if (finalPot <= 0) return 0;
  return (callAmount / finalPot) * 100;
}
