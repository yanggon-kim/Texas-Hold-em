// 승률(에퀴티), 리버까지의 족보 확률, 아웃츠를 계산합니다.
// 코치 설명과 사이드 패널의 "내 패 전망"에 씁니다.

import { type Card, RANKS, SUITS } from './card';
import { HandCategory } from './handEvaluator';
import { cardToInt, categoryOf, evalInts } from './fastEval';
import { classifyStartingHand } from './startingHands';

type Rng = () => number;

/** 0..51 정수 → Card. */
const INT_TO_CARD: Card[] = (() => {
  const out: Card[] = [];
  for (let r = 0; r < 13; r++) for (let s = 0; s < 4; s++) out.push({ rank: RANKS[r], suit: SUITS[s] });
  return out;
})();

export function intToCard(i: number): Card {
  return INT_TO_CARD[i];
}

/** 상대 패를 가정하는 범위. 'any' = 아무 2장, 'noTrash' = 트래시 핸드는 제외. */
export type OpponentRange = 'any' | 'noTrash';

export interface EquityResult {
  /** 이길 확률 (0..1). */
  win: number;
  /** 비길(팟을 나눌) 확률 (0..1). */
  tie: number;
  /** 에퀴티 = 이길 확률 + 비길 때 내 몫 (0..1). */
  equity: number;
  iterations: number;
}

function unseen(known: number[]): number[] {
  const used = new Set(known);
  const out: number[] = [];
  for (let i = 0; i < 52; i++) if (!used.has(i)) out.push(i);
  return out;
}

const isTrash = (a: number, b: number) =>
  classifyStartingHand(INT_TO_CARD[a], INT_TO_CARD[b]).tier === 'trash';

/**
 * 몬테카를로 시뮬레이션으로 승률을 추정합니다: 상대 패와 남은 보드를 무작위로
 * 여러 번 깔아 보고, 내가 이기거나 비긴 비율을 셉니다.
 */
export function estimateEquity(
  hole: Card[],
  board: Card[],
  opponents: OpponentRange[],
  rng: Rng = Math.random,
  iterations = 2500,
): EquityResult {
  const me = hole.map(cardToInt);
  const b = board.map(cardToInt);
  const rest = unseen([...me, ...b]);
  const need = 5 - b.length;
  let win = 0;
  let tie = 0;
  let share = 0;
  const used = new Uint8Array(52);

  for (let it = 0; it < iterations; it++) {
    used.fill(0);
    const take = (): number => {
      for (;;) {
        const c = rest[Math.floor(rng() * rest.length)];
        if (!used[c]) {
          used[c] = 1;
          return c;
        }
      }
    };
    const opp: number[][] = [];
    for (const range of opponents) {
      let a = take();
      let c = take();
      if (range === 'noTrash') {
        for (let tries = 0; tries < 30 && isTrash(a, c); tries++) {
          used[a] = 0;
          used[c] = 0;
          a = take();
          c = take();
        }
      }
      opp.push([a, c]);
    }
    const fullBoard = [...b];
    for (let k = 0; k < need; k++) fullBoard.push(take());

    const mine = evalInts([...me, ...fullBoard]);
    let best = 0;
    let bestCount = 0;
    for (const o of opp) {
      const sc = evalInts([...o, ...fullBoard]);
      if (sc > best) {
        best = sc;
        bestCount = 1;
      } else if (sc === best) bestCount++;
    }
    if (mine > best) {
      win++;
      share += 1;
    } else if (mine === best) {
      tie++;
      share += 1 / (bestCount + 1);
    }
  }
  return { win: win / iterations, tie: tie / iterations, equity: share / iterations, iterations };
}

/**
 * 리버까지 갔을 때 내 최종 족보가 각 종류일 확률 (HandCategory 인덱스 0..9).
 * 남은 카드가 2장 이하(플랍·턴)면 모든 경우를 정확히 세고,
 * 프리플랍이면 몬테카를로로 추정합니다.
 */
