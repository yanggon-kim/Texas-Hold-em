import { type Drill, type Rng } from './types';
import { type QuizItem, quizDrill } from './quiz';

/** Level 6 — table position and why acting later is an advantage. */
const ITEMS: QuizItem[] = [
  {
    prompt: 'What is "position" in poker?',
    correct: 'Where you sit relative to the button and the order you act in',
    distractors: [
      'How many chips you have',
      'The strength of your hand',
      'How long you have played at the table',
    ],
    explanation: 'Position is your seat relative to the dealer button, which sets when you act on each round.',
  },
  {
    prompt: 'Which is generally the most profitable position?',
    correct: 'The Button (BTN)',
    distractors: ['The small blind', 'Under the gun (UTG)', 'The big blind'],
    explanation: 'The button acts last after the flop, so it has the most information — the best seat in poker.',
  },
  {
    prompt: 'Acting later in a betting round gives you...',
    correct: 'More information about what opponents do',
    distractors: [
      'Worse odds on every hand',
      'A guaranteed winning hand',
      'Less time to decide',
    ],
    explanation: 'Seeing opponents act before you is a real edge — the core reason late position is valuable.',
  },
  {
    prompt: 'Which position acts first before the flop?',
    correct: 'Under the gun (the player left of the big blind)',
    distractors: ['The button', 'The big blind', 'The small blind'],
    explanation: 'Pre-flop, action starts "under the gun" — directly left of the big blind.',
  },
  {
    prompt: 'What does "UTG" stand for?',
    correct: 'Under the gun — the first seat to act pre-flop',
    distractors: [
      'Up to game — the chip leader',
      'Under the gun — the last seat to act',
      'A type of bet',
    ],
    explanation: 'UTG (under the gun) is the earliest position pre-flop and therefore the toughest spot.',
  },
  {
    prompt: 'How should you play from early position (like UTG)?',
    correct: 'Tight — only strong starting hands',
    distractors: [
      'Loose — play almost any two cards',
      'It makes no difference',
      'Always go all-in',
    ],
    explanation: 'Early position has the least information, so play a tight range of strong hands.',
  },
  {
    prompt: 'How can you adjust as you move to late position (near the button)?',
    correct: 'Loosen up — you can profitably play more hands',
    distractors: [
      'Tighten up to only aces',
      'Stop betting entirely',
      'Always fold',
    ],
    explanation: 'Late position lets you see others act first, so you can play a wider range of hands.',
  },
  {
    prompt: 'Two players are in a hand. Who "has position" on the other?',
    correct: 'The one who acts last after the flop',
    distractors: [
      'The one who acts first',
      'The one with more chips',
      'The one closest to the dealer',
    ],
    explanation: 'Having position means acting after your opponent on each post-flop street.',
  },
  {
    prompt: 'Which two seats must post forced bets and act early after the flop?',
    correct: 'The small blind and big blind',
    distractors: [
      'The button and the cutoff',
      'Under the gun and the button',
      'Only the dealer',
    ],
    explanation: 'The blinds pay forced bets and act first on the flop, turn, and river — a positional disadvantage.',
  },
  {
    prompt: 'Why is the button the best seat after the flop?',
    correct: 'It always acts last, with the most information',
    distractors: [
      'It is dealt an extra card',
      'It never has to bet',
      'It wins ties automatically',
    ],
    explanation: 'Acting last every post-flop round lets the button make the best-informed decisions.',
  },
];

export function generatePositionDrill(rng: Rng): Drill {
  return quizDrill(rng, ITEMS);
}
