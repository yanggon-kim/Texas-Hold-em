import { type LessonCard, type Rng } from './types';
import { HandCategory, CATEGORY_NAME, evaluateHand } from '../engine/handEvaluator';
import { makeHandOfCategory, make7OfCategory } from '../engine/handFactory';
import { parseCard } from '../engine/handEvaluator';
import { SUITS, SUIT_NAME } from '../engine/card';
import { josa } from '../engine/josa';
import { ALL_CATEGORIES } from './categories';

/** 학습 단계에서 쓰는 족보별 자세한 정의. */
const HAND_DEF: Record<HandCategory, string> = {
  [HandCategory.RoyalFlush]:
    '같은 무늬의 에이스-킹-퀸-잭-10. 포커에서 가장 강한 핸드로, 이길 수 있는 핸드가 없습니다.',
  [HandCategory.StraightFlush]:
    '같은 무늬로 연속된 숫자 5장. 예: 모두 하트인 9-8-7-6-5.',
  [HandCategory.FourOfAKind]:
    '같은 랭크의 카드 4장 — 한 숫자의 네 무늬가 모두 모인 것. 예: 퀸 네 장.',
  [HandCategory.FullHouse]:
    '트리플에 원 페어를 더한 것. 예: 킹 세 장과 7 두 장.',
  [HandCategory.Flush]:
    '연속되지는 않지만 모두 같은 무늬인 5장. 족보를 정할 때 숫자는 상관없습니다.',
  [HandCategory.Straight]:
    '무늬가 섞인 연속된 숫자 5장. 예: 8-7-6-5-4. 에이스는 높게(에이스-킹-퀸-잭-10)도, 낮게(5-4-3-2-에이스)도 쓸 수 있습니다.',
  [HandCategory.ThreeOfAKind]:
    '같은 랭크의 카드 3장과 관계없는 카드 2장. 예: 5 세 장.',
  [HandCategory.TwoPair]:
    '서로 다른 페어 2개와 카드 1장. 예: 잭 두 장과 4 두 장.',
  [HandCategory.OnePair]:
    '같은 랭크의 카드 2장과 관계없는 카드 3장. 예: 10 두 장.',
  [HandCategory.HighCard]:
    '페어 이상이 하나도 없는 핸드. 가장 높은 카드로 비교하며, 가장 약한 결과입니다.',
};

/** 레벨 1 — 카드, 무늬, 색깔, 랭크. */
export function cardsLesson(rng: Rng): LessonCard[] {
  const cards: LessonCard[] = [
    {
      term: '덱',
      definition:
        '표준 덱은 52장입니다. 무늬 4가지가 있고, 무늬마다 랭크가 13가지(2부터 10, 그다음 잭, 퀸, 킹, 에이스) 있습니다.',
      diagram: { kind: 'suits' },
    },
  ];
  for (const suit of SUITS) {
    const colour = suit === '♥' || suit === '♦' ? '빨간색' : '검은색';
    cards.push({
      term: `${SUIT_NAME[suit]} ${suit}`,
      definition: `네 가지 무늬 중 하나입니다. ${josa(SUIT_NAME[suit], '은/는')} ${colour} 무늬입니다.`,
      example: { cards: [{ rank: 'A', suit }, { rank: '7', suit }] },
    });
  }
  cards.push({
    term: '랭크와 색깔',
    definition:
      '낮은 랭크 → 높은 랭크: 2, 3, 4, 5, 6, 7, 8, 9, 10, 잭, 퀸, 킹, 에이스 (보통 에이스가 가장 높습니다). 하트 ♥와 다이아몬드 ♦는 빨간색, 스페이드 ♠와 클럽 ♣는 검은색입니다.',
    diagram: { kind: 'rankStrip' },
    note: '그림 카드는 잭, 퀸, 킹 세 가지입니다. 에이스는 보통 가장 높은 카드지만, 5-4-3-2-에이스 스트레이트에서는 가장 낮은 카드로 씁니다.',
  });
  void rng;
  return cards;
}

