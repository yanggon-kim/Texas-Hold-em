import { describe, it, expect } from 'vitest';
import { classifyStartingHand, shouldPlay } from '../src/engine/startingHands';
import { parseCard } from '../src/engine/handEvaluator';
import { boardNuts, flushPossible, isPaired, maxSuitCount } from '../src/engine/board';
import { HandCategory } from '../src/engine/handEvaluator';

const c = (label: string) => parseCard(label);

describe('startingHands — classification', () => {
  it('classifies premium hands', () => {
    expect(classifyStartingHand(c('A♠'), c('A♦')).tier).toBe('premium'); // AA
    expect(classifyStartingHand(c('K♠'), c('K♦')).tier).toBe('premium'); // KK
    expect(classifyStartingHand(c('A♠'), c('K♠')).tier).toBe('premium'); // AKs
    expect(classifyStartingHand(c('A♠'), c('K♦')).tier).toBe('premium'); // AKo
  });

  it('classifies playable and trash hands', () => {
    expect(classifyStartingHand(c('7♥'), c('6♥')).tier).toBe('playable'); // 76s connector
    expect(classifyStartingHand(c('5♣'), c('5♦')).tier).toBe('playable'); // 55
    expect(classifyStartingHand(c('7♣'), c('2♦')).tier).toBe('trash'); // 72o
    expect(classifyStartingHand(c('J♣'), c('4♦')).tier).toBe('trash'); // J4o
  });

  it('produces canonical codes', () => {
    expect(classifyStartingHand(c('K♠'), c('A♠')).code).toBe('AKs');
    expect(classifyStartingHand(c('2♦'), c('7♣')).code).toBe('72o');
    expect(classifyStartingHand(c('Q♥'), c('Q♣')).code).toBe('QQ');
  });

  it('play/fold respects position', () => {
    expect(shouldPlay('premium', 'early')).toBe(true);
    expect(shouldPlay('playable', 'early')).toBe(false);
    expect(shouldPlay('playable', 'late')).toBe(true);
    expect(shouldPlay('trash', 'late')).toBe(false);
  });
});

describe('board reading', () => {
  it('detects flush possibility and pairing', () => {
    expect(flushPossible([c('Q♠'), c('8♠'), c('3♠'), c('J♥'), c('2♦')])).toBe(true);
    expect(flushPossible([c('Q♠'), c('8♠'), c('3♦'), c('J♥'), c('2♦')])).toBe(false);
    expect(isPaired([c('8♣'), c('8♦'), c('K♠'), c('4♥'), c('2♣')])).toBe(true);
    expect(isPaired([c('8♣'), c('9♦'), c('K♠'), c('4♥'), c('2♣')])).toBe(false);
    expect(maxSuitCount([c('Q♠'), c('8♠'), c('3♠'), c('J♠'), c('2♦')])).toBe(4);
  });

  it('finds the nuts: a royal flush is possible with four to a royal of one suit', () => {
    // Board A♠ K♠ Q♠ J♠ 2♦ — someone with T♠ has a royal flush.
    const nuts = boardNuts([c('A♠'), c('K♠'), c('Q♠'), c('J♠'), c('2♦')]);
    expect(nuts.category).toBe(HandCategory.RoyalFlush);
  });

  it('finds the nuts: quads board gives four of a kind as best', () => {
    // Board K♣ K♦ K♠ K♥ 2♦ — the nuts is four kings with an ace kicker.
    const nuts = boardNuts([c('K♣'), c('K♦'), c('K♠'), c('K♥'), c('2♦')]);
    expect(nuts.category).toBe(HandCategory.FourOfAKind);
  });
});
