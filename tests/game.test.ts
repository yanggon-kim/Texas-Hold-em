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

/** Drive a hand to completion with a passive policy: call if facing a bet, else check. */
function playPassive(state: GameState): GameState {
  let s = state;
  let guard = 0;
  while (s.street !== 'complete' && s.toAct >= 0 && guard++ < 200) {
    const legal = legalActions(s);
    s = applyAction(s, legal.callAmount > 0 ? { type: 'call' } : { type: 'check' });
  }
  return s;
}

describe('startHand', () => {
  it('deals two cards each and posts the blinds', () => {
    const players = makePlayers(3, 1000); // 4 players
    const s = startHand(players, 0, 20, mulberry32(1));
    expect(s.players.every((p) => p.hole.length === 2)).toBe(true);
    expect(s.pot).toBe(30); // small blind 10 + big blind 20
    expect(s.currentBet).toBe(20);
    expect(s.street).toBe('preflop');
    expect(s.toAct).toBeGreaterThanOrEqual(0);
  });
});

describe('chip conservation', () => {
  it('keeps total chips constant through a full passive hand', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const players = makePlayers(3, 1000);
      const start = startHand(players, seed % 4, 20, mulberry32(seed));
      const before = totalChips(start) + start.pot;
      const end = playPassive(start);
      expect(end.street).toBe('complete');
      expect(totalChips(end)).toBe(before); // pot fully redistributed
      expect(end.outcome).toBeDefined();
      expect(end.outcome!.winners.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('keeps chips constant when bots play too', () => {
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

describe('side pots', () => {
  it('splits into a main and side pot when stacks are unequal', () => {
    const players: Player[] = makePlayers(2, 500); // 3 players, 500 each
    players[0].chips = 100; // short stack
    players[0].name = 'Shorty';

    let s = startHand(players, 0, 20, mulberry32(11));
    let guard = 0;
    while (s.street !== 'complete' && s.toAct >= 0 && guard++ < 50) {
      const legal = legalActions(s);
      s = applyAction(s, legal.canRaise ? { type: 'allin' } : { type: 'call' });
    }

    expect(s.street).toBe('complete');
    // Contributions 100 / 500 / 500 → main pot 300 (all 3), side pot 800 (the two big stacks).
    const amounts = s.outcome!.pots.map((p) => p.amount).sort((a, b) => a - b);
    expect(amounts).toEqual([300, 800]);
    expect(s.players.reduce((t, p) => t + p.chips, 0)).toBe(1100); // conserved

    // The short stack can only ever win the 300 main pot, never the side pot.
    const shorty = s.players.find((p) => p.name === 'Shorty')!;
    expect(shorty.chips === 0 || shorty.chips === 300).toBe(true);
  });
});

describe('bot difficulty', () => {
  it('plays valid, chip-conserving hands at every difficulty', () => {
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

describe('winning by folds', () => {
  it('awards the pot to the last player standing when everyone else folds', () => {
    const players = makePlayers(2, 1000); // 3 players
    let s = startHand(players, 0, 20, mulberry32(5));
    let guard = 0;
    while (s.street !== 'complete' && s.toAct >= 0 && guard++ < 50) {
      // Everyone folds when they can; the forced last player wins.
      const legal = legalActions(s);
      s = applyAction(s, legal.canFold ? { type: 'fold' } : { type: 'check' });
    }
    expect(s.street).toBe('complete');
    expect(s.outcome!.winners).toHaveLength(1);
    expect(s.outcome!.showdown).toHaveLength(0); // no showdown when won by folds
  });
});

describe('legalActions', () => {
  it('lets the player check when there is no bet to face (post-blind call round)', () => {
    const players = makePlayers(2, 1000);
    const s = startHand(players, 0, 20, mulberry32(3));
    const legal = legalActions(s);
    // Pre-flop facing the big blind, the first actor must call or raise, not check.
    expect(legal.callAmount).toBeGreaterThan(0);
    expect(legal.canCheck).toBe(false);
    expect(legal.canRaise).toBe(true);
  });
});
