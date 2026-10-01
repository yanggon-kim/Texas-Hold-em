// 봇과 한 테이블에서 플레이하기 위한 간결한 노리밋 텍사스 홀덤 핸드 엔진입니다.
//
// 블라인드, 스트리트, 베팅, 최소 레이즈, 사이드 팟, 쇼다운은 실제 규칙을 따르며
// 테스트된 핸드 평가기를 재사용합니다.

import { type Card } from './card';
import { shuffledDeck } from './deck';
import { evaluateHand, compareScores, type HandResult } from './handEvaluator';
import { josa } from './josa';

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'complete';

/** 화면과 기록에 표시하는 스트리트 이름. */
export const STREET_LABEL: Record<Street, string> = {
  preflop: '프리플랍',
  flop: '플랍',
  turn: '턴',
  river: '리버',
  complete: '핸드 종료',
};

export interface Player {
  id: number;
  name: string;
  isHuman: boolean;
  chips: number;
  hole: Card[];
  folded: boolean;
  allIn: boolean;
  committed: number; // 이번 스트리트에 낸 칩
  totalCommitted: number; // 이번 핸드에 낸 칩
  hasActed: boolean; // 이번 스트리트의 마지막 벳·레이즈 이후 행동했는지
  lastAction?: string; // 화면 표시용
}

export interface ShowdownEntry {
  playerId: number;
  result: HandResult | null; // 폴드했다면 null
}

export interface PotResult {
  amount: number;
  winners: number[]; // 이 팟을 나눠 갖는 플레이어 ID
  label: string; // "팟", "메인 팟", "사이드 팟 1", …
}

export interface HandOutcome {
  winners: number[]; // 팟을 하나라도 가져간 모든 플레이어 ID
  pots: PotResult[]; // 메인 팟 + 사이드 팟
  winnings: Record<number, number>; // 플레이어 ID별로 딴 칩
  showdown: ShowdownEntry[]; // 공개된 비폴드 핸드 (모두 폴드해서 이겼다면 비어 있음)
  summary: string;
}

export interface GameState {
  players: Player[];
  buttonIndex: number;
  street: Street;
  board: Card[];
  deck: Card[];
  pot: number;
  currentBet: number; // 이번 스트리트의 가장 높은 `committed`
  minRaise: number; // 최소 레이즈 증가폭
  bigBlind: number;
  toAct: number; // 행동할 플레이어의 인덱스, 핸드가 끝났으면 -1
  log: string[];
  outcome?: HandOutcome;
}

export type ActionType = 'fold' | 'check' | 'call' | 'raise' | 'allin';
export interface Action {
  type: ActionType;
  /** 'raise'일 때: 이번 스트리트에 이 플레이어가 낸 칩의 총합 목표. */
  amount?: number;
}

export interface LegalActions {
  canFold: boolean;
  canCheck: boolean;
  callAmount: number; // 콜에 필요한 칩 (체크할 수 있으면 0)
  canRaise: boolean;
  minRaiseTo: number; // 가장 작은 합법 레이즈 목표 (낸 칩 총합)
  maxRaiseTo: number; // 올인 목표 (낸 칩 총합)
}

const BOT_NAMES = ['민수', '지영', '현우', '서연', '은지'];

/** 플레이어 구성: 사람 1명과 봇 `botCount`명, 각자 `startingChips`개의 칩. */
export function makePlayers(botCount: number, startingChips: number): Player[] {
  const players: Player[] = [
    blankPlayer(0, '나', true, startingChips),
  ];
  for (let i = 0; i < botCount; i++) {
    players.push(blankPlayer(i + 1, BOT_NAMES[i] ?? `봇 ${i + 1}`, false, startingChips));
  }
  return players;
}

function blankPlayer(id: number, name: string, isHuman: boolean, chips: number): Player {
  return {
    id,
    name,
    isHuman,
    chips,
    hole: [],
    folded: false,
    allIn: false,
    committed: 0,
    totalCommitted: 0,
    hasActed: false,
  };
}

const activeIndexes = (s: GameState): number[] =>
  s.players.map((_, i) => i).filter((i) => !s.players[i].folded);

