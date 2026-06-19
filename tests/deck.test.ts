import { describe, it, expect } from 'vitest';
import { makeDeck, shuffle, draw, mulberry32, shuffledDeck } from '../src/engine/deck';
import { cardId } from '../src/engine/card';

describe('deck', () => {
  it('makes 52 unique cards', () => {
    const deck = makeDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map(cardId)).size).toBe(52);
  });

  it('shuffle preserves the multiset of cards', () => {
    const deck = makeDeck();
    const shuffled = shuffle(deck, mulberry32(42));
    expect(shuffled).toHaveLength(52);
    expect(new Set(shuffled.map(cardId)).size).toBe(52);
  });

  it('shuffle is deterministic for a fixed seed', () => {
    const a = shuffledDeck(mulberry32(7)).map(cardId);
    const b = shuffledDeck(mulberry32(7)).map(cardId);
    expect(a).toEqual(b);
  });

  it('draw returns the requested count and leaves the rest', () => {
    const deck = makeDeck();
    const { drawn, rest } = draw(deck, 5);
    expect(drawn).toHaveLength(5);
    expect(rest).toHaveLength(47);
  });

  it('draw throws when over-drawing', () => {
    expect(() => draw(makeDeck(), 53)).toThrow();
  });
});
