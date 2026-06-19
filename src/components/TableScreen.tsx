import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type GameState,
  type Player,
  makePlayers,
  startHand,
  applyAction,
  legalActions,
} from '../engine/game';
import { decideBotAction, coachTip } from '../engine/bot';
import { PlayingCard, CardBack } from './PlayingCard';

const BIG_BLIND = 20;
const STARTING_CHIPS = 1000;
const BOTS = 3;
const BOT_DELAY_MS = 750;

interface Props {
  onExit: () => void;
}

function nextButton(players: Player[], current: number): number {
  for (let k = 1; k <= players.length; k++) {
    const i = (current + k) % players.length;
    if (players[i].chips > 0) return i;
  }
  return current;
}

export function TableScreen({ onExit }: Props) {
  const [game, setGame] = useState<GameState>(() =>
    startHand(makePlayers(BOTS, STARTING_CHIPS), 0, BIG_BLIND),
  );
  const [showCoach, setShowCoach] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const human = game.players.find((p) => p.isHuman)!;
  const actor = game.toAct >= 0 ? game.players[game.toAct] : null;
  const humanToAct = actor?.isHuman ?? false;
  const handOver = game.street === 'complete';

  // Auto-play bot turns with a small delay so the action is readable.
  useEffect(() => {
    if (handOver || !actor || actor.isHuman) return;
    timer.current = setTimeout(() => {
      setGame((g) => {
        if (g.street === 'complete' || g.toAct < 0 || g.players[g.toAct].isHuman) return g;
        return applyAction(g, decideBotAction(g));
      });
    }, BOT_DELAY_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [game, actor, handOver]);

  const act = useCallback(
    (action: Parameters<typeof applyAction>[1]) => {
      setGame((g) => (g.toAct >= 0 && g.players[g.toAct].isHuman ? applyAction(g, action) : g));
    },
    [],
  );

  const nextHand = useCallback(() => {
    setGame((g) => {
      const roster = g.players.map((p) => ({ ...p }));
      const button = nextButton(roster, g.buttonIndex);
      return startHand(roster, button, BIG_BLIND);
    });
  }, []);

  const newGame = useCallback(() => {
    setGame(startHand(makePlayers(BOTS, STARTING_CHIPS), 0, BIG_BLIND));
  }, []);

  const bots = game.players.filter((p) => !p.isHuman);
  const revealAll = handOver && game.outcome!.showdown.length > 0;
  const humanBroke = human.chips <= 0 && handOver;

  const legal = humanToAct ? legalActions(game) : null;
  const tip = humanToAct && showCoach ? coachTip(game) : null;

  // A sensible default raise size for the human: ~60% pot, within legal bounds.
  const raiseTarget = legal
    ? Math.max(
        legal.minRaiseTo,
        Math.min(legal.maxRaiseTo, game.currentBet + Math.max(BIG_BLIND, Math.round(game.pot * 0.6))),
      )
    : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-5">
      <div className="flex items-center justify-between mb-3">
        <button onClick={onExit} className="text-sm text-slate-500 hover:text-slate-800">
          ← Exit
        </button>
        <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer">
          <input
            type="checkbox"
            checked={showCoach}
            onChange={(e) => setShowCoach(e.target.checked)}
          />
          💡 Coach
        </label>
      </div>

      {/* opponents */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {bots.map((p) => (
          <Seat
            key={p.id}
            player={p}
            isButton={game.players[game.buttonIndex].id === p.id}
            reveal={revealAll && !p.folded}
          />
        ))}
      </div>

      {/* felt: pot + board */}
      <div className="rounded-3xl bg-emerald-700 border-4 border-emerald-900 p-5 mb-3 shadow-inner">
        <div className="text-center text-emerald-100 text-sm mb-3">
          Pot <span className="font-bold text-white">{game.pot}</span>
          <span className="mx-2 text-emerald-300">·</span>
          <span className="capitalize">{handOver ? 'hand over' : game.street}</span>
        </div>
        <div className="flex justify-center gap-1.5 min-h-[5rem] items-center">
          {game.board.length === 0 ? (
            <span className="text-emerald-200/70 text-sm">community cards appear here</span>
          ) : (
            game.board.map((c, i) => <PlayingCard key={i} card={c} size="md" />)
          )}
        </div>
      </div>

      {/* your seat */}
      <Seat
        player={human}
        isButton={game.players[game.buttonIndex].id === human.id}
        reveal
        big
        active={humanToAct}
      />

      {/* outcome / action bar */}
      {handOver ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-center">
          <p className="font-semibold text-slate-800">{game.outcome!.summary}</p>
          {humanBroke ? (
            <>
              <p className="text-sm text-rose-600 mt-2">You're out of chips!</p>
              <button
                onClick={newGame}
                className="mt-3 rounded-xl bg-slate-800 px-6 py-2.5 font-semibold text-white hover:bg-slate-900"
              >
                New game
              </button>
            </>
          ) : (
            <button
              onClick={nextHand}
              className="mt-3 rounded-xl bg-emerald-600 px-6 py-2.5 font-semibold text-white hover:bg-emerald-700"
            >
              Next hand →
            </button>
          )}
        </div>
      ) : humanToAct && legal ? (
        <div className="mt-4">
          {tip && (
            <div className="mb-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm text-indigo-800">
              💡 Coach suggests <strong>{tip.suggestion}</strong> — {tip.reason}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => act({ type: 'fold' })}
              className="flex-1 rounded-xl bg-rose-100 text-rose-700 px-4 py-3 font-semibold hover:bg-rose-200"
            >
              Fold
            </button>
            {legal.canCheck ? (
              <button
                onClick={() => act({ type: 'check' })}
                className="flex-1 rounded-xl bg-slate-200 text-slate-800 px-4 py-3 font-semibold hover:bg-slate-300"
              >
                Check
              </button>
            ) : (
              <button
                onClick={() => act({ type: 'call' })}
                className="flex-1 rounded-xl bg-slate-200 text-slate-800 px-4 py-3 font-semibold hover:bg-slate-300"
              >
                Call {legal.callAmount}
              </button>
            )}
            {legal.canRaise && raiseTarget < legal.maxRaiseTo && (
              <button
                onClick={() => act({ type: 'raise', amount: raiseTarget })}
                className="flex-1 rounded-xl bg-emerald-600 text-white px-4 py-3 font-semibold hover:bg-emerald-700"
              >
                {game.currentBet > 0 ? 'Raise' : 'Bet'} {raiseTarget}
              </button>
            )}
            {legal.canRaise && (
              <button
                onClick={() => act({ type: 'allin' })}
                className="flex-1 rounded-xl bg-amber-500 text-white px-4 py-3 font-semibold hover:bg-amber-600"
              >
                All-in {legal.maxRaiseTo}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 text-center text-sm text-slate-400 py-3">
          {actor ? `${actor.name} is thinking…` : 'Dealing…'}
        </div>
      )}

      {/* action log */}
      <div className="mt-4 rounded-xl bg-slate-100 p-3 h-24 overflow-y-auto text-xs text-slate-500 font-mono">
        {game.log.slice(-8).map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
}

function Seat({
  player,
  isButton,
  reveal,
  big,
  active,
}: {
  player: Player;
  isButton: boolean;
  reveal: boolean;
  big?: boolean;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-3 ${
        active ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-slate-200'
      } ${player.folded ? 'opacity-50' : ''} ${big ? 'bg-white' : 'bg-white'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-semibold text-slate-800 truncate">{player.name}</span>
          {isButton && (
            <span className="inline-grid place-items-center w-4 h-4 rounded-full bg-slate-800 text-white text-[9px]">
              D
            </span>
          )}
        </div>
        <span className="text-sm font-bold text-emerald-700 shrink-0">{player.chips}</span>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-1">
          {player.hole.length === 0 ? (
            <span className="text-xs text-slate-300">—</span>
          ) : reveal ? (
            player.hole.map((c, i) => <PlayingCard key={i} card={c} size={big ? 'md' : 'sm'} />)
          ) : (
            player.hole.map((_, i) => <CardBack key={i} size={big ? 'md' : 'sm'} />)
          )}
        </div>
        {player.lastAction && !player.folded && (
          <span className="text-[11px] text-slate-500">{player.lastAction}</span>
        )}
        {player.folded && <span className="text-[11px] text-rose-400">folded</span>}
      </div>
    </div>
  );
}
