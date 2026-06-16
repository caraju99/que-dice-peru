'use client';

import { CATEGORY_LABELS, MarketDTO } from '@/lib/types';

type Props = {
  market: MarketDTO;
  onBuy: (market: MarketDTO, direction: 'si' | 'no') => void;
};

export function MarketCard({ market, onBuy }: Props) {
  const no = 100 - market.probability;
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(market.closesAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="rounded-card border border-brand-border border-l-[3px] border-l-brand-green bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-brand-green">
            {CATEGORY_LABELS[market.category] ?? market.category} {market.emoji}
          </p>
          <p className="font-display text-[15px] font-bold leading-snug text-brand-text">{market.title}</p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="font-display text-3xl font-extrabold leading-none text-brand-green">
            {market.probability}%
          </p>
          <p className="text-[10px] font-semibold tracking-wide text-brand-text2">SÍ</p>
        </div>
      </div>

      <div className="relative my-3 h-[7px] overflow-hidden rounded-full bg-brand-surface">
        <div
          className="h-full rounded-full bg-brand-green transition-[width] duration-700"
          style={{ width: `${market.probability}%` }}
        />
        <div
          className="absolute right-0 top-0 h-full rounded-full bg-brand-red transition-[width] duration-700"
          style={{ width: `${no}%` }}
        />
      </div>

      <div className="flex justify-between text-[11px] font-medium text-brand-text2">
        <span>SÍ: {market.probability}%</span>
        <span>NO: {no}%</span>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onBuy(market, 'si')}
          className="flex-1 rounded-lg border border-brand-green/30 bg-brand-green/10 py-2 text-xs font-bold text-brand-greenDark hover:bg-brand-green/20"
        >
          COMPRAR SÍ · {market.probability}¢
        </button>
        <button
          onClick={() => onBuy(market, 'no')}
          className="flex-1 rounded-lg border border-brand-red/25 bg-brand-red/[0.08] py-2 text-xs font-bold text-brand-red hover:bg-brand-red/20"
        >
          COMPRAR NO · {no}¢
        </button>
      </div>

      <div className="mt-3 flex gap-4 text-[11px] font-medium text-brand-text2">
        <span>👥 {market.volume.toLocaleString()} DICE en juego</span>
        <span>⏱ {daysLeft}d restantes</span>
      </div>
    </div>
  );
}
