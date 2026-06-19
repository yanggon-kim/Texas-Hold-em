import { shuffledDeck, draw } from '../engine/deck';
import { CATEGORY_NAME } from '../engine/handEvaluator';
import { boardNuts, flushPossible, isPaired } from '../engine/board';
import { type Drill, type Rng, shuffledOptions, sampleDistinct } from './types';
import { ALL_CATEGORIES, CATEGORY_HINT } from './categories';

/** Level 9 — reading the board: the nuts, flush threats, and paired boards. */
export function generateBoardDrill(rng: Rng): Drill {
  const board = draw(shuffledDeck(rng), 5).drawn;
  const variant = Math.floor(rng() * 3);

  // 1) What's the best possible hand anyone could have on this board?
  if (variant === 0) {
    const nuts = boardNuts(board);
    const correct = CATEGORY_NAME[nuts.category];
    const distractors = sampleDistinct(rng, ALL_CATEGORIES, 3, [nuts.category]).map(
      (c) => CATEGORY_NAME[c],
    );
    const { options, correctIndex } = shuffledOptions(rng, correct, distractors);
    return {
      prompt: 'What is the best possible hand (the "nuts") anyone could hold on this board?',
      visual: { label: 'Community board', board },
      options,
      correctIndex,
      explanation: `The strongest hand possible here is ${correct} (${CATEGORY_HINT[nuts.category]}). Always ask what beats you before committing chips.`,
    };
  }

  // 2) Could anyone make a flush on this board?
  if (variant === 1) {
    const possible = flushPossible(board);
    const correct = possible ? 'Yes' : 'No';
    const options = ['Yes', 'No'];
    return {
      prompt: 'Could a player make a flush using this board?',
      visual: { label: 'Community board', board },
      options,
      correctIndex: options.indexOf(correct),
      explanation: possible
        ? 'Yes — there are 3+ cards of one suit on the board, so a player holding two of that suit has a flush.'
        : 'No — no suit appears 3+ times on the board, so a flush is impossible here.',
    };
  }

  // 3) Is the board paired (which allows full houses / quads)?
  const paired = isPaired(board);
  const correct = paired ? 'Yes' : 'No';
  const options = ['Yes', 'No'];
  return {
    prompt: 'Is this board "paired" (a rank appearing twice)?',
    visual: { label: 'Community board', board },
    options,
    correctIndex: options.indexOf(correct),
    explanation: paired
      ? 'Yes — a repeated rank means full houses and four-of-a-kind become possible. Be cautious.'
      : 'No — with no pair on the board, nobody can have a full house or quads yet.',
  };
}
