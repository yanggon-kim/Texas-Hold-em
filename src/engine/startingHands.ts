import { type Card, RANK_VALUE, rankForValue } from './card';

export type Tier = 'premium' | 'strong' | 'playable' | 'trash';

export const TIER_LABEL: Record<Tier, string> = {
  premium: 'Premium',
  strong: 'Strong',
  playable: 'Playable',
  trash: 'Trash',
};

export interface StartingHand {
  /** Canonical code, e.g. "AA", "AKs", "72o". */
  code: string;
  tier: Tier;
  suited: boolean;
  pair: boolean;
}

/**
 * Classify a 2-card starting hand into a beginner tier, following a simple,
 * widely-taught chart. High card first; 's' = suited, 'o' = offsuit.
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
    if (hi >= 11) return 'premium'; // JJ+
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
    if (hi - lo === 1 && lo >= 4) return 'playable'; // suited connectors 54s–T9s
    return 'trash';
  }

  // offsuit
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
 * Whether to play a hand as the first raise ("raise first in") from a position.
 * Early position is tight (premium/strong only); late position adds playables.
 */
export function shouldPlay(tier: Tier, position: Position): boolean {
  if (tier === 'trash') return false;
  if (tier === 'playable') return position === 'late';
  return true; // premium / strong from anywhere
}