export function finalCategoryOdds(
  hole: Card[],
  board: Card[],
  rng: Rng = Math.random,
  samples = 4000,
): { odds: number[]; exact: boolean } {
  const me = hole.map(cardToInt);
  const b = board.map(cardToInt);
  const rest = unseen([...me, ...b]);
  const need = 5 - b.length;
  const counts = new Array<number>(10).fill(0);
  let total = 0;

  const add = (extra: number[]) => {
    counts[categoryOf(evalInts([...me, ...b, ...extra]))]++;
    total++;
  };

  if (need === 0) {
    add([]);
    return { odds: counts.map((c) => c / total), exact: true };
  }
  if (need === 1) {
    for (const c of rest) add([c]);
    return { odds: counts.map((c) => c / total), exact: true };
  }
  if (need === 2) {
    for (let i = 0; i < rest.length; i++) for (let j = i + 1; j < rest.length; j++) add([rest[i], rest[j]]);
    return { odds: counts.map((c) => c / total), exact: true };
  }
  const pool = rest.slice();
  for (let s = 0; s < samples; s++) {
    for (let k = 0; k < need; k++) {
      const j = k + Math.floor(rng() * (pool.length - k));
      [pool[k], pool[j]] = [pool[j], pool[k]];
    }
    add(pool.slice(0, need));
  }
  return { odds: counts.map((c) => c / total), exact: false };
}

/**
 * 리버까지 갔을 때 "내 카드 덕분에" 지금보다 높은 족보가 될 확률.
 * 보드에만 생겨 모두가 함께 갖는 족보(예: 보드 페어)는 세지 않습니다.
 * 플랍·턴에서는 정확히 셉니다.
 */
export function improveOdds(hole: Card[], board: Card[], rng: Rng = Math.random, samples = 4000): number {
  const me = hole.map(cardToInt);
  const b = board.map(cardToInt);
  const current = categoryOf(evalInts([...me, ...b]));
  const rest = unseen([...me, ...b]);
  const need = 5 - b.length;
  let hit = 0;
  let total = 0;
  const check = (extra: number[]) => {
    const full = [...b, ...extra];
    const cat = categoryOf(evalInts([...me, ...full]));
    if (cat > current && cat > categoryOf(evalInts(full))) hit++;
    total++;
  };
  if (need === 0) return 0;
  if (need === 1) for (const c of rest) check([c]);
  else if (need === 2) {
    for (let i = 0; i < rest.length; i++) for (let j = i + 1; j < rest.length; j++) check([rest[i], rest[j]]);
  } else {
    const pool = rest.slice();
    for (let s = 0; s < samples; s++) {
      for (let k = 0; k < need; k++) {
        const j = k + Math.floor(rng() * (pool.length - k));
        [pool[k], pool[j]] = [pool[j], pool[k]];
      }
      check(pool.slice(0, need));
    }
  }
  return hit / total;
}

export interface OutsInfo {
  /** 내 핸드를 한 단계 이상 좋게 만드는 남은 카드 수. */
  total: number;
  /** 결과 족보별 아웃츠 수와 카드 목록. */
  byCategory: { category: HandCategory; count: number; cards: Card[] }[];
  /** 지금 내 족보. */
  current: HandCategory;
}

/**
 * 다음 카드 한 장으로 내 족보가 올라가는 카드(아웃츠)를 셉니다.
 * 보드에만 생기는 족보(모두가 함께 쓰는 것)는 내 아웃츠로 치지 않습니다.
 * 플랍·턴에서만 의미가 있습니다 (그 외에는 빈 결과).
 */
export function findOuts(hole: Card[], board: Card[]): OutsInfo {
  const me = hole.map(cardToInt);
  const b = board.map(cardToInt);
  const current = categoryOf(evalInts([...me, ...b]));
  const result: OutsInfo = { total: 0, byCategory: [], current };
  if (b.length < 3 || b.length > 4) return result;

  const groups = new Map<HandCategory, Card[]>();
  for (const c of unseen([...me, ...b])) {
    const cat = categoryOf(evalInts([...me, ...b, c]));
    const boardCat = categoryOf(evalInts([...b, c]));
    if (cat > current && cat > boardCat) {
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(intToCard(c));
    }
  }
  result.byCategory = [...groups.entries()]
    .sort((a, z) => z[0] - a[0])
    .map(([category, cards]) => ({ category, count: cards.length, cards }));
  result.total = result.byCategory.reduce((s, g) => s + g.count, 0);
  return result;
}