const nextSeat = (s: GameState, from: number): number => (from + 1) % s.players.length;

/** 새 핸드 시작: 플레이어 초기화, 홀 카드 딜, 블라인드 지불. */
export function startHand(
  players: Player[],
  buttonIndex: number,
  bigBlind: number,
  rng: () => number = Math.random,
): GameState {
  const deck = shuffledDeck(rng);
  const fresh = players.map((p) => ({
    ...p,
    hole: [] as Card[],
    folded: p.chips <= 0, // 칩이 없는 플레이어는 쉽니다
    allIn: false,
    committed: 0,
    totalCommitted: 0,
    hasActed: false,
    lastAction: undefined,
  }));

  const state: GameState = {
    players: fresh,
    buttonIndex,
    street: 'preflop',
    board: [],
    deck,
    pot: 0,
    currentBet: 0,
    minRaise: bigBlind,
    bigBlind,
    toAct: -1,
    log: [],
  };

  // 자리에 앉은 플레이어마다 홀 카드 2장을 나눠 줍니다.
  for (let r = 0; r < 2; r++) {
    for (const p of state.players) {
      if (!p.folded) p.hole.push(state.deck.shift()!);
    }
  }

  // 블라인드 지불 (헤즈업에서는 버튼이 스몰 블라인드지만, 여기서는 단순하게
  // 버튼 왼쪽이 스몰 블라인드, 그다음이 빅 블라인드입니다).
  const sbIndex = nextSeat(state, buttonIndex);
  const bbIndex = nextSeat(state, sbIndex);
  postBlind(state, sbIndex, Math.floor(bigBlind / 2), '스몰 블라인드');
  postBlind(state, bbIndex, bigBlind, '빅 블라인드');
  state.currentBet = bigBlind;
  state.minRaise = bigBlind;

  // 프리플랍에서는 빅 블라인드 왼쪽이 먼저 행동합니다.
  state.toAct = activeCanAct(state, nextSeat(state, bbIndex));
  return state;
}

function postBlind(state: GameState, index: number, amount: number, label: string) {
  const p = state.players[index];
  const pay = Math.min(amount, p.chips);
  p.chips -= pay;
  p.committed += pay;
  p.totalCommitted += pay;
  state.pot += pay;
  if (p.chips === 0) p.allIn = true;
  state.log.push(`${p.name}: ${label} ${pay} 지불`);
}

/** `start`부터 행동할 수 있는(폴드·올인이 아닌) 다음 자리를 찾습니다. */
function activeCanAct(state: GameState, start: number): number {
  for (let k = 0; k < state.players.length; k++) {
    const i = (start + k) % state.players.length;
    const p = state.players[i];
    if (!p.folded && !p.allIn) return i;
  }
  return -1;
}

/** `toAct` 자리의 플레이어가 아직 행동해야 하는지 여부. */
function needsAction(state: GameState, i: number): boolean {
  const p = state.players[i];
  if (p.folded || p.allIn) return false;
  return !p.hasActed || p.committed < state.currentBet;
}

/** 행동할 플레이어의 합법 행동. */
export function legalActions(state: GameState): LegalActions {
  const p = state.players[state.toAct];
  const toCall = Math.max(0, state.currentBet - p.committed);
  const callAmount = Math.min(toCall, p.chips);
  const maxRaiseTo = p.committed + p.chips; // 올인 총합
  const minRaiseTo = state.currentBet + state.minRaise;
  return {
    canFold: true,
    canCheck: toCall === 0,
    callAmount,
    canRaise: p.chips > toCall, // 콜하고도 칩이 남는지
    minRaiseTo: Math.min(minRaiseTo, maxRaiseTo),
    maxRaiseTo,
  };
}

