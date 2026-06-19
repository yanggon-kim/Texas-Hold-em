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

describe('applyResult — session accumulation', () => {
  it('accumulates totals and trend across mastery and endless sessions', () => {
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

  it('only a passing mastery session marks the level mastered', () => {
    let p = fresh();
    // Endless never masters, even at 100%.
    const endless = applyResult(p, { mode: 'endless', correct: 10, answered: 10 }, 8);
    expect(endless.mastered).toBe(false);
    expect(endless.next.mastered).toBe(false);

    // A mastery session below the threshold also doesn't master.
    p = applyResult(endless.next, { mode: 'mastery', correct: 7, answered: 10 }, 8).next;
    expect(p.mastered).toBe(false);

    // A passing mastery session does.
    const pass = applyResult(p, { mode: 'mastery', correct: 9, answered: 10 }, 8);
    expect(pass.mastered).toBe(true);
    expect(pass.next.mastered).toBe(true);
  });

  it('mastery stays sticky once earned', () => {
    let p = applyResult(fresh(), { mode: 'mastery', correct: 9, answered: 10 }, 8).next;
    p = applyResult(p, { mode: 'mastery', correct: 2, answered: 10 }, 8).next; // bad session
    expect(p.mastered).toBe(true);
  });

  it('caps the trend at 12 recent sessions', () => {
    let p = fresh();
    for (let i = 0; i < 20; i++) {
      p = applyResult(p, { mode: 'endless', correct: 1, answered: 1 }, 8).next;
    }
    expect(p.recentAccuracy).toHaveLength(12);
  });
});

describe('levelAccuracy / isUnlocked', () => {
  it('returns null accuracy before any practice', () => {
    expect(levelAccuracy(fresh())).toBeNull();
  });

  it('unlocks level 2 only when level 1 is mastered', () => {
    const state: ProgressState = { 1: fresh(), 2: fresh() };
    expect(isUnlocked(state, 1)).toBe(true); // first level always unlocked
    expect(isUnlocked(state, 2)).toBe(false);
    state[1] = applyResult(state[1], { mode: 'mastery', correct: 10, answered: 10 }, 8).next;
    expect(isUnlocked(state, 2)).toBe(true);
  });
});
