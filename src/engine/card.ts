// 순수 카드 모델 — UI 의존성이 없습니다.

export const SUITS = ['♠', '♥', '♦', '♣'] as const;
export type Suit = (typeof SUITS)[number];

export const RANKS = [
  '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A',
] as const;
export type Rank = (typeof RANKS)[number];

export interface Card {
  rank: Rank;
  suit: Suit;
}

/** 랭크의 숫자 세기: 2(가장 낮음) .. 14(에이스, 가장 높음). */
export const RANK_VALUE: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, J: 11, Q: 12, K: 13, A: 14,
};

export const SUIT_NAME: Record<Suit, string> = {
  '♠': '스페이드',
  '♥': '하트',
  '♦': '다이아몬드',
  '♣': '클럽',
};

export const RANK_NAME: Record<Rank, string> = {
  '2': '2', '3': '3', '4': '4', '5': '5', '6': '6',
  '7': '7', '8': '8', '9': '9', '10': '10',
  J: '잭', Q: '퀸', K: '킹', A: '에이스',
};

/** 세기가 `value`(2..14)인 랭크를 돌려줍니다. */
export function rankForValue(value: number): Rank {
  const rank = RANKS[value - 2];
  if (!rank) throw new Error(`값 ${value}에 해당하는 랭크가 없습니다`);
  return rank;
}

export const RED_SUITS: ReadonlySet<Suit> = new Set<Suit>(['♥', '♦']);

export function isRed(card: Card): boolean {
  return RED_SUITS.has(card.suit);
}

/** "A♠", "10♥" 같은 내부용 짧은 표기 (코드·테스트용). */
export function cardLabel(card: Card): string {
  return `${card.rank}${card.suit}`;
}

/** 화면에 보여 주는 짧은 한국어 표기, 예: "♠에이스", "♥10". */
export function cardShortName(card: Card): string {
  return `${card.suit}${RANK_NAME[card.rank]}`;
}

/** "스페이드 에이스" 같은 카드의 전체 이름. */
export function cardName(card: Card): string {
  return `${SUIT_NAME[card.suit]} ${RANK_NAME[card.rank]}`;
}

/** 키·중복 제거에 쓰는 고정 ID, 예: "A-♠". */
export function cardId(card: Card): string {
  return `${card.rank}-${card.suit}`;
}

export function cardsEqual(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}
