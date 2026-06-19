import type { DrillVisual as DrillVisualData } from '../drills/types';
import { cardId } from '../engine/card';
import { PlayingCard } from './PlayingCard';

function CardRow({ cards, size }: { cards: DrillVisualData['cards']; size?: 'sm' | 'md' | 'lg' }) {
  if (!cards) return null;
  return (
    <div className="flex flex-wrap gap-1.5 justify-center">
      {cards.map((c, i) => (
        <PlayingCard key={`${cardId(c)}-${i}`} card={c} size={size} />
      ))}
    </div>
  );
}

export function DrillVisual({ visual }: { visual?: DrillVisualData }) {
  if (!visual) return null;

  return (
    <div className="flex flex-col items-center gap-4">
      {visual.label && <p className="text-sm text-slate-500">{visual.label}</p>}

      {visual.cards && <CardRow cards={visual.cards} />}

      {visual.hands && (
        <div className="flex flex-wrap gap-6 justify-center">
          {visual.hands.map((hand) => (
            <div key={hand.label} className="flex flex-col items-center gap-2">
              <span className="text-sm font-medium text-slate-600">{hand.label}</span>
              <CardRow cards={hand.cards} size="sm" />
            </div>
          ))}
        </div>
      )}

      {(visual.hole || visual.board) && (
        <div className="flex flex-col gap-4 items-center">
          {visual.board && (
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-xs uppercase tracking-wide text-slate-400">Community board</span>
              <CardRow cards={visual.board} />
            </div>
          )}
          {visual.hole && (
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-xs uppercase tracking-wide text-emerald-500">Your hole cards</span>
              <CardRow cards={visual.hole} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
