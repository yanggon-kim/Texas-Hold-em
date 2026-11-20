import { useEffect, useMemo, useState } from 'react';
import {
  type Action,
  type GameState,
  type Player,
  makePlayers,
  startHand,
  applyAction,
  legalActions,
  actingOrder,
  seatName,
  STREET_LABEL,
} from '../engine/game';
import { decideBotAction, type Difficulty, DIFFICULTY_LABEL } from '../engine/bot';
import { type CoachAdvice, coachAdvice, suggestedRaiseTo } from '../engine/coach';
import { estimateEquity, finalCategoryOdds, type OpponentRange } from '../engine/equity';
import { cardToInt, categoryOf, evalInts } from '../engine/fastEval';
import { type Narration, narrateBotAction, narrateHandStart, narrateMyAction } from '../engine/narration';
import { GLOSSARY, Glosser } from '../engine/glossary';
import { cardId } from '../engine/card';
import { josa } from '../engine/josa';
import { PlayingCard, CardBack } from './PlayingCard';
import { HandOutlook, GlossaryPanel } from './HandOutlook';

const BIG_BLIND = 20;
const STARTING_CHIPS = 1000;
const BOTS = 3;
const AUTO_DELAY_MS = 750;

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

interface TableState {
  game: GameState;
  feed: Narration[];
}

function freshTable(players: Player[], button: number): TableState {
  const game = startHand(players, button, BIG_BLIND);
  return { game, feed: [narrateHandStart(game)] };
}

export function TableScreen({ onExit }: Props) {
  const [table, setTable] = useState<TableState>(() => freshTable(makePlayers(BOTS, STARTING_CHIPS), 0));
  const { game, feed } = table;
  const [showCoach, setShowCoach] = useState(true);
  const [stepMode, setStepMode] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');

  const human = game.players.find((p) => p.isHuman)!;
  const actor = game.toAct >= 0 ? game.players[game.toAct] : null;
  const humanToAct = actor?.isHuman ?? false;
  const handOver = game.street === 'complete';
  const humanOut = human.folded || human.sittingOut;

  // 내 패 전망과 승률: 카드나 남은 상대가 바뀔 때만 다시 계산합니다.
  const opponents = game.players.filter((p) => !p.isHuman && !p.folded);
  const ranges: OpponentRange[] = opponents.map((p) => (p.raises > 0 ? 'noTrash' : 'any'));
  const cardsKey = [...human.hole, ...game.board].map(cardId).join(',');
  const rangeKey = ranges.join(',');
  const inHand = !humanOut && human.hole.length === 2 && !handOver;

  const outlook = useMemo(() => {
    if (!inHand) return null;
    const { odds, exact } = finalCategoryOdds(human.hole, game.board);
    const current = categoryOf(evalInts([...human.hole, ...game.board].map(cardToInt)));
    return { odds, exact, current };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inHand, cardsKey]);

  const equity = useMemo(
    () => (inHand && opponents.length > 0 ? estimateEquity(human.hole, game.board, ranges) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inHand, cardsKey, rangeKey],
  );

  const advice: CoachAdvice | null = useMemo(
    () => (humanToAct && !handOver ? coachAdvice(game, Math.random, equity ?? undefined) : null),
    [game, humanToAct, handOver, equity],
  );

  function stepBot() {
    if (handOver || !actor || actor.isHuman) return;
    const action = decideBotAction(game, Math.random, difficulty);
    const next = applyAction(game, action);
    setTable({ game: next, feed: [...feed, narrateBotAction(game, next, action, difficulty)] });
  }

  // 내가 빠졌으면(폴드·칩 없음) 나머지는 빠르게 끝냅니다.
  // 한 단계씩 보기를 껐으면 봇 차례를 약간의 지연 후 자동 진행합니다.
  useEffect(() => {
    if (handOver || !actor || actor.isHuman) return;
    if (humanOut) {
      const t = setTimeout(() => {
        let g = game;
        let guard = 0;
        while (g.street !== 'complete' && g.toAct >= 0 && guard++ < 500) {
          g = applyAction(g, decideBotAction(g, Math.random, difficulty));
        }
        const lines = g.log.slice(game.log.length);
        setTable({
          game: g,
          feed: [...feed, { title: '나머지 진행', kind: 'start', sections: [{ title: '내가 빠진 뒤의 진행', lines }] }],
        });
      }, 400);
      return () => clearTimeout(t);
    }
    if (!stepMode) {
      const t = setTimeout(stepBot, AUTO_DELAY_MS);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, stepMode, humanOut, handOver, difficulty]);

  function act(action: Action) {
    if (!humanToAct) return;
    const next = applyAction(game, action);
    setTable({ game: next, feed: [...feed, narrateMyAction(game, next, action, showCoach ? advice : null)] });
  }

  function nextHand() {
    const roster = game.players.map((p) => ({ ...p }));
    setTable(freshTable(roster, nextButton(roster, game.buttonIndex)));
  }

  function newGame() {
    setTable(freshTable(makePlayers(BOTS, STARTING_CHIPS), 0));
  }

  const bots = game.players.filter((p) => !p.isHuman);
  const revealAll = handOver && game.outcome!.showdown.length > 0;
  const humanBroke = human.chips <= 0 && handOver;
  const legal = humanToAct ? legalActions(game) : null;
  const raiseTarget = legal ? suggestedRaiseTo(game) : 0;
  const order = actingOrder(game);
  const orderPos = (id: number) => order.indexOf(id) + 1;
  const recommended = showCoach && advice ? advice.action : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <button onClick={onExit} className="text-sm text-slate-500 hover:text-slate-800">
          ← 나가기
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1" title="봇 난이도">
            {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`rounded-md px-2 py-1 text-xs font-semibold ${
                  difficulty === d ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {DIFFICULTY_LABEL[d]}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-sm text-slate-500 cursor-pointer">
            <input type="checkbox" checked={stepMode} onChange={(e) => setStepMode(e.target.checked)} />
            한 명씩 멈춰 보기
          </label>
          <label className="flex items-center gap-1.5 text-sm text-slate-500 cursor-pointer">
            <input type="checkbox" checked={showCoach} onChange={(e) => setShowCoach(e.target.checked)} />
            💡 코치
          </label>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          {/* 상대 */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {bots.map((p) => (
              <Seat
                key={p.id}
                player={p}
                game={game}
                orderPos={orderPos(p.id)}
                reveal={revealAll && !p.folded}
                active={actor?.id === p.id}
              />
            ))}
          </div>

          {/* 테이블: 팟 + 보드 */}
          <div className="rounded-3xl bg-emerald-700 border-4 border-emerald-900 p-4 mb-3 shadow-inner">
            <div className="text-center text-emerald-100 text-sm">
              팟 <span className="font-bold text-white">{game.pot}</span>칩
              <span className="mx-2 text-emerald-300">·</span>
              <span className="font-semibold text-white">{STREET_LABEL[game.street]}</span>
            </div>
            {GLOSSARY[STREET_LABEL[game.street]] && (
              <p className="text-center text-[11px] text-emerald-200 mb-2">({GLOSSARY[STREET_LABEL[game.street]]})</p>
            )}
            <div className="flex justify-center gap-1.5 min-h-[5rem] items-center">
              {game.board.length === 0 ? (
                <span className="text-emerald-200/70 text-sm">커뮤니티 카드가 여기에 깔립니다</span>
              ) : (
                game.board.map((c, i) => <PlayingCard key={i} card={c} size="md" />)
              )}
            </div>
          </div>

          {/* 행동 순서 */}
          {!handOver && <OrderBar game={game} order={order} />}

          {/* 내 자리 */}
          <Seat player={human} game={game} orderPos={orderPos(human.id)} reveal big active={humanToAct} />

          <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
            딜러 = 딜러 버튼(매 핸드 한 칸씩 옮겨 가며, 플랍 이후 가장 마지막에 행동) · SB = 스몰 블라인드(버튼 왼쪽,
            의무로 10칩) · BB = 빅 블라인드(그다음 자리, 의무로 20칩) · "n번째" = 이번 베팅 라운드에서 행동하는 순서
          </p>

          {/* 해설 */}
          <NarrationFeed feed={feed} />

          {/* 결과 / 진행 / 액션 */}
          {handOver ? (
            <ResultPanel game={game} onNext={nextHand} onNewGame={newGame} broke={humanBroke} />
          ) : humanToAct && legal ? (
            <div className="mt-3">
              {showCoach && advice && <CoachPanel advice={advice} />}
              <div className="mt-2 flex flex-wrap gap-2">
                <ActButton
                  onClick={() => act({ type: 'fold' })}
                  tone="rose"
                  label="폴드"
                  hint="패를 버리고 포기"
                  rec={recommended === 'fold'}
                />
                {legal.canCheck ? (
                  <ActButton
                    onClick={() => act({ type: 'check' })}
                    tone="slate"
                    label="체크"
                    hint="칩 없이 차례 넘기기"
                    rec={recommended === 'check'}
                  />
                ) : (
                  <ActButton
                    onClick={() => act({ type: 'call' })}
                    tone="slate"
                    label={`콜 ${legal.callAmount}`}
                    hint="앞사람 금액에 맞추기"
                    rec={recommended === 'call'}
                  />
                )}
                {legal.canRaise && raiseTarget < legal.maxRaiseTo && (
                  <ActButton
                    onClick={() => act({ type: 'raise', amount: raiseTarget })}
                    tone="emerald"
                    label={`${game.currentBet > 0 ? '레이즈' : '벳'} ${raiseTarget}`}
                    hint={game.currentBet > 0 ? '더 올려서 걸기' : '처음으로 칩 걸기'}
                    rec={recommended === 'raise'}
                  />
                )}
                {legal.canRaise && (
                  <ActButton
                    onClick={() => act({ type: 'allin' })}
                    tone="amber"
                    label={`올인 ${legal.maxRaiseTo}`}
                    hint="가진 칩 전부 걸기"
                    rec={recommended === 'allin'}
                  />
                )}
              </div>
            </div>
          ) : actor && !humanOut && stepMode ? (
            <button
              onClick={stepBot}
              className="mt-3 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700"
            >
              다음 ▶ {seatName(actor)}의 행동 보기
            </button>
          ) : (
            <div className="mt-3 text-center text-sm text-slate-400 py-3">
              {humanOut ? '내가 빠진 핸드라 빠르게 진행합니다…' : actor ? `${seatName(actor)} 생각 중…` : '카드를 나누는 중…'}
            </div>
          )}

          {/* 액션 기록 */}
          <div className="mt-4 rounded-xl bg-slate-100 p-3 max-h-32 overflow-y-auto text-xs text-slate-500 font-mono">
            {game.log.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>

        {/* 사이드 패널 */}
        <aside className="space-y-3">
          <HandOutlook
            hole={human.hole}
            board={game.board}
            odds={outlook?.odds ?? null}
            exact={outlook?.exact ?? false}
            current={outlook?.current ?? null}
            equity={equity}
            opponents={opponents.length}
          />
          <GlossaryPanel />
        </aside>
      </div>
    </div>
  );
}

function OrderBar({ game, order }: { game: GameState; order: number[] }) {
  return (
    <div className="mb-3 rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs text-slate-600">
      <span className="font-semibold text-slate-700">{STREET_LABEL[game.street]} 행동 순서: </span>
      {order.map((i, k) => {
        const p = game.players[i];
        const current = game.toAct === i;
        return (
          <span key={i}>
            {k > 0 && <span className="mx-1 text-slate-300">→</span>}
            <span
              className={`${current ? 'rounded bg-emerald-100 px-1 font-bold text-emerald-800' : ''} ${
                p.folded ? 'line-through text-slate-300' : ''
              }`}
            >
              {seatName(p)}
              {p.allIn && !p.folded ? '(올인)' : ''}
            </span>
          </span>
        );
      })}
    </div>
  );
}

function Seat({
  player,
  game,
  orderPos,
  reveal,
  big,
  active,
}: {
  player: Player;
  game: GameState;
  orderPos: number;
  reveal: boolean;
  big?: boolean;
  active?: boolean;
}) {
  const roles: string[] = [];
  if (!player.sittingOut) {
    if (game.buttonIndex === player.id) roles.push('딜러');
    if (game.sbIndex === player.id) roles.push('SB');
    if (game.bbIndex === player.id) roles.push('BB');
  }
  return (
    <div
      className={`rounded-2xl border bg-white p-3 ${
        active ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-slate-200'
      } ${player.folded ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 min-w-0 flex-wrap">
          <span className="inline-grid place-items-center w-5 h-5 shrink-0 rounded-full bg-slate-700 text-white text-[11px] font-bold">
            {player.id + 1}
          </span>
          <span className="font-semibold text-slate-800 truncate whitespace-nowrap">
            {player.id + 1}번 {player.name}
          </span>
          {roles.map((r) => (
            <span key={r} className="rounded bg-slate-800 px-1 text-[10px] text-white">
              {r}
            </span>
          ))}
        </div>
        <span className="text-sm font-bold text-emerald-700 shrink-0">{player.chips}</span>
      </div>
      {!player.sittingOut && game.street !== 'complete' && orderPos > 0 && (
        <div className="text-[10px] text-slate-400 mt-0.5">이번 라운드 {orderPos}번째로 행동</div>
      )}
      <div className="flex items-center justify-between mt-2 gap-1">
        <div className="flex gap-1 shrink-0">
          {player.hole.length === 0 ? (
            <span className="text-xs text-slate-300">{player.sittingOut ? '칩 없음 · 쉼' : '—'}</span>
          ) : reveal ? (
            player.hole.map((c, i) => <PlayingCard key={i} card={c} size={big ? 'md' : 'sm'} />)
          ) : (
            player.hole.map((_, i) => <CardBack key={i} size={big ? 'md' : 'sm'} />)
          )}
        </div>
        {player.lastAction && !player.folded && (
          <span className="text-[11px] text-slate-500 text-right">{player.lastAction}</span>
        )}
        {player.folded && !player.sittingOut && <span className="text-[11px] text-rose-400 shrink-0">폴드</span>}
      </div>
    </div>
  );
}

function ActButton({
  onClick,
  tone,
  label,
  hint,
  rec,
}: {
  onClick: () => void;
  tone: 'rose' | 'slate' | 'emerald' | 'amber';
  label: string;
  hint: string;
  rec: boolean;
}) {
  const tones = {
    rose: 'bg-rose-100 text-rose-700 hover:bg-rose-200',
    slate: 'bg-slate-200 text-slate-800 hover:bg-slate-300',
    emerald: 'bg-emerald-600 text-white hover:bg-emerald-700',
    amber: 'bg-amber-500 text-white hover:bg-amber-600',
  };
  return (
    <button
      onClick={onClick}
      className={`flex-1 min-w-[6.5rem] rounded-xl px-3 py-2 font-semibold leading-tight ${tones[tone]} ${
        rec ? 'ring-4 ring-indigo-300' : ''
      }`}
    >
      <div>
        {label}
        {rec && ' 💡'}
      </div>
      <div className="text-[10px] font-normal opacity-80">{hint}</div>
    </button>
  );
}

function Sections({ sections }: { sections: { title: string; lines: string[] }[] }) {
  return (
    <div className="space-y-2">
      {sections.map((s) => (
        <div key={s.title}>
          <div className="font-semibold text-[13px]">{s.title}</div>
          <ul className="mt-0.5 space-y-1 list-disc pl-5">
            {s.lines.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function CoachPanel({ advice }: { advice: CoachAdvice }) {
  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900 leading-relaxed">
      <div className="font-bold mb-2">💡 코치: {advice.headline}</div>
      <Sections sections={advice.sections} />
    </div>
  );
}

function NarrationFeed({ feed }: { feed: Narration[] }) {
  if (feed.length === 0) return null;
  const latest = feed[feed.length - 1];
  const earlier = feed.slice(0, -1);
  const tone =
    latest.kind === 'bot'
      ? 'border-amber-200 bg-amber-50 text-amber-950'
      : latest.kind === 'me'
        ? 'border-sky-200 bg-sky-50 text-sky-950'
        : 'border-slate-200 bg-white text-slate-800';
  return (
    <div className="mt-3">
      <div className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${tone}`}>
        <div className="font-bold mb-2">📢 {latest.title}</div>
        <Sections sections={latest.sections} />
      </div>
      {earlier.length > 0 && (
        <details className="mt-1">
          <summary className="cursor-pointer text-xs text-slate-500">
            이번 핸드의 이전 해설 {earlier.length}개 보기
          </summary>
          <div className="mt-1 space-y-2">
            {[...earlier].reverse().map((n, i) => (
              <div key={i} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                <div className="font-semibold mb-1">{n.title}</div>
                <Sections sections={n.sections} />
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function ResultPanel({
  game,
  onNext,
  onNewGame,
  broke,
}: {
  game: GameState;
  onNext: () => void;
  onNewGame: () => void;
  broke: boolean;
}) {
  const o = game.outcome!;
  const g = new Glosser();
  const name = (id: number) => seatName(game.players[id]);
  const names = (ids: number[]) => ids.map(name).join(', ');
  const me = game.players.find((p) => p.isHuman)!;
  const myNet = o.net[me.id];
  const handOf = (id: number) => o.showdown.find((s) => s.playerId === id)?.result ?? null;
  const players = game.players.filter((p) => !p.sittingOut);

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm">
      <p className="font-semibold text-slate-800">{o.summary}</p>

      {!me.sittingOut && (
        <p
          className={`mt-2 rounded-lg px-3 py-2 font-semibold ${
            myNet > 0 ? 'bg-emerald-50 text-emerald-800' : myNet < 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-700'
          }`}
        >
          나의 결과: 이번 핸드에 {o.contributed[me.id]}칩을 내고 {o.winnings[me.id] ?? 0}칩을 받아 →{' '}
          {myNet > 0 ? `${myNet}칩 이득` : myNet < 0 ? `${-myNet}칩 손해` : '본전'}
        </p>
      )}

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500 border-b">
              <th className="text-left py-1">자리</th>
              <th className="text-left">패</th>
              <th className="text-right">낸 칩</th>
              <th className="text-right">받은 칩</th>
              <th className="text-right">순이익</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => {
              const r = handOf(p.id);
              const net = o.net[p.id];
              return (
                <tr key={p.id} className={`border-b border-slate-100 ${p.isHuman ? 'font-semibold' : ''}`}>
                  <td className="py-1">{seatName(p)}</td>
                  <td>{p.folded ? '폴드' : r ? r.name : '—'}</td>
                  <td className="text-right tabular-nums">{o.contributed[p.id]}</td>
                  <td className="text-right tabular-nums">{o.winnings[p.id] ?? 0}</td>
                  <td
                    className={`text-right tabular-nums ${net > 0 ? 'text-emerald-700' : net < 0 ? 'text-rose-600' : ''}`}
                  >
                    {net > 0 ? `+${net}` : net}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-slate-600 leading-relaxed">
        {o.pots.map((pot) => {
          const each = Math.floor(pot.amount / pot.winners.length);
          return (
            <p key={pot.label}>
              <strong>{pot.label === '팟' ? g.t('팟') : g.t(pot.label.startsWith('사이드') ? '사이드 팟' : '메인 팟')}</strong>
              {pot.label.startsWith('사이드 팟 ') ? ` ${pot.label.slice(-1)}` : ''} {pot.amount}칩 — 이길 자격:{' '}
              {names(pot.eligible)}.{' '}
              {pot.winners.length === 1
                ? `${josa(name(pot.winners[0]), '이/가')} 모두 가져갑니다.`
                : `${josa(names(pot.winners), '이/가')} 똑같이 강해서 ${g.t('스플릿')}: 1인당 ${each}칩씩 나눠 가집니다.`}
            </p>
          );
        })}
        {o.pots.length > 1 && (
          <p className="text-slate-500">
            팟이 여러 개인 이유: 누군가 가진 칩이 모자라 올인하면, 그 사람은 자기가 낸 만큼까지만 다른 사람에게서
            받을 수 있습니다. 그 위로 나머지 사람들이 더 건 칩은 따로 모아(사이드 팟) 그 사람들끼리만 겨룹니다.
          </p>
        )}
        {o.showdown.length > 0 && (
          <p>
            {g.t('쇼다운')}에서 공개된 패:{' '}
            {o.showdown
              .map((s) => `${name(s.playerId)} ${s.result ? s.result.name : ''}`)
              .join(' · ')}
            .
          </p>
        )}
      </div>

      <div className="mt-3 text-center">
        {broke ? (
          <>
            <p className="text-sm text-rose-600">칩을 모두 잃었습니다!</p>
            <button
              onClick={onNewGame}
              className="mt-2 rounded-xl bg-slate-800 px-6 py-2.5 font-semibold text-white hover:bg-slate-900"
            >
              새 게임
            </button>
          </>
        ) : (
          <button
            onClick={onNext}
            className="rounded-xl bg-emerald-600 px-6 py-2.5 font-semibold text-white hover:bg-emerald-700"
          >
            다음 핸드 →
          </button>
        )}
      </div>
    </div>
  );
}
