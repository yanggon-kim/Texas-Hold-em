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
} from '../src/drills/lessons';
import { evaluateHand } from '../src/engine/handEvaluator';
import { ALL_CATEGORIES } from '../src/drills/categories';

describe('every level has a study lesson', () => {
  it('all 6 levels define a lesson generator', () => {
    for (const level of LEVELS) {
      expect(level.lesson, `level ${level.id} should have a lesson`).toBeTypeOf('function');
    }
  });
});

describe('lessons produce well-formed cards', () => {
  const all = [
    cardsLesson,
    rankingsLesson,
    bestHandLesson,
    tableFlowLesson,
    actionsLesson,
    positionLesson,
  ];
  for (const gen of all) {
    it(`${gen.name} cards have a term and definition`, () => {
      const cards = gen(mulberry32(3));
      expect(cards.length).toBeGreaterThan(0);
      for (const card of cards) {
        expect(card.term.length).toBeGreaterThan(0);
        expect(card.definition.length).toBeGreaterThan(0);
      }
    });
  }
});

describe('Level 2 rankings lesson', () => {
  it('covers all 10 hands, strongest first, with correct example cards', () => {
    const cards = rankingsLesson(mulberry32(9));
    expect(cards).toHaveLength(ALL_CATEGORIES.length);
    // Strongest first: first example should be a Royal Flush (category 9).
    const firstExample = cards[0].example?.cards;
    expect(firstExample).toBeDefined();
    expect(evaluateHand(firstExample!).category).toBe(9);
    // Every card carries a Korean translation.
    for (const card of cards) {
      expect(card.korean, `${card.term} should have Korean`).toBeTruthy();
    }
  });
});
