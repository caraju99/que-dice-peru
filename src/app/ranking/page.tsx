'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

type RankEntry = {
  id: string;
  name: string;
  accuracy: number;
  total: number;
  badge: string;
  diceScore: number;
  diceGanados: number;
  streak: number;
  streakFactor: number;
};

const FILTERS = [
  { key: 'global', label: '🌎 Global' },
  { key: 'politica', label: '🗳️ Política' },
  { key: 'deportes', label: '⚽ Deportes' },
  { key: 'economia', label: '💵 Economía' },
  { key: 'cultura', label: '🎭 Cultura' },
  { key: 'gaming', label: '🎮 Gaming / IA' }
];

export default function RankingPage() {
  const { data: session } = useSession();
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

  const myId = (session?.user as any)?.id;

  function getMedal(i: number) {
    if (i === 0) return '🥇';
    if (i === 1) return '🥈';
    if (i === 2) return '🥉';
    return `#${i + 1}`;
  }

  function getStreakLabel(streak: number) {
    if (streak >= 10) return `🔥🔥🔥 ${streak} seguidas`;
    if (streak >= 5) return `🔥🔥 ${streak} seguidas`;
    if (streak >= 3) return `🔥 ${streak} seguidas`;
    return null;
  }

  const podium = ranking.length >= 3 ? [ranking[1], ranking[0], ranking[2]] : [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 pb-24">

      {/* Header */}
      <div className="mb-6">
        <p className="text-[9px] font-bold uppercase tracking-[.1em] text-brand-text3 mb-2">Ranking nacional</p>
        <h1 className="font-display text-3xl font-bold text-brand-text mb-2">
          Los mejores predictores
        </h1>
        <p className="text-xs text-brand-text2">
          DICE Score = precisión × experiencia × volumen × racha
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded border px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              filter === f.key
                ? 'border-brand-dark bg-brand-dark text-white'
                : 'border-brand-border2 bg-white text-brand-text2 hover:border-brand-dark hover:bg-brand-dark hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Podio */}
      {!loading && podium.length === 3 && (
        <div className="mb-6 bg-brand-dark rounded border border-white/[0.06] p-6 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(200,16,46,0.15) 0%, transparent 70%)' }} />
          <div className="relative z-10">
            <p className="text-[9px] font-bold uppercase tracking-[.1em] text-white/30 mb-6 text-center">Podio</p>
            <div className="grid grid-cols-3 gap-4 items-end">
              {podium.map((r, i) => {
                const realPos = i === 0 ? 1 : i === 1 ? 0 : 2;
                const isMe = r?.id === myId;
                const isGold = realPos === 0;
                const medal = isGold ? '🥇' : realPos === 1 ? '🥈' : '🥉';
                const barHeight = isGold ? 'h-20' : realPos === 1 ? 'h-12' : 'h-8';
                return r ? (
                  <div key={r.id} className={`flex flex-col items-center gap-2 ${isMe ? 'ring-1 ring-brand-red rounded p-2' : ''}`}>
                    <p className="text-2xl">{medal}</p>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${isGold ? 'bg-brand-red' : 'bg-white/15'}`}>
                      {r.name.slice(0, 2).toUpperCase()}
                    </div>
                    <p className="text-[12px] font-bold text-white text-center leading-tight px-1">{r.name}</p>
                    <p className="font-mono text-sm font-medium text-brand-red leading-none">{r.diceScore.toLocaleString()}</p>
                    <p className="text-[9px] text-white/35 font-mono">{r.accuracy}% prec.</p>
                    <div className={`w-full rounded-t bg-white/[0.07] border-t border-white/[0.1] ${barHeight}`} />
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>
      )}

      {!loading && ranking.length > 0 && ranking.length < 3 && (
        <div className="mb-4 rounded border border-brand-border bg-brand-surface p-5 text-center">
          <p className="text-sm font-bold text-brand-text mb-1">Invita amigos para llenar el podio</p>
          <p className="text-xs text-brand-text2">El podio aparece cuando haya 3 o más predictores.</p>
        </div>
      )}

      {/* Lista */}
      <div className="grid gap-2">
        {loading && <p className="text-sm text-brand-text3 font-mono uppercase tracking-wider">Cargando ranking...</p>}

        {!loading && ranking.length === 0 && (
          <div className="rounded border border-brand-border bg-white p-10 text-center">
            <p className="text-3xl mb-3">🔮</p>
            <p className="text-sm font-bold text-brand-text mb-1">Todavía no hay predictores</p>
            <p className="text-xs text-brand-text2">Sé el primero en aparecer</p>
          </div>
        )}

        {ranking.map((r, i) => {
          const isMe = r.id === myId;
          const streakLabel = getStreakLabel(r.streak);
          return (
            <div
              key={r.id}
              className={`flex items-center gap-3 rounded border p-4 transition-shadow hover:shadow-sm ${
                isMe ? 'border-brand-red bg-brand-redSoft' : 'border-brand-border bg-white'
              }`}
              style={isMe ? { borderLeft: '3px solid #C8102E' } : i < 3 ? { borderLeft: '3px solid #111111' } : {}}
            >
              <div className="w-8 text-center font-mono text-sm font-medium text-brand-text3 flex-shrink-0">
                {getMedal(i)}
              </div>

              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white ${
                i === 0 ? 'bg-brand-red' : 'bg-brand-dark'
              }`}>
                {r.name.slice(0, 2).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-bold text-brand-text truncate">{r.name}</p>
                  {isMe && <span className="text-[9px] font-bold uppercase tracking-wider text-brand-red">Tú</span>}
                </div>
                <p className="text-[11px] text-brand-text3 mt-0.5">
                  {r.badge} · {r.total} pred. · {r.diceGanados.toLocaleString()} DICE
                </p>
                {streakLabel && (
                  <p className="text-[10px] font-bold text-orange-500 mt-0.5">{streakLabel}</p>
                )}
              </div>

              <div className="text-right flex-shrink-0">
                <p className="font-mono text-base font-medium text-brand-red">
                  {r.diceScore.toLocaleString()} pts
                </p>
                <p className="text-[10px] font-mono text-brand-text3 mt-0.5">
                  {r.accuracy}% precisión
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}