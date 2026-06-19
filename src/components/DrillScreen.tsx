import { useState } from 'react';
import type { Drill, LevelDef } from '../drills/types';
import { DrillVisual } from './DrillVisual';

export type DrillMode = 'mastery' | 'endless';

interface Props {
  level: LevelDef;
  mode: DrillMode;
  /** Called when a mastery session ends (records progress). */
  onFinish: (correct: number, total: number) => void;
  /** Restart the session in the same mode. */
  onReplay: () => void;
  onExit: () => void;
}

const rng = Math.random;

export function DrillScreen({ level, mode, onFinish, onReplay, onExit }: Props) {
  const isEndless = mode === 'endless';
  const base = level.drillsPerSession;

  // Mastery starts with `base` questions; endless starts with one and grows.
  const [queue, setQueue] = useState<Drill[]>(() =>
    isEndless ? [level.generate(rng)] : Array.from({ length: base }, () => level.generate(rng)),
  );
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [baseCorrect, setBaseCorrect] = useState(0); // correct among first `base` (mastery)
  const [totalCorrect, setTotalCorrect] = useState(0); // correct overall (both modes)
  const [finished, setFinished] = useState(false);

  const current = queue[index];
  const answered = selected !== null;
  const isBaseQuestion = !isEndless && index < base;
  const progressShown = Math.min(index + 1, base);
  const answeredCount = index + (answered ? 1 : 0);

  function choose(i: number) {
    if (answered) return;
    setSelected(i);
    const correct = i === current.correctIndex;
    if (correct) setTotalCorrect((c) => c + 1);
    if (isBaseQuestion && correct) setBaseCorrect((c) => c + 1);
    // Missing a base/endless question appends a bonus rep (spaced repetition).
    if (!correct && (isEndless || isBaseQuestion)) {
      setQueue((q) => [...q, level.generate(rng)]);
    }
  }

  function next() {
    const nextIndex = index + 1;
    if (isEndless) {
      if (nextIndex >= queue.length) setQueue((q) => [...q, level.generate(rng)]);
      setIndex(nextIndex);
      setSelected(null);
      return;
    }
    if (nextIndex >= queue.length) {
      setFinished(true);
      onFinish(baseCorrect, base);
    } else {
      setIndex(nextIndex);
      setSelected(null);
    }
  }

  if (finished) {
    if (isEndless) {
      return (
        <EndlessSummary
          title={level.title}
          correct={totalCorrect}
          total={answeredCount}
          onReplay={onReplay}
          onExit={onExit}
        />
      );
    }
    return (
      <MasterySummary
        title={level.title}
        correct={baseCorrect}
        total={base}
        mastered={baseCorrect >= level.masteryNeeded}
        onReplay={onReplay}
        onExit={onExit}
      />
    );
  }

  const accuracy = answeredCount > 0 ? Math.round((totalCorrect / answeredCount) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* header / progress */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onExit} className="text-sm text-slate-500 hover:text-slate-800">
          ← Exit
        </button>
        <div className="text-sm text-slate-500">
          {isEndless ? (
            <>
              <span className="text-indigo-600 font-medium">∞ Endless</span>
              <span className="ml-3">Answered {answeredCount}</span>
            </>
          ) : isBaseQuestion ? (
            <>Question {progressShown} / {base}</>
          ) : (
            <span className="text-amber-600">Bonus practice</span>
          )}
          <span className="ml-3 font-medium text-emerald-600">
            {isEndless ? `${totalCorrect} correct · ${accuracy}%` : `${baseCorrect} correct`}
          </span>
        </div>
      </div>
      <div className="h-1.5 w-full rounded bg-slate-200 mb-6">
        <div
          className={`h-1.5 rounded transition-all ${isEndless ? 'bg-indigo-500' : 'bg-emerald-500'}`}
          style={{ width: isEndless ? `${accuracy}%` : `${(progressShown / base) * 100}%` }}
        />
      </div>

      <QuestionCard drill={current} selected={selected} onChoose={choose} />

      <div className="mt-5 flex items-center justify-between">
        {isEndless ? (
          <button
            onClick={() => setFinished(true)}
            className="rounded-xl px-4 py-2.5 font-medium text-slate-500 hover:bg-slate-100"
          >
            End practice
          </button>
        ) : (
          <span />
        )}
        {answered && (
          <button
            onClick={next}
            className="rounded-xl bg-emerald-600 px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            {isEndless ? 'Next →' : index + 1 >= queue.length ? 'Finish' : 'Next →'}
          </button>
        )}
      </div>
    </div>
  );
}

function QuestionCard({
  drill,
  selected,
  onChoose,
}: {
  drill: Drill;
  selected: number | null;
  onChoose: (i: number) => void;
}) {
  const answered = selected !== null;
  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-800 text-center mb-5">{drill.prompt}</h2>

      <div className="mb-6">
        <DrillVisual visual={drill.visual} />
      </div>

      <div className="grid gap-2.5">
        {drill.options.map((option, i) => {
          const isCorrect = i === drill.correctIndex;
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
              onClick={() => onChoose(i)}
              className={`w-full text-left rounded-xl border px-4 py-3 font-medium transition ${cls}`}
            >
              {option}
              {answered && isCorrect && <span className="float-right">✓</span>}
              {answered && isChosen && !isCorrect && <span className="float-right">✗</span>}
            </button>
          );
        })}
      </div>

      {answered && <Coach correct={selected === drill.correctIndex} text={drill.explanation} />}
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

function MasterySummary({
  title,
  correct,
  total,
  mastered,
  onReplay,
  onExit,
}: {
  title: string;
  correct: number;
  total: number;
  mastered: boolean;
  onReplay: () => void;
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
      <div className="flex flex-col gap-3">
        <button
          onClick={onReplay}
          className="rounded-xl bg-emerald-600 px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          🔁 Practice again
        </button>
        <button
          onClick={onExit}
          className="rounded-xl bg-slate-800 px-6 py-2.5 font-semibold text-white hover:bg-slate-900"
        >
          Back to levels
        </button>
      </div>
      <p className="mt-4 text-xs text-slate-400">
        Repetition is how it sticks — run it again to lock in the concepts.
      </p>
    </div>
  );
}

function EndlessSummary({
  title,
  correct,
  total,
  onReplay,
  onExit,
}: {
  title: string;
  correct: number;
  total: number;
  onReplay: () => void;
  onExit: () => void;
}) {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="mx-auto max-w-md px-4 py-12 text-center">
      <div className="text-6xl mb-4">🏋️</div>
      <h2 className="text-2xl font-bold text-slate-800 mb-1">{title} · Endless Practice</h2>
      <p className="text-slate-500 mb-6">
        You answered <span className="font-semibold text-slate-800">{total}</span> questions ·{' '}
        <span className="font-semibold text-slate-800">{correct} correct</span> ({accuracy}%)
      </p>
      <div className="flex flex-col gap-3">
        <button
          onClick={onReplay}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          🔁 Keep practising
        </button>
        <button
          onClick={onExit}
          className="rounded-xl bg-slate-800 px-6 py-2.5 font-semibold text-white hover:bg-slate-900"
        >
          Back to levels
        </button>
      </div>
    </div>
  );
}
