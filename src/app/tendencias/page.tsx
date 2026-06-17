'use client';

import { useEffect, useState } from 'react';

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
    const base = probability;
    const offset = Math.sin(i * 0.9 + probability) * 10;
    return Math.min(99, Math.max(1, Math.round(base - 12 + (i * 12 / 7) + offset)));
  });
  data[data.length - 1] = probability;

  const w = 80, h = 28;
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
      <polygon points={area} fill={color} opacity="0.12" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
    <div className="p-4 pb-20">

      <div className="mb-4">
        <h1 className="font-display text-2xl font-extrabold text-brand-text">
          Tendencias 📈
        </h1>
        <p className="mt-1 text-sm text-brand-text2">
          Los mercados más activos ahora mismo
        </p>
      </div>

      {loading && <p className="text-sm text-brand-text2">Cargando tendencias...</p>}

      <div className="grid gap-3">
        {markets.map((m, i) => {
          const trendUp = m.probability >= 50;
          const color = trendUp ? '#00C853' : '#E63946';
          const days = daysLeft(m.closesAt);

          return (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-card border border-brand-border bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Posición */}
              <div className="font-display text-xl font-extrabold text-brand-text2 w-7 text-center flex-shrink-0">
                {i + 1}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-brand-green mb-0.5">
                  {CATEGORY_LABELS[m.category] ?? m.category} {m.emoji}
                </p>
                <p className="text-[13px] font-bold text-brand-text leading-snug truncate">
                  {m.title}
                </p>
                <div className="mt-1 flex gap-3 text-[11px] text-brand-text2 font-medium">
                  <span>👥 {m.volume.toLocaleString()} DICE</span>
                  <span>⏱ {days}d restantes</span>
                </div>
              </div>

              {/* Sparkline */}
              <div className="flex-shrink-0">
                <Sparkline probability={m.probability} color={color} />
              </div>

              {/* Probabilidad */}
              <div className="text-right flex-shrink-0">
                <p className="font-display text-xl font-extrabold" style={{ color }}>
                  {m.probability}%
                </p>
                <p className="text-[10px] font-bold" style={{ color }}>
                  {trendUp ? '▲ Al alza' : '▼ A la baja'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}