import { type LessonCard, type Rng } from './types';
import { HandCategory, CATEGORY_NAME, evaluateHand } from '../engine/handEvaluator';
import { makeHandOfCategory, make7OfCategory } from '../engine/handFactory';
import { parseCard } from '../engine/handEvaluator';
import { SUITS, SUIT_NAME } from '../engine/card';
import { ALL_CATEGORIES } from './categories';
import { ko, HAND_KOREAN, SUIT_KOREAN, TERM_KOREAN } from '../data/korean';

/** Fuller definitions of each hand, used by the study stage. */
const HAND_DEF: Record<HandCategory, string> = {
  [HandCategory.RoyalFlush]:
    'A-K-Q-J-10 all of the same suit. The single best hand in poker — unbeatable.',
  [HandCategory.StraightFlush]:
    'Five cards in a row (a sequence), all of the same suit. e.g. 9-8-7-6-5 all hearts.',
  [HandCategory.FourOfAKind]:
    'Four cards of the same rank — all four suits of one card, e.g. four Queens.',
  [HandCategory.FullHouse]:
    'Three of a kind plus a pair, e.g. three Kings and two Sevens.',
  [HandCategory.Flush]:
    'Five cards all of the same suit, but not in sequence. The ranks do not matter for the type.',
  [HandCategory.Straight]:
    'Five cards in a row of mixed suits, e.g. 8-7-6-5-4. The Ace can be high (A-K-Q-J-10) or low (5-4-3-2-A).',
  [HandCategory.ThreeOfAKind]:
    'Three cards of the same rank, e.g. three Fives, plus two unrelated cards.',
  [HandCategory.TwoPair]:
    'Two different pairs, e.g. two Jacks and two Fours, plus one more card.',
  [HandCategory.OnePair]:
    'Two cards of the same rank, e.g. two Tens, plus three unrelated cards.',
  [HandCategory.HighCard]:
    'No pair or better. The hand is judged by its highest card — the weakest result.',
};

/** Level 1 — cards, suits, colours, ranks. */
export function cardsLesson(rng: Rng): LessonCard[] {
  const cards: LessonCard[] = [
    {
      term: 'The deck',
      korean: ko(TERM_KOREAN.deck),
      definition:
        'A standard deck has 52 cards: 4 suits, each with 13 ranks (2 to 10, then J, Q, K, A).',
      diagram: { kind: 'suits' },
    },
  ];
  for (const suit of SUITS) {
    const colour = suit === '♥' || suit === '♦' ? 'red' : 'black';
    cards.push({
      term: `${SUIT_NAME[suit]} ${suit}`,
      korean: ko(SUIT_KOREAN[suit]),
      definition: `One of the four suits. ${SUIT_NAME[suit]} is a ${colour} suit.`,
      example: { cards: [{ rank: 'A', suit }, { rank: '7', suit }] },
    });
  }
  cards.push({
    term: 'Ranks & colours',
    definition:
      'Ranks low→high: 2,3,4,5,6,7,8,9,10,J,Q,K,A (Ace is usually highest). Hearts ♥ and diamonds ♦ are red; spades ♠ and clubs ♣ are black.',
    diagram: { kind: 'rankStrip' },
    note: `Red = ${ko(TERM_KOREAN.red)}, Black = ${ko(TERM_KOREAN.black)}.`,
  });
  void rng;
  return cards;
}

/** Level 2 — the ten hand rankings, strongest → weakest, each with an example. */
export function rankingsLesson(rng: Rng): LessonCard[] {
  const strongestFirst = [...ALL_CATEGORIES].reverse();
  const overview: LessonCard = {
    term: 'The 10 hands',
    definition:
      'Every hand falls into one of ten categories. A higher category always beats a lower one — no matter the cards. Here they are, strongest to weakest:',
    diagram: { kind: 'rankLadder' },
    note: 'The next cards show a real example of each, from the top down.',
  };
  const hands = strongestFirst.map((category, i) => ({
    term: `${strongestFirst.length - i}. ${CATEGORY_NAME[category]}`,
    korean: ko(HAND_KOREAN[category]),
    definition: HAND_DEF[category],
    example: { label: 'Example', cards: makeHandOfCategory(category, rng) },
  }));
  return [overview, ...hands];
}

