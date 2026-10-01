import type { Card } from '../engine/card';

/** 연습 문제 위에 보여 주는 시각 자료. */
export interface DrillVisual {
  /** 카드 위에 표시하는 설명 (선택). */
  label?: string;
  /** 카드 한 줄. */
  cards?: Card[];
  /** 이름표가 붙은 홀 카드 (나만 보는 카드 2장). */
  hole?: Card[];
  /** 이름표가 붙은 커뮤니티 보드. */
  board?: Card[];
  /** 나란히 보여 주는 이름 붙은 핸드 2개 이상 (예: "어느 쪽이 더 강한가요?"). */
  hands?: { label: string; cards: Card[] }[];
}

/** 객관식 문제 하나. */
export interface Drill {
  prompt: string;
  visual?: DrillVisual;
  options: string[];
  correctIndex: number;
  /** 답한 뒤 코치가 보여 주는 해설 — 이유를 설명합니다. */
  explanation: string;
}

export type Rng = () => number;
export type DrillGenerator = (rng: Rng) => Drill;

/** 포커 테이블 그림의 강조 방식. */
export type TableHighlight = 'button' | 'blinds' | 'utg' | 'earlyLate';

/** 학습 단계에서 보여 주는 도식형 시각 자료. */
export type LessonDiagram =
  | { kind: 'suits' }
  | { kind: 'rankStrip' }
  | { kind: 'rankLadder' }
  | { kind: 'bettingRounds' }
  | { kind: 'table'; highlight?: TableHighlight };

/**
 * 연습 문제 전에 학습 단계에서 보여 주는 설명 카드 — 개념 정의와 선택적인
 * 예시로 이루어집니다.
 */
export interface LessonCard {
  /** 가르치는 용어·개념, 예: "풀하우스". */
  term: string;
  /** 쉬운 말로 쓴 정의. */
  definition: string;
  /** 개념을 보여 주는 예시 카드 (선택). */
  example?: DrillVisual;
  /** 도식형 시각 자료 (테이블 배치, 베팅 순서 등, 선택). */
  diagram?: LessonDiagram;
  /** 추가 팁 (선택). */
  note?: string;
}

export type LessonGenerator = (rng: Rng) => LessonCard[];

/** 커리큘럼의 레벨 하나. */
export interface LevelDef {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  /** 소개 화면에 보여 주는 짧은 개념 요약. */
  concept: string[];
  /** 학습 단계 (선택): 연습 문제 전에 보여 주는 정의와 예시. */
  lesson?: LessonGenerator;
  /** 문제 생성기 (퀴즈 레벨은 필수, 플레이 레벨은 생략). */
  generate?: DrillGenerator;
  /** 세션당 기본 문제 수 (퀴즈 레벨). */
  drillsPerSession?: number;
  /** 레벨 마스터에 필요한 정답 수 (퀴즈 레벨). */
  masteryNeeded?: number;
  /** "플레이" 레벨은 연습 문제 대신 AI와의 실전 테이블을 엽니다. */
  play?: boolean;
}

/**
 * 정답과 오답으로 섞인 객관식 보기를 만들고,
 * 보기 목록과 정답의 인덱스를 돌려줍니다.
 */
export function shuffledOptions(
  rng: Rng,
  correct: string,
  distractors: string[],
): { options: string[]; correctIndex: number } {
  const options = [correct, ...distractors];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { options, correctIndex: options.indexOf(correct) };
}

/** `pool`에서 서로 다른 항목 `n`개를 고릅니다 (`exclude`에 있는 것은 제외). */
export function sampleDistinct<T>(rng: Rng, pool: readonly T[], n: number, exclude: T[] = []): T[] {
  const available = pool.filter((x) => !exclude.includes(x));
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }
  return available.slice(0, n);
}
