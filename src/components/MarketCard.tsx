'use client';

import Link from 'next/link';
import { CATEGORY_LABELS, MarketDTO } from '@/lib/types';

type Props = {
  market: MarketDTO;
  onBuy: (market: MarketDTO, direction: 'si' | 'no') => void;
};

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 120, h = 32;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = (max - min) || 1;

  const step = w / (data.length - 1);

  const points = data
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const area = `${points} ${w},${h} 0,${h}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polygon points={area} fill={color} opacity="0.12" />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MarketCard({ market, onBuy }: Props) {
  const no = 100 - market.probability;

  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(market.closesAt).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const trend = Array.from({ length: 8 }, (_, i) => {
    const base = market.probability;
    const offset = Math.sin(i * 0.8 + market.id.charCodeAt(0)) * 8;
    return Math.min(
      99,
      Math.max(1, Math.round(base - 10 + (i * 10) / 7 + offset))
    );
  });

  trend[trend.length - 1] = market.probability;

  const trendUp = trend[trend.length - 1] >= trend[0];
  const trendColor = trendUp ? '#00C853' : '#E63946';

  function shareWhatsApp() {
    const url = `https://que-dice-peru-cp93.vercel.app/mercados/${market.id}`;

    const text = `🇵🇪 *¿Qué Dice Perú?*\n\n"${market.title}"\n\nEl mercado cree que hay un *${market.probability}%* de probabilidad de que SÍ pase.\n\n¿Qué crees tú? Predice gratis 👇\n${url}`;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      '_blank'
    );
  }

  return (
    <div className="rounded-card border border-brand-border bg-white p-4 shadow-sm transition-shadow hover:shadow-md border-l-[3px] border-l-brand-green">

      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-brand-green">
            {CATEGORY_LABELS[market.category] ?? market.category} {market.emoji}
          </p>

          <Link
            href={`/mercados/${market.id}`}
            className="font-display text-[15px] font-bold leading-snug text-brand-text hover:text-brand-green transition-colors"
          >
            {market.title}
          </Link>
        </div>

        <div className="flex-shrink-0 text-right">
          <p className="font-display text-3xl font-extrabold leading-none text-brand-green">
            {market.probability}%
          </p>
          <p className="text-[10px] font-semibold tracking-wide text-brand-text2">
            SÍ
          </p>
        </div>
      </div>

      <div className="my-2">
        <Sparkline data={trend} color={trendColor} />
      </div>

      <div className="relative my-2 h-[7px] overflow-hidden rounded-full bg-brand-surface">
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
          className="flex-1 rounded-lg border border-brand-green/30 bg-brand-green/10 py-2.5 text-xs font-bold text-brand-greenDark hover:bg-brand-green/20 transition-colors"
        >
          COMPRAR SÍ · {market.probability}¢
        </button>

        <button
          onClick={() => onBuy(market, 'no')}
          className="flex-1 rounded-lg border border-brand-red/25 bg-brand-red/[0.08] py-2.5 text-xs font-bold text-brand-red hover:bg-brand-red/20 transition-colors"
        >
          COMPRAR NO · {no}¢
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-brand-text2">
        <div className="flex gap-3">
          <span>👥 {market.volume.toLocaleString()} DICE</span>
          <span>⏱ {daysLeft}d restantes</span>
        </div>

        <div className="flex items-center gap-2">
          <span style={{ color: trendColor }} className="font-bold">
            {trendUp ? '▲ Al alza' : '▼ A la baja'}
          </span>

          <button
            onClick={shareWhatsApp}
            className="flex items-center gap-1 rounded-lg bg-[#25D366] px-2.5 py-1 text-[10px] font-bold text-white hover:bg-[#20BA5A] transition-colors"
          >
            📲
          </button>
        </div>
      </div>
    </div>
  );
}