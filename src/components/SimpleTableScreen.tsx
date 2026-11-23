// 레벨 11: 휴대폰용 간단한 실전 테이블.
// 레벨 10의 자세한 해설·전망 패널 없이, 한 줄 코치 추천과 액션 버튼만 보여 줍니다.
// 봇 차례는 짧게 기다렸다가 자동으로 진행합니다.

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type Action,
  type GameState,
  type Player,
  makePlayers,
  startHand,
  applyAction,
  legalActions,
  seatName,
  STREET_LABEL,
} from '../engine/game';
import { decideBotAction, type Difficulty, DIFFICULTY_LABEL } from '../engine/bot';
import { coachAdvice, suggestedRaiseTo, TIER_TERM } from '../engine/coach';
import { evaluateHand, arrangeBestFive, type HandResult } from '../engine/handEvaluator';
import { classifyStartingHand } from '../engine/startingHands';
import { josa } from '../engine/josa';
import { PlayingCard, CardBack } from './PlayingCard';

const BIG_BLIND = 20;
const STARTING_CHIPS = 1000;
const BOTS = 3;
const BOT_DELAY_MS = 750;
/** 내가 폴드한 뒤에는 봇끼리의 진행을 빠르게 넘깁니다. */
const FAST_DELAY_MS = 120;

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

