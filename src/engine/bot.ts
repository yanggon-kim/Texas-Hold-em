// 단순하고 이해하기 쉬운 봇 상대와, 사람 플레이어를 위한 코치 도우미입니다.
// 프리플랍에서는 스타팅 핸드 차트를, 플랍 이후에는 핸드 평가기를 사용하며,
// 플레이가 완전히 예측되지 않도록 약간의 무작위성을 더합니다.

import { type GameState, type Action, legalActions } from './game';
import { classifyStartingHand, type Tier } from './startingHands';
import { evaluateHand, HandCategory } from './handEvaluator';

const TIER_SCORE: Record<Tier, number> = { premium: 3, strong: 2, playable: 1, trash: 0 };

export type Difficulty = 'easy' | 'normal' | 'hard';

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: '쉬움',
  normal: '보통',
  hard: '어려움',
};

interface BotProfile {
  noise: number; // 핸드 세기 추정에 더하는 무작위성
  foldThreshold: number; // 이 세기보다 약하면 벳에 폴드 (콜 비용이 의미 있을 때)
  raiseStrength: number; // 이 세기 이상이면 레이즈·벳
  raiseFreq: number; // 충분히 강할 때 레이즈하는 빈도
  bluffFreq: number; // 받을 벳이 없을 때 약한 핸드로 블러프·벳할 확률
}

const PROFILES: Record<Difficulty, BotProfile> = {
  // 루즈-패시브 "콜링 스테이션": 콜을 너무 많이 하고 레이즈는 드뭅니다 — 이기기 쉽습니다.
  easy: { noise: 0.35, foldThreshold: 0.12, raiseStrength: 0.85, raiseFreq: 0.15, bluffFreq: 0 },
  // 균형형.
  normal: { noise: 0.2, foldThreshold: 0.3, raiseStrength: 0.65, raiseFreq: 0.5, bluffFreq: 0.05 },
  // 타이트-어그레시브: 약한 핸드는 폴드하고, 밸류 레이즈를 자주 하며, 가끔 블러프합니다.
  hard: { noise: 0.1, foldThreshold: 0.42, raiseStrength: 0.55, raiseFreq: 0.75, bluffFreq: 0.14 },
};

/** 행동할 플레이어의 대략적인 0..1 세기 추정치. */
function handStrength(state: GameState): number {
  const p = state.players[state.toAct];
  if (state.board.length === 0) {
    const tier = classifyStartingHand(p.hole[0], p.hole[1]).tier;
    return TIER_SCORE[tier] / 3; // 0, .33, .66, 1
  }
  const cat = evaluateHand([...p.hole, ...state.board]).category;
  // 완성된 족보를 세기 구간으로 바꿉니다.
  if (cat >= HandCategory.Straight) return 1;
  if (cat === HandCategory.ThreeOfAKind || cat === HandCategory.TwoPair) return 0.8;
  if (cat === HandCategory.OnePair) return 0.55;
  return 0.25; // 하이 카드
}

/** 주어진 난이도에서 봇의 행동을 정합니다. */
export function decideBotAction(
  state: GameState,
  rng: () => number = Math.random,
  difficulty: Difficulty = 'normal',
): Action {
  const profile = PROFILES[difficulty];
  const legal = legalActions(state);
  const strength = handStrength(state);
  const s = strength + (rng() - 0.5) * profile.noise;
  const raiseTo = () => botRaiseTarget(state, legal.minRaiseTo, legal.maxRaiseTo);

  // 벳을 받은 상황.
  if (legal.callAmount > 0) {
    const potOdds = legal.callAmount / (state.pot + legal.callAmount);
    if (s < profile.foldThreshold && potOdds > 0.12) return { type: 'fold' };
    if (s >= profile.raiseStrength && legal.canRaise && rng() < profile.raiseFreq) {
      return { type: 'raise', amount: raiseTo() };
    }
    return { type: 'call' };
  }

  // 받을 벳이 없음: 밸류 벳, 가끔 블러프, 아니면 체크.
  if (s >= profile.raiseStrength && legal.canRaise && rng() < profile.raiseFreq) {
    return { type: 'raise', amount: raiseTo() };
  }
  if (s < 0.4 && legal.canRaise && rng() < profile.bluffFreq) {
    return { type: 'raise', amount: raiseTo() };
  }
  return { type: 'check' };
}

function botRaiseTarget(state: GameState, minRaiseTo: number, maxRaiseTo: number): number {
  // 팟의 대략 절반~3분의 2를 베팅하되, 합법 범위 안으로 맞춥니다.
  const target = state.currentBet + Math.max(state.bigBlind, Math.round(state.pot * 0.6));
  return Math.max(minRaiseTo, Math.min(target, maxRaiseTo));
}

export interface CoachTip {
  suggestion: string; // 예: "콜", "폴드", "레이즈"
  reason: string;
}

/** 사람 플레이어의 현재 결정에 대한 코치 추천. */
export function coachTip(state: GameState): CoachTip {
  const legal = legalActions(state);
  const strength = handStrength(state);
  const p = state.players[state.toAct];

  if (state.board.length === 0) {
    const hand = classifyStartingHand(p.hole[0], p.hole[1]);
    if (hand.tier === 'trash' && legal.callAmount > 0) {
      return { suggestion: '폴드', reason: `${hand.code}: 트래시 핸드 — 벳을 받으면 폴드하세요.` };
    }
    if (hand.tier === 'premium' && legal.canRaise) {
      return { suggestion: '레이즈', reason: `${hand.code}: 프리미엄 핸드 — 밸류를 위해 레이즈하세요.` };
    }
    if (legal.canCheck) return { suggestion: '체크', reason: `${hand.code}: 싸게 플랍을 보세요.` };
    return { suggestion: '콜', reason: `${hand.code}: 이 상황에서는 플레이할 만합니다.` };
  }

  const made = evaluateHand([...p.hole, ...state.board]);
  if (legal.callAmount > 0) {
    const potOdds = Math.round((legal.callAmount / (state.pot + legal.callAmount)) * 100);
    if (strength < 0.3) {
      return { suggestion: '폴드', reason: `${made.name}뿐입니다. 콜에 ${potOdds}%를 내기에는 너무 비쌉니다.` };
    }
    if (strength > 0.8 && legal.canRaise) {
      return { suggestion: '레이즈', reason: `${made.name}: 강한 핸드 — 밸류를 위해 레이즈하세요.` };
    }
    return { suggestion: '콜', reason: `${made.name}: ${potOdds}%를 내고 콜할 가치가 있습니다.` };
  }
  if (strength > 0.6 && legal.canRaise) {
    return { suggestion: '벳', reason: `${made.name}: 강한 핸드 — 밸류를 위해 벳하세요.` };
  }
  return { suggestion: '체크', reason: `${made.name}: 팟을 작게 유지하세요.` };
}
