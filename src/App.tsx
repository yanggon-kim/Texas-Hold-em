import { useState, type ReactNode } from 'react';
import { getLevel } from './drills/levels';
import { useProgress } from './state/progress';
import { LevelMap } from './components/LevelMap';
import { IntroScreen } from './components/IntroScreen';
import { LessonScreen } from './components/LessonScreen';
import { DrillScreen, type DrillMode } from './components/DrillScreen';
import { StatsDashboard } from './components/StatsDashboard';
import { TableScreen } from './components/TableScreen';

type View =
  | { name: 'map' }
  | { name: 'stats' }
  | { name: 'intro'; levelId: number }
  | { name: 'lesson'; levelId: number }
  | { name: 'drill'; levelId: number; mode: DrillMode }
  | { name: 'table'; levelId: number };

export default function App() {
  const { progress, recordResult, reset } = useProgress();
  const [view, setView] = useState<View>({ name: 'map' });
  // 새 연습 세션을 위해 연습 화면을 다시 마운트할 때 증가시킵니다.
  const [sessionKey, setSessionKey] = useState(0);

  const goMap = () => setView({ name: 'map' });

  function startDrill(levelId: number, mode: DrillMode) {
    setSessionKey((k) => k + 1);
    setView({ name: 'drill', levelId, mode });
  }

  if (view.name === 'map') {
    return (
      <Shell>
        <LevelMap
          progress={progress}
          onPick={(levelId) => setView({ name: 'intro', levelId })}
          onPractice={(levelId) => startDrill(levelId, 'endless')}
          onShowStats={() => setView({ name: 'stats' })}
          onReset={reset}
        />
      </Shell>
    );
  }

  if (view.name === 'stats') {
    return (
      <Shell>
        <StatsDashboard
          progress={progress}
          onBack={goMap}
          onPractice={(levelId) => startDrill(levelId, 'endless')}
        />
      </Shell>
    );
  }

  const level = getLevel(view.levelId);
  if (!level) {
    return (
      <Shell>
        <div className="p-8 text-center text-slate-500">레벨을 찾을 수 없습니다.</div>
      </Shell>
    );
  }

  // 학습이 끝나면(또는 바로) 연습 문제나 실전 테이블을 엽니다.
  const afterLesson = () =>
    level.play
      ? setView({ name: 'table', levelId: level.id })
      : startDrill(level.id, 'mastery');

  const startFromIntro = () =>
    setView(level.lesson ? { name: 'lesson', levelId: level.id } : pickPlayOrDrill(level.id, level.play));

  function pickPlayOrDrill(levelId: number, play?: boolean): View {
    return play ? { name: 'table', levelId } : { name: 'drill', levelId, mode: 'mastery' };
  }

  if (view.name === 'intro') {
    return (
      <Shell>
        <IntroScreen
          level={level}
          onStart={startFromIntro}
          onEndless={() => startDrill(level.id, 'endless')}
          onExit={goMap}
        />
      </Shell>
    );
  }

  if (view.name === 'lesson') {
    return (
      <Shell>
        <LessonScreen level={level} onStartPractice={afterLesson} onExit={goMap} />
      </Shell>
    );
  }

  if (view.name === 'table') {
    return (
      <Shell>
        <TableScreen onExit={goMap} />
      </Shell>
    );
  }

  const mode = view.mode;
  return (
    <Shell>
      <DrillScreen
        key={sessionKey}
        level={level}
        mode={mode}
        onComplete={(outcome) => recordResult(level.id, outcome)}
        onReplay={() => startDrill(level.id, mode)}
        onExit={goMap}
      />
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-slate-50 text-slate-900">{children}</div>;
}