/** Level 3 — hole cards, community cards, and making the best 5 of 7. */
export function bestHandLesson(rng: Rng): LessonCard[] {
  const sample = make7OfCategory(HandCategory.TwoPair, rng);
  const best = evaluateHand(sample.all);
  return [
    {
      term: 'Hole cards',
      korean: ko(TERM_KOREAN['hole cards']),
      definition: 'Your 2 private cards, dealt face down. Only you can use them.',
      example: { label: 'Your hole cards', cards: sample.hole },
    },
    {
      term: 'Community cards',
      korean: ko(TERM_KOREAN['community cards']),
      definition: 'The 5 shared cards in the middle. Every player may use them.',
      example: { label: 'The board', cards: sample.board },
    },
    {
      term: 'Best 5 of 7',
      definition:
        'Combine your 2 hole cards with the 5 community cards and make the best 5-card hand. You may use both hole cards, one, or none.',
      example: { hole: sample.hole, board: sample.board },
      note: `Here the best hand is ${CATEGORY_NAME[best.category]}.`,
    },
  ];
}

const c = (label: string) => parseCard(label);

/** Level 4 — table, button, blinds, the four betting rounds. */
export function tableFlowLesson(_rng: Rng): LessonCard[] {
  void _rng;
  return [
    {
      term: 'Dealer button',
      korean: ko(TERM_KOREAN['dealer button']),
      definition:
        'A marker (the "D") showing who is "the dealer" for the hand. It moves one seat clockwise every hand.',
      diagram: { kind: 'table', highlight: 'button' },
    },
    {
      term: 'Small & big blind',
      korean: `${ko(TERM_KOREAN['small blind'])} / ${ko(TERM_KOREAN['big blind'])}`,
      definition:
        'Forced bets that start the action. The player left of the button posts the small blind; the next player posts the (larger) big blind.',
      diagram: { kind: 'table', highlight: 'blinds' },
    },
    {
      term: 'The four betting rounds',
      definition:
        'A hand plays out in four rounds, with betting on each: Pre-flop, then the Flop, Turn, and River, ending in a showdown.',
      diagram: { kind: 'bettingRounds' },
    },
    {
      term: 'Pre-flop',
      korean: ko(TERM_KOREAN.preflop),
      definition: 'The first betting round, right after everyone gets their 2 hole cards.',
    },
    {
      term: 'Flop',
      korean: ko(TERM_KOREAN.flop),
      definition: 'The first 3 community cards, dealt together, followed by a betting round.',
      example: { label: 'A flop (3 cards)', cards: [c('K♠'), c('9♥'), c('4♣')] },
    },
    {
      term: 'Turn',
      korean: ko(TERM_KOREAN.turn),
      definition: 'The 4th community card (one card), followed by a betting round.',
      example: { label: 'The turn card', cards: [c('Q♦')] },
    },
    {
      term: 'River',
      korean: ko(TERM_KOREAN.river),
      definition: 'The 5th and final community card, followed by the last betting round.',
      example: { label: 'The river card', cards: [c('2♠')] },
    },
    {
      term: 'Showdown',
      korean: ko(TERM_KOREAN.showdown),
      definition:
        'If two or more players remain after the river, they reveal their hands and the best 5-card hand wins the pot.',
    },
  ];
}

