import { LEVELS } from '../drills/levels';
import { type ProgressState, isUnlocked } from '../state/progress';

interface Props {
  progress: ProgressState;
  onPick: (levelId: number) => void;
  onPractice: (levelId: number) => void;
  onReset: () => void;
}

export function LevelMap({ progress, onPick, onPractice, onReset }: Props) {
  const masteredCount = LEVELS.filter((l) => progress[l.id]?.mastered).length;

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Learn Texas Hold'em</h1>
        <p className="text-slate-500 mt-1">Step by step, one skill at a time.</p>
        <p className="text-xs text-slate-400 mt-3">
          {masteredCount} / {LEVELS.length} levels mastered
        </p>
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
                    <span className="text-xs font-semibold text-slate-400">LEVEL {level.id}</span>
                    {mastered && (
                      <span className="text-xs font-semibold text-emerald-600">✓ Mastered</span>
                    )}
                  </div>
                  <h2 className="font-semibold text-slate-800 truncate">{level.title}</h2>
                  <p className="text-sm text-slate-500 truncate">{level.subtitle}</p>
                </div>
                {state && state.attempts > 0 && (
                  <div className="text-right text-xs text-slate-400 shrink-0">
                    best
                    <div className="text-sm font-semibold text-slate-600">
                      {state.bestScore}/{level.drillsPerSession}
                    </div>
                  </div>
                )}
              </button>
              {unlocked && (
                <button
                  onClick={() => onPractice(level.id)}
                  title="Endless practice"
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
        More levels (starting hands, pot odds, full table play) are coming soon.
      </p>

      {masteredCount > 0 && (
        <div className="text-center mt-6">
          <button onClick={onReset} className="text-xs text-slate-400 hover:text-rose-500 underline">
            Reset progress
          </button>
        </div>
      )}
    </div>
  );
}
