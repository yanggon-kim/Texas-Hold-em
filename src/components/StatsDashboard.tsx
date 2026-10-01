import { LEVELS } from '../drills/levels';
import { type ProgressState, levelAccuracy } from '../state/progress';

interface Props {
  progress: ProgressState;
  onBack: () => void;
  onPractice: (levelId: number) => void;
}

function accuracyColor(pct: number): string {
  if (pct >= 90) return 'text-emerald-600';
  if (pct >= 70) return 'text-amber-600';
  return 'text-rose-600';
}

function barColor(pct: number): string {
  if (pct >= 90) return 'bg-emerald-500';
  if (pct >= 70) return 'bg-amber-500';
  return 'bg-rose-500';
}

/** 최근 세션 정확도를 보여 주는 작은 막대 그래프. */
function Trend({ data }: { data: number[] }) {
  if (data.length === 0) {
    return <span className="text-xs text-slate-300">아직 세션 없음</span>;
  }
  return (
    <div className="flex items-end gap-0.5 h-8" title="최근 세션 정확도 (오래된 것 → 최신)">
      {data.map((pct, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-sm ${barColor(pct)}`}
          style={{ height: `${Math.max(8, pct)}%` }}
        />
      ))}
    </div>
  );
}

export function StatsDashboard({ progress, onBack, onPractice }: Props) {
  const practised = LEVELS.filter((l) => (progress[l.id]?.totalAnswered ?? 0) > 0);
  const totalAnswered = LEVELS.reduce((s, l) => s + (progress[l.id]?.totalAnswered ?? 0), 0);
  const totalCorrect = LEVELS.reduce((s, l) => s + (progress[l.id]?.totalCorrect ?? 0), 0);
  const overallAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const masteredCount = LEVELS.filter((l) => progress[l.id]?.mastered).length;

  // 가장 약한 분야: 데이터가 충분한 레벨 중 정확도가 가장 낮은 레벨.
  const weakest = practised
    .filter((l) => (progress[l.id]?.totalAnswered ?? 0) >= 5)
    .map((l) => ({ level: l, acc: levelAccuracy(progress[l.id])! }))
    .sort((a, b) => a.acc - b.acc)[0];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-800 mb-6">
        ← 레벨 목록으로
      </button>

      <h1 className="text-2xl font-bold text-slate-800 mb-1">내 통계</h1>
      <p className="text-slate-500 mb-6">분야별 정확도와 연습 기록입니다.</p>

      {/* 전체 요약 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <SummaryTile label="푼 문제" value={String(totalAnswered)} />
        <SummaryTile label="정확도" value={totalAnswered > 0 ? `${overallAccuracy}%` : '—'} />
        <SummaryTile label="마스터" value={`${masteredCount}/${LEVELS.length}`} />
      </div>

      {weakest && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-amber-800">
              가장 약한 분야: {weakest.level.title} ({weakest.acc}%)
            </p>
            <p className="text-xs text-amber-700">반복 연습해서 정확도를 올려 보세요.</p>
          </div>
          <button
            onClick={() => onPractice(weakest.level.id)}
            className="shrink-0 rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            연습하기
          </button>
        </div>
      )}

      {totalAnswered === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          아직 연습 기록이 없습니다. 레벨을 플레이하거나 무한 연습을 하면 여기에 통계가 표시됩니다.
        </div>
      ) : (
        <ul className="space-y-2.5">
          {LEVELS.map((level) => {
            const p = progress[level.id];
            const acc = levelAccuracy(p);
            const isWeakest = weakest?.level.id === level.id;
            return (
              <li
                key={level.id}
                className={`rounded-2xl border bg-white p-4 ${
                  isWeakest ? 'border-amber-300' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="grid place-items-center w-10 h-10 rounded-lg bg-slate-100 text-xl shrink-0">
                    {level.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-slate-800 truncate">
                        {level.id}. {level.title}
                      </h2>
                      {p?.mastered && (
                        <span className="text-xs font-semibold text-emerald-600">✓</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {p.totalAnswered}문제 풂 · 마스터 {p.attempts}회 · 무한 연습 {p.practiceSessions}회
                    </p>
                  </div>
                  <Trend data={p.recentAccuracy} />
                  <div className="text-right shrink-0 w-14">
                    <div
                      className={`text-lg font-bold ${acc === null ? 'text-slate-300' : accuracyColor(acc)}`}
                    >
                      {acc === null ? '—' : `${acc}%`}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-slate-400">정확도</div>
                  </div>
                </div>
                {acc !== null && (
                  <div className="h-1.5 w-full rounded bg-slate-100 mt-3">
                    <div className={`h-1.5 rounded ${barColor(acc)}`} style={{ width: `${acc}%` }} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  );
}
