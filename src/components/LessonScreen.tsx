import { useMemo, useState } from 'react';
import type { LevelDef, LessonCard } from '../drills/types';
import { DrillVisual } from './DrillVisual';
import { LessonDiagram } from './LessonDiagram';

interface Props {
  level: LevelDef;
  onStartPractice: () => void;
  onExit: () => void;
}

const rng = Math.random;

export function LessonScreen({ level, onStartPractice, onExit }: Props) {
  // 방문할 때마다 학습 내용을 한 번 만듭니다 (공부하는 동안 예시는 바뀌지 않습니다).
  const cards = useMemo<LessonCard[]>(
    () => (level.lesson ? level.lesson(rng) : []),
    [level],
  );
  const [index, setIndex] = useState(0);

  if (cards.length === 0) {
    onStartPractice();
    return null;
  }

  const card = cards[index];
  const isLast = index === cards.length - 1;

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onExit} className="text-sm text-slate-500 hover:text-slate-800">
          ← 나가기
        </button>
        <span className="text-sm text-slate-500">
          학습 · {index + 1} / {cards.length}
        </span>
      </div>
      <div className="h-1.5 w-full rounded bg-slate-200 mb-6">
        <div
          className="h-1.5 rounded bg-indigo-500 transition-all"
          style={{ width: `${((index + 1) / cards.length) * 100}%` }}
        />
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 min-h-[18rem] flex flex-col">
        <h2 className="text-xl font-bold text-slate-800">{card.term}</h2>

        <p className="mt-3 text-slate-700 leading-relaxed">{card.definition}</p>

        {card.diagram && (
          <div className="mt-5 flex justify-center">
            <LessonDiagram diagram={card.diagram} />
          </div>
        )}

        {card.example && (
          <div className="mt-5 flex justify-center">
            <DrillVisual visual={card.example} />
          </div>
        )}

        {card.note && (
          <p className="mt-auto pt-5 text-sm text-slate-500 italic">💡 {card.note}</p>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="rounded-xl px-4 py-2.5 font-medium text-slate-600 disabled:opacity-40 hover:bg-slate-100"
        >
          ← 이전
        </button>
        {isLast ? (
          <button
            onClick={onStartPractice}
            className="rounded-xl bg-emerald-600 px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            연습 시작 →
          </button>
        ) : (
          <button
            onClick={() => setIndex((i) => Math.min(cards.length - 1, i + 1))}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            다음 →
          </button>
        )}
      </div>
    </div>
  );
}
