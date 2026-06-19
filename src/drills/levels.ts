import type { LevelDef } from './types';
import { generateCardDrill } from './level01_cards';
import { generateRankingDrill } from './level02_rankings';
import { generateBestHandDrill } from './level03_bestHand';
import { generateTableFlowDrill } from './level04_tableFlow';
import { generateActionsDrill } from './level05_actions';
import { generatePositionDrill } from './level06_position';
import {
  cardsLesson,
  rankingsLesson,
  bestHandLesson,
  tableFlowLesson,
  actionsLesson,
  positionLesson,
} from './lessons';

/**
 * The curriculum.
 *   Levels 1–3: rules fluency.   Levels 4–6: game flow.
 * Later milestones append Levels 7–10 (strategy + full play) to this list.
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
    lesson: cardsLesson,
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
    lesson: rankingsLesson,
    generate: generateRankingDrill,
    drillsPerSession: 12,
    masteryNeeded: 9,
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
    lesson: bestHandLesson,
    generate: generateBestHandDrill,
    drillsPerSession: 10,
    masteryNeeded: 8,
  },
  {
    id: 4,
    title: 'Table & Flow',
    subtitle: 'Button, blinds, and the 4 betting rounds',
    icon: '🎬',
    concept: [
      'The dealer button rotates clockwise; the two players left of it post the small and big blinds.',
      'A hand runs Pre-flop → Flop (3 cards) → Turn (1 card) → River (1 card), with betting on each.',
      'If two or more players remain after the river, the showdown decides the winner.',
    ],
    lesson: tableFlowLesson,
    generate: generateTableFlowDrill,
    drillsPerSession: 10,
    masteryNeeded: 8,
  },
  {
    id: 5,
    title: 'Betting Actions',
    subtitle: 'Check, bet, call, raise, fold',
    icon: '💰',
    concept: [
      'Check = pass with no bet; Bet = put chips in first; Call = match; Raise = increase; Fold = give up.',
      'You can only check when there is no bet in front of you.',
      'Facing a bet, your options are fold, call, or raise — never check.',
    ],
    lesson: actionsLesson,
    generate: generateActionsDrill,
    drillsPerSession: 10,
    masteryNeeded: 8,
  },
  {
    id: 6,
    title: 'Position',
    subtitle: 'Why acting later wins',
    icon: '🎯',
    concept: [
      'Position is your seat relative to the button and the order in which you act.',
      'Acting later means more information — the Button is the best seat, UTG the toughest.',
      'Play tight from early position and loosen up as you get closer to the button.',
    ],
    lesson: positionLesson,
    generate: generatePositionDrill,
    drillsPerSession: 10,
    masteryNeeded: 8,
  },
];

export function getLevel(id: number): LevelDef | undefined {
  return LEVELS.find((l) => l.id === id);
}
