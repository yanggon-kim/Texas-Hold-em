import { type Drill, type Rng } from './types';
import { type QuizItem, quizDrill } from './quiz';

/** Level 5 — the betting actions and when each one is available. */
const ITEMS: QuizItem[] = [
  {
    prompt: 'What does it mean to "call"?',
    correct: 'Match the current bet to stay in the hand',
    distractors: [
      'Increase the current bet',
      'Give up your hand',
      'Pass without betting',
    ],
    explanation: 'Calling means putting in exactly enough chips to match the current bet.',
  },
  {
    prompt: 'What does it mean to "raise"?',
    correct: 'Increase the current bet',
    distractors: [
      'Match the current bet',
      'Bet all of your chips',
      'Pass the action without betting',
    ],
    explanation: 'A raise increases the bet; other players must then match the new, higher amount to continue.',
  },
  {
    prompt: 'What does it mean to "fold"?',
    correct: 'Give up your hand and forfeit the pot',
    distractors: [
      'Match the current bet',
      'Bet all of your chips',
      'Pass without betting',
    ],
    explanation: 'Folding discards your hand. You put in no more chips but cannot win the pot.',
  },
  {
    prompt: 'What does it mean to "check"?',
    correct: 'Pass the action without betting (only if no bet is pending)',
    distractors: [
      'Match the current bet',
      'Increase the current bet',
      'Bet all of your chips',
    ],
    explanation: 'Checking passes the action along. It is only allowed when no one has bet in the current round.',
  },
  {
    prompt: 'What does "all-in" mean?',
    correct: 'Bet all of your remaining chips',
    distractors: [
      'Fold every hand for a round',
      'Match the big blind exactly',
      'Split the pot voluntarily',
    ],
    explanation: 'Going all-in commits all your chips. You can still win, but only up to the amount you contributed.',
  },
  {
    prompt: 'It is your turn and no one has bet yet this round. You want to stay in for free. What do you do?',
    correct: 'Check',
    distractors: ['Call', 'Fold', 'Raise'],
    explanation: 'With no bet in front of you, checking lets you stay in without putting in chips.',
  },
  {
    prompt: 'A player bets $10. You put in exactly $10 to stay in. What is this called?',
    correct: 'A call',
    distractors: ['A raise', 'A check', 'A fold'],
    explanation: 'Matching the exact amount of the current bet is a call.',
  },
  {
    prompt: 'There is a bet in front of you. Which actions are available?',
    correct: 'Fold, call, or raise',
    distractors: [
      'Check, call, or fold',
      'Only call or fold',
      'Check or raise only',
    ],
    explanation: 'Once there is a bet, you cannot check — you may fold, call, or raise.',
  },
  {
    prompt: 'Can you "check" when there is already a bet in front of you?',
    correct: 'No — you must fold, call, or raise',
    distractors: [
      'Yes, checking is always allowed',
      'Yes, but only on the river',
      'Only if you are on the button',
    ],
    explanation: 'Checking is only possible when no bet is pending. With a bet to face, your options are fold/call/raise.',
  },
  {
    prompt: 'You have a strong hand and want to build the pot. Which action increases the amount others must pay?',
    correct: 'Raise',
    distractors: ['Check', 'Call', 'Fold'],
    explanation: 'Raising grows the pot and pressures opponents — the standard aggressive play with strong hands.',
  },
  {
    prompt: 'You have a weak hand and someone makes a big bet you don\'t want to match. Best basic option?',
    correct: 'Fold',
    distractors: ['Call anyway', 'Check', 'Go all-in'],
    explanation: 'Folding weak hands to big bets saves chips — avoiding costly chases is a core beginner rule.',
  },
];

export function generateActionsDrill(rng: Rng): Drill {
  return quizDrill(rng, ITEMS);
}
