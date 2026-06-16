'use client';

import { useEffect, useState } from 'react';

type RankEntry = {
  id: string;
  name: string;
  accuracy: number;
  total: number;
  badge: string;
};

const FILTERS = [
  { key: 'global', label: 'Global' },
  { key: 'politica', label: 'Política' },
  { key: 'deportes', label: 'Fútbol' },
  { key: 'economia', label: 'Economía' }
];

const MEDAL_COLORS: Record<number, string> = {
  1: 'text-[#D4920C]',
  2: 'text-[#8A8A8A]',
  3: 'text-[#B5651D]'
};

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankEntry[]>([]);
  const [filter, setFilter] = useState('global');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/ranking?category=${filter}`)
      .then((r) => r.json())
      .then((data) => setRanking(data.ranking ?? []))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="p-4">
      <h1 className="font-display text-lg font-bold text-brand-text">Ranking nacional</h1>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              filter === f.key
                ? 'border-brand-green bg-brand-green text-white'
                : 'border-brand-border bg-brand-surface text-brand-text2 hover:border-brand-green hover:bg-brand-green hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-2">
        {loading && <p className="text-sm text-brand-text2">Cargando ranking...</p>}
        {!loading && ranking.length === 0 && (
          <p className="text-sm text-brand-text2">
            Todavía no hay predicciones resueltas en esta categoría. ¡Sé el primero en aparecer aquí!
          </p>
        )}
        {ranking.map((r, i) => (
          <div key={r.id} className="flex items-center gap-3 rounded-card border border-brand-border bg-white p-3.5">
            <div className={`w-7 font-display text-lg font-extrabold text-brand-text2 ${MEDAL_COLORS[i + 1] ?? ''}`}>
              {i + 1}
            </div>
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-[13px] font-bold text-blue-800">
              {r.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-brand-text">{r.name}</p>
              <p className="mt-0.5 text-[11px] text-brand-text2">{r.badge}</p>
            </div>
            <p className="font-display text-base font-bold text-brand-green">{r.accuracy}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
