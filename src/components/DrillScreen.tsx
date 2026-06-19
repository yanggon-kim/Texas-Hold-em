import { useState } from 'react';
import type { Drill, LevelDef } from '../drills/types';
import { DrillVisual } from './DrillVisual';

interface Props {
  level: LevelDef;
  onFinish: (correct: number, total: number) => void;
  onExit: () => void;
}

const rng = Math.random;

export function DrillScreen({ level, onFinish, onExit }: Props) {
  const base = level.drillsPerSession;

  // The queue starts with `base` questions; missing a base question appends
  // one bonus rep of the same skill (light spaced repetition).
  const [queue, setQueue] = useState<Drill[]>(() =>
    Array.from({ length: base }, () => level.generate(rng)),
  );
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [baseCorrect, setBaseCorrect] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = queue[index];
  const answered = selected !== null;
  const isBaseQuestion = index < base;
  const progressShown = Math.min(index + 1, base);

  function choose(i: number) {
    if (answered) return;
    setSelected(i);
    const correct = i === current.correctIndex;
    if (isBaseQuestion && correct) setBaseCorrect((c) => c + 1);
    if (!correct && isBaseQuestion) {
      setQueue((q) => [...q, level.generate(rng)]);
    }
  }

  function next() {
    const nextIndex = index + 1;
    if (nextIndex >= queue.length) {
      setFinished(true);
      onFinish(baseCorrect, base);
    } else {
      setIndex(nextIndex);
      setSelected(null);
    }
  }

  if (finished) {
    const mastered = baseCorrect >= level.masteryNeeded;
    return (
      <SessionSummary
        title={level.title}
        correct={baseCorrect}
        total={base}
        mastered={mastered}
        onExit={onExit}
      />
    );
  }

  const correctIndex = current.correctIndex;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* header / progress */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onExit} className="text-sm text-slate-500 hover:text-slate-800">
          ← Exit
        </button>
        <div className="text-sm text-slate-500">
          {isBaseQuestion ? (
            <>Question {progressShown} / {base}</>
          ) : (
            <span className="text-amber-600">Bonus practice</span>
          )}
          <span className="ml-3 font-medium text-emerald-600">{baseCorrect} correct</span>
        </div>
      </div>
      <div className="h-1.5 w-full rounded bg-slate-200 mb-6">
        <div
          className="h-1.5 rounded bg-emerald-500 transition-all"
          style={{ width: `${(progressShown / base) * 100}%` }}
        />
      </div>

      <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 text-center mb-5">{current.prompt}</h2>

        <div className="mb-6">
          <DrillVisual visual={current.visual} />
        </div>

        <div className="grid gap-2.5">
          {current.options.map((option, i) => {
            const isCorrect = i === correctIndex;
            const isChosen = i === selected;
            let cls = 'border-slate-200 bg-white hover:border-slate-400';
            if (answered) {
              if (isCorrect) cls = 'border-emerald-500 bg-emerald-50 text-emerald-800';
              else if (isChosen) cls = 'border-rose-400 bg-rose-50 text-rose-700';
              else cls = 'border-slate-200 bg-white opacity-60';
            }
            return (
              <button
                key={option}
                disabled={answered}
                onClick={() => choose(i)}
                className={`w-full text-left rounded-xl border px-4 py-3 font-medium transition ${cls}`}
              >
                {option}
                {answered && isCorrect && <span className="float-right">✓</span>}
                {answered && isChosen && !isCorrect && <span className="float-right">✗</span>}
              </button>
            );
          })}
        </div>

        {answered && <Coach correct={selected === correctIndex} text={current.explanation} />}
      </div>

      {answered && (
        <div className="mt-5 flex justify-end">
          <button
            onClick={next}
            className="rounded-xl bg-emerald-600 px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            {index + 1 >= queue.length ? 'Finish' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  );
}

function Coach({ correct, text }: { correct: boolean; text: string }) {
  return (
    <div
      className={`mt-5 rounded-xl border p-4 text-sm ${
        correct ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
      }`}
    >
      <p className={`font-semibold mb-1 ${correct ? 'text-emerald-700' : 'text-amber-700'}`}>
        {correct ? '✅ Correct!' : '💡 Not quite'}
      </p>
      <p className="text-slate-700 leading-relaxed">{text}</p>
    </div>
  );
}

function SessionSummary({
  title,
  correct,
  total,
  mastered,
  onExit,
}: {
  title: string;
  correct: number;
  total: number;
  mastered: boolean;
  onExit: () => void;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-12 text-center">
      <div className="text-6xl mb-4">{mastered ? '🎉' : '💪'}</div>
      <h2 className="text-2xl font-bold text-slate-800 mb-1">{title}</h2>
      <p className="text-slate-500 mb-6">
        You scored <span className="font-semibold text-slate-800">{correct} / {total}</span>
      </p>
      <div
        className={`rounded-xl border p-4 mb-8 ${
          mastered ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
        }`}
      >
        {mastered ? (
          <p className="text-emerald-700 font-medium">Level mastered — the next level is unlocked! 🔓</p>
        ) : (
          <p className="text-amber-700 font-medium">
            Almost! Score at least the mastery target to unlock the next level. Keep practising.
          </p>
        )}
      </div>
      <button
        onClick={onExit}
        className="rounded-xl bg-slate-800 px-6 py-2.5 font-semibold text-white hover:bg-slate-900"
      >
        Back to levels
      </button>
    </div>
  );
}
