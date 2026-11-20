import { type Card, cardName, isRed } from '../engine/card';

type Size = 'xs' | 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<Size, string> = {
  xs: 'w-7 h-10 text-xs rounded',
  sm: 'w-10 h-14 text-base rounded-md',
  md: 'w-14 h-20 text-xl rounded-lg',
  lg: 'w-16 h-24 text-2xl rounded-lg',
};

export function PlayingCard({ card, size = 'md' }: { card: Card; size?: Size }) {
  const red = isRed(card);
  // 카드 앞면은 실제 카드처럼 영문자(J·Q·K·A)와 숫자로 표시합니다.
  // 설명 문장에서는 "퀸"처럼 한국어 이름을 씁니다 (aria-label 포함).
  const rank = card.rank;
  const rankSize = rank.length > 1 ? 'text-[0.85em] tracking-tighter' : '';
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
