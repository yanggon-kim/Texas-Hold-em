import { useState, type ReactNode } from 'react';
import { getLevel } from './drills/levels';
import { useProgress } from './state/progress';
import { LevelMap } from './components/LevelMap';
import { IntroScreen } from './components/IntroScreen';
import { DrillScreen } from './components/DrillScreen';

type View =
  | { name: 'map' }
  | { name: 'intro'; levelId: number }
  | { name: 'drill'; levelId: number };

export default function App() {
  const { progress, recordSession, reset } = useProgress();
  const [view, setView] = useState<View>({ name: 'map' });

  const goMap = () => setView({ name: 'map' });

  if (view.name === 'map') {
    return (
      <Shell>
        <LevelMap
          progress={progress}
          onPick={(levelId) => setView({ name: 'intro', levelId })}
          onReset={reset}
        />
      </Shell>
    );
  }

  const level = getLevel(view.levelId);
  if (!level) {
    return (
      <Shell>
        <div className="p-8 text-center text-slate-500">Level not found.</div>
      </Shell>
    );
  }

  if (view.name === 'intro') {
    return (
      <Shell>
        <IntroScreen
          level={level}
          onStart={() => setView({ name: 'drill', levelId: level.id })}
          onExit={goMap}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <DrillScreen
        level={level}
        onFinish={(correct, total) => recordSession(level.id, correct, total)}
        onExit={goMap}
      />
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-slate-50 text-slate-900">{children}</div>;
}
