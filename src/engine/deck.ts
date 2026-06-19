import { type Card, RANKS, SUITS } from './card';

/** A fresh, ordered 52-card deck. */
export function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

/**
 * Returns a shuffled copy of `cards` using Fisher–Yates.
 * `rng` defaults to Math.random but can be injected for deterministic tests.
 */
export function shuffle<T>(cards: readonly T[], rng: () => number = Math.random): T[] {
  const out = cards.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** A shuffled full deck. */
export function shuffledDeck(rng: () => number = Math.random): Card[] {
  return shuffle(makeDeck(), rng);
}

/**
 * Draw `count` cards from the front of `deck`, returning the drawn cards and
 * the remaining deck (does not mutate the input).
 */
export function draw(deck: readonly Card[], count: number): { drawn: Card[]; rest: Card[] } {
  if (count > deck.length) {
    throw new Error(`Cannot draw ${count} cards from a deck of ${deck.length}`);
  }
  return { drawn: deck.slice(0, count), rest: deck.slice(count) };
}

/**
 * A small seedable PRNG (mulberry32) so drills can be reproduced for testing
 * and so "replay this exact question" is possible later.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
