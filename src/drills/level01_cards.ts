import { SUITS, SUIT_NAME, cardName, isRed } from '../engine/card';
import { shuffledDeck } from '../engine/deck';
import { type Drill, type Rng, shuffledOptions } from './types';
import { josa } from '../engine/josa';

/** 레벨 1 — 52장의 카드와 무늬, 색깔을 알아봅니다. */
export function generateCardDrill(rng: Rng): Drill {
  const variant = Math.floor(rng() * 3);
  const deck = shuffledDeck(rng);
  const card = deck[0];

  if (variant === 0) {
    // 이 카드의 이름은?
    const distractors = deck.slice(1, 4).map(cardName);
    const { options, correctIndex } = shuffledOptions(rng, cardName(card), distractors);
    return {
      prompt: '이 카드는 무엇인가요?',
      visual: { cards: [card] },
      options,
      correctIndex,
      explanation: `이 카드는 ${cardName(card)}입니다.`,
    };
  }

  if (variant === 1) {
    // 어떤 무늬인가?
    const correct = SUIT_NAME[card.suit];
    const distractors = SUITS.filter((s) => s !== card.suit).map((s) => SUIT_NAME[s]);
    const { options, correctIndex } = shuffledOptions(rng, correct, distractors.slice(0, 3));
    return {
      prompt: '이 카드의 무늬는 무엇인가요?',
      visual: { cards: [card] },
      options,
      correctIndex,
      explanation: `${card.suit} 기호는 ${SUIT_NAME[card.suit]} 무늬입니다.`,
    };
  }

  // 빨간색인가, 검은색인가?
  const correct = isRed(card) ? '빨간색' : '검은색';
  const options = ['빨간색', '검은색'];
  return {
    prompt: '이 카드는 빨간색인가요, 검은색인가요?',
    visual: { cards: [card] },
    options,
    correctIndex: options.indexOf(correct),
    explanation: `하트 ♥와 다이아몬드 ♦는 빨간색, 스페이드 ♠와 클럽 ♣는 검은색입니다. ${josa(SUIT_NAME[card.suit], '은/는')} ${correct}입니다.`,
  };
}
