// Short Korean translations for key poker terms, so the learner picks up the
// Korean vocabulary alongside the concepts. Each entry: Hangul + romanization.

import { HandCategory } from '../engine/handEvaluator';
import type { Suit } from '../engine/card';

export interface KoreanTerm {
  ko: string; // Hangul
  roma: string; // romanization to help pronunciation
}

/** Format a term as "한글 (romanization)". */
export function ko(term: KoreanTerm): string {
  return `${term.ko} (${term.roma})`;
}

export const HAND_KOREAN: Record<HandCategory, KoreanTerm> = {
  [HandCategory.HighCard]: { ko: '하이 카드', roma: 'hai kadeu' },
  [HandCategory.OnePair]: { ko: '원 페어', roma: 'won peeo' },
  [HandCategory.TwoPair]: { ko: '투 페어', roma: 'tu peeo' },
  [HandCategory.ThreeOfAKind]: { ko: '트리플', roma: 'teuripeul' },
  [HandCategory.Straight]: { ko: '스트레이트', roma: 'seuteureiteu' },
  [HandCategory.Flush]: { ko: '플러시', roma: 'peulleosi' },
  [HandCategory.FullHouse]: { ko: '풀 하우스', roma: 'pul hauseu' },
  [HandCategory.FourOfAKind]: { ko: '포 카드', roma: 'po kadeu' },
  [HandCategory.StraightFlush]: { ko: '스트레이트 플러시', roma: 'seuteureiteu peulleosi' },
  [HandCategory.RoyalFlush]: { ko: '로열 플러시', roma: 'royeol peulleosi' },
};

export const SUIT_KOREAN: Record<Suit, KoreanTerm> = {
  '♠': { ko: '스페이드', roma: 'seupeideu' },
  '♥': { ko: '하트', roma: 'hateu' },
  '♦': { ko: '다이아몬드', roma: 'daiamondeu' },
  '♣': { ko: '클럽', roma: 'keulleop' },
};

/** General terms keyed by a stable English slug. */
export const TERM_KOREAN: Record<string, KoreanTerm> = {
  // cards & deck
  deck: { ko: '덱', roma: 'deok' },
  rank: { ko: '랭크', roma: 'raengkeu' },
  suit: { ko: '무늬', roma: 'munui' },
  red: { ko: '빨강', roma: 'ppalgang' },
  black: { ko: '검정', roma: 'geomjeong' },
  // table & flow
  'dealer button': { ko: '딜러 버튼', roma: 'dilleo beoteun' },
  'small blind': { ko: '스몰 블라인드', roma: 'seumol beullaindeu' },
  'big blind': { ko: '빅 블라인드', roma: 'big beullaindeu' },
  'hole cards': { ko: '홀 카드', roma: 'hol kadeu' },
  'community cards': { ko: '커뮤니티 카드', roma: 'keomyuniti kadeu' },
  preflop: { ko: '프리플랍', roma: 'peuripeullap' },
  flop: { ko: '플랍', roma: 'peullap' },
  turn: { ko: '턴', roma: 'teon' },
  river: { ko: '리버', roma: 'ribeo' },
  showdown: { ko: '쇼다운', roma: 'syodaun' },
  pot: { ko: '팟', roma: 'pat' },
  // actions
  check: { ko: '체크', roma: 'chekeu' },
  bet: { ko: '벳', roma: 'bet' },
  call: { ko: '콜', roma: 'kol' },
  raise: { ko: '레이즈', roma: 'reijeu' },
  fold: { ko: '폴드', roma: 'poldeu' },
  'all-in': { ko: '올인', roma: 'orin' },
  // position
  position: { ko: '포지션', roma: 'pojisyeon' },
  button: { ko: '버튼', roma: 'beoteun' },
  'under the gun': { ko: '언더 더 건', roma: 'eondeo deo geon' },
  // strategy
  'starting hand': { ko: '스타팅 핸드', roma: 'seutating haendeu' },
  outs: { ko: '아웃', roma: 'aut' },
  draw: { ko: '드로우', roma: 'deurou' },
  'pot odds': { ko: '팟 오즈', roma: 'pat ojeu' },
  equity: { ko: '에쿼티', roma: 'ekwoti' },
  nuts: { ko: '너츠', roma: 'neocheu' },
};
