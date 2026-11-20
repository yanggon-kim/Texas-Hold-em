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
  id: number; // 자리 인덱스와 같습니다 (자리 번호 = id + 1)
  name: string;
  isHuman: boolean;
  chips: number;
  hole: Card[];
  folded: boolean;
  allIn: boolean;
  committed: number; // 이번 스트리트에 낸 칩
  totalCommitted: number; // 이번 핸드에 낸 칩
  hasActed: boolean; // 이번 스트리트의 마지막 벳·레이즈 이후 행동했는지
  raises: number; // 이번 핸드에서 벳·레이즈·올인한 횟수
  sittingOut: boolean; // 칩이 없어 이번 핸드에 참여하지 않음
  lastAction?: string; // 화면 표시용
}

export interface ShowdownEntry {
  playerId: number;
  result: HandResult | null; // 폴드했다면 null
}

export interface PotResult {
  amount: number;
  eligible: number[]; // 이 팟을 이길 자격이 있는(폴드하지 않은) 플레이어 ID
  winners: number[]; // 이 팟을 나눠 갖는 플레이어 ID
  label: string; // "팟", "메인 팟", "사이드 팟 1", …
}

export interface HandOutcome {
  winners: number[]; // 팟을 하나라도 가져간 모든 플레이어 ID
  pots: PotResult[]; // 메인 팟 + 사이드 팟
  winnings: Record<number, number>; // 플레이어 ID별로 받은 칩
  contributed: Record<number, number>; // 플레이어 ID별로 이번 핸드에 낸 칩
  net: Record<number, number>; // 받은 칩 − 낸 칩 (순이익, 음수면 손해)
  showdown: ShowdownEntry[]; // 공개된 비폴드 핸드 (모두 폴드해서 이겼다면 비어 있음)
  summary: string;
}

export interface GameState {
  players: Player[];
  buttonIndex: number;
  sbIndex: number; // 스몰 블라인드 자리
  bbIndex: number; // 빅 블라인드 자리
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

/** 자리 번호를 붙인 이름, 예: "2번 민수". */
export function seatName(p: Player): string {
  return `${p.id + 1}번 ${p.name}`;
}

/** 플레이어 구성: 사람 1명과 봇 `botCount`명, 각자 `startingChips`개의 칩. */
export function makePlayers(botCount: number, startingChips: number): Player[] {
  const players: Player[] = [blankPlayer(0, '나', true, startingChips)];
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
    raises: 0,
    sittingOut: false,
  };
}

const activeIndexes = (s: GameState): number[] =>
  s.players.map((_, i) => i).filter((i) => !s.players[i].folded);

/** `from` 다음 자리부터 시계 방향으로, 이번 핸드에 참여한 가장 가까운 자리. */
function nextDealtIn(s: GameState, from: number): number {
  for (let k = 1; k <= s.players.length; k++) {
    const i = (from + k) % s.players.length;
    if (!s.players[i].sittingOut) return i;
  }
  return from;
}

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
    sittingOut: p.chips <= 0,
    allIn: false,
    committed: 0,
    totalCommitted: 0,
    hasActed: false,
    raises: 0,
    lastAction: undefined,
  }));

  const state: GameState = {
    players: fresh,
    buttonIndex,
    sbIndex: -1,
    bbIndex: -1,
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
      if (!p.sittingOut) p.hole.push(state.deck.shift()!);
    }
  }

  // 블라인드: 버튼 왼쪽이 스몰 블라인드, 그다음이 빅 블라인드입니다.
  // 두 명만 남은 헤즈업에서는 버튼이 스몰 블라인드를 냅니다 (실제 규칙).
  const dealtIn = state.players.filter((p) => !p.sittingOut).length;
  const sbIndex = dealtIn === 2 ? buttonIndex : nextDealtIn(state, buttonIndex);
  const bbIndex = nextDealtIn(state, sbIndex);
  state.sbIndex = sbIndex;
  state.bbIndex = bbIndex;
  postBlind(state, sbIndex, Math.floor(bigBlind / 2), '스몰 블라인드');
  postBlind(state, bbIndex, bigBlind, '빅 블라인드');
  state.currentBet = bigBlind;
  state.minRaise = bigBlind;

  // 프리플랍에서는 빅 블라인드 왼쪽이 먼저 행동합니다.
  state.toAct = activeCanAct(state, (bbIndex + 1) % state.players.length);
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
  p.lastAction = `${label} ${pay}`;
  state.log.push(`${seatName(p)}: ${label} ${pay} 지불`);
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

/**
 * 이번 스트리트의 행동 순서 (자리 인덱스). 프리플랍은 빅 블라인드 왼쪽부터,
 * 플랍 이후는 버튼 왼쪽부터 시작합니다. 이번 핸드에 참여한 자리만 들어갑니다
 * (폴드한 자리도 순서 표시를 위해 포함).
 */
export function actingOrder(state: GameState): number[] {
  const n = state.players.length;
  const start = state.street === 'preflop' ? (state.bbIndex + 1) % n : (state.buttonIndex + 1) % n;
  const order: number[] = [];
  for (let k = 0; k < n; k++) {
    const i = (start + k) % n;
    if (!state.players[i].sittingOut) order.push(i);
  }
  return order;
}

/**
 * 플랍 이후 이 자리 뒤에 행동하는(아직 폴드하지 않은) 플레이어 수.
 * 0이면 가장 마지막에 행동하는 가장 좋은 포지션입니다.
 */
