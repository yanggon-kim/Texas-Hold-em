import { SUITS, SUIT_NAME, cardName, isRed } from '../engine/card';
import { shuffledDeck } from '../engine/deck';
import { type Drill, type Rng, shuffledOptions } from './types';

/** Level 1 — recognize the 52 cards, their suits, and their colours. */
export function generateCardDrill(rng: Rng): Drill {
  const variant = Math.floor(rng() * 3);
  const deck = shuffledDeck(rng);
  const card = deck[0];

  if (variant === 0) {
    // Name this card.
    const distractors = deck.slice(1, 4).map(cardName);
    const { options, correctIndex } = shuffledOptions(rng, cardName(card), distractors);
    return {
      prompt: 'Which card is this?',
      visual: { cards: [card] },
      options,
      correctIndex,
      explanation: `This is the ${cardName(card)}.`,
    };
  }

  if (variant === 1) {
    // Which suit?
    const correct = SUIT_NAME[card.suit];
    const distractors = SUITS.filter((s) => s !== card.suit).map((s) => SUIT_NAME[s]);
    const { options, correctIndex } = shuffledOptions(rng, correct, distractors.slice(0, 3));
    return {
      prompt: 'What suit is this card?',
      visual: { cards: [card] },
      options,
      correctIndex,
      explanation: `The ${card.suit} symbol is the suit of ${SUIT_NAME[card.suit]}.`,
    };
  }

  // Red or black?
  const correct = isRed(card) ? 'Red' : 'Black';
  const options = ['Red', 'Black'];
  return {
    prompt: 'Is this card red or black?',
    visual: { cards: [card] },
    options,
    correctIndex: options.indexOf(correct),
    explanation: `Hearts ♥ and diamonds ♦ are red; spades ♠ and clubs ♣ are black. ${SUIT_NAME[card.suit]} is ${correct.toLowerCase()}.`,
  };
}
