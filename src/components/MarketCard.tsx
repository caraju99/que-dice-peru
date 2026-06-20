'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CATEGORY_LABELS, MarketDTO } from '@/lib/types';
import { EarnedBadgeInfo } from '@/lib/checkBadges';

type Props = {
  market: MarketDTO;
  onBuy: (market: MarketDTO, direction: 'si' | 'no') => void;
  onBadgeEarned?: (badges: EarnedBadgeInfo[], rewardBalance: number) => void;
};

function Sparkline({ data, color, timestamps }: { data: number[]; color: string; timestamps?: string[] }) {
  const w = 80, h = 36;
  const [tooltip, setTooltip] = useState<{ x: number; y: number; prob: number; time: string } | null>(null);

  if (data.length < 2) {
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke={color} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = (max - min) || 1;
  const step = w / (data.length - 1);

  const pts = data.map((v, i) => ({
    x: i * step,
    y: h - ((v - min) / range) * (h - 4) - 2,
    v
  }));

  const points = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${points} ${w},${h} 0,${h}`;

  function formatTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `Hace ${days}d`;
    if (hrs > 0) return `Hace ${hrs}h`;
    if (mins > 0) return `Hace ${mins}m`;
    return 'Ahora';
  }

  return (
    <div className="relative flex-shrink-0" style={{ width: w, height: h }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} onMouseLeave={() => setTooltip(null)}>
        <polygon points={area} fill={color} opacity="0.1" />
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill="transparent"
            onMouseEnter={() => setTooltip({
              x: p.x, y: p.y, prob: p.v,
              time: timestamps?.[i] ? formatTime(timestamps[i]) : ''
            })}
          />
        ))}
        <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r={2.5} fill={color} />
      </svg>
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded border border-brand-border bg-white px-2 py-1 text-[10px] font-bold shadow-md"
          style={{ left: Math.min(tooltip.x, w - 60), top: tooltip.y - 28, whiteSpace: 'nowrap' }}
        >
          <span style={{ color }}>{tooltip.prob}%</span>
          {tooltip.time && <span className="ml-1 text-brand-text2">{tooltip.time}</span>}
        </div>
      )}
    </div>
  );
}

export function MarketCard({ market, onBuy, onBadgeEarned }: Props) {
  const no = 100 - market.probability;
  const daysLeft = Math.max(0, Math.ceil((new Date(market.closesAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const hasHistory = market.history && market.history.length >= 2;
  const trend = hasHistory
    ? market.history.map((s) => s.probability)
    : Array.from({ length: 8 }, (_, i) => {
        const base = market.probability;
        const offset = Math.sin(i * 0.8 + market.id.charCodeAt(0)) * 8;
        return Math.min(99, Math.max(1, Math.round(base - 10 + (i * 10) / 7 + offset)));
      });

  if (!hasHistory) trend[trend.length - 1] = market.probability;
  const timestamps = hasHistory ? market.history.map((s) => s.createdAt) : undefined;
  const trendUp = trend[trend.length - 1] >= trend[0];
  const trendColor = trendUp ? '#C8102E' : '#555555';

  async function shareWhatsApp() {
    const url = `https://dice.pe/mercados/${market.id}`;
    const text = `🇵🇪 *DICE — Mercado de predicciones*\n\n"${market.title}"\n\nEl mercado dice: *${market.probability}%* de SÍ.\n\n¿Qué crees tú? 👇\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');

    // Intentar otorgar el badge Embajador (no bloqueante)
    try {
      const res = await fetch('/api/badges/embajador', { method: 'POST' });
      if (res.status === 401) return; // no logueado, no pasa nada
      const data = await res.json();
      if (data.earned && onBadgeEarned) {
        onBadgeEarned(
          [{
            code: 'embajador',
            name: 'Embajador',
            description: 'Compartiste un mercado por WhatsApp',
            icon: '📲',
            reward: data.reward
          }],
          data.diceBalance
        );
      }
    } catch {
      // silencioso, no afecta la experiencia de compartir
    }
  }

  return (
    <div className="bg-white border border-brand-border rounded relative overflow-hidden hover:shadow-sm transition-shadow" style={{ borderLeft: '3px solid #C8102E' }}>
      <div className="p-4">

        {/* Categoría */}
        <p className="text-[9px] font-bold uppercase tracking-[.09em] text-brand-red mb-1.5">
          {CATEGORY_LABELS[market.category] ?? market.category} {market.emoji}
        </p>

        {/* Título */}
        <Link
          href={`/mercados/${market.id}`}
          className="font-display text-[15px] font-bold leading-snug text-brand-text hover:text-brand-red transition-colors block mb-3"
        >
          {market.title}
        </Link>

        {/* % grande + sparkline en la misma fila */}
        <div className="flex items-end justify-between mb-2.5">
          <div>
            <p className="font-mono text-3xl font-medium text-brand-red leading-none">
              {market.probability}%
            </p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-brand-text3 mt-1">
              Probabilidad SÍ
            </p>
          </div>
          <Sparkline data={trend} color={trendColor} timestamps={timestamps} />
        </div>

        {/* Barra */}
        <div className="relative h-[5px] bg-brand-surface rounded overflow-hidden mb-1.5">
          <div className="h-full bg-brand-red transition-[width] duration-700" style={{ width: `${market.probability}%` }} />
          <div className="absolute right-0 top-0 h-full bg-brand-dark transition-[width] duration-700" style={{ width: `${no}%` }} />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-brand-text3 mb-3">
          <span>SÍ {market.probability}%</span>
          <span>NO {no}%</span>
        </div>

        {/* Botones */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => onBuy(market, 'si')}
            className="flex-1 rounded border border-brand-red/20 bg-brand-redSoft py-2 text-[10px] font-bold uppercase tracking-wider text-brand-redDark hover:bg-brand-redMid transition-colors"
          >
            Comprar SÍ · {market.probability}¢
          </button>
          <button
            onClick={() => onBuy(market, 'no')}
            className="flex-1 rounded border border-brand-border2 bg-brand-surface py-2 text-[10px] font-bold uppercase tracking-wider text-brand-text2 hover:bg-brand-border hover:text-brand-text transition-colors"
          >
            Comprar NO · {no}¢
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2.5 border-t border-brand-border">
          <div className="flex gap-3 font-mono text-[10px] text-brand-text3">
            <span>👥 {market.volume.toLocaleString()}</span>
            <span>⏱ {daysLeft}d</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold" style={{ color: trendColor }}>
              {trendUp ? '▲ Sube' : '▼ Baja'}
            </span>
            <button
              onClick={shareWhatsApp}
              className="rounded bg-[#25D366] px-2 py-1 text-[9px] font-bold text-white hover:bg-[#20BA5A] transition-colors"
            >
              📲
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}