/** 레벨 2 — 10가지 족보, 강한 것 → 약한 것 순서로 예시와 함께. */
export function rankingsLesson(rng: Rng): LessonCard[] {
  const strongestFirst = [...ALL_CATEGORIES].reverse();
  const overview: LessonCard = {
    term: '10가지 족보',
    definition:
      '모든 핸드는 10가지 족보 중 하나에 속합니다. 카드와 상관없이 높은 족보는 항상 낮은 족보를 이깁니다. 강한 것부터 약한 것 순서로 보면:',
    diagram: { kind: 'rankLadder' },
    note: '다음 카드들에서 맨 위부터 차례로 각 족보의 실제 예시를 보여 줍니다.',
  };
  const hands = strongestFirst.map((category, i) => ({
    term: `${strongestFirst.length - i}. ${CATEGORY_NAME[category]}`,
    definition: HAND_DEF[category],
    example: { label: '예시', cards: makeHandOfCategory(category, rng) },
  }));
  return [overview, ...hands];
}

/** 레벨 3 — 홀 카드, 커뮤니티 카드, 7장 중 가장 좋은 5장 만들기. */
export function bestHandLesson(rng: Rng): LessonCard[] {
  const sample = make7OfCategory(HandCategory.TwoPair, rng);
  const best = evaluateHand(sample.all);
  return [
    {
      term: '홀 카드',
      definition: '뒷면으로 받는 나만의 카드 2장. 나만 쓸 수 있습니다.',
      example: { label: '내 홀 카드', cards: sample.hole },
    },
    {
      term: '커뮤니티 카드',
      definition: '가운데에 깔리는 공용 카드 5장. 모든 플레이어가 쓸 수 있습니다.',
      example: { label: '보드', cards: sample.board },
    },
    {
      term: '7장 중 가장 좋은 5장',
      definition:
        '홀 카드 2장과 커뮤니티 카드 5장을 합쳐 가장 좋은 5장 핸드를 만듭니다. 홀 카드는 2장 다, 1장만, 또는 하나도 쓰지 않아도 됩니다.',
      example: { hole: sample.hole, board: sample.board },
      note: `여기서 가장 좋은 핸드는 ${CATEGORY_NAME[best.category]}입니다.`,
    },
  ];
}

const c = (label: string) => parseCard(label);

/** 레벨 4 — 테이블, 버튼, 블라인드, 네 번의 베팅 라운드. */
export function tableFlowLesson(_rng: Rng): LessonCard[] {
  void _rng;
  return [
    {
      term: '딜러 버튼',
      definition:
        '이번 핸드에서 누가 "딜러"인지 표시하는 표식("딜")입니다. 매 핸드 시계 방향으로 한 자리씩 이동합니다.',
      diagram: { kind: 'table', highlight: 'button' },
    },
    {
      term: '스몰 블라인드와 빅 블라인드',
      definition:
        '액션을 시작하는 강제 베팅입니다. 버튼 왼쪽 플레이어가 스몰 블라인드를, 그다음 플레이어가 (더 큰) 빅 블라인드를 냅니다.',
      diagram: { kind: 'table', highlight: 'blinds' },
    },
    {
      term: '네 번의 베팅 라운드',
      definition:
        '한 핸드는 네 라운드로 진행되며 매 라운드마다 베팅이 있습니다: 프리플랍, 플랍, 턴, 리버, 그리고 마지막에 쇼다운.',
      diagram: { kind: 'bettingRounds' },
    },
    {
      term: '프리플랍',
      definition: '모두가 홀 카드 2장을 받은 직후의 첫 베팅 라운드입니다.',
    },
    {
      term: '플랍',
      definition: '한 번에 깔리는 첫 커뮤니티 카드 3장이며, 이어서 베팅 라운드가 진행됩니다.',
      example: { label: '플랍 (3장)', cards: [c('K♠'), c('9♥'), c('4♣')] },
    },
    {
      term: '턴',
      definition: '4번째 커뮤니티 카드(한 장)이며, 이어서 베팅 라운드가 진행됩니다.',
      example: { label: '턴 카드', cards: [c('Q♦')] },
    },
    {
      term: '리버',
      definition: '5번째이자 마지막 커뮤니티 카드이며, 이어서 마지막 베팅 라운드가 진행됩니다.',
      example: { label: '리버 카드', cards: [c('2♠')] },
    },
    {
      term: '쇼다운',
      definition:
        '리버 후 두 명 이상 남아 있으면 핸드를 공개하고, 가장 좋은 5장 핸드가 팟을 가져갑니다.',
    },
  ];
}

