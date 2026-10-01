import { describe, it, expect } from 'vitest';
import { mulberry32 } from '../src/engine/deck';
import { LEVELS } from '../src/drills/levels';
import {
  cardsLesson,
  rankingsLesson,
  bestHandLesson,
  tableFlowLesson,
  actionsLesson,
  positionLesson,
  startingHandsLesson,
  oddsLesson,
  boardLesson,
} from '../src/drills/lessons';
import { evaluateHand, CATEGORY_NAME } from '../src/engine/handEvaluator';
import { ALL_CATEGORIES } from '../src/drills/categories';

describe('모든 레벨에 학습 단계가 있다', () => {
  it('모든 레벨이 학습 생성기를 정의한다', () => {
    for (const level of LEVELS) {
      expect(level.lesson, `레벨 ${level.id}에 학습 단계가 있어야 합니다`).toBeTypeOf('function');
    }
  });
});

describe('학습 카드가 올바른 형태로 만들어진다', () => {
  const all = [
    cardsLesson,
    rankingsLesson,
    bestHandLesson,
    tableFlowLesson,
    actionsLesson,
    positionLesson,
    startingHandsLesson,
    oddsLesson,
    boardLesson,
  ];
  for (const gen of all) {
    it(`${gen.name} 카드에 용어와 정의가 있다`, () => {
      const cards = gen(mulberry32(3));
      expect(cards.length).toBeGreaterThan(0);
      for (const card of cards) {
        expect(card.term.length).toBeGreaterThan(0);
        expect(card.definition.length).toBeGreaterThan(0);
      }
    });
  }
});

describe('레벨 2 족보 학습', () => {
  it('족보 사다리 개요로 시작해, 10가지 족보를 강한 순서로 보여 준다', () => {
    const cards = rankingsLesson(mulberry32(9));
    // 개요 카드 1장 + 족보 카드 10장.
    expect(cards).toHaveLength(ALL_CATEGORIES.length + 1);
    expect(cards[0].diagram).toEqual({ kind: 'rankLadder' });

    const handCards = cards.slice(1);
    // 첫 번째 족보 예시는 로열 플러시(족보 9)여야 한다.
    const firstExample = handCards[0].example?.cards;
    expect(firstExample).toBeDefined();
    expect(evaluateHand(firstExample!).category).toBe(9);
    // 족보 카드는 강한 순서대로 한국어 족보 이름을 제목으로 쓴다.
    const strongestFirst = [...ALL_CATEGORIES].reverse();
    handCards.forEach((card, i) => {
      expect(card.term).toContain(CATEGORY_NAME[strongestFirst[i]]);
    });
  });
});