export function SimpleTableScreen({ onExit }: Props) {
  const [game, setGame] = useState<GameState>(() =>
    startHand(makePlayers(BOTS, STARTING_CHIPS), 0, BIG_BLIND),
  );
  const [showCoach, setShowCoach] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');

  const human = game.players.find((p) => p.isHuman)!;
  const actor = game.toAct >= 0 ? game.players[game.toAct] : null;
  const humanToAct = actor?.isHuman ?? false;
  const handOver = game.street === 'complete';
  const humanOut = human.folded || human.sittingOut;

  // 봇 차례는 약간 기다렸다가 자동 진행합니다. 그래야 액션을 따라갈 수 있습니다.
  useEffect(() => {
    if (handOver || !actor || actor.isHuman) return;
    const t = setTimeout(
      () => {
        setGame((g) => {
          if (g.street === 'complete' || g.toAct < 0 || g.players[g.toAct].isHuman) return g;
          return applyAction(g, decideBotAction(g, Math.random, difficulty));
        });
      },
      humanOut ? FAST_DELAY_MS : BOT_DELAY_MS,
    );
    return () => clearTimeout(t);
  }, [game, actor, handOver, difficulty, humanOut]);

  const act = useCallback((action: Action) => {
    setGame((g) => (g.toAct >= 0 && g.players[g.toAct].isHuman ? applyAction(g, action) : g));
  }, []);

  const nextHand = useCallback(() => {
    setGame((g) => {
      const roster = g.players.map((p) => ({ ...p }));
      return startHand(roster, nextButton(roster, g.buttonIndex), BIG_BLIND);
    });
  }, []);

  const newGame = useCallback(() => {
    setGame(startHand(makePlayers(BOTS, STARTING_CHIPS), 0, BIG_BLIND));
  }, []);

  const legal = humanToAct ? legalActions(game) : null;
  const advice = useMemo(
    () => (humanToAct && showCoach ? coachAdvice(game, Math.random) : null),
    [game, humanToAct, showCoach],
  );
  // 코치 요약의 마지막 줄이 "추천 X: 이유" 한 줄입니다.
  const tip = advice ? advice.summary[advice.summary.length - 1] : null;
  const raiseTarget = legal ? suggestedRaiseTo(game) : 0;

  const bots = game.players.filter((p) => !p.isHuman);
  const revealAll = handOver && game.outcome!.showdown.length > 0;
  const humanBroke = handOver && human.chips <= 0;
  // 봇이 모두 칩을 잃으면 내가 우승한 것이므로 게임이 끝납니다.
  const humanChampion = handOver && !humanBroke && bots.every((p) => p.chips <= 0);
  const myHand = !handOver && !humanOut && human.hole.length === 2 ? describeMyHand(human, game) : null;
  const myNet = handOver ? (game.outcome!.net[human.id] ?? 0) : 0;
  const isButton = (p: Player) => game.players[game.buttonIndex].id === p.id;

  return (
    <div className="mx-auto max-w-md px-3 py-3 pb-6">
      <div className="flex items-center justify-between gap-2 mb-2">
        <button onClick={onExit} className="text-sm text-slate-500 hover:text-slate-800">
          ← 나가기
        </button>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1" title="봇 난이도">
            {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`rounded-md px-2 py-1 text-xs font-semibold ${
                  difficulty === d ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {DIFFICULTY_LABEL[d]}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer" title="코치 켜기/끄기">
            <input type="checkbox" checked={showCoach} onChange={(e) => setShowCoach(e.target.checked)} />
            💡코치
          </label>
        </div>
      </div>

      {/* 상대 3명 */}
      <div className="grid grid-cols-3 gap-1.5 mb-2">
        {bots.map((p) => (
          <Seat
            key={p.id}
            player={p}
            isButton={isButton(p)}
            reveal={revealAll && !p.folded}
            active={actor?.id === p.id}
          />
        ))}
      </div>

      {/* 테이블: 팟 + 보드 */}
      <div className="rounded-3xl bg-emerald-700 border-4 border-emerald-900 px-2 py-3 mb-2 shadow-inner">
        <div className="text-center text-emerald-100 text-sm mb-2">
          팟 <span className="font-bold text-white">{game.pot}</span>
          <span className="mx-2 text-emerald-300">·</span>
          <span>{STREET_LABEL[game.street]}</span>
        </div>
        <div className="flex justify-center gap-1 min-h-[4rem] items-center">
          {game.board.length === 0 ? (
            <span className="text-emerald-200/70 text-xs">커뮤니티 카드가 여기에 깔립니다</span>
          ) : (
            game.board.map((c, i) => <PlayingCard key={i} card={c} size="sm" />)
          )}
        </div>
      </div>

      {/* 내 자리 */}
      <Seat player={human} isButton={isButton(human)} reveal big active={humanToAct} />

      {/* 결과 / 액션 버튼 */}
      {handOver ? (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 text-center">
          <p
            className={`text-lg font-bold ${
              myNet > 0 ? 'text-emerald-600' : myNet < 0 ? 'text-rose-600' : 'text-slate-600'
            }`}
          >
            {myNet > 0 ? `+${myNet}칩 땄습니다!` : myNet < 0 ? `${myNet}칩 잃었습니다` : '본전입니다'}
          </p>
          <p className="text-sm text-slate-700 mt-1">{game.outcome!.summary}</p>
          <ShowdownList game={game} />
          {humanChampion ? (
            <>
              <p className="text-sm font-semibold text-emerald-700 mt-2">🏆 우승! 상대 3명의 칩을 모두 땄습니다.</p>
              <button
                onClick={newGame}
                className="mt-3 w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white"
              >
                새 게임
              </button>
            </>
          ) : humanBroke ? (
            <>
              <p className="text-sm text-rose-600 mt-2">칩을 모두 잃었습니다!</p>
              <button
                onClick={newGame}
                className="mt-3 w-full rounded-xl bg-slate-800 py-3 font-semibold text-white"
              >
                새 게임
              </button>
            </>
          ) : (
            <button
              onClick={nextHand}
              className="mt-3 w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700"
            >
              다음 핸드 →
            </button>
          )}
        </div>
      ) : humanToAct && legal ? (
        <div className="mt-3">
          {myHand && <MyHandBox info={myHand} />}
          {tip && (
            <div className="mb-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
              💡 {tip}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <ActionButton
              label="폴드"
              tone="bg-rose-100 text-rose-700"
              recommended={advice?.action === 'fold'}
              onClick={() => act({ type: 'fold' })}
            />
            {legal.canCheck ? (
              <ActionButton
                label="체크"
                tone="bg-slate-200 text-slate-800"
                recommended={advice?.action === 'check'}
                onClick={() => act({ type: 'check' })}
              />
            ) : (
              <ActionButton
                label={`콜 ${legal.callAmount}`}
                tone="bg-slate-200 text-slate-800"
                recommended={advice?.action === 'call'}
                onClick={() => act({ type: 'call' })}
              />
            )}
            {legal.canRaise && raiseTarget < legal.maxRaiseTo && (
              <ActionButton
                label={`${game.currentBet > 0 ? '레이즈' : '벳'} ${raiseTarget}`}
                tone="bg-emerald-600 text-white"
                recommended={advice?.action === 'raise'}
                onClick={() => act({ type: 'raise', amount: raiseTarget })}
              />
            )}
            {legal.canRaise && (
              <ActionButton
                label={`올인 ${legal.maxRaiseTo}`}
                tone="bg-amber-500 text-white"
                recommended={advice?.action === 'allin'}
                onClick={() => act({ type: 'allin' })}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="mt-3">
          {myHand && <MyHandBox info={myHand} />}
        <div className="text-center text-sm text-slate-400 py-3">
          {humanOut
            ? '폴드했습니다 — 남은 사람들의 진행을 빠르게 넘깁니다…'
            : actor
              ? `${seatName(actor)} 생각 중…`
              : '카드를 나누는 중…'}
        </div>
        </div>
      )}

      {/* 액션 기록 */}
      <div className="mt-3 rounded-xl bg-slate-100 p-2 h-24 overflow-y-auto text-xs text-slate-500">
        {game.log.slice(-8).map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
}

interface MyHandInfo {
  title: string;
  detail: string;
  best: HandResult | null;
}

/** 지금 내 패 조합: 프리플랍이면 시작 2장의 등급, 이후에는 7장 중 가장 좋은 5장의 족보. */
export function describeMyHand(me: Player, game: GameState): MyHandInfo {
  if (game.board.length === 0) {
    const h = classifyStartingHand(me.hole[0], me.hole[1]);
    return { title: h.name, detail: `시작 2장 등급: ${TIER_TERM[h.tier]}`, best: null };
  }
  const r = evaluateHand([...me.hole, ...game.board]);
  return { title: r.name, detail:
      arrangeBestFive(r).kickers.length > 0
        ? '내 카드 2장 + 커뮤니티 카드 중 가장 좋은 5장 (흐린 카드는 킥커: 족보가 같을 때만 승부를 가름)'
        : '내 카드 2장 + 커뮤니티 카드 중 가장 좋은 5장',
    best: r,
  };
}

/** 가장 좋은 5장을 족보 모양대로: 족보를 이루는 카드, 한 칸 띄우고 흐린 킥커. */
function BestFive({ result }: { result: HandResult }) {
  const { main, kickers } = arrangeBestFive(result);
  return (
    <span className="flex items-center gap-0.5 shrink-0">
      {main.map((c, i) => (
        <PlayingCard key={i} card={c} size="xs" />
      ))}
      {kickers.length > 0 && (
        <span className="ml-1.5 flex gap-0.5 opacity-60" title="킥커: 족보가 같을 때만 승부를 가르는 카드">
          {kickers.map((c, i) => (
            <PlayingCard key={i} card={c} size="xs" />
          ))}
        </span>
      )}
    </span>
  );
}

function MyHandBox({ info }: { info: MyHandInfo }) {
  return (
    <div className="mb-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
      <div className="flex items-center justify-between gap-2">
        <span>
          🃏 지금 내 패: <strong>{info.title}</strong>
        </span>
        {info.best && <BestFive result={info.best} />}
      </div>
      <div className="text-xs text-emerald-700 mt-0.5">{info.detail}</div>
    </div>
  );
}

/** 승부가 끝났을 때 각자의 패와 족보, 그리고 누가 왜 이겼는지 보여 줍니다. */
export function ShowdownList({ game }: { game: GameState }) {
  const outcome = game.outcome!;
  const byId = (id: number) => game.players.find((p) => p.id === id)!;
  const winners = new Set(outcome.winners);

  if (outcome.showdown.length === 0) {
    const w = outcome.winners.map((id) => seatName(byId(id))).join(', ');
    return (
      <p className="mt-2 rounded-lg bg-slate-50 px-2 py-1.5 text-xs text-slate-600">
        나머지가 모두 폴드해서 {josa(w, '이/가')} 카드를 공개하지 않고 팟을 가져갔습니다.
      </p>
    );
  }

  const entries = outcome.showdown
    .filter((e) => e.result)
    .map((e) => ({ player: byId(e.playerId), result: e.result!, won: winners.has(e.playerId) }))
    .sort((a, b) => Number(b.won) - Number(a.won) || b.result.category - a.result.category);

  const best = entries.find((e) => e.won);
  const loser = entries.find((e) => !e.won);
  let why = '';
  if (best && loser) {
    const w = seatName(best.player);
    why =
      best.result.category > loser.result.category
        ? `${w}의 ${josa(best.result.name, '이/가')} ${seatName(loser.player)}의 ${loser.result.name}보다 높은 족보라서 이겼습니다.`
        : `${josa(w, '과/와')} ${seatName(loser.player)} 모두 ${josa(best.result.name, '으로/로')} 족보는 같지만, 5장의 숫자(높은 카드·킥커)를 비교해 ${josa(w, '이/가')} 이겼습니다.`;
  } else if (entries.length > 1) {
    why = `모두 같은 세기의 ${best?.result.name ?? '패'}라서 팟을 나눠 가졌습니다.`;
  }

  return (
    <div className="mt-3 text-left">
      <div className="text-xs font-semibold text-slate-500 mb-1">공개된 패</div>
      <ul className="space-y-1.5">
        {entries.map(({ player, result, won }) => (
          <li
            key={player.id}
            className={`rounded-lg border px-2 py-1.5 ${won ? 'border-amber-300 bg-amber-50' : 'border-slate-200'}`}
          >
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-semibold text-slate-800">
                {won && '🏆 '}
                {seatName(player)}
              </span>
              <span className={won ? 'font-bold text-amber-700' : 'text-slate-600'}>{result.name}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex gap-0.5">
                {player.hole.map((c, i) => (
                  <PlayingCard key={i} card={c} size="xs" />
                ))}
              </span>
              <span className="text-[10px] text-slate-400">→ 가장 좋은 5장</span>
              <BestFive result={result} />
            </div>
          </li>
        ))}
      </ul>
      {why && <p className="mt-2 text-xs text-slate-600">💬 {why}</p>}
    </div>
  );
}

function ActionButton({
  label,
  tone,
  recommended,
  onClick,
}: {
  label: string;
  tone: string;
  recommended?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-xl py-3 font-semibold leading-tight ${tone} ${
        recommended ? 'ring-2 ring-indigo-400 ring-offset-1' : ''
      }`}
    >
      {label}
      {recommended && (
        <span className="absolute -top-2 right-1 rounded-full bg-indigo-500 px-1.5 text-[10px] text-white">
          💡추천
        </span>
      )}
    </button>
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
  const size = big ? 'md' : 'xs';
  return (
    <div
      className={`rounded-2xl border bg-white ${big ? 'p-3' : 'p-1.5'} ${
        active ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-slate-200'
      } ${player.folded || player.sittingOut ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <span className={`font-semibold text-slate-800 truncate ${big ? '' : 'text-xs'}`}>
            {seatName(player)}
          </span>
          {isButton && (
            <span
              className="inline-grid place-items-center w-4 h-4 shrink-0 rounded-full bg-slate-800 text-white text-[9px]"
              title="딜러 버튼"
            >
              딜
            </span>
          )}
        </div>
        <span className={`font-bold text-emerald-700 shrink-0 ${big ? 'text-sm' : 'text-xs'}`}>
          {player.chips}
        </span>
      </div>
      <div className={`flex items-center justify-between gap-1 ${big ? 'mt-2' : 'mt-1'}`}>
        <div className="flex gap-0.5 shrink-0">
          {player.hole.length === 0 ? (
            <span className="text-xs text-slate-300">—</span>
          ) : reveal ? (
            player.hole.map((c, i) => <PlayingCard key={i} card={c} size={size} />)
          ) : (
            player.hole.map((_, i) => <CardBack key={i} size={size} />)
          )}
        </div>
        {player.folded ? (
          <span className="text-[10px] text-rose-400 whitespace-nowrap">폴드</span>
        ) : player.sittingOut ? (
          <span className="text-[10px] text-slate-400 whitespace-nowrap">탈락</span>
        ) : (
          player.lastAction && (
            <span className="text-[10px] text-slate-500 whitespace-nowrap truncate">{player.lastAction}</span>
          )
        )}
      </div>
    </div>
  );
}
