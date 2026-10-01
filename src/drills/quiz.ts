import { type Drill, type DrillVisual, type Rng, shuffledOptions } from './types';

/**
 * 고정된 지식 문제. 카드를 읽는 대신 규칙 지식이 답이 되는 개념 레벨
 * (테이블 진행, 베팅 액션, 포지션)에서 사용합니다.
 */
export interface QuizItem {
  prompt: string;
  correct: string;
  /** 오답 (2~3개). 정답과 함께 섞입니다. */
  distractors: string[];
  explanation: string;
  visual?: DrillVisual;
}

/** 문제 하나를 무작위로 골라 객관식 문제(Drill)로 만듭니다. */
export function quizDrill(rng: Rng, items: readonly QuizItem[]): Drill {
  const item = items[Math.floor(rng() * items.length)];
  const { options, correctIndex } = shuffledOptions(rng, item.correct, item.distractors);
  return {
    prompt: item.prompt,
    visual: item.visual,
    options,
    correctIndex,
    explanation: item.explanation,
  };
}