/** 현재 플레이어의 행동을 적용하고 핸드를 진행합니다. 새 상태를 돌려줍니다. */
export function applyAction(prev: GameState, action: Action): GameState {
  const state = cloneState(prev);
  const i = state.toAct;
  if (i < 0) return state;
  const p = state.players[i];

  switch (action.type) {
    case 'fold':
      p.folded = true;
      p.hasActed = true;
      p.lastAction = '폴드';
      state.log.push(`${p.name}: 폴드`);
      break;
    case 'check':
      p.hasActed = true;
      p.lastAction = '체크';
      state.log.push(`${p.name}: 체크`);
      break;
    case 'call': {
      const pay = Math.min(state.currentBet - p.committed, p.chips);
      commit(state, p, pay);
      p.hasActed = true;
      p.lastAction = pay > 0 ? `콜 ${pay}` : '체크';
      state.log.push(`${p.name}: 콜 ${pay}`);
      break;
    }
    case 'raise':
    case 'allin': {
      const target =
        action.type === 'allin'
          ? p.committed + p.chips
          : Math.min(action.amount ?? 0, p.committed + p.chips);
      const pay = target - p.committed;
      const raiseSize = target - state.currentBet;
      commit(state, p, pay);
      if (raiseSize > 0) {
        state.minRaise = Math.max(state.minRaise, raiseSize);
        state.currentBet = target;
        // 레이즈가 나오면 다른 모든 플레이어가 다시 행동해야 합니다.
        for (const other of state.players) {
          if (other !== p && !other.folded && !other.allIn) other.hasActed = false;
        }
      }
      p.hasActed = true;
      p.lastAction = p.allIn ? `올인 ${target}` : `레이즈 ${target}`;
      state.log.push(`${p.name}: ${p.lastAction}`);
      break;
    }
  }

  // 한 명만 남았나요? 그 플레이어가 바로 이깁니다.
  if (activeIndexes(state).length === 1) {
    return finishHand(state);
  }

  // 이번 스트리트에 행동해야 하는 다음 플레이어를 찾습니다.
  let next = -1;
  for (let k = 1; k <= state.players.length; k++) {
    const idx = (i + k) % state.players.length;
    if (needsAction(state, idx)) {
      next = idx;
      break;
    }
  }

  if (next === -1) {
    return advanceStreet(state);
  }
  state.toAct = next;
  return state;
}

function commit(state: GameState, p: Player, pay: number) {
  const amount = Math.max(0, Math.min(pay, p.chips));
  p.chips -= amount;
  p.committed += amount;
  p.totalCommitted += amount;
  state.pot += amount;
  if (p.chips === 0) p.allIn = true;
}

/** 다음 스트리트로 넘어가거나(보드 카드 딜) 쇼다운으로 갑니다. */
function advanceStreet(state: GameState): GameState {
  // 스트리트 베팅을 초기화합니다.
  for (const p of state.players) {
    p.committed = 0;
    p.hasActed = false;
  }
  state.currentBet = 0;
  state.minRaise = state.bigBlind;

  const deal = (n: number) => {
    state.deck.shift(); // 번 카드
    for (let k = 0; k < n; k++) state.board.push(state.deck.shift()!);
  };

  if (state.street === 'preflop') {
    state.street = 'flop';
    deal(3);
  } else if (state.street === 'flop') {
    state.street = 'turn';
    deal(1);
  } else if (state.street === 'turn') {
    state.street = 'river';
    deal(1);
  } else {
    return finishHand(state);
  }
  state.log.push(`--- ${STREET_LABEL[state.street]} ---`);

  // 플랍 이후 첫 행동: 버튼 왼쪽에서 가장 가까운 활성 플레이어.
  const first = activeCanAct(state, nextSeat(state, state.buttonIndex));

  // 행동할 수 있는 플레이어가 2명 미만이면 보드를 끝까지 깔고 쇼다운합니다.
  const canActCount = state.players.filter((p) => !p.folded && !p.allIn).length;
  if (first === -1 || canActCount < 2) {
    return advanceStreet(state);
  }
  state.toAct = first;
  return state;
}

