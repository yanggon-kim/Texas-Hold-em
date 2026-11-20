import { type ReactNode } from 'react';
import { type Card } from '../engine/card';
import { CATEGORY_NAME, HandCategory } from '../engine/handEvaluator';
import { type EquityResult } from '../engine/equity';
import { GLOSSARY } from '../engine/glossary';

interface Props {
  hole: Card[];
  board: Card[];
  /** 리버까지의 최종 족보 확률 (HandCategory 인덱스). 핸드에 참여하지 않으면 null. */
  odds: number[] | null;
  exact: boolean;
  current: HandCategory | null;
  equity: EquityResult | null;
  opponents: number;
}

const ORDER: HandCategory[] = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

function fmt(p: number): string {
  if (p <= 0) return '0%';
  if (p < 0.001) return '<0.1%';
  if (p < 0.1) return `${(p * 100).toFixed(1)}%`;
  return `${Math.round(p * 100)}%`;
}

/** 사이드 패널: 리버까지 각 족보가 될 확률과 지금 승률. */
export function HandOutlook({ hole, board, odds, exact, current, equity, opponents }: Props) {
  if (!odds || current === null) {
    return (
      <Panel title="내 패 전망">
        <p className="text-sm text-slate-400">이번 핸드에는 참여하고 있지 않습니다.</p>
      </Panel>
    );
  }
  const atLeast = (cat: number) => odds.slice(cat).reduce((a, b) => a + b, 0);
  const cardsLeft = 5 - board.length;
  const next1 = current + 1 <= 9 ? current + 1 : null;
  const next2 = current + 2 <= 9 ? current + 2 : null;

  return (
    <Panel title="내 패 전망">
      {equity && (
        <div className="mb-3 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2">
          <div className="text-xs text-emerald-700">
            지금 승률(에퀴티: 이길 확률 + 비길 때 내 몫), 상대 {opponents}명 기준
          </div>
          <div className="text-2xl font-bold text-emerald-800">{Math.round(equity.equity * 100)}%</div>
          <div className="text-[11px] text-emerald-700">
            이길 확률 {Math.round(equity.win * 100)}% · 비길 확률 {Math.round(equity.tie * 100)}% · 모두 같은
            실력일 때 평균 {Math.round(100 / (opponents + 1))}%
          </div>
        </div>
      )}

      <p className="text-xs text-slate-500 mb-2">
        {cardsLeft === 0
          ? '모든 카드가 나왔습니다. 아래는 내 최종 족보입니다.'
          : `남은 커뮤니티 카드 ${cardsLeft}장이 다 나왔을 때(리버), 내 최종 족보가 각각 될 확률입니다. ${
              exact ? '남은 모든 경우를 정확히 센 값입니다.' : '4,000번 무작위로 깔아 본 추정값입니다.'
            }`}
      </p>

      <ul className="space-y-1">
        {ORDER.map((cat) => {
          const p = odds[cat];
          const isNow = cat === current;
          return (
            <li key={cat} className={`rounded-lg px-2 py-1 ${isNow ? 'bg-indigo-50 ring-1 ring-indigo-200' : ''}`}>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${p > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
                  {CATEGORY_NAME[cat]}
                  {isNow && (
                    <span className="ml-1 rounded bg-indigo-600 px-1 py-px text-[10px] text-white">지금</span>
                  )}
                </span>
                <span className={`tabular-nums ${p > 0 ? 'text-slate-700' : 'text-slate-300'}`}>{fmt(p)}</span>
              </div>
              <div className="mt-0.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${isNow ? 'bg-indigo-500' : cat > current ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  style={{ width: `${Math.min(100, p * 100)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 space-y-1 text-xs text-slate-600 leading-relaxed">
        <p>
          지금 내 족보: <strong>{CATEGORY_NAME[current]}</strong>
          {board.length === 0 && ` (아직 홀 카드 ${hole.length}장뿐)`}.
        </p>
        {cardsLeft > 0 && next1 !== null && (
          <p>
            리버까지 <strong>{CATEGORY_NAME[next1 as HandCategory]} 이상</strong>이 될 확률 {fmt(atLeast(next1))}
            {next2 !== null && (
              <>
                , <strong>{CATEGORY_NAME[next2 as HandCategory]} 이상</strong>은 {fmt(atLeast(next2))}
              </>
            )}
            .
          </p>
        )}
        <p className="text-slate-400">
          이 막대는 내 패만 본 확률입니다. 상대의 패도 함께 좋아질 수 있어서, 실제로 이길지는 위의 승률로
          판단합니다.
        </p>
      </div>
    </Panel>
  );
}

/** 사이드 패널: 용어 사전. */
export function GlossaryPanel() {
  return (
    <Panel title="용어 사전">
      <details>
        <summary className="cursor-pointer text-sm text-slate-600">펼쳐 보기 ({Object.keys(GLOSSARY).length}개)</summary>
        <dl className="mt-2 space-y-1.5 text-xs">
          {Object.entries(GLOSSARY).map(([term, meaning]) => (
            <div key={term}>
              <dt className="font-semibold text-slate-800 inline">{term}</dt>
              <dd className="inline text-slate-600"> — {meaning}</dd>
            </div>
          ))}
        </dl>
      </details>
    </Panel>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
      {children}
    </section>
  );
}
