import { type Card, RANKS, SUITS } from './card';

/** 순서대로 정렬된 새 52장 덱. */
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
 * 피셔–예이츠 방식으로 `cards`를 섞은 사본을 돌려줍니다.
 * `rng`의 기본값은 Math.random이며, 결정적 테스트를 위해 주입할 수 있습니다.
 */
export function shuffle<T>(cards: readonly T[], rng: () => number = Math.random): T[] {
  const out = cards.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** 섞인 전체 덱. */
export function shuffledDeck(rng: () => number = Math.random): Card[] {
  return shuffle(makeDeck(), rng);
}

/**
 * `deck` 앞쪽에서 `count`장을 뽑아, 뽑은 카드와 남은 덱을 돌려줍니다
 * (입력은 변경하지 않습니다).
 */
export function draw(deck: readonly Card[], count: number): { drawn: Card[]; rest: Card[] } {
  if (count > deck.length) {
    throw new Error(`${deck.length}장짜리 덱에서 ${count}장을 뽑을 수 없습니다`);
  }
  return { drawn: deck.slice(0, count), rest: deck.slice(count) };
}

/**
 * 시드를 줄 수 있는 작은 의사난수 생성기(mulberry32). 테스트에서 문제를 재현하고,
 * 나중에 "이 문제 다시 풀기"를 가능하게 합니다.
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
