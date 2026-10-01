import { describe, it, expect } from 'vitest';
import {
  makePlayers,
  startHand,
  applyAction,
  legalActions,
  type GameState,
  type Player,
} from '../src/engine/game';
import { decideBotAction, type Difficulty } from '../src/engine/bot';
import { mulberry32 } from '../src/engine/deck';

const totalChips = (s: GameState) => s.players.reduce((sum, p) => sum + p.chips, 0);

/** 수동적인 방식으로 핸드를 끝까지 진행합니다: 벳을 받으면 콜, 아니면 체크. */
function playPassive(state: GameState): GameState {
  let s = state;
  let guard = 0;
  while (s.street !== 'complete' && s.toAct >= 0 && guard++ < 200) {
    const legal = legalActions(s);
    s = applyAction(s, legal.callAmount > 0 ? { type: 'call' } : { type: 'check' });
  }
  return s;
}

describe('핸드 시작', () => {
  it('각자 2장씩 나눠 주고 블라인드를 낸다', () => {
    const players = makePlayers(3, 1000); // 4명
    const s = startHand(players, 0, 20, mulberry32(1));
    expect(s.players.every((p) => p.hole.length === 2)).toBe(true);
    expect(s.pot).toBe(30); // 스몰 블라인드 10 + 빅 블라인드 20
    expect(s.currentBet).toBe(20);
    expect(s.street).toBe('preflop');
    expect(s.toAct).toBeGreaterThanOrEqual(0);
  });
});

describe('칩 보존', () => {
  it('수동적인 핸드를 끝까지 해도 전체 칩 수가 그대로다', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const players = makePlayers(3, 1000);
      const start = startHand(players, seed % 4, 20, mulberry32(seed));
      const before = totalChips(start) + start.pot;
      const end = playPassive(start);
      expect(end.street).toBe('complete');
      expect(totalChips(end)).toBe(before); // 팟이 모두 다시 분배됨
      expect(end.outcome).toBeDefined();
      expect(end.outcome!.winners.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('봇이 플레이해도 전체 칩 수가 그대로다', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const rng = mulberry32(seed * 7);
      const players = makePlayers(3, 1000);
      let s = startHand(players, 0, 20, rng);
      const before = totalChips(s) + s.pot;
      let guard = 0;
      while (s.street !== 'complete' && s.toAct >= 0 && guard++ < 300) {
        s = applyAction(s, decideBotAction(s, rng));
      }
      expect(s.street).toBe('complete');
      expect(totalChips(s)).toBe(before);
    }
  });
});

describe('사이드 팟', () => {
  it('스택이 다르면 메인 팟과 사이드 팟으로 나뉜다', () => {
    const players: Player[] = makePlayers(2, 500); // 3명, 각자 500
    players[0].chips = 100; // 숏스택
    players[0].name = '숏스택';

    let s = startHand(players, 0, 20, mulberry32(11));
    let guard = 0;
    while (s.street !== 'complete' && s.toAct >= 0 && guard++ < 50) {
      const legal = legalActions(s);
      s = applyAction(s, legal.canRaise ? { type: 'allin' } : { type: 'call' });
    }

    expect(s.street).toBe('complete');
    // 낸 칩 100 / 500 / 500 → 메인 팟 300 (3명 모두), 사이드 팟 800 (큰 스택 2명).
    const amounts = s.outcome!.pots.map((p) => p.amount).sort((a, b) => a - b);
    expect(amounts).toEqual([300, 800]);
    expect(s.players.reduce((t, p) => t + p.chips, 0)).toBe(1100); // 보존됨

    // 숏스택은 메인 팟 300만 이길 수 있고, 사이드 팟은 절대 이길 수 없다.
    const shorty = s.players.find((p) => p.name === '숏스택')!;
    expect(shorty.chips === 0 || shorty.chips === 300).toBe(true);
  });
});

describe('봇 난이도', () => {
  it('모든 난이도에서 올바르고 칩이 보존되는 핸드를 플레이한다', () => {
    for (const d of ['easy', 'normal', 'hard'] as Difficulty[]) {
      for (let seed = 1; seed <= 15; seed++) {
        const rng = mulberry32(seed * 13);
        const players = makePlayers(3, 1000);
        let s = startHand(players, 0, 20, rng);
        const before = totalChips(s) + s.pot;
        let guard = 0;
        while (s.street !== 'complete' && s.toAct >= 0 && guard++ < 300) {
          s = applyAction(s, decideBotAction(s, rng, d));
        }
        expect(s.street).toBe('complete');
        expect(totalChips(s)).toBe(before);
      }
    }
  });
});

describe('폴드로 이기기', () => {
  it('나머지가 모두 폴드하면 마지막 남은 플레이어가 팟을 가져간다', () => {
    const players = makePlayers(2, 1000); // 3명
    let s = startHand(players, 0, 20, mulberry32(5));
    let guard = 0;
    while (s.street !== 'complete' && s.toAct >= 0 && guard++ < 50) {
      // 폴드할 수 있으면 모두 폴드하고, 마지막에 남은 플레이어가 이긴다.
      const legal = legalActions(s);
      s = applyAction(s, legal.canFold ? { type: 'fold' } : { type: 'check' });
    }
    expect(s.street).toBe('complete');
    expect(s.outcome!.winners).toHaveLength(1);
    expect(s.outcome!.showdown).toHaveLength(0); // 폴드로 이기면 쇼다운이 없다
  });
});

describe('합법 행동', () => {
  it('블라인드 직후 첫 행동자는 체크할 수 없고 콜이나 레이즈를 해야 한다', () => {
    const players = makePlayers(2, 1000);
    const s = startHand(players, 0, 20, mulberry32(3));
    const legal = legalActions(s);
    // 프리플랍에서 빅 블라인드를 받은 첫 행동자는 체크가 아니라 콜이나 레이즈를 해야 한다.
    expect(legal.callAmount).toBeGreaterThan(0);
    expect(legal.canCheck).toBe(false);
    expect(legal.canRaise).toBe(true);
  });
});