export function playersActingAfterPostflop(state: GameState, index: number): number {
  const n = state.players.length;
  const order: number[] = [];
  for (let k = 1; k <= n; k++) {
    const i = (state.buttonIndex + k) % n; // 버튼 왼쪽부터, 버튼이 마지막
    if (!state.players[i].sittingOut) order.push(i);
  }
  const pos = order.indexOf(index);
  return order.slice(pos + 1).filter((i) => !state.players[i].folded).length;
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
      state.log.push(`${seatName(p)}: 폴드`);
      break;
    case 'check':
      p.hasActed = true;
      p.lastAction = '체크';
      state.log.push(`${seatName(p)}: 체크`);
      break;
    case 'call': {
      const pay = Math.min(state.currentBet - p.committed, p.chips);
      commit(state, p, pay);
      p.hasActed = true;
      p.lastAction = pay > 0 ? `콜 ${pay}` : '체크';
      state.log.push(`${seatName(p)}: ${p.lastAction}`);
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
      const wasBet = state.currentBet === 0;
      commit(state, p, pay);
      if (raiseSize > 0) {
        p.raises++;
        state.minRaise = Math.max(state.minRaise, raiseSize);
        state.currentBet = target;
        // 레이즈가 나오면 다른 모든 플레이어가 다시 행동해야 합니다.
        for (const other of state.players) {
          if (other !== p && !other.folded && !other.allIn) other.hasActed = false;
        }
      }
      p.hasActed = true;
      p.lastAction = p.allIn ? `올인 ${target}` : `${wasBet ? '벳' : '레이즈'} ${target}`;
      state.log.push(`${seatName(p)}: ${p.lastAction}`);
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
    if (!p.folded && !p.allIn) p.lastAction = undefined;
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
  const first = activeCanAct(state, (state.buttonIndex + 1) % state.players.length);

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
  const showdown: ShowdownEntry[] = [];
  if (contenders.length > 1) {
    for (const i of contenders) {
      const res = evaluateHand([...state.players[i].hole, ...state.board]);
      handById.set(state.players[i].id, res);
      showdown.push({ playerId: state.players[i].id, result: res });
    }
  }

  // 이번 핸드에서 각 플레이어가 낸 총액으로 사이드 팟을 만듭니다.
  const contributed: Record<number, number> = {};
  const contrib = new Map<number, number>();
  for (const p of state.players) {
    contributed[p.id] = p.totalCommitted;
    if (p.totalCommitted > 0) contrib.set(p.id, p.totalCommitted);
  }

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

    // 자격자와 승자가 앞 팟과 똑같으면 같은 팟으로 합칩니다
    // (폴드한 사람의 칩 때문에 생기는 의미 없는 사이드 팟을 없앱니다).
    const last = pots[pots.length - 1];
    if (last && sameIds(last.eligible, eligible) && sameIds(last.winners, winners)) {
      last.amount += amount;
    } else {
      pots.push({ amount, eligible, winners, label: '팟' });
    }
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

  const net: Record<number, number> = {};
  for (const p of state.players) net[p.id] = (winnings[p.id] ?? 0) - contributed[p.id];

  const allWinners = [...new Set(pots.flatMap((p) => p.winners))];
  const byId = (id: number) => state.players.find((p) => p.id === id)!;
  const names = (ids: number[]) => ids.map((id) => seatName(byId(id))).join(', ');
  const total = pots.reduce((s, p) => s + p.amount, 0);

  let summary: string;
  if (showdown.length === 0) {
    summary = `${names(allWinners)} 승리 — 나머지가 모두 폴드해서 팟 ${total}칩을 가져갑니다.`;
  } else if (pots.length === 1) {
    const pot = pots[0];
    const handName = handById.get(pot.winners[0])?.name ?? '가장 좋은 핸드';
    if (pot.winners.length === 1) {
      summary = `${names(pot.winners)} 승리 — ${josa(handName, '으로/로')} 팟 ${pot.amount}칩을 모두 가져갑니다.`;
    } else {
      const each = Math.floor(pot.amount / pot.winners.length);
      summary = `무승부 — ${names(pot.winners)} 모두 같은 ${josa(handName, '이/가')} 되어 팟 ${pot.amount}칩을 ${pot.winners.length}명이 나눠 가집니다 (1인당 약 ${each}칩).`;
    }
  } else if (pots.every((pot) => sameIds(pot.winners, pots[0].winners))) {
    const w = pots[0].winners;
    const handName = handById.get(w[0])?.name ?? '가장 좋은 핸드';
    summary =
      w.length === 1
        ? `${names(w)} 승리 — ${josa(handName, '으로/로')} 모든 팟 ${total}칩을 가져갑니다.`
        : `무승부 — ${names(w)} 모두 같은 ${josa(handName, '이/가')} 되어 모든 팟 ${total}칩을 나눠 가집니다.`;
  } else {
    summary = pots
      .map((pot) => {
        const handName = handById.get(pot.winners[0])?.name;
        const how =
          pot.winners.length === 1
            ? `${names(pot.winners)} 승리`
            : `${names(pot.winners)} 무승부로 나눠 가짐`;
        return `${pot.label} ${pot.amount}칩: ${how}${handName ? ` (${handName})` : ''}`;
      })
      .join(' / ');
  }

  state.outcome = { winners: allWinners, pots, winnings, contributed, net, showdown, summary };
  state.street = 'complete';
  state.log.push(summary);
  return state;
}

function sameIds(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((x) => b.includes(x));
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