/** 레벨 5 — 베팅 액션. */
export function actionsLesson(_rng: Rng): LessonCard[] {
  void _rng;
  return [
    {
      term: '체크',
      definition: '베팅하지 않고 차례를 넘깁니다. 받은 벳이 없을 때만 할 수 있습니다.',
    },
    {
      term: '벳',
      definition: '베팅 라운드에서 가장 먼저 팟에 칩을 거는 것입니다.',
    },
    {
      term: '콜',
      definition: '현재 베팅 금액을 맞춰 핸드에 남는 것입니다.',
    },
    {
      term: '레이즈',
      definition: '현재 베팅 금액을 올리는 것입니다. 상대는 계속하려면 새 금액을 맞춰야 합니다.',
    },
    {
      term: '폴드',
      definition: '핸드를 포기하는 것입니다. 칩을 더 내지 않지만 팟을 이길 수도 없습니다.',
    },
    {
      term: '올인',
      definition: '남은 칩을 모두 거는 것입니다.',
      note: '벳을 받으면 폴드, 콜, 레이즈는 할 수 있지만 체크는 할 수 없습니다.',
    },
  ];
}

/** 레벨 6 — 포지션과 자리 이름. */
export function positionLesson(_rng: Rng): LessonCard[] {
  void _rng;
  return [
    {
      term: '포지션',
      definition:
        '버튼을 기준으로 한 내 자리로, 행동 순서를 정합니다. 나중에 행동할수록 = 정보가 많고 = 유리합니다. 6인 테이블:',
      diagram: { kind: 'table' },
    },
    {
      term: '버튼',
      definition:
        '딜러 버튼이 놓인 자리입니다. 플랍 이후 가장 마지막에 행동하는, 가장 좋고 수익이 높은 자리입니다.',
      diagram: { kind: 'table', highlight: 'button' },
    },
    {
      term: '언더더건',
      definition:
        '빅 블라인드 왼쪽 자리입니다. 프리플랍에서 가장 먼저 행동하는 가장 어려운 자리이므로 타이트하게 플레이하세요.',
      diagram: { kind: 'table', highlight: 'utg' },
    },
    {
      term: '얼리 포지션과 레이트 포지션',
      definition:
        '얼리 포지션에서는 강한 핸드 몇 개만 플레이하고, 버튼에 가까워질수록 느슨하게 더 많은 핸드를 플레이하세요.',
      diagram: { kind: 'table', highlight: 'earlyLate' },
      note: '블라인드는 플랍 이후 먼저 행동하므로 포지션상 불리합니다.',
    },
  ];
}

/** 레벨 7 — 스타팅 핸드 선택. */
export function startingHandsLesson(_rng: Rng): LessonCard[] {
  void _rng;
  return [
    {
      term: '스타팅 핸드',
      definition:
        '내 홀 카드 2장입니다. 어떤 핸드를 플레이할지 고르는 것이 프리플랍에서 가장 중요한 결정입니다 — 이기는 플레이어는 대부분의 핸드를 폴드합니다.',
    },
    {
      term: '프리미엄 핸드',
      definition:
        '가장 강한 시작 핸드: 높은 페어(에이스·킹·퀸·잭 페어)와 높은 에이스(에이스·킹, 에이스·퀸). 어느 포지션에서든 항상 플레이할 수 있습니다.',
      example: { label: '예: ♠에이스 ♠킹', cards: [c('A♠'), c('K♠')] },
    },
    {
      term: '플레이 가능 핸드',
      definition:
        '작은·중간 페어, 수티드 커넥터, 수티드 에이스 같은 핸드입니다. 레이트 포지션에서는 좋지만, 얼리 포지션에서는 보통 폴드합니다.',
      example: { label: '예: ♥7 ♥6', cards: [c('7♥'), c('6♥')] },
    },
    {
      term: '트래시 핸드',
      definition:
        '7·2 오프수트처럼 약하고 연결되지 않은 카드입니다. 폴드하세요 — 초보자 대부분은 이런 핸드를 너무 많이 플레이해서 잃습니다.',
      example: { label: '예: ♣7 ♦2', cards: [c('7♣'), c('2♦')] },
    },
    {
      term: '얼리는 타이트하게, 레이트는 느슨하게',
      definition:
        '얼리 포지션에서는 프리미엄·강한 핸드만 플레이하고, 버튼 근처에서는 플레이 가능 핸드도 더할 수 있습니다.',
      diagram: { kind: 'table', highlight: 'earlyLate' },
      note: '수티드는 두 카드의 무늬가 같은 것, 오프수트는 무늬가 다른 것을 뜻합니다.',
    },
  ];
}

