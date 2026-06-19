import { useCallback, useEffect, useState } from 'react';
import { LEVELS } from '../drills/levels';

const STORAGE_KEY = 'th-learn-progress-v1';

export interface LevelProgress {
  mastered: boolean;
  bestScore: number; // best correct count in a single session
  attempts: number;
}

export type ProgressState = Record<number, LevelProgress>;

function emptyProgress(): ProgressState {
  const state: ProgressState = {};
  for (const level of LEVELS) {
    state[level.id] = { mastered: false, bestScore: 0, attempts: 0 };
  }
  return state;
}

export function loadProgress(): ProgressState {
  if (typeof localStorage === 'undefined') return emptyProgress();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as ProgressState;
    // Merge with defaults so newly added levels appear.
    return { ...emptyProgress(), ...parsed };
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

export interface ProgressApi {
  progress: ProgressState;
  /** Record a finished session and persist it. Returns whether the level is now mastered. */
  recordSession: (levelId: number, correct: number, total: number) => boolean;
  reset: () => void;
}

export function useProgress(): ProgressApi {
  const [progress, setProgress] = useState<ProgressState>(loadProgress);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const recordSession = useCallback(
    (levelId: number, correct: number, total: number): boolean => {
      const level = LEVELS.find((l) => l.id === levelId);
      const mastered = level ? correct >= level.masteryNeeded : false;
      setProgress((prev) => {
        const cur = prev[levelId] ?? { mastered: false, bestScore: 0, attempts: 0 };
        return {
          ...prev,
          [levelId]: {
            mastered: cur.mastered || mastered,
            bestScore: Math.max(cur.bestScore, correct),
            attempts: cur.attempts + 1,
          },
        };
      });
      void total;
      return mastered;
    },
    [],
  );

  const reset = useCallback(() => setProgress(emptyProgress()), []);

  return { progress, recordSession, reset };
}
