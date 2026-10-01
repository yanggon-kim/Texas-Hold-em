import type { LessonDiagram as Diagram, TableHighlight } from '../drills/types';
import { RANKS, SUITS, SUIT_NAME } from '../engine/card';
import { parseCard } from '../engine/handEvaluator';
import { PlayingCard, CardBack } from './PlayingCard';

export function LessonDiagram({ diagram }: { diagram: Diagram }) {
  switch (diagram.kind) {
    case 'suits':
      return <SuitsDiagram />;
    case 'rankStrip':
      return <RankStripDiagram />;
    case 'rankLadder':
      return <RankLadderDiagram />;
    case 'bettingRounds':
      return <BettingRoundsDiagram />;
    case 'table':
      return <PokerTableDiagram highlight={diagram.highlight} />;
  }
}

/* ---- 네 가지 무늬와 색깔 ---- */
function SuitsDiagram() {
  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
      {SUITS.map((suit) => {
        const red = suit === '♥' || suit === '♦';
        return (
          <div
            key={suit}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
          >
            <span className={`text-3xl ${red ? 'text-rose-600' : 'text-slate-900'}`}>{suit}</span>
            <div className="min-w-0">
              <div className="font-semibold text-slate-800 text-sm">{SUIT_NAME[suit]}</div>
              <div className={`text-[10px] font-medium ${red ? 'text-rose-500' : 'text-slate-500'}`}>
                {red ? '빨간색' : '검은색'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---- 랭크 순서 2 → A ---- */
function RankStripDiagram() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex flex-wrap justify-center gap-1">
        {RANKS.map((rank) => (
          <span
            key={rank}
            className="grid place-items-center w-8 h-10 rounded-md border border-slate-200 bg-white text-sm font-semibold text-slate-800"
          >
            {rank}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between w-full max-w-xs text-xs text-slate-400">
        <span>← 낮음</span>
        <span>높음 (에이스) →</span>
      </div>
    </div>
  );
}

/* ---- 10가지 족보 사다리, 가장 강한 것이 맨 위 ---- */
const LADDER: { name: string; tone: string }[] = [
  { name: '로열 플러시', tone: 'bg-emerald-600' },
  { name: '스트레이트 플러시', tone: 'bg-emerald-500' },
  { name: '포카드', tone: 'bg-teal-500' },
  { name: '풀하우스', tone: 'bg-cyan-500' },
  { name: '플러시', tone: 'bg-sky-500' },
  { name: '스트레이트', tone: 'bg-blue-500' },
  { name: '트리플', tone: 'bg-indigo-500' },
  { name: '투 페어', tone: 'bg-violet-500' },
  { name: '원 페어', tone: 'bg-purple-400' },
  { name: '하이 카드', tone: 'bg-slate-400' },
];

function RankLadderDiagram() {
  return (
    <div className="w-full max-w-sm">
      <div className="text-xs text-slate-400 mb-1 text-center">가장 강함 ↑</div>
      <div className="flex flex-col gap-1">
        {LADDER.map((row, i) => (
          <div
            key={row.name}
            className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-white text-sm font-medium ${row.tone}`}
          >
            <span>{row.name}</span>
            <span className="text-white/70 text-xs">#{i + 1}</span>
          </div>
        ))}
      </div>
      <div className="text-xs text-slate-400 mt-1 text-center">가장 약함 ↓</div>
    </div>
  );
}

/* ---- 네 번의 베팅 라운드 타임라인 ---- */
const c = (label: string) => parseCard(label);

function Stage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-end gap-0.5">{children}</div>
      <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap">{title}</span>
    </div>
  );
}

function Arrow() {
  return <span className="text-slate-300 text-lg self-start mt-3">→</span>;
}

function BettingRoundsDiagram() {
  return (
    <div className="flex items-start gap-1.5 overflow-x-auto w-full justify-center pb-1">
      <Stage title="프리플랍">
        <CardBack size="sm" />
        <CardBack size="sm" />
      </Stage>
      <Arrow />
      <Stage title="플랍 (3)">
        <PlayingCard card={c('K♠')} size="sm" />
        <PlayingCard card={c('9♥')} size="sm" />
        <PlayingCard card={c('4♣')} size="sm" />
      </Stage>
      <Arrow />
      <Stage title="턴 (1)">
        <PlayingCard card={c('Q♦')} size="sm" />
      </Stage>
      <Arrow />
      <Stage title="리버 (1)">
        <PlayingCard card={c('2♠')} size="sm" />
      </Stage>
      <Arrow />
      <Stage title="쇼다운">
        <span className="text-2xl leading-none">🏆</span>
      </Stage>
    </div>
  );
}

/* ---- 자리 역할이 표시된 6인 포커 테이블 ---- */
interface Seat {
  role: string;
  top: number;
  left: number;
}
const SEATS: Seat[] = [
  { role: 'BTN', top: 86, left: 70 },
  { role: 'SB', top: 86, left: 30 },
  { role: 'BB', top: 50, left: 8 },
  { role: 'UTG', top: 14, left: 30 },
  { role: 'MP', top: 14, left: 70 },
  { role: 'CO', top: 50, left: 92 },
];

/** 그림에 표시하는 자리 이름. */
const SEAT_LABEL: Record<string, string> = {
  BTN: '버튼',
  SB: '스몰 블라인드',
  BB: '빅 블라인드',
  UTG: '언더더건',
  MP: '미들',
  CO: '컷오프',
};

function seatStyle(role: string, highlight?: TableHighlight): string {
  const on = 'bg-emerald-500 text-white border-emerald-600 ring-2 ring-emerald-300';
  const early = 'bg-amber-100 text-amber-800 border-amber-300';
  const late = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  const off = 'bg-white text-slate-600 border-slate-300';
  switch (highlight) {
    case 'button':
      return role === 'BTN' ? on : off;
    case 'blinds':
      return role === 'SB' || role === 'BB' ? on : off;
    case 'utg':
      return role === 'UTG' ? on : off;
    case 'earlyLate':
      if (role === 'UTG' || role === 'MP') return early;
      if (role === 'CO' || role === 'BTN') return late;
      return off;
    default:
      return off;
  }
}

function PokerTableDiagram({ highlight }: { highlight?: TableHighlight }) {
  return (
    <div className="w-full max-w-sm">
      <div className="relative w-full" style={{ paddingBottom: '62%' }}>
        {/* 테이블 천 */}
        <div className="absolute inset-[14%] rounded-[50%] bg-emerald-700 border-4 border-emerald-900 shadow-inner grid place-items-center">
          <span className="text-emerald-200/70 text-xs font-semibold tracking-wide">테이블</span>
        </div>
        {/* 자리 */}
        {SEATS.map((seat) => (
          <div
            key={seat.role}
            className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg border px-2 py-1 text-xs font-bold shadow-sm ${seatStyle(
              seat.role,
              highlight,
            )}`}
            style={{ top: `${seat.top}%`, left: `${seat.left}%` }}
          >
            {SEAT_LABEL[seat.role]}
            {seat.role === 'BTN' && (
              <span className="ml-1 inline-grid place-items-center w-4 h-4 rounded-full bg-white text-slate-900 text-[9px] align-middle">
                D
              </span>
            )}
          </div>
        ))}
      </div>
      {highlight === 'earlyLate' && (
        <div className="flex justify-center gap-4 mt-1 text-[11px]">
          <span className="text-amber-700">● 얼리 (타이트)</span>
          <span className="text-emerald-700">● 레이트 (루즈)</span>
        </div>
      )}
    </div>
  );
}
