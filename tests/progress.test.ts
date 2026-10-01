import { describe, it, expect } from 'vitest';
import {
  applyResult,
  levelAccuracy,
  isUnlocked,
  type LevelProgress,
  type ProgressState,
} from '../src/state/progress';

const fresh = (): LevelProgress => ({
  mastered: false,
  bestScore: 0,
  attempts: 0,
  practiceSessions: 0,
  totalAnswered: 0,
  totalCorrect: 0,
  recentAccuracy: [],
});

describe('applyResult — 세션 누적', () => {
  it('마스터 세션과 무한 연습 세션의 합계와 추세를 누적한다', () => {
    let p = fresh();
    p = applyResult(p, { mode: 'mastery', correct: 8, answered: 10 }, 8).next;
    p = applyResult(p, { mode: 'endless', correct: 5, answered: 20 }, 8).next;

    expect(p.totalAnswered).toBe(30);
    expect(p.totalCorrect).toBe(13);
    expect(p.attempts).toBe(1);
    expect(p.practiceSessions).toBe(1);
    expect(p.recentAccuracy).toEqual([80, 25]); // 8/10, 5/20
    expect(levelAccuracy(p)).toBe(43); // 13/30 ≈ 43%
  });

  it('통과한 마스터 세션만 레벨을 마스터로 표시한다', () => {
    let p = fresh();
    // 무한 연습은 100%여도 마스터가 되지 않는다.
    const endless = applyResult(p, { mode: 'endless', correct: 10, answered: 10 }, 8);
    expect(endless.mastered).toBe(false);
    expect(endless.next.mastered).toBe(false);

    // 기준 미달인 마스터 세션도 마스터가 되지 않는다.
    p = applyResult(endless.next, { mode: 'mastery', correct: 7, answered: 10 }, 8).next;
    expect(p.mastered).toBe(false);

    // 통과한 마스터 세션은 마스터가 된다.
    const pass = applyResult(p, { mode: 'mastery', correct: 9, answered: 10 }, 8);
    expect(pass.mastered).toBe(true);
    expect(pass.next.mastered).toBe(true);
  });

  it('한 번 얻은 마스터는 유지된다', () => {
    let p = applyResult(fresh(), { mode: 'mastery', correct: 9, answered: 10 }, 8).next;
    p = applyResult(p, { mode: 'mastery', correct: 2, answered: 10 }, 8).next; // 나쁜 세션
    expect(p.mastered).toBe(true);
  });

  it('추세는 최근 12개 세션까지만 남긴다', () => {
    let p = fresh();
    for (let i = 0; i < 20; i++) {
      p = applyResult(p, { mode: 'endless', correct: 1, answered: 1 }, 8).next;
    }
    expect(p.recentAccuracy).toHaveLength(12);
  });
});

describe('levelAccuracy / isUnlocked', () => {
  it('연습 전에는 정확도로 null을 돌려준다', () => {
    expect(levelAccuracy(fresh())).toBeNull();
  });

  it('모든 레벨을 열린 것으로 취급한다 (잠금 없음)', () => {
    const state: ProgressState = { 1: fresh(), 2: fresh() };
    expect(isUnlocked(state, 1)).toBe(true);
    expect(isUnlocked(state, 2)).toBe(true); // 레벨 1을 마스터하기 전에도 들어갈 수 있다
  });
});
