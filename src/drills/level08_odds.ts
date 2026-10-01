import { ruleOfTwoAndFour, potOddsPercent } from '../engine/odds';
import { type Drill, type Rng, shuffledOptions } from './types';

/** 자주 나오는 드로우와 아웃츠 수 — 외워 둘 핵심 사실. */
const OUTS_FACTS: { draw: string; outs: number }[] = [
  { draw: '플러시 드로우 (같은 무늬 4장)', outs: 9 },
  { draw: '오픈엔디드 스트레이트 드로우', outs: 8 },
  { draw: '거트샷 (안쪽) 스트레이트 드로우', outs: 4 },
  { draw: '오버카드 2장', outs: 6 },
  { draw: '플러시 드로우 + 오픈엔디드 스트레이트 드로우', outs: 15 },
  { draw: '셋(트리플)을 노리는 포켓 페어', outs: 2 },
  { draw: '거트샷 + 플러시 드로우', outs: 12 },
];

function numberOptions(rng: Rng, correct: number, spread: number[]): {
  options: string[];
  correctIndex: number;
} {
  const distractors = spread
    .map((d) => correct + d)
    .filter((n) => n > 0 && n !== correct)
    .slice(0, 3)
    .map(String);
  return shuffledOptions(rng, String(correct), distractors);
}

/** 레벨 8 — 아웃츠 세기, 2와 4의 법칙, 팟 오즈. */
export function generateOddsDrill(rng: Rng): Drill {
  const variant = Math.floor(rng() * 4);

  // 1) 이 드로우의 아웃츠는 몇 장인가?
  if (variant === 0) {
    const fact = OUTS_FACTS[Math.floor(rng() * OUTS_FACTS.length)];
    const { options, correctIndex } = numberOptions(rng, fact.outs, [2, -2, 4]);
    return {
      prompt: `${fact.draw}일 때 아웃츠는 몇 장인가요?`,
      options,
      correctIndex,
      explanation: `${fact.draw}의 아웃츠는 ${fact.outs}장입니다 — 덱에 남아 있으면서 내 핸드를 완성해 주는 카드입니다.`,
    };
  }

  // 2) 2와 4의 법칙: 아웃츠로 에퀴티를 어림합니다.
  if (variant === 1) {
    const outs = 4 + Math.floor(rng() * 12); // 4–15
    const cardsToCome: 1 | 2 = rng() < 0.5 ? 1 : 2;
    const pct = ruleOfTwoAndFour(outs, cardsToCome);
    const { options, correctIndex } = numberOptions(rng, pct, [
      cardsToCome === 2 ? 8 : 4,
      cardsToCome === 2 ? -8 : -4,
      cardsToCome === 2 ? 4 : 2,
    ]);
    const opts = options.map((o) => `${o}%`);
    const stage = cardsToCome === 2 ? '플랍(카드 2장 남음)' : '턴(카드 1장 남음)';
    const mult = cardsToCome === 2 ? 4 : 2;
    return {
      prompt: `${stage}에서 아웃츠가 ${outs}장입니다. 핸드가 완성될 확률은 대략 얼마인가요?`,
      options: opts,
      correctIndex,
      explanation: `2와 4의 법칙: 아웃츠 × ${mult} ≈ ${pct}%. (${outs} × ${mult})`,
    };
  }

  // 3) 팟 오즈: 콜하려면 팟의 몇 퍼센트를 내야 하나?
  if (variant === 2) {
    const call = (1 + Math.floor(rng() * 5)) * 10; // 10–50
    const pot = call * (2 + Math.floor(rng() * 4)); // 콜 금액의 2~5배
    const pct = Math.round(potOddsPercent(pot, call));
    const { options, correctIndex } = numberOptions(rng, pct, [5, -5, 10]);
    const opts = options.map((o) => `${o}%`);
    return {
      prompt: `팟은 ${pot}칩이고 콜하려면 ${call}칩을 내야 합니다. 최종 팟 중 내가 내는 비율은 얼마인가요?`,
      options: opts,
      correctIndex,
      explanation: `팟 오즈 = 콜 금액 ÷ (팟 + 콜 금액) = ${call} ÷ ${pot + call} ≈ ${pct}%. 이길 확률이 이보다 높으면 콜이 이득입니다.`,
    };
  }

  // 4) 결정: 에퀴티와 콜 비용을 비교합니다.
  const equity = 20 + Math.floor(rng() * 30); // 20–49%
  const price = 10 + Math.floor(rng() * 30); // 10–39%
  const call = equity > price;
  const correct = call ? '콜' : '폴드';
  const options = ['콜', '폴드'];
  return {
    prompt: `이길 확률은 약 ${equity}%이고, 팟 오즈로 보면 콜에 ${price}%를 내야 합니다. 어떻게 해야 할까요?`,
    options,
    correctIndex: options.indexOf(correct),
    explanation: call
      ? `에퀴티(${equity}%)가 콜 비용(${price}%)보다 높으므로, 장기적으로 콜이 이득입니다.`
      : `에퀴티(${equity}%)가 콜 비용(${price}%)보다 낮으므로 폴드가 맞습니다 — 무리하게 쫓아가지 마세요.`,
  };
}
