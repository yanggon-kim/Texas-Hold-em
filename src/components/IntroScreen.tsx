import type { LevelDef } from '../drills/types';

interface Props {
  level: LevelDef;
  onStart: () => void;
  onExit: () => void;
}

export function IntroScreen({ level, onStart, onExit }: Props) {
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <button onClick={onExit} className="text-sm text-slate-500 hover:text-slate-800 mb-6">
        ← Back to levels
      </button>

      <div className="text-center mb-6">
        <div className="text-5xl mb-3">{level.icon}</div>
        <h1 className="text-2xl font-bold text-slate-800">
          Level {level.id}: {level.title}
        </h1>
        <p className="text-slate-500">{level.subtitle}</p>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-3">
          What you'll learn
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
        {level.lesson && 'First study the concepts, then practice. '}
        {level.drillsPerSession} questions · get {level.masteryNeeded} right to master this level.
        Miss one and you'll get extra practice on it.
      </p>

      <button
        onClick={onStart}
        className="w-full rounded-xl bg-emerald-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-emerald-700"
      >
        {level.lesson ? 'Start learning →' : 'Start drills →'}
      </button>
    </div>
  );
}
