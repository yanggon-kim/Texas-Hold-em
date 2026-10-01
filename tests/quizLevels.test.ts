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
  ['레벨 4 테이블과 진행', generateTableFlowDrill],
  ['레벨 5 베팅 액션', generateActionsDrill],
  ['레벨 6 포지션', generatePositionDrill],
  ['레벨 7 스타팅 핸드', generateStartingHandDrill],
  ['레벨 8 아웃츠와 팟 오즈', generateOddsDrill],
  ['레벨 9 보드 읽기', generateBoardDrill],
];

describe('퀴즈 레벨이 올바른 문제를 만든다', () => {
  for (const [name, generate] of generators) {
    it(`${name} — 60번 생성해도 형태가 올바르다`, () => {
      for (let seed = 1; seed <= 60; seed++) {
        const drill = generate(mulberry32(seed));
        // 보기 2개 이상, 모두 서로 다르고, 정답 인덱스는 범위 안에 하나.
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
