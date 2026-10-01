import { useState } from 'react';
import type { Drill, LevelDef } from '../drills/types';
import { DrillVisual } from './DrillVisual';

export type DrillMode = 'mastery' | 'endless';

export interface SessionOutcome {
  mode: DrillMode;
  correct: number;
  answered: number;
}

interface Props {
  level: LevelDef;
  mode: DrillMode;
  /** 세션이 끝날 때(마스터 또는 무한 연습) 한 번 호출되어 통계를 기록합니다. */
  onComplete: (outcome: SessionOutcome) => void;
  /** 같은 모드로 세션을 다시 시작합니다. */
  onReplay: () => void;
  onExit: () => void;
}

const rng = Math.random;

// 레벨 설정이 잘못되어도 멈추지 않도록 하는 대체 문제 (플레이 레벨은 사용하지 않음).
const emptyDrill: Drill = {
  prompt: '이 레벨에는 연습 문제가 없습니다.',
  options: ['확인'],
  correctIndex: 0,
  explanation: '',
};

export function DrillScreen({ level, mode, onComplete, onReplay, onExit }: Props) {
  const isEndless = mode === 'endless';
  const base = level.drillsPerSession ?? 10;
  const generate = level.generate ?? (() => emptyDrill);

  // 마스터 모드는 `base`개 문제로 시작하고, 무한 연습은 한 문제로 시작해 늘어납니다.
  const [queue, setQueue] = useState<Drill[]>(() =>
    isEndless ? [generate(rng)] : Array.from({ length: base }, () => generate(rng)),
  );
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [baseCorrect, setBaseCorrect] = useState(0); // 처음 `base`개 중 정답 수 (마스터)
  const [totalCorrect, setTotalCorrect] = useState(0); // 전체 정답 수 (두 모드 모두)
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
    // 기본·무한 연습 문제를 틀리면 보너스 반복 문제가 추가됩니다 (간격 반복).
    if (!correct && (isEndless || isBaseQuestion)) {
      setQueue((q) => [...q, generate(rng)]);
    }
  }

  function next() {
    const nextIndex = index + 1;
    if (isEndless) {
      if (nextIndex >= queue.length) setQueue((q) => [...q, generate(rng)]);
      setIndex(nextIndex);
      setSelected(null);
      return;
    }
    if (nextIndex >= queue.length) {
      setFinished(true);
      onComplete({ mode: 'mastery', correct: baseCorrect, answered: base });
    } else {
      setIndex(nextIndex);
      setSelected(null);
    }
  }

  function endEndless() {
    setFinished(true);
    onComplete({ mode: 'endless', correct: totalCorrect, answered: answeredCount });
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
        mastered={baseCorrect >= (level.masteryNeeded ?? base)}
        onReplay={onReplay}
        onExit={onExit}
      />
    );
  }

  const accuracy = answeredCount > 0 ? Math.round((totalCorrect / answeredCount) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* 머리글 / 진행도 */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onExit} className="text-sm text-slate-500 hover:text-slate-800">
          ← 나가기
        </button>
        <div className="text-sm text-slate-500">
          {isEndless ? (
            <>
              <span className="text-indigo-600 font-medium">∞ 무한 연습</span>
              <span className="ml-3">{answeredCount}문제 풂</span>
            </>
          ) : isBaseQuestion ? (
            <>문제 {progressShown} / {base}</>
          ) : (
            <span className="text-amber-600">보너스 연습</span>
          )}
          <span className="ml-3 font-medium text-emerald-600">
            {isEndless ? `${totalCorrect}개 정답 · ${accuracy}%` : `${baseCorrect}개 정답`}
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
            onClick={endEndless}
            className="rounded-xl px-4 py-2.5 font-medium text-slate-500 hover:bg-slate-100"
          >
            연습 끝내기
          </button>
        ) : (
          <span />
        )}
        {answered && (
          <button
            onClick={next}
            className="rounded-xl bg-emerald-600 px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            {isEndless ? '다음 →' : index + 1 >= queue.length ? '완료' : '다음 →'}
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
        {correct ? '✅ 정답입니다!' : '💡 아쉬워요'}
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
        점수 <span className="font-semibold text-slate-800">{correct} / {total}</span>
      </p>
      <div
        className={`rounded-xl border p-4 mb-8 ${
          mastered ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
        }`}
      >
        {mastered ? (
          <p className="text-emerald-700 font-medium">레벨 마스터 — 잘했어요! 🏅</p>
        ) : (
          <p className="text-amber-700 font-medium">
            거의 다 왔어요! 마스터 목표 점수 이상을 받으면 레벨을 마스터합니다. 계속 연습하세요.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <button
          onClick={onReplay}
          className="rounded-xl bg-emerald-600 px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          🔁 다시 연습하기
        </button>
        <button
          onClick={onExit}
          className="rounded-xl bg-slate-800 px-6 py-2.5 font-semibold text-white hover:bg-slate-900"
        >
          레벨 목록으로
        </button>
      </div>
      <p className="mt-4 text-xs text-slate-400">
        반복해야 몸에 익습니다 — 다시 풀어서 개념을 확실히 다지세요.
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
      <h2 className="text-2xl font-bold text-slate-800 mb-1">{title} · 무한 연습</h2>
      <p className="text-slate-500 mb-6">
        <span className="font-semibold text-slate-800">{total}</span>문제 풂 ·{' '}
        <span className="font-semibold text-slate-800">{correct}개 정답</span> ({accuracy}%)
      </p>
      <div className="flex flex-col gap-3">
        <button
          onClick={onReplay}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          🔁 계속 연습하기
        </button>
        <button
          onClick={onExit}
          className="rounded-xl bg-slate-800 px-6 py-2.5 font-semibold text-white hover:bg-slate-900"
        >
          레벨 목록으로
        </button>
      </div>
    </div>
  );
}
