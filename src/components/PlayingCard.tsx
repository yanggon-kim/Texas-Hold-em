import { type Card, RANK_NAME, cardName, isRed } from '../engine/card';

type Size = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'w-10 h-14 text-base rounded-md',
  md: 'w-14 h-20 text-xl rounded-lg',
  lg: 'w-16 h-24 text-2xl rounded-lg',
};

export function PlayingCard({ card, size = 'md' }: { card: Card; size?: Size }) {
  const red = isRed(card);
  const rank = RANK_NAME[card.rank];
  // "에이스"처럼 긴 이름은 모서리에 들어가도록 글자를 줄입니다.
  const rankSize = rank.length > 2 ? 'text-[0.6em] tracking-tighter' : rank.length > 1 && /\D/.test(rank) ? 'text-[0.8em]' : '';
  return (
    <div
      role="img"
      aria-label={cardName(card)}
      className={`relative inline-flex flex-col justify-between bg-white border border-slate-300 shadow-sm select-none font-semibold ${SIZE_CLASSES[size]} ${
        red ? 'text-rose-600' : 'text-slate-900'
      }`}
    >
      <span className={`absolute top-1 left-1 leading-none ${rankSize}`}>{rank}</span>
      <span className="flex-1 grid place-items-center text-[1.6em] leading-none">
        {card.suit}
      </span>
      <span className={`absolute bottom-1 right-1 leading-none rotate-180 ${rankSize}`}>{rank}</span>
    </div>
  );
}

/** 뒷면이 보이는 카드. 자리 표시용으로 씁니다. */
export function CardBack({ size = 'md' }: { size?: Size }) {
  return (
    <div
      aria-hidden
      className={`inline-block bg-gradient-to-br from-indigo-600 to-indigo-800 border border-indigo-900 shadow-sm ${SIZE_CLASSES[size]}`}
    />
  );
}
