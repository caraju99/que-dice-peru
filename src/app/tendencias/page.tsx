'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Market = {
  id: string;
  title: string;
  category: string;
  emoji: string | null;
  probability: number;
  volume: number;
  closesAt: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  deportes: 'Deportes',
  politica: 'Política',
  economia: 'Economía',
  cultura: 'Cultura',
  gaming: 'Gaming / IA'
};

function Sparkline({ probability, color }: { probability: number; color: string }) {
  const data = Array.from({ length: 8 }, (_, i) => {
    const offset = Math.sin(i * 0.9 + probability) * 10;
    return Math.min(99, Math.max(1, Math.round(probability - 12 + (i * 12 / 7) + offset)));
  });
  data[data.length - 1] = probability;

  const w = 80, h = 32;
  const min = Math.min(...data), max = Math.max(...data);
  const range = (max - min) || 1;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const area = `${points} ${w},${h} 0,${h}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polygon points={area} fill={color} opacity="0.1" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function TendenciasPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/markets')
      .then((r) => r.json())
      .then((data) => {
        const sorted = (data.markets ?? []).sort(
          (a: Market, b: Market) => b.volume - a.volume
        );
        setMarkets(sorted);
      })
      .finally(() => setLoading(false));
  }, []);

  const daysLeft = (closesAt: string) =>
    Math.max(0, Math.ceil((new Date(closesAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 pb-24">

      {/* Header */}
      <div className="mb-6">
        <p className="text-[9px] font-bold uppercase tracking-[.1em] text-brand-text3 mb-2">
          Mercados
        </p>
        <h1 className="font-display text-3xl font-bold text-brand-text mb-2">
          Tendencias
        </h1>
        <p className="text-xs text-brand-text2">
          Los mercados más activos ordenados por volumen
        </p>
      </div>

      {loading && (
        <p className="text-sm text-brand-text3 font-mono uppercase tracking-wider">
          Cargando tendencias...
        </p>
      )}

      <div className="grid gap-2">
        {markets.map((m, i) => {
          const trendUp = m.probability >= 50;
          const trendColor = '#C8102E';
          const days = daysLeft(m.closesAt);
          const isTop3 = i < 3;

          return (
            <div
              key={m.id}
              className="flex items-center gap-4 rounded border border-brand-border bg-white p-4 hover:shadow-sm transition-shadow"
              style={isTop3 ? { borderLeft: '3px solid #C8102E' } : {}}
            >
              {/* Posición */}
              <div className="font-mono text-sm font-medium text-brand-text3 w-6 text-center flex-shrink-0">
                {i === 0 ? '🔥' : i === 1 ? '📈' : i === 2 ? '⚡' : `${i + 1}`}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[.09em] text-brand-red mb-1">
                  {CATEGORY_LABELS[m.category] ?? m.category} {m.emoji}
                </p>
                <Link
                  href={`/mercados/${m.id}`}
                  className="font-display text-[14px] font-bold text-brand-text leading-snug hover:text-brand-red transition-colors block"
                >
                  {m.title}
                </Link>
                <div className="mt-1.5 flex gap-3 font-mono text-[10px] text-brand-text3">
                  <span>👥 {m.volume.toLocaleString()} DICE</span>
                  <span>⏱ {days}d</span>
                </div>
              </div>

              {/* Sparkline */}
              <div className="flex-shrink-0">
                <Sparkline probability={m.probability} color={trendColor} />
              </div>

              {/* Probabilidad */}
              <div className="text-right flex-shrink-0 min-w-[56px]">
                <p className="font-mono text-xl font-medium text-brand-red leading-none">
                  {m.probability}%
                </p>
                <p className="text-[9px] font-bold text-brand-red mt-1">
                  {trendUp ? '▲ Sube' : '▼ Baja'}
                </p>
              </div>
            </div>
          );
        })}

        {!loading && markets.length === 0 && (
          <div className="rounded border border-brand-border bg-white p-10 text-center">
            <p className="text-3xl mb-3">📊</p>
            <p className="text-sm font-bold text-brand-text mb-1">No hay mercados activos</p>
            <p className="text-xs text-brand-text2">Vuelve pronto</p>
          </div>
        )}
      </div>
    </div>
  );
}