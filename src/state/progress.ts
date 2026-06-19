import { useCallback, useEffect, useState } from 'react';
import { LEVELS } from '../drills/levels';

const STORAGE_KEY = 'th-learn-progress-v1';
const MAX_TREND = 12; // how many recent session accuracies to remember

export type SessionMode = 'mastery' | 'endless';

export interface LevelProgress {
  mastered: boolean;
  bestScore: number; // best correct count in a single mastery session
  attempts: number; // number of mastery sessions
  practiceSessions: number; // number of endless sessions
  totalAnswered: number; // cumulative questions answered (all modes)
  totalCorrect: number; // cumulative correct answers (all modes)
  recentAccuracy: number[]; // accuracy % of the last few sessions, oldest → newest
}

export type ProgressState = Record<number, LevelProgress>;

function emptyLevel(): LevelProgress {
  return {
    mastered: false,
    bestScore: 0,
    attempts: 0,
    practiceSessions: 0,
    totalAnswered: 0,
    totalCorrect: 0,
    recentAccuracy: [],
  };
}

function emptyProgress(): ProgressState {
  const state: ProgressState = {};
  for (const level of LEVELS) state[level.id] = emptyLevel();
  return state;
}

/** Fill in any missing fields so older saved data and new levels both work. */
function normalize(parsed: Partial<Record<number, Partial<LevelProgress>>>): ProgressState {
  const state = emptyProgress();
  for (const level of LEVELS) {
    const saved = parsed[level.id];
    if (saved) state[level.id] = { ...emptyLevel(), ...saved };
  }
  return state;
}

export function loadProgress(): ProgressState {
  if (typeof localStorage === 'undefined') return emptyProgress();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    return normalize(JSON.parse(raw));
  } catch {
    return emptyProgress();
  }
}

function saveProgress(state: ProgressState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable (private mode); progress just won't persist.
  }
}

/** A level is unlocked if it's the first level or the previous one is mastered. */
export function isUnlocked(state: ProgressState, levelId: number): boolean {
  const index = LEVELS.findIndex((l) => l.id === levelId);
  if (index <= 0) return true;
  const prev = LEVELS[index - 1];
  return state[prev.id]?.mastered ?? false;
}

/** Cumulative accuracy (%) for a level, or null if nothing practised yet. */
export function levelAccuracy(p: LevelProgress): number | null {
  if (p.totalAnswered === 0) return null;
  return Math.round((p.totalCorrect / p.totalAnswered) * 100);
}

export interface SessionResult {
  mode: SessionMode;
  correct: number;
  answered: number;
}

/**
 * Pure reducer: fold a finished session into a level's progress. Kept separate
 * from React so the accumulation logic can be unit-tested directly.
 */
export function applyResult(
  cur: LevelProgress,
  result: SessionResult,
  masteryNeeded: number,
): { next: LevelProgress; mastered: boolean } {
  const { mode, correct, answered } = result;
  const mastered = mode === 'mastery' && correct >= masteryNeeded;
  const sessionAccuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  const next: LevelProgress = {
    mastered: cur.mastered || mastered,
    bestScore: mode === 'mastery' ? Math.max(cur.bestScore, correct) : cur.bestScore,
    attempts: cur.attempts + (mode === 'mastery' ? 1 : 0),
    practiceSessions: cur.practiceSessions + (mode === 'endless' ? 1 : 0),
    totalAnswered: cur.totalAnswered + answered,
    totalCorrect: cur.totalCorrect + correct,
    recentAccuracy:
      answered > 0
        ? [...cur.recentAccuracy, sessionAccuracy].slice(-MAX_TREND)
        : cur.recentAccuracy,
  };
  return { next, mastered };
}

export interface ProgressApi {
  progress: ProgressState;
  /** Record a finished session (mastery or endless). Returns whether the level is now mastered. */
  recordResult: (levelId: number, result: SessionResult) => boolean;
  reset: () => void;
}

export function useProgress(): ProgressApi {
  const [progress, setProgress] = useState<ProgressState>(loadProgress);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const recordResult = useCallback(
    (levelId: number, result: SessionResult): boolean => {
      const level = LEVELS.find((l) => l.id === levelId);
      const masteryNeeded = level?.masteryNeeded ?? Infinity;
      setProgress((prev) => {
        const cur = prev[levelId] ?? emptyLevel();
        return { ...prev, [levelId]: applyResult(cur, result, masteryNeeded).next };
      });
      return result.mode === 'mastery' && result.correct >= masteryNeeded;
    },
    [],
  );

  const reset = useCallback(() => setProgress(emptyProgress()), []);

  return { progress, recordResult, reset };
}
