import type { LevelDef } from '../drills/types';

interface Props {
  level: LevelDef;
  onStart: () => void;
  onEndless: () => void;
  onExit: () => void;
}

export function IntroScreen({ level, onStart, onEndless, onExit }: Props) {
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <button onClick={onExit} className="text-sm text-slate-500 hover:text-slate-800 mb-6">
        ← 레벨 목록으로
      </button>

      <div className="text-center mb-6">
        <div className="text-5xl mb-3">{level.icon}</div>
        <h1 className="text-2xl font-bold text-slate-800">
          레벨 {level.id}: {level.title}
        </h1>
        <p className="text-slate-500">{level.subtitle}</p>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-3">
          배울 내용
        </h2>
        <ul className="space-y-3">
          {level.concept.map((point, i) => (
            <li key={i} className="flex gap-3 text-slate-700">
              <span className="text-emerald-500 font-bold">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-center text-sm text-slate-500 mb-5">
        {level.play
          ? '짧은 설명을 읽은 뒤, 테이블에 앉아 봇과 핸드를 끝까지 플레이하세요.'
          : `${level.lesson ? '먼저 개념을 공부한 뒤 연습합니다. ' : ''}${level.drillsPerSession}문제 · ${level.masteryNeeded}개 이상 맞히면 이 레벨을 마스터합니다. 틀린 문제는 추가로 더 연습합니다.`}
      </p>

      <button
        onClick={onStart}
        className="w-full rounded-xl bg-emerald-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-emerald-700"
      >
        {level.play ? '시작 ♠️' : level.lesson ? '학습 시작 →' : '연습 시작 →'}
      </button>

      {!level.play && (
        <>
          <button
            onClick={onEndless}
            className="mt-3 w-full rounded-xl border border-indigo-200 bg-indigo-50 px-6 py-3 font-semibold text-indigo-700 hover:bg-indigo-100"
          >
            ∞ 무한 연습
          </button>
          <p className="mt-2 text-center text-xs text-slate-400">
            무한 연습은 문제가 끝없이 나와 반복해서 연습할 수 있습니다 — 제한 없이, 언제든 멈출 수 있습니다.
          </p>
        </>
      )}
    </div>
  );
}
