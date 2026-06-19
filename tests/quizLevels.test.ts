import { describe, it, expect } from 'vitest';
import { mulberry32 } from '../src/engine/deck';
import { generateTableFlowDrill } from '../src/drills/level04_tableFlow';
import { generateActionsDrill } from '../src/drills/level05_actions';
import { generatePositionDrill } from '../src/drills/level06_position';
import { generateStartingHandDrill } from '../src/drills/level07_startingHands';
import { generateOddsDrill } from '../src/drills/level08_odds';
import { generateBoardDrill } from '../src/drills/level09_board';
import type { DrillGenerator } from '../src/drills/types';

const generators: Array<[string, DrillGenerator]> = [
  ['Level 4 Table & Flow', generateTableFlowDrill],
  ['Level 5 Betting Actions', generateActionsDrill],
  ['Level 6 Position', generatePositionDrill],
  ['Level 7 Starting Hands', generateStartingHandDrill],
  ['Level 8 Outs & Pot Odds', generateOddsDrill],
  ['Level 9 Reading the Board', generateBoardDrill],
];

describe('quiz-based levels produce valid drills', () => {
  for (const [name, generate] of generators) {
    it(`${name} — 60 generations are well-formed`, () => {
      for (let seed = 1; seed <= 60; seed++) {
        const drill = generate(mulberry32(seed));
        // At least 2 options, all unique, exactly one correct index in range.
        expect(drill.options.length).toBeGreaterThanOrEqual(2);
        expect(new Set(drill.options).size).toBe(drill.options.length);
        expect(drill.correctIndex).toBeGreaterThanOrEqual(0);
        expect(drill.correctIndex).toBeLessThan(drill.options.length);
        expect(drill.prompt.length).toBeGreaterThan(0);
        expect(drill.explanation.length).toBeGreaterThan(0);
      }
    });
  }
});
