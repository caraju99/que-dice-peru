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
  { key: 'deportes', label: '⚽ Fútbol' },
  { key: 'economia', label: '💵 Economía' }
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

  function getAccuracyColor(accuracy: number) {
    if (accuracy >= 80) return 'text-brand-green';
    if (accuracy >= 60) return 'text-yellow-500';
    return 'text-brand-red';
  }

  function getStreakLabel(streak: number) {
    if (streak >= 10) return '🔥🔥🔥 ' + streak + ' seguidas';
    if (streak >= 5) return '🔥🔥 ' + streak + ' seguidas';
    if (streak >= 3) return '🔥 ' + streak + ' seguidas';
    return null;
  }

  const podium = ranking.length >= 3
    ? [ranking[1], ranking[0], ranking[2]]
    : [];

  return (
    <div className="p-4 pb-20">

      <div className="mb-4">
        <h1 className="font-display text-2xl font-extrabold text-brand-text">
          Ranking nacional 🇵🇪
        </h1>
        <p className="mt-1 text-sm text-brand-text2">
          Ordenado por DICE Score — precisión × experiencia × volumen × racha
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === f.key
                ? 'border-brand-green bg-brand-green text-white'
                : 'border-brand-border bg-brand-surface text-brand-text2 hover:border-brand-green hover:bg-brand-green hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!loading && podium.length === 3 && (
        <div className="mb-6 grid grid-cols-3 gap-2 items-end">
          {podium.map((r, i) => {
            const realPos = i === 0 ? 1 : i === 1 ? 0 : 2;
            const isMe = r?.id === myId;
            const isGold = realPos === 0;
            return r ? (
              <div
                key={r.id}
                className={`rounded-xl border p-3 text-center transition-shadow ${
                  isGold
                    ? 'border-yellow-300 bg-yellow-50 shadow-md scale-105'
                    : 'border-brand-border bg-white'
                } ${isMe ? 'ring-2 ring-brand-green' : ''}`}
              >
                <div className="text-2xl mb-1">
                  {isGold ? '🥇' : realPos === 1 ? '🥈' : '🥉'}
                </div>
                <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${isGold ? 'bg-yellow-400' : 'bg-brand-green'}`}>
                  {r.name.slice(0, 2).toUpperCase()}
                </div>
                <p className="text-xs font-bold text-brand-text truncate">{r.name}</p>
                <p className="font-display text-lg font-extrabold text-brand-green">
                  {r.diceScore.toLocaleString()} pts
                </p>
                <p className={`text-[10px] font-semibold ${getAccuracyColor(r.accuracy)}`}>
                  {r.accuracy}% precisión
                </p>
                <p className="text-[10px] text-brand-text2">{r.total} pred.</p>
              </div>
            ) : null;
          })}
        </div>
      )}

      {!loading && ranking.length > 0 && ranking.length < 3 && (
        <div className="mb-4 rounded-xl border border-brand-green bg-brand-green/5 p-4 text-center">
          <p className="text-sm font-semibold text-brand-text">
            🏆 ¡Invita amigos para llenar el podio!
          </p>
          <p className="mt-1 text-xs text-brand-text2">
            El podio aparece cuando haya 3 o más predictores.
          </p>
        </div>
      )}

      <div className="grid gap-2">
        {loading && (
          <p className="text-sm text-brand-text2">Cargando ranking...</p>
        )}
        {!loading && ranking.length === 0 && (
          <div className="rounded-xl border border-brand-border bg-white p-8 text-center">
            <p className="text-2xl mb-2">🔮</p>
            <p className="text-sm font-semibold text-brand-text">
              Todavía no hay predictores aquí
            </p>
            <p className="mt-1 text-xs text-brand-text2">
              ¡Sé el primero en aparecer en el ranking!
            </p>
          </div>
        )}
        {ranking.map((r, i) => {
          const isMe = r.id === myId;
          const streakLabel = getStreakLabel(r.streak);
          return (
            <div
              key={r.id}
              className={`flex items-center gap-3 rounded-card border p-3.5 transition-shadow hover:shadow-sm ${
                isMe
                  ? 'border-brand-green bg-brand-green/5'
                  : 'border-brand-border bg-white'
              }`}
            >
              <div className="w-8 text-center font-display text-base font-extrabold text-brand-text2">
                {getMedal(i)}
              </div>

              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-surface text-[13px] font-bold text-brand-text">
                {r.name.slice(0, 2).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-brand-text truncate">
                  {r.name} {isMe && <span className="text-brand-green text-[11px]">(Tú)</span>}
                </p>
                <p className="mt-0.5 text-[11px] text-brand-text2">
                  {r.badge} · {r.total} pred. · {r.diceGanados.toLocaleString()} DICE ganados
                </p>
                {streakLabel && (
                  <p className="text-[11px] font-bold text-orange-500">{streakLabel}</p>
                )}
              </div>

              <div className="text-right flex-shrink-0">
                <p className="font-display text-base font-extrabold text-brand-green">
                  {r.diceScore.toLocaleString()} pts
                </p>
                <p className={`text-[11px] font-semibold ${getAccuracyColor(r.accuracy)}`}>
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