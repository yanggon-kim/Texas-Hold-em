import { type Drill, type Rng } from './types';
import { type QuizItem, quizDrill } from './quiz';

/** Level 4 — the table, the button, the blinds, and the four betting rounds. */
const ITEMS: QuizItem[] = [
  {
    prompt: 'How many private "hole" cards does each player get?',
    correct: '2',
    distractors: ['1', '3', '5'],
    explanation: 'Each player is dealt exactly 2 hole cards, face down.',
  },
  {
    prompt: 'How many community cards are there in total by the river?',
    correct: '5',
    distractors: ['3', '4', '7'],
    explanation: 'Five community cards are shared: 3 on the flop, 1 on the turn, 1 on the river.',
  },
  {
    prompt: 'How many cards are dealt on the flop?',
    correct: '3',
    distractors: ['1', '2', '5'],
    explanation: 'The flop is the first three community cards, dealt at once.',
  },
  {
    prompt: 'How many cards are dealt on the turn?',
    correct: '1',
    distractors: ['2', '3', '0'],
    explanation: 'The turn is a single community card (the 4th), followed by a betting round.',
  },
  {
    prompt: 'How many cards are dealt on the river?',
    correct: '1',
    distractors: ['2', '3', '5'],
    explanation: 'The river is the final single community card (the 5th).',
  },
  {
    prompt: 'What is the correct order of the betting rounds?',
    correct: 'Pre-flop → Flop → Turn → River',
    distractors: [
      'Flop → Pre-flop → Turn → River',
      'Pre-flop → Turn → Flop → River',
      'Flop → Turn → River → Pre-flop',
    ],
    explanation: 'Betting goes Pre-flop, then Flop, Turn, and River — in that order.',
  },
  {
    prompt: 'Which betting round comes immediately after the flop?',
    correct: 'The turn',
    distractors: ['The river', 'Pre-flop', 'The showdown'],
    explanation: 'Order is flop → turn → river. The turn follows the flop.',
  },
  {
    prompt: 'Which betting round comes first?',
    correct: 'Pre-flop',
    distractors: ['The flop', 'The turn', 'The river'],
    explanation: 'Pre-flop betting happens right after the hole cards are dealt, before any community cards.',
  },
  {
    prompt: 'Who posts the small blind?',
    correct: 'The player to the left of the dealer button',
    distractors: [
      'The player on the button',
      'The player to the right of the button',
      'Everyone at the table',
    ],
    explanation: 'The small blind is posted by the player directly left of the button; the big blind is the next player left.',
  },
  {
    prompt: 'What are the blinds?',
    correct: 'Forced bets that start the action before the cards are seen',
    distractors: [
      'Optional bets only the dealer makes',
      'Bets placed only after the river',
      'A penalty for folding too often',
    ],
    explanation: 'The small and big blinds are forced bets that seed the pot and get betting started each hand.',
  },
  {
    prompt: 'What does the dealer button do?',
    correct: 'Marks who is "the dealer" and rotates clockwise each hand',
    distractors: [
      'Marks the player who must fold',
      'Shows who has the best hand',
      'Stays with the same player all game',
    ],
    explanation: 'The button rotates one seat clockwise each hand, which also moves the blinds around the table.',
  },
  {
    prompt: 'After the final betting round, if two or more players remain, what happens?',
    correct: 'The showdown — players reveal cards and the best hand wins',
    distractors: [
      'Another community card is dealt',
      'The blinds are posted again',
      'The pot is split evenly no matter what',
    ],
    explanation: 'At the showdown, remaining players show their hands and the best 5-card hand wins the pot.',
  },
  {
    prompt: 'Why is a card "burned" before the flop, turn, and river?',
    correct: 'To guard against cheating with a marked top card',
    distractors: [
      'To make the deck smaller',
      'To give the dealer an extra card',
      'To restart the betting',
    ],
    explanation: 'The dealer discards (burns) the top card face down before each community deal as an anti-cheating measure.',
  },
];

export function generateTableFlowDrill(rng: Rng): Drill {
  return quizDrill(rng, ITEMS);
}
