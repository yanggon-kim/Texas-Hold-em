import { ruleOfTwoAndFour, potOddsPercent } from '../engine/odds';
import { type Drill, type Rng, shuffledOptions } from './types';

/** Common draws and how many outs they have — core facts to memorise. */
const OUTS_FACTS: { draw: string; outs: number }[] = [
  { draw: 'a flush draw (4 to a flush)', outs: 9 },
  { draw: 'an open-ended straight draw', outs: 8 },
  { draw: 'a gutshot (inside) straight draw', outs: 4 },
  { draw: 'two overcards', outs: 6 },
  { draw: 'a flush draw + open-ended straight draw', outs: 15 },
  { draw: 'one pair trying to hit trips (a set)', outs: 2 },
  { draw: 'a gutshot + a flush draw', outs: 12 },
];

function numberOptions(rng: Rng, correct: number, spread: number[]): {
  options: string[];
  correctIndex: number;
} {
  const distractors = spread
    .map((d) => correct + d)
    .filter((n) => n > 0 && n !== correct)
    .slice(0, 3)
    .map(String);
  return shuffledOptions(rng, String(correct), distractors);
}

/** Level 8 — counting outs, the Rule of 2 & 4, and pot odds. */
export function generateOddsDrill(rng: Rng): Drill {
  const variant = Math.floor(rng() * 4);

  // 1) How many outs does a named draw have?
  if (variant === 0) {
    const fact = OUTS_FACTS[Math.floor(rng() * OUTS_FACTS.length)];
    const { options, correctIndex } = numberOptions(rng, fact.outs, [2, -2, 4]);
    return {
      prompt: `How many outs do you have with ${fact.draw}?`,
      options,
      correctIndex,
      explanation: `${fact.draw} has ${fact.outs} outs — the cards left in the deck that complete your hand.`,
    };
  }

  // 2) Rule of 2 and 4: estimate equity from outs.
  if (variant === 1) {
    const outs = 4 + Math.floor(rng() * 12); // 4–15
    const cardsToCome: 1 | 2 = rng() < 0.5 ? 1 : 2;
    const pct = ruleOfTwoAndFour(outs, cardsToCome);
    const { options, correctIndex } = numberOptions(rng, pct, [
      cardsToCome === 2 ? 8 : 4,
      cardsToCome === 2 ? -8 : -4,
      cardsToCome === 2 ? 4 : 2,
    ]);
    const opts = options.map((o) => `${o}%`);
    const stage = cardsToCome === 2 ? 'the flop (two cards to come)' : 'the turn (one card to come)';
    return {
      prompt: `You have ${outs} outs on ${stage}. Roughly what is your chance to hit?`,
      options: opts,
      correctIndex,
      explanation: `Rule of 2 and 4: outs × ${cardsToCome === 2 ? 4 : 2} ≈ ${pct}%. (${outs} × ${cardsToCome === 2 ? 4 : 2})`,
    };
  }

  // 3) Pot odds: what share of the pot must you pay to call?
  if (variant === 2) {
    const call = (1 + Math.floor(rng() * 5)) * 10; // 10–50
    const pot = call * (2 + Math.floor(rng() * 4)); // 2–5× the call
    const pct = Math.round(potOddsPercent(pot, call));
    const { options, correctIndex } = numberOptions(rng, pct, [5, -5, 10]);
    const opts = options.map((o) => `${o}%`);
    return {
      prompt: `The pot is $${pot} and you must call $${call}. What share of the final pot are you paying?`,
      options: opts,
      correctIndex,
      explanation: `Pot odds = call ÷ (pot + call) = ${call} ÷ ${pot + call} ≈ ${pct}%. If your chance to win is higher than this, calling is profitable.`,
    };
  }

  // 4) Decision: compare equity to the price.
  const equity = 20 + Math.floor(rng() * 30); // 20–49%
  const price = 10 + Math.floor(rng() * 30); // 10–39%
  const call = equity > price;
  const correct = call ? 'Call' : 'Fold';
  const options = ['Call', 'Fold'];
  return {
    prompt: `Your chance to win is about ${equity}%, and the pot odds mean you're paying ${price}% to call. What should you do?`,
    options,
    correctIndex: options.indexOf(correct),
    explanation: call
      ? `Your equity (${equity}%) is higher than the price (${price}%), so calling is profitable in the long run.`
      : `Your equity (${equity}%) is lower than the price (${price}%), so folding is correct — don't chase.`,
  };
}
