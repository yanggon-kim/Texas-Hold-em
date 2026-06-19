import { describe, it, expect } from 'vitest';
import { mulberry32 } from '../src/engine/deck';
import { generateTableFlowDrill } from '../src/drills/level04_tableFlow';
import { generateActionsDrill } from '../src/drills/level05_actions';
import { generatePositionDrill } from '../src/drills/level06_position';
import type { DrillGenerator } from '../src/drills/types';

const generators: Array<[string, DrillGenerator]> = [
  ['Level 4 Table & Flow', generateTableFlowDrill],
  ['Level 5 Betting Actions', generateActionsDrill],
  ['Level 6 Position', generatePositionDrill],
];

describe('quiz-based levels produce valid drills', () => {
  for (const [name, generate] of generators) {
    it(`${name} — 100 generations are well-formed`, () => {
      for (let seed = 1; seed <= 100; seed++) {
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
