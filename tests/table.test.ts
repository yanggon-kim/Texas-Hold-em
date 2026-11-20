import { describe, it, expect } from 'vitest';
import { mulberry32, shuffledDeck } from '../src/engine/deck';
import { evaluateHand, parseCard, HandCategory } from '../src/engine/handEvaluator';
import { cardToInt, categoryOf, evalInts } from '../src/engine/fastEval';
import { estimateEquity, finalCategoryOdds, findOuts } from '../src/engine/equity';
import { Glosser } from '../src/engine/glossary';
import {
  makePlayers,
  startHand,
  applyAction,
  legalActions,
  actingOrder,
  playersActingAfterPostflop,
  type GameState,
} from '../src/engine/game';
import { decideBotAction } from '../src/engine/bot';
import { coachAdvice } from '../src/engine/coach';
import { narrateBotAction, narrateHandStart, narrateMyAction } from '../src/engine/narration';

const cards = (s: string) => s.split(' ').map(parseCard);

describe('빠른 평가기', () => {
  it('족보 종류와 승패 비교가 기본 평가기와 같다', () => {
    const rng = mulberry32(42);
    for (let t = 0; t < 1500; t++) {
      const deck = shuffledDeck(rng);
      const a = deck.slice(0, 7);
      const b = deck.slice(7, 14);
      const ra = evaluateHand(a);
      const rb = evaluateHand(b);
      const fa = evalInts(a.map(cardToInt));
      const fb = evalInts(b.map(cardToInt));
      expect(categoryOf(fa)).toBe(ra.category);
      const slow = Math.sign(ra.score.reduce((d, v, i) => d || v - (rb.score[i] ?? 0), 0));
      expect(Math.sign(fa - fb)).toBe(slow);
    }
  });

  it('휠 스트레이트와 로열 플러시를 알아본다', () => {
    expect(categoryOf(evalInts(cards('A♠ 2♥ 3♦ 4♣ 5♠').map(cardToInt)))).toBe(HandCategory.Straight);
    expect(categoryOf(evalInts(cards('A♠ K♠ Q♠ J♠ 10♠').map(cardToInt)))).toBe(HandCategory.RoyalFlush);
  });
});

describe('승률과 족보 확률', () => {
  it('에이스 페어는 무작위 패 1명을 상대로 약 85% 이긴다', () => {
    const r = estimateEquity(cards('A♠ A♥'), [], ['any'], mulberry32(1), 4000);
    expect(r.equity).toBeGreaterThan(0.8);
    expect(r.equity).toBeLessThan(0.9);
  });

  it('리버까지의 족보 확률은 합이 1이고, 리버에서는 지금 족보가 100%다', () => {
    const flop = finalCategoryOdds(cards('A♠ K♠'), cards('2♠ 7♠ 9♦'));
    expect(flop.exact).toBe(true);
    expect(flop.odds.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);
    const river = finalCategoryOdds(cards('A♠ K♠'), cards('2♠ 7♠ 9♦ J♣ 3♥'));
    expect(river.odds[HandCategory.HighCard]).toBe(1);
  });

  it('플러시 드로우의 아웃츠는 플러시가 되는 카드 9장이다', () => {
    const outs = findOuts(cards('A♠ K♠'), cards('2♠ 7♠ 9♦'));
    const flush = outs.byCategory.find((o) => o.category === HandCategory.Flush);
    expect(flush?.count).toBe(9);
  });
});

describe('용어 설명', () => {
  it('처음 쓸 때만 뜻을 붙이고, 조사는 용어에 맞춘다', () => {
    const g = new Glosser();
    const first = g.t('프리플랍', '이/가');
    expect(first.startsWith('프리플랍(')).toBe(true);
    expect(first.endsWith(')이')).toBe(true);
    expect(g.t('프리플랍', '이/가')).toBe('프리플랍이');
    expect(g.t('콜', '을/를')).toMatch(/^콜\(.+\)을$/);
  });
});

describe('블라인드와 자리', () => {
  it('칩이 없는 자리는 건너뛰고 블라인드를 낸다', () => {
    const players = makePlayers(3, 1000);
    players[1].chips = 0; // 버튼(0번 인덱스) 바로 왼쪽이 칩 없음
    const s = startHand(players, 0, 20, mulberry32(2));
    expect(s.sbIndex).toBe(2);
    expect(s.bbIndex).toBe(3);
    expect(s.pot).toBe(30);
    expect(actingOrder(s)).not.toContain(1);
  });

  it('헤즈업에서는 버튼이 스몰 블라인드를 내고 프리플랍에서 먼저 행동한다', () => {
    const players = makePlayers(1, 1000);
    const s = startHand(players, 0, 20, mulberry32(3));
    expect(s.sbIndex).toBe(0);
    expect(s.bbIndex).toBe(1);
    expect(s.toAct).toBe(0);
  });

  it('버튼은 플랍 이후 가장 마지막에 행동한다', () => {
    const s = startHand(makePlayers(3, 1000), 2, 20, mulberry32(4));
    expect(playersActingAfterPostflop(s, 2)).toBe(0);
    expect(playersActingAfterPostflop(s, 3)).toBe(3);
  });
});

describe('핸드 결과', () => {
  it('순이익의 합은 0이고, 낸 칩과 받은 칩이 맞는다', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const rng = mulberry32(seed);
      let s = startHand(makePlayers(3, 1000), seed % 4, 20, rng);
      let guard = 0;
      while (s.street !== 'complete' && s.toAct >= 0 && guard++ < 300) {
        s = applyAction(s, decideBotAction(s, rng, 'hard'));
      }
      const o = s.outcome!;
      expect(Object.values(o.net).reduce((a, b) => a + b, 0)).toBe(0);
      for (const pot of o.pots) {
        expect(pot.winners.every((w) => pot.eligible.includes(w))).toBe(true);
      }
    }
  });
});

describe('코치와 해설', () => {
  it('여러 핸드에서 설명이 비어 있지 않고 숫자 오류가 없다', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const rng = mulberry32(seed * 101);
      let s: GameState = startHand(makePlayers(3, 1000), seed % 4, 20, rng);
      const texts: string[] = [narrateHandStart(s).sections.flatMap((x) => x.lines).join(' ')];
      let guard = 0;
      while (s.street !== 'complete' && s.toAct >= 0 && guard++ < 300) {
        const prev = s;
        if (s.players[s.toAct].isHuman) {
          const advice = coachAdvice(s, rng);
          expect(advice.sections.length).toBeGreaterThanOrEqual(5);
          texts.push(advice.headline, ...advice.sections.flatMap((x) => x.lines));
          const legal = legalActions(s);
          const action =
            advice.action === 'raise'
              ? { type: 'raise' as const, amount: advice.raiseTo }
              : { type: advice.action };
          s = applyAction(s, action);
          if (!legal.canCheck || action.type !== 'check') {
            texts.push(...narrateMyAction(prev, s, action, advice).sections.flatMap((x) => x.lines));
          }
        } else {
          const action = decideBotAction(s, rng, 'normal');
          s = applyAction(s, action);
          texts.push(...narrateBotAction(prev, s, action, 'normal').sections.flatMap((x) => x.lines));
        }
      }
      const all = texts.join(' ');
      expect(all).not.toMatch(/NaN|undefined|Infinity/);
    }
  });
});