/** 핸드 정산: 사이드 팟을 만들어 나눠 주고, 쇼다운에서 핸드를 공개합니다. */
function finishHand(state: GameState): GameState {
  state.toAct = -1;
  const contenders = activeIndexes(state); // 폴드하지 않은 자리 인덱스
  const foldedIds = new Set(state.players.filter((p) => p.folded).map((p) => p.id));

  // 남은 핸드를 평가합니다 (실제 쇼다운일 때만 필요).
  const handById = new Map<number, HandResult>();
  let showdown: ShowdownEntry[] = [];
  if (contenders.length > 1) {
    for (const i of contenders) {
      const res = evaluateHand([...state.players[i].hole, ...state.board]);
      handById.set(state.players[i].id, res);
      showdown.push({ playerId: state.players[i].id, result: res });
    }
  }

  // 이번 핸드에서 각 플레이어가 낸 총액으로 사이드 팟을 만듭니다.
  const contrib = new Map<number, number>();
  for (const p of state.players) if (p.totalCommitted > 0) contrib.set(p.id, p.totalCommitted);

  const pots: PotResult[] = [];
  let guard = 0;
  while ([...contrib.values()].some((v) => v > 0) && guard++ < 50) {
    const positive = [...contrib.entries()].filter(([, v]) => v > 0);
    const layer = Math.min(...positive.map(([, v]) => v));
    let amount = 0;
    const eligible: number[] = [];
    for (const [id, v] of positive) {
      amount += layer;
      contrib.set(id, v - layer);
      if (!foldedIds.has(id)) eligible.push(id);
    }

    let winners: number[];
    if (contenders.length === 1) {
      winners = [state.players[contenders[0]].id];
    } else if (eligible.length === 0) {
      winners = positive.map(([id]) => id); // 환불 (보통은 일어나지 않음)
    } else {
      let best: HandResult | null = null;
      for (const id of eligible) {
        const r = handById.get(id)!;
        if (!best || compareScores(r.score, best.score) > 0) best = r;
      }
      winners = eligible.filter((id) => compareScores(handById.get(id)!.score, best!.score) === 0);
    }
    pots.push({ amount, winners, label: '팟' });
  }

  // 팟 이름(메인·사이드)을 붙이고 나눠 줍니다. 나누고 남는 칩은 첫 번째 승자에게 갑니다.
  const winnings: Record<number, number> = {};
  pots.forEach((pot, idx) => {
    pot.label = pots.length === 1 ? '팟' : idx === 0 ? '메인 팟' : `사이드 팟 ${idx}`;
    const each = Math.floor(pot.amount / pot.winners.length);
    const remainder = pot.amount - each * pot.winners.length;
    pot.winners.forEach((id, wi) => {
      winnings[id] = (winnings[id] ?? 0) + each + (wi === 0 ? remainder : 0);
    });
  });
  for (const p of state.players) if (winnings[p.id]) p.chips += winnings[p.id];

  const allWinners = [...new Set(pots.flatMap((p) => p.winners))];
  const name = (id: number) => state.players.find((p) => p.id === id)!.name;

  let summary: string;
  if (showdown.length === 0) {
    const total = pots.reduce((s, p) => s + p.amount, 0);
    summary = `${allWinners.map(name).join(', ')} 승리 — ${total}칩 획득 (나머지 모두 폴드)`;
  } else if (pots.length === 1) {
    const pot = pots[0];
    const handName = handById.get(pot.winners[0])?.name ?? '가장 좋은 핸드';
    summary = `${pot.winners.map(name).join(', ')} 승리 — ${josa(handName, '으로/로')} ${pot.amount}칩 획득`;
  } else {
    summary = pots
      .map((pot) => {
        const handName = handById.get(pot.winners[0])?.name;
        return `${pot.label}: ${pot.winners.map(name).join(', ')} 승리 — ${pot.amount}칩${
          handName ? ` (${handName})` : ''
        }`;
      })
      .join('; ');
  }

  state.outcome = { winners: allWinners, pots, winnings, showdown, summary };
  state.street = 'complete';
  state.log.push(summary);
  return state;
}

function cloneState(s: GameState): GameState {
  return {
    ...s,
    players: s.players.map((p) => ({ ...p, hole: [...p.hole] })),
    board: [...s.board],
    deck: [...s.deck],
    log: [...s.log],
  };
}
