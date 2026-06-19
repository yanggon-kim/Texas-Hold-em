import type { LevelDef } from './types';
import { generateCardDrill } from './level01_cards';
import { generateRankingDrill } from './level02_rankings';
import { generateBestHandDrill } from './level03_bestHand';

/**
 * The v0.1 curriculum: the three rules-fluency levels.
 * Later milestones append Levels 4–10 to this list.
 */
export const LEVELS: LevelDef[] = [
  {
    id: 1,
    title: 'Cards & Suits',
    subtitle: 'Recognise all 52 cards',
    icon: '🂡',
    concept: [
      'A standard deck has 52 cards: 4 suits × 13 ranks.',
      'Suits: ♠ spades and ♣ clubs are black; ♥ hearts and ♦ diamonds are red.',
      'Ranks run 2, 3, 4 … 10, then J, Q, K, A. The Ace is usually the highest.',
    ],
    generate: generateCardDrill,
    drillsPerSession: 10,
    masteryNeeded: 8,
  },
  {
    id: 2,
    title: 'Hand Rankings',
    subtitle: 'The 10 hands, weakest to strongest',
    icon: '🏆',
    concept: [
      'From strongest to weakest: Royal Flush, Straight Flush, Four of a Kind, Full House, Flush, Straight, Three of a Kind, Two Pair, One Pair, High Card.',
      'A higher category always beats a lower one — a Flush always beats a Straight.',
      'Learn to name a hand on sight and to compare two hands.',
    ],
    generate: generateRankingDrill,
    drillsPerSession: 10,
    masteryNeeded: 8,
  },
  {
    id: 3,
    title: 'Make the Best Hand',
    subtitle: 'Best 5 cards from 7',
    icon: '🃏',
    concept: [
      'You get 2 private hole cards; 5 community cards are shared by everyone.',
      'Your hand is the best 5-card combination from those 7 cards.',
      'You can use both hole cards, one, or even none ("playing the board").',
    ],
    generate: generateBestHandDrill,
    drillsPerSession: 10,
    masteryNeeded: 8,
  },
];

export function getLevel(id: number): LevelDef | undefined {
  return LEVELS.find((l) => l.id === id);
}
