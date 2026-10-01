import { shuffledDeck } from '../engine/deck';
import {
  type Position,
  classifyStartingHand,
  shouldPlay,
  TIER_LABEL,
} from '../engine/startingHands';
import { josa } from '../engine/josa';
import { type Drill, type Rng, shuffledOptions } from './types';

/** 레벨 7 — 포지션에 따른 프리플랍 스타팅 핸드 선택. */
export function generateStartingHandDrill(rng: Rng): Drill {
  const deck = shuffledDeck(rng);
  const hole = [deck[0], deck[1]];
  const hand = classifyStartingHand(hole[0], hole[1]);
  const askTier = rng() < 0.5;

  if (askTier) {
    const correct = TIER_LABEL[hand.tier];
    const distractors = (['premium', 'strong', 'playable', 'trash'] as const)
      .filter((t) => t !== hand.tier)
      .map((t) => TIER_LABEL[t]);
    const { options, correctIndex } = shuffledOptions(rng, correct, distractors);
    return {
      prompt: '이 스타팅 핸드는 얼마나 강한가요?',
      visual: { hole },
      options,
      correctIndex,
      explanation: `${josa(hand.name, '은/는')} '${correct}' 등급의 스타팅 핸드입니다. 강한 핸드는 어느 자리에서나 플레이하고, 약한 핸드는 레이트 포지션에서만 플레이하거나 아예 플레이하지 않습니다.`,
    };
  }

  // 포지션에 따라 플레이할지 폴드할지.
  const position: Position = rng() < 0.5 ? 'early' : 'late';
  const play = shouldPlay(hand.tier, position);
  const posLabel = position === 'early' ? '얼리 포지션(언더더건)' : '레이트 포지션(버튼)';
  const tierLabel = TIER_LABEL[hand.tier];
  const correct = play ? '플레이 (레이즈)' : '폴드';
  const options = ['플레이 (레이즈)', '폴드'];
  const reason = play
    ? `${josa(hand.name, '은/는')} '${tierLabel}' 등급 — ${posLabel}에서 오픈하기에 충분히 강합니다.`
    : hand.tier === 'trash'
      ? `${josa(hand.name, '은/는')} '${tierLabel}' 등급 — 어느 포지션에서든 폴드하세요.`
        : `${josa(hand.name, '은/는')} '${tierLabel}' 등급일 뿐입니다. 레이트 포지션에서는 플레이하지만, ${posLabel}에서는 폴드하세요.`;
  return {
    prompt: `${posLabel}에서 이 핸드로 가장 먼저 행동합니다. 플레이할까요, 폴드할까요?`,
    visual: { hole },
    options,
    correctIndex: options.indexOf(correct),
    explanation: reason,
  };
}