/** Level 5 — the betting actions. */
export function actionsLesson(_rng: Rng): LessonCard[] {
  void _rng;
  return [
    {
      term: 'Check',
      korean: ko(TERM_KOREAN.check),
      definition: 'Pass the action without betting. Only allowed when there is no bet to face.',
    },
    {
      term: 'Bet',
      korean: ko(TERM_KOREAN.bet),
      definition: 'Be the first to put chips into the pot in a betting round.',
    },
    {
      term: 'Call',
      korean: ko(TERM_KOREAN.call),
      definition: 'Match the current bet to stay in the hand.',
    },
    {
      term: 'Raise',
      korean: ko(TERM_KOREAN.raise),
      definition: 'Increase the current bet. Opponents must match the new amount to continue.',
    },
    {
      term: 'Fold',
      korean: ko(TERM_KOREAN.fold),
      definition: 'Give up your hand. You put in no more chips and cannot win the pot.',
    },
    {
      term: 'All-in',
      korean: ko(TERM_KOREAN['all-in']),
      definition: 'Bet all of your remaining chips.',
      note: 'Facing a bet you can fold, call, or raise — but you cannot check.',
    },
  ];
}

/** Level 6 — position and seat names. */
export function positionLesson(_rng: Rng): LessonCard[] {
  void _rng;
  return [
    {
      term: 'Position',
      korean: ko(TERM_KOREAN.position),
      definition:
        'Where you sit relative to the button, which decides the order you act in. Acting later = more information = an advantage. A 6-seat table:',
      diagram: { kind: 'table' },
    },
    {
      term: 'The Button (BTN)',
      korean: ko(TERM_KOREAN.button),
      definition:
        'The seat on the dealer button. It acts last after the flop — the best, most profitable seat.',
      diagram: { kind: 'table', highlight: 'button' },
    },
    {
      term: 'Under the gun (UTG)',
      korean: ko(TERM_KOREAN['under the gun']),
      definition:
        'The seat left of the big blind. It acts first pre-flop — the toughest spot, so play tight here.',
      diagram: { kind: 'table', highlight: 'utg' },
    },
    {
      term: 'Early vs. late',
      definition:
        'Play few, strong hands from early position; loosen up and play more hands as you get closer to the button.',
      diagram: { kind: 'table', highlight: 'earlyLate' },
      note: 'The blinds act first after the flop, a positional disadvantage.',
    },
  ];
}

/** Level 7 — starting-hand selection. */
export function startingHandsLesson(_rng: Rng): LessonCard[] {
  void _rng;
  return [
    {
      term: 'Starting hands',
      korean: ko(TERM_KOREAN['starting hand']),
      definition:
        'Your 2 hole cards. Choosing which ones to play is the most important pre-flop decision — winning players fold most hands.',
    },
    {
      term: 'Premium hands',
      definition:
        'The strongest openers: big pairs (AA, KK, QQ, JJ) and big aces (AK, AQ). Always playable, from any position.',
      example: { label: 'e.g. A♠ K♠', cards: [c('A♠'), c('K♠')] },
    },
    {
      term: 'Playable hands',
      definition:
        'Hands like small/medium pairs, suited connectors, and suited aces. Good from late position, usually folded from early position.',
      example: { label: 'e.g. 7♥ 6♥', cards: [c('7♥'), c('6♥')] },
    },
    {
      term: 'Trash hands',
      definition:
        'Weak, unconnected cards like 7-2 offsuit. Fold these — most beginners lose by playing too many of them.',
      example: { label: 'e.g. 7♣ 2♦', cards: [c('7♣'), c('2♦')] },
    },
    {
      term: 'Tight early, loose late',
      definition:
        'From early position play only premium/strong hands; near the button you can add the playable hands too.',
      diagram: { kind: 'table', highlight: 'earlyLate' },
    },
  ];
}

