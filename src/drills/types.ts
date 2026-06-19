import type { Card } from '../engine/card';

/** Visual context shown above a drill question. */
export interface DrillVisual {
  /** Optional caption above the cards. */
  label?: string;
  /** A single row of cards. */
  cards?: Card[];
  /** Labeled hole cards (your two private cards). */
  hole?: Card[];
  /** Labeled community board. */
  board?: Card[];
  /** Two or more named hands shown side by side (e.g. "which is stronger?"). */
  hands?: { label: string; cards: Card[] }[];
}

/** A single multiple-choice question. */
export interface Drill {
  prompt: string;
  visual?: DrillVisual;
  options: string[];
  correctIndex: number;
  /** Shown by the Coach after answering — explains the why. */
  explanation: string;
}

export type Rng = () => number;
export type DrillGenerator = (rng: Rng) => Drill;

/** Highlight modes for the poker-table diagram. */
export type TableHighlight = 'button' | 'blinds' | 'utg' | 'earlyLate';

/** A schematic visual aid shown in the Learn stage. */
export type LessonDiagram =
  | { kind: 'suits' }
  | { kind: 'rankStrip' }
  | { kind: 'rankLadder' }
  | { kind: 'bettingRounds' }
  | { kind: 'table'; highlight?: TableHighlight };

/**
 * A teaching card shown in the Learn (study) stage before drills — a concept
 * definition with an optional worked example and a Korean translation.
 */
export interface LessonCard {
  /** The term/concept being taught, e.g. "Full House". */
  term: string;
  /** Short Korean translation, formatted "한글 (romanization)". */
  korean?: string;
  /** Plain-language definition. */
  definition: string;
  /** Optional example cards illustrating the concept. */
  example?: DrillVisual;
  /** Optional schematic visual aid (table layout, betting timeline, etc.). */
  diagram?: LessonDiagram;
  /** Optional extra tip. */
  note?: string;
}

export type LessonGenerator = (rng: Rng) => LessonCard[];

/** A level in the curriculum. */
export interface LevelDef {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  /** Short concept bullets shown on the intro screen. */
  concept: string[];
  /** Optional study stage: definitions + examples shown before the drills. */
  lesson?: LessonGenerator;
  /** Drill generator (required for quiz levels; omitted for play levels). */
  generate?: DrillGenerator;
  /** How many base questions per session (quiz levels). */
  drillsPerSession?: number;
  /** Correct answers needed to master the level (quiz levels). */
  masteryNeeded?: number;
  /** A "play" level launches the live table vs. AI instead of drills. */
  play?: boolean;
}

/**
 * Build a shuffled multiple-choice set from a correct answer and distractors,
 * returning the option list and the index of the correct one.
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

/** Pick `n` distinct items from `pool` (excluding anything in `exclude`). */
export function sampleDistinct<T>(rng: Rng, pool: readonly T[], n: number, exclude: T[] = []): T[] {
  const available = pool.filter((x) => !exclude.includes(x));
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }
  return available.slice(0, n);
}
