import { type Card, RANK_VALUE, rankForValue } from './card';

export type Tier = 'premium' | 'strong' | 'playable' | 'trash';

export const TIER_LABEL: Record<Tier, string> = {
  premium: '프리미엄',
  strong: '강함',
  playable: '플레이 가능',
  trash: '트래시',
};

export interface StartingHand {
  /** 표준 코드, 예: "AA", "AKs", "72o". */
  code: string;
  tier: Tier;
  suited: boolean;
  pair: boolean;
}

/**
 * 2장짜리 스타팅 핸드를 초보자용 등급으로 분류합니다. 널리 쓰이는 간단한 차트를
 * 따릅니다. 높은 카드를 먼저 쓰며, 's' = 수티드(같은 무늬), 'o' = 오프수트(다른 무늬)입니다.
 */
export function classifyStartingHand(a: Card, b: Card): StartingHand {
  const va = RANK_VALUE[a.rank];
  const vb = RANK_VALUE[b.rank];
  const hi = Math.max(va, vb);
  const lo = Math.min(va, vb);
  const pair = va === vb;
  const suited = a.suit === b.suit;
  const code =
    rankForValue(hi) + rankForValue(lo) + (pair ? '' : suited ? 's' : 'o');

  return { code, tier: tierOf(hi, lo, pair, suited), suited, pair };
}

function tierOf(hi: number, lo: number, pair: boolean, suited: boolean): Tier {
  if (pair) {
    if (hi >= 11) return 'premium'; // JJ 이상
    if (hi >= 9) return 'strong'; // TT, 99
    return 'playable'; // 22–88
  }

  if (suited) {
    if (hi === 14) {
      if (lo >= 12) return 'premium'; // AKs, AQs
      if (lo >= 10) return 'strong'; // AJs, ATs
      return 'playable'; // A2s–A9s
    }
    if (hi === 13) {
      if (lo >= 11) return 'strong'; // KQs, KJs
      if (lo === 10) return 'playable'; // KTs
      return 'trash';
    }
    if (hi === 12 && lo >= 10) return 'playable'; // QJs, QTs
    if (hi === 11 && lo === 10) return 'playable'; // JTs
    if (hi - lo === 1 && lo >= 4) return 'playable'; // 수티드 커넥터 54s–T9s
    return 'trash';
  }

  // 오프수트
  if (hi === 14) {
    if (lo === 13) return 'premium'; // AKo
    if (lo >= 11) return 'strong'; // AQo, AJo
    if (lo === 10) return 'playable'; // ATo
    return 'trash';
  }
  if (hi === 13) {
    if (lo === 12) return 'strong'; // KQo
    if (lo === 11) return 'playable'; // KJo
    return 'trash';
  }
  if (hi === 12 && lo === 11) return 'playable'; // QJo
  if (hi === 11 && lo === 10) return 'playable'; // JTo
  return 'trash';
}

export type Position = 'early' | 'late';

/**
 * 해당 포지션에서 처음 레이즈("레이즈 퍼스트 인")로 이 핸드를 플레이할지 여부.
 * 얼리 포지션은 타이트하게(프리미엄·강함만), 레이트 포지션은 플레이 가능 핸드까지 더합니다.
 */
export function shouldPlay(tier: Tier, position: Position): boolean {
  if (tier === 'trash') return false;
  if (tier === 'playable') return position === 'late';
  return true; // 프리미엄·강함은 어디서나
}
