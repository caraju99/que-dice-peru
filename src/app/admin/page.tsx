'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CATEGORY_LABELS } from '@/lib/types';

type AdminMarket = {
  id: string;
  title: string;
  category: string;
  emoji: string | null;
  probability: number;
  volume: number;
  closesAt: string;
  resolved: boolean;
  outcome: string | null;
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [markets, setMarkets] = useState<AdminMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('deportes');
  const [emoji, setEmoji] = useState('');
  const [probability, setProbability] = useState(50);
  const [closesAt, setClosesAt] = useState('');
  const [closesAtTime, setClosesAtTime] = useState('23:59');

  const isAdmin = (session?.user as any)?.isAdmin;

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && !isAdmin) router.push('/');
  }, [status, isAdmin, router]);

  function loadMarkets() {
    setLoading(true);
    fetch('/api/admin/markets')
      .then((r) => r.json())
      .then((data) => setMarkets(data.markets ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (isAdmin) loadMarkets();
  }, [isAdmin]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Combina fecha y hora en un datetime completo
    const closesAtDateTime = new Date(`${closesAt}T${closesAtTime}:00`);

    const res = await fetch('/api/admin/markets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        category,
        emoji,
        probability,
        closesAt: closesAtDateTime.toISOString()
      })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'No se pudo crear el mercado.');
      return;
    }
    setTitle('');
    setEmoji('');
    setProbability(50);
    setClosesAt('');
    setClosesAtTime('23:59');
    loadMarkets();
  }

  async function handleResolve(id: string, outcome: 'si' | 'no') {
    const res = await fetch(`/api/admin/markets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'No se pudo resolver el mercado.');
      return;
    }
    loadMarkets();
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Seguro que quieres eliminar este mercado?')) return;
    await fetch(`/api/admin/markets/${id}`, { method: 'DELETE' });
    loadMarkets();
  }

  if (status === 'loading' || !isAdmin) {
    return <p className="p-4 text-sm text-brand-text2">Cargando panel...</p>;
  }

  return (
    <div className="p-4 pb-20">
      <h1 className="font-display text-lg font-bold text-brand-text">Panel de administrador</h1>
      <p className="mt-1 text-sm text-brand-text2">Crea nuevos mercados y define resultados.</p>

      <form onSubmit={handleCreate} className="mt-4 grid gap-2.5 rounded-card border border-brand-border bg-white p-4">
        <p className="font-display text-sm font-bold text-brand-text">Crear nuevo mercado</p>

        <input
          type="text"
          placeholder="Título del mercado (ej: ¿Perú clasificará al Mundial 2026?)"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-lg border border-brand-border2 px-3 py-2 text-sm focus:outline focus:outline-2 focus:outline-brand-green"
        />

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-brand-border2 px-3 py-2 text-sm"
          >
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Emoji (opcional)"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            maxLength={4}
            className="rounded-lg border border-brand-border2 px-3 py-2 text-sm"
          />

          <input
            type="number"
            min={1}
            max={99}
            value={probability}
            onChange={(e) => setProbability(parseInt(e.target.value) || 50)}
            className="rounded-lg border border-brand-border2 px-3 py-2 text-sm"
            title="Probabilidad inicial de SÍ (%)"
            placeholder="Prob. inicial %"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-brand-text2">
              Fecha de cierre
            </label>
            <input
              type="date"
              required
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
              className="w-full rounded-lg border border-brand-border2 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-brand-text2">
              Hora de cierre
            </label>
            <input
              type="time"
              required
              value={closesAtTime}
              onChange={(e) => setClosesAtTime(e.target.value)}
              className="w-full rounded-lg border border-brand-border2 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {error && <p className="text-xs font-semibold text-brand-red">{error}</p>}

        <button
          type="submit"
          className="rounded-lg bg-brand-green py-2.5 text-sm font-semibold text-white hover:bg-brand-greenDark"
        >
          Crear mercado
        </button>
      </form>

      <h2 className="mb-2.5 mt-6 font-display text-base font-bold text-brand-text">
        Mercados ({markets.length})
      </h2>

      <div className="grid gap-2">
        {loading && <p className="text-sm text-brand-text2">Cargando mercados...</p>}
        {markets.map((m) => (
          <div key={m.id} className="rounded-card border border-brand-border bg-white p-3.5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-brand-green">
                  {CATEGORY_LABELS[m.category] ?? m.category} {m.emoji}
                </p>
                <p className="text-[13px] font-semibold text-brand-text">{m.title}</p>
                <p className="mt-0.5 text-[11px] text-brand-text2">
                  Prob: {m.probability}% · Vol: {m.volume.toLocaleString()} DICE · Cierra:{' '}
                  {new Date(m.closesAt).toLocaleString('es-PE')}
                </p>
              </div>

              <div className="flex flex-col gap-1.5 items-end">
                {m.resolved ? (
                  <span className="whitespace-nowrap rounded-full bg-brand-green/10 px-3 py-1 text-[11px] font-bold text-brand-greenDark">
                    {m.outcome ? `Resuelto: ${m.outcome === 'si' ? 'SÍ' : 'NO'}` : 'Cerrado — sin resultado'}
                  </span>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolve(m.id, 'si')}
                      className="rounded-lg border border-brand-green/30 bg-brand-green/10 px-3 py-1.5 text-xs font-bold text-brand-greenDark hover:bg-brand-green/20"
                    >
                      Resolver: SÍ
                    </button>
                    <button
                      onClick={() => handleResolve(m.id, 'no')}
                      className="rounded-lg border border-brand-red/25 bg-brand-red/[0.08] px-3 py-1.5 text-xs font-bold text-brand-red hover:bg-brand-red/20"
                    >
                      Resolver: NO
                    </button>
                  </div>
                )}
                <button
                  onClick={() => handleDelete(m.id)}
                  className="text-[11px] font-semibold text-brand-text2 hover:text-brand-red transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}