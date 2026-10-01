import { LEVELS } from '../drills/levels';
import { type ProgressState, isUnlocked } from '../state/progress';

interface Props {
  progress: ProgressState;
  onPick: (levelId: number) => void;
  onPractice: (levelId: number) => void;
  onShowStats: () => void;
  onReset: () => void;
}

export function LevelMap({ progress, onPick, onPractice, onShowStats, onReset }: Props) {
  const masteredCount = LEVELS.filter((l) => progress[l.id]?.mastered).length;

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">텍사스 홀덤 배우기</h1>
        <p className="text-slate-500 mt-1">한 번에 하나씩, 차근차근.</p>
        <p className="text-xs text-slate-400 mt-3">
          {LEVELS.length}개 레벨 중 {masteredCount}개 마스터
        </p>
        <button
          onClick={onShowStats}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-600 shadow-sm hover:border-slate-300"
        >
          📊 통계 보기
        </button>
      </header>

      <ol className="space-y-3">
        {LEVELS.map((level) => {
          const state = progress[level.id];
          const unlocked = isUnlocked(progress, level.id);
          const mastered = state?.mastered ?? false;
          return (
            <li
              className={`flex items-center gap-3 rounded-2xl border p-4 transition ${
                unlocked
                  ? 'border-slate-200 bg-white shadow-sm hover:border-emerald-400 hover:shadow'
                  : 'border-slate-200 bg-slate-100 opacity-70'
              }`}
            >
              <button
                disabled={!unlocked}
                onClick={() => onPick(level.id)}
                className="flex flex-1 items-center gap-4 text-left min-w-0 disabled:cursor-not-allowed"
              >
                <div className="grid place-items-center w-12 h-12 rounded-xl bg-slate-100 text-2xl shrink-0">
                  {unlocked ? level.icon : '🔒'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">레벨 {level.id}</span>
                    {mastered && (
                      <span className="text-xs font-semibold text-emerald-600">✓ 마스터</span>
                    )}
                  </div>
                  <h2 className="font-semibold text-slate-800 truncate">{level.title}</h2>
                  <p className="text-sm text-slate-500 truncate">{level.subtitle}</p>
                </div>
                {state && state.attempts > 0 && (
                  <div className="text-right text-xs text-slate-400 shrink-0">
                    최고 점수
                    <div className="text-sm font-semibold text-slate-600">
                      {state.bestScore}/{level.drillsPerSession}
                    </div>
                  </div>
                )}
              </button>
              {unlocked && !level.play && (
                <button
                  onClick={() => onPractice(level.id)}
                  title="무한 연습"
                  className="shrink-0 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                >
                  ∞
                </button>
              )}
            </li>
          );
        })}
      </ol>

      <p className="text-center text-xs text-slate-400 mt-8">
        10개 레벨을 차례로 익히고, 레벨 10에서 봇과 실전 핸드를 플레이하세요. ♠️
      </p>

      {masteredCount > 0 && (
        <div className="text-center mt-6">
          <button onClick={onReset} className="text-xs text-slate-400 hover:text-rose-500 underline">
            진행 상황 초기화
          </button>
        </div>
      )}
    </div>
  );
}