/** 레벨 8 — 아웃츠, 2와 4의 법칙, 팟 오즈. */
export function oddsLesson(_rng: Rng): LessonCard[] {
  void _rng;
  return [
    {
      term: '아웃츠',
      definition:
        '덱에 남아 있으면서 내 핸드를 완성해 주는 카드입니다. 예: 플러시 드로우는 아웃츠 9장, 오픈엔디드 스트레이트 드로우는 8장입니다.',
    },
    {
      term: '드로우',
      definition:
        '아직 완성되지 않았지만 좋아질 수 있는 핸드입니다. 흔한 예: 플러시 드로우(아웃츠 9), 오픈엔디드 스트레이트(8), 거트샷(4).',
      example: { label: '같은 무늬 4장 — 플러시 드로우', cards: [c('A♥'), c('9♥'), c('5♥'), c('K♥')] },
    },
    {
      term: '2와 4의 법칙',
      definition:
        '에퀴티(이길 확률)를 빠르게 어림하는 법: 카드가 2장 남았으면 에퀴티 ≈ 아웃츠 × 4%, 1장 남았으면 ≈ 아웃츠 × 2%.',
      note: '플랍에서 아웃츠 9장이면 리버까지 완성될 확률 ≈ 36%.',
    },
    {
      term: '팟 오즈',
      definition:
        '콜 금액이 최종 팟에서 차지하는 비율: 콜 금액 ÷ (팟 + 콜 금액). 이길 확률이 이 비율보다 높으면 콜이 이득입니다.',
      note: '팟 80칩, 콜 20칩 → 20 ÷ 100 = 20%. 콜하려면 에퀴티가 약 20% 이상 필요합니다.',
    },
  ];
}

/** 레벨 9 — 보드 읽기. */
export function boardLesson(_rng: Rng): LessonCard[] {
  void _rng;
  return [
    {
      term: '넛츠',
      definition:
        '주어진 보드에서 가능한 가장 좋은 핸드입니다. 크게 베팅하기 전에 "여기서 누군가 가질 수 있는 가장 강한 핸드는 무엇일까?"를 물어보세요.',
    },
    {
      term: '플러시 위협',
      definition:
        '보드에 같은 무늬가 3장 이상 있으면, 그 무늬 2장을 가진 사람은 플러시입니다. 무늬를 잘 살피세요.',
      example: { label: '♠ 3장 — 플러시 가능', cards: [c('Q♠'), c('8♠'), c('3♠'), c('J♥'), c('2♦')] },
    },
    {
      term: '페어 보드',
      definition:
        '보드에 같은 랭크가 두 번 나오면 풀하우스와 포카드가 가능해집니다 — 조심해서 진행하세요.',
      example: { label: '페어 보드 (8-8)', cards: [c('8♣'), c('8♦'), c('K♠'), c('4♥'), c('2♣')] },
    },
    {
      term: '무엇이 나를 이길까?',
      definition:
        '보드 읽기는 습관입니다. 칩을 걸기 전에 매 스트리트마다 내 핸드를 이길 수 있는 스트레이트, 플러시, 페어를 살펴보세요.',
    },
  ];
}

/** 레벨 10 — 봇과의 실전 테이블에서 모든 것을 종합합니다. */
export function tablePlayLesson(_rng: Rng): LessonCard[] {
  void _rng;
  return [
    {
      term: '봇과 실전',
      definition:
        '이제 봇 상대와 핸드를 끝까지 플레이합니다. 4인 테이블에서 칩 1,000개로 시작하며, 블라인드는 10/20입니다.',
      diagram: { kind: 'table' },
    },
    {
      term: '배운 것을 모두 활용하세요',
      definition:
        '포지션에 맞게 좋은 스타팅 핸드를 고르고, 보드에서 위협을 읽고, 콜하기 전에 팟 오즈를 따져 보세요. 강한 핸드는 베팅하고, 약한 핸드는 폴드하세요.',
      diagram: { kind: 'bettingRounds' },
    },
    {
      term: '테이블의 액션 버튼',
      definition:
        '테이블에서 쓰는 버튼: 폴드, 체크, 콜, 벳, 레이즈, 올인. 콜·벳·레이즈·올인 버튼에는 내야 할 칩 수가 함께 표시됩니다.',
      note: '가운데에 팟 크기가 표시되며, 블라인드는 스몰 블라인드 10 / 빅 블라인드 20입니다.',
    },
    {
      term: '코치가 켜져 있습니다',
      definition:
        '내가 결정할 때마다 코치 팁이 액션을 추천하고 이유를 설명합니다. 자신감이 생기면 💡 스위치로 끌 수 있습니다.',
    },
  ];
}
