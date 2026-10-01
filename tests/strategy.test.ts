import { describe, it, expect } from 'vitest';
import { classifyStartingHand, shouldPlay } from '../src/engine/startingHands';
import { parseCard } from '../src/engine/handEvaluator';
import { boardNuts, flushPossible, isPaired, maxSuitCount } from '../src/engine/board';
import { HandCategory } from '../src/engine/handEvaluator';

const c = (label: string) => parseCard(label);

describe('스타팅 핸드 — 분류', () => {
  it('프리미엄 핸드를 분류한다', () => {
    expect(classifyStartingHand(c('A♠'), c('A♦')).tier).toBe('premium'); // AA
    expect(classifyStartingHand(c('K♠'), c('K♦')).tier).toBe('premium'); // KK
    expect(classifyStartingHand(c('A♠'), c('K♠')).tier).toBe('premium'); // AKs
    expect(classifyStartingHand(c('A♠'), c('K♦')).tier).toBe('premium'); // AKo
  });

  it('플레이 가능 핸드와 트래시 핸드를 분류한다', () => {
    expect(classifyStartingHand(c('7♥'), c('6♥')).tier).toBe('playable'); // 76s 커넥터
    expect(classifyStartingHand(c('5♣'), c('5♦')).tier).toBe('playable'); // 55
    expect(classifyStartingHand(c('7♣'), c('2♦')).tier).toBe('trash'); // 72o
    expect(classifyStartingHand(c('J♣'), c('4♦')).tier).toBe('trash'); // J4o
  });

  it('표준 코드를 만든다', () => {
    expect(classifyStartingHand(c('K♠'), c('A♠')).code).toBe('AKs');
    expect(classifyStartingHand(c('2♦'), c('7♣')).code).toBe('72o');
    expect(classifyStartingHand(c('Q♥'), c('Q♣')).code).toBe('QQ');
  });

  it('화면에 보여 줄 한국어 이름을 만든다', () => {
    expect(classifyStartingHand(c('K♠'), c('A♠')).name).toBe('에이스·킹 수티드');
    expect(classifyStartingHand(c('2♦'), c('7♣')).name).toBe('7·2 오프수트');
    expect(classifyStartingHand(c('Q♥'), c('Q♣')).name).toBe('퀸 페어');
  });

  it('플레이/폴드 결정이 포지션을 따른다', () => {
    expect(shouldPlay('premium', 'early')).toBe(true);
    expect(shouldPlay('playable', 'early')).toBe(false);
    expect(shouldPlay('playable', 'late')).toBe(true);
    expect(shouldPlay('trash', 'late')).toBe(false);
  });
});

describe('보드 읽기', () => {
  it('플러시 가능성과 페어 보드를 감지한다', () => {
    expect(flushPossible([c('Q♠'), c('8♠'), c('3♠'), c('J♥'), c('2♦')])).toBe(true);
    expect(flushPossible([c('Q♠'), c('8♠'), c('3♦'), c('J♥'), c('2♦')])).toBe(false);
    expect(isPaired([c('8♣'), c('8♦'), c('K♠'), c('4♥'), c('2♣')])).toBe(true);
    expect(isPaired([c('8♣'), c('9♦'), c('K♠'), c('4♥'), c('2♣')])).toBe(false);
    expect(maxSuitCount([c('Q♠'), c('8♠'), c('3♠'), c('J♠'), c('2♦')])).toBe(4);
  });

  it('넛츠 찾기: 한 무늬로 로열에 4장이 모이면 로열 플러시가 가능하다', () => {
    // 보드 A♠ K♠ Q♠ J♠ 2♦ — 10♠를 가진 사람은 로열 플러시다.
    const nuts = boardNuts([c('A♠'), c('K♠'), c('Q♠'), c('J♠'), c('2♦')]);
    expect(nuts.category).toBe(HandCategory.RoyalFlush);
  });

  it('넛츠 찾기: 포카드 보드에서는 포카드가 가장 좋다', () => {
    // 보드 K♣ K♦ K♠ K♥ 2♦ — 넛츠는 에이스 키커의 K 포카드다.
    const nuts = boardNuts([c('K♣'), c('K♦'), c('K♠'), c('K♥'), c('2♦')]);
    expect(nuts.category).toBe(HandCategory.FourOfAKind);
  });
});
