// Pure card model — no UI dependencies.

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

/** Numeric strength of a rank, 2 (low) .. 14 (Ace high). */
export const RANK_VALUE: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, J: 11, Q: 12, K: 13, A: 14,
};

export const SUIT_NAME: Record<Suit, string> = {
  '♠': 'Spades',
  '♥': 'Hearts',
  '♦': 'Diamonds',
  '♣': 'Clubs',
};

export const RANK_NAME: Record<Rank, string> = {
  '2': 'Two', '3': 'Three', '4': 'Four', '5': 'Five', '6': 'Six',
  '7': 'Seven', '8': 'Eight', '9': 'Nine', '10': 'Ten',
  J: 'Jack', Q: 'Queen', K: 'King', A: 'Ace',
};

/** The Rank whose strength equals `value` (2..14). */
export function rankForValue(value: number): Rank {
  const rank = RANKS[value - 2];
  if (!rank) throw new Error(`No rank for value ${value}`);
  return rank;
}

export const RED_SUITS: ReadonlySet<Suit> = new Set<Suit>(['♥', '♦']);

export function isRed(card: Card): boolean {
  return RED_SUITS.has(card.suit);
}

/** Short label such as "A♠" or "10♥". */
export function cardLabel(card: Card): string {
  return `${card.rank}${card.suit}`;
}

/** Full spoken name such as "Ace of Spades". */
export function cardName(card: Card): string {
  return `${RANK_NAME[card.rank]} of ${SUIT_NAME[card.suit]}`;
}

/** Stable id used for keys / dedupe, e.g. "A-♠". */
export function cardId(card: Card): string {
  return `${card.rank}-${card.suit}`;
}

export function cardsEqual(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}
