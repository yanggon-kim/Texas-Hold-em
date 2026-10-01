import { describe, it, expect } from 'vitest';
import { makeDeck, shuffle, draw, mulberry32, shuffledDeck } from '../src/engine/deck';
import { cardId } from '../src/engine/card';

describe('덱', () => {
  it('서로 다른 카드 52장을 만든다', () => {
    const deck = makeDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map(cardId)).size).toBe(52);
  });

  it('섞어도 카드 구성은 그대로다', () => {
    const deck = makeDeck();
    const shuffled = shuffle(deck, mulberry32(42));
    expect(shuffled).toHaveLength(52);
    expect(new Set(shuffled.map(cardId)).size).toBe(52);
  });

  it('같은 시드로 섞으면 결과가 같다', () => {
    const a = shuffledDeck(mulberry32(7)).map(cardId);
    const b = shuffledDeck(mulberry32(7)).map(cardId);
    expect(a).toEqual(b);
  });

  it('draw는 요청한 장수를 뽑고 나머지를 남긴다', () => {
    const deck = makeDeck();
    const { drawn, rest } = draw(deck, 5);
    expect(drawn).toHaveLength(5);
    expect(rest).toHaveLength(47);
  });

  it('남은 장수보다 많이 뽑으면 오류를 던진다', () => {
    expect(() => draw(makeDeck(), 53)).toThrow();
  });
});