/** Level 8 — outs, the Rule of 2 & 4, and pot odds. */
export function oddsLesson(_rng: Rng): LessonCard[] {
  void _rng;
  return [
    {
      term: 'Outs',
      korean: ko(TERM_KOREAN.outs),
      definition:
        'The cards still in the deck that complete your hand. Example: a flush draw has 9 outs; an open-ended straight draw has 8.',
    },
    {
      term: 'Draw',
      korean: ko(TERM_KOREAN.draw),
      definition:
        'An incomplete hand that can improve. Common ones: flush draw (9 outs), open-ended straight (8), gutshot (4).',
      example: { label: '4 to a flush — a flush draw', cards: [c('A♥'), c('9♥'), c('5♥'), c('K♥')] },
    },
    {
      term: 'Rule of 2 and 4',
      korean: ko(TERM_KOREAN.equity),
      definition:
        'Quick equity estimate: with two cards to come, equity ≈ outs × 4%. With one card to come, ≈ outs × 2%.',
      note: '9 outs on the flop ≈ 36% to hit by the river.',
    },
    {
      term: 'Pot odds',
      korean: ko(TERM_KOREAN['pot odds']),
      definition:
        'The price of a call as a share of the final pot: call ÷ (pot + call). If your chance to win is higher than this price, calling is profitable.',
      note: 'Pot $80, call $20 → 20 ÷ 100 = 20%. Need ~20%+ equity to call.',
    },
  ];
}

/** Level 9 — reading the board. */
export function boardLesson(_rng: Rng): LessonCard[] {
  void _rng;
  return [
    {
      term: 'The nuts',
      korean: ko(TERM_KOREAN.nuts),
      definition:
        'The best possible hand on a given board. Before betting big, ask: what is the strongest hand someone could have here?',
    },
    {
      term: 'Flush threats',
      definition:
        'If three or more cards of one suit are on the board, someone holding two of that suit has a flush. Watch the suits.',
      example: { label: 'Three ♠ — flush possible', cards: [c('Q♠'), c('8♠'), c('3♠'), c('J♥'), c('2♦')] },
    },
    {
      term: 'Paired boards',
      definition:
        'When a rank appears twice on the board, full houses and four-of-a-kind become possible — proceed with caution.',
      example: { label: 'Paired board (8-8)', cards: [c('8♣'), c('8♦'), c('K♠'), c('4♥'), c('2♣')] },
    },
    {
      term: 'What beats me?',
      definition:
        'Good board reading is a habit: each street, scan for straights, flushes, and pairs that could beat your hand before you commit chips.',
    },
  ];
}

/** Level 10 — putting it together at a live table vs. bots. */
export function tablePlayLesson(_rng: Rng): LessonCard[] {
  void _rng;
  return [
    {
      term: 'Live play vs. AI',
      korean: ko(TERM_KOREAN.pot),
      definition:
        'Now play full hands against bot opponents. You start with 1,000 chips at a 4-handed table; blinds are 10/20.',
      diagram: { kind: 'table' },
    },
    {
      term: 'Use everything you learned',
      definition:
        'Pick good starting hands by position, read the board for threats, and weigh pot odds before calling. Bet your strong hands, fold your weak ones.',
      diagram: { kind: 'bettingRounds' },
    },
    {
      term: 'Action words (Korean)',
      definition: `Buttons you'll use at the table: Fold = ${ko(TERM_KOREAN.fold)}, Check = ${ko(
        TERM_KOREAN.check,
      )}, Call = ${ko(TERM_KOREAN.call)}, Bet = ${ko(TERM_KOREAN.bet)}, Raise = ${ko(
        TERM_KOREAN.raise,
      )}, All-in = ${ko(TERM_KOREAN['all-in'])}.`,
      note: `The pot is ${ko(TERM_KOREAN.pot)}, the blinds are ${ko(
        TERM_KOREAN['small blind'],
      )} / ${ko(TERM_KOREAN['big blind'])}.`,
    },
    {
      term: 'The Coach is on',
      definition:
        'A coach tip suggests an action and explains why on each of your decisions. Turn it off with the 💡 toggle once you feel confident.',
    },
  ];
}
