import { type Drill, type DrillVisual, type Rng, shuffledOptions } from './types';

/**
 * A static knowledge question. Used by the concept levels (table flow, betting
 * actions, position) where the answer is rules knowledge rather than a card read.
 */
export interface QuizItem {
  prompt: string;
  correct: string;
  /** Wrong answers (2–3). They are shuffled in with the correct answer. */
  distractors: string[];
  explanation: string;
  visual?: DrillVisual;
}

/** Pick a random quiz item and turn it into a multiple-choice Drill. */
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
