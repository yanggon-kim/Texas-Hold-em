import { useState, type ReactNode } from 'react';
import { getLevel } from './drills/levels';
import { useProgress } from './state/progress';
import { LevelMap } from './components/LevelMap';
import { IntroScreen } from './components/IntroScreen';
import { LessonScreen } from './components/LessonScreen';
import { DrillScreen } from './components/DrillScreen';

type View =
  | { name: 'map' }
  | { name: 'intro'; levelId: number }
  | { name: 'lesson'; levelId: number }
  | { name: 'drill'; levelId: number };

export default function App() {
  const { progress, recordSession, reset } = useProgress();
  const [view, setView] = useState<View>({ name: 'map' });
  // Bumped to remount the drill screen for a fresh "practice again" session.
  const [sessionKey, setSessionKey] = useState(0);

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

  const startFromIntro = () =>
    setView(
      level.lesson
        ? { name: 'lesson', levelId: level.id }
        : { name: 'drill', levelId: level.id },
    );

  const startPractice = () => {
    setSessionKey((k) => k + 1);
    setView({ name: 'drill', levelId: level.id });
  };

  if (view.name === 'intro') {
    return (
      <Shell>
        <IntroScreen level={level} onStart={startFromIntro} onExit={goMap} />
      </Shell>
    );
  }

  if (view.name === 'lesson') {
    return (
      <Shell>
        <LessonScreen level={level} onStartPractice={startPractice} onExit={goMap} />
      </Shell>
    );
  }

  return (
    <Shell>
      <DrillScreen
        key={sessionKey}
        level={level}
        onFinish={(correct, total) => recordSession(level.id, correct, total)}
        onReplay={startPractice}
        onExit={goMap}
      />
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-slate-50 text-slate-900">{children}</div>;
}
