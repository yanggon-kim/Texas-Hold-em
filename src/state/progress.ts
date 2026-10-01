import { useCallback, useEffect, useState } from 'react';
import { LEVELS } from '../drills/levels';

const STORAGE_KEY = 'th-learn-progress-v1';
const MAX_TREND = 12; // 기억할 최근 세션 정확도 개수

export type SessionMode = 'mastery' | 'endless';

export interface LevelProgress {
  mastered: boolean;
  bestScore: number; // 마스터 세션 한 번에서 맞힌 최고 개수
  attempts: number; // 마스터 세션 횟수
  practiceSessions: number; // 무한 연습 세션 횟수
  totalAnswered: number; // 누적 푼 문제 수 (모든 모드)
  totalCorrect: number; // 누적 정답 수 (모든 모드)
  recentAccuracy: number[]; // 최근 몇 세션의 정확도 %, 오래된 것 → 최신
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

/** 빠진 필드를 채워, 예전에 저장한 데이터와 새 레벨이 모두 동작하게 합니다. */
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
    // 저장소를 못 쓸 수 있습니다(시크릿 모드 등). 그러면 진행 상황이 저장되지 않을 뿐입니다.
  }
}

/**
 * 레벨에 들어갈 수 있는지 여부. 모든 레벨이 열려 있으며 잠금은 없습니다.
 * `mastered` 표시는 진행 상황과 통계 표시용으로만 유지합니다. 호출하는 쪽을
 * 바꾸지 않아도 되도록 함수 형태는 그대로 둡니다.
 */
export function isUnlocked(_state: ProgressState, _levelId: number): boolean {
  return true;
}

/** 레벨의 누적 정확도(%). 아직 연습하지 않았으면 null. */
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
 * 순수 리듀서: 끝난 세션을 레벨 진행 상황에 반영합니다. 누적 로직을 직접
 * 단위 테스트할 수 있도록 React와 분리해 둡니다.
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
  /** 끝난 세션(마스터 또는 무한 연습)을 기록합니다. 이제 레벨을 마스터했는지 돌려줍니다. */
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
