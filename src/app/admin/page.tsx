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
    const closesAtDateTime = new Date(`${closesAt}T${closesAtTime}:00`);
    const res = await fetch('/api/admin/markets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category, emoji, probability, closesAt: closesAtDateTime.toISOString() })
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'No se pudo crear el mercado.'); return; }
    setTitle(''); setEmoji(''); setProbability(50); setClosesAt(''); setClosesAtTime('23:59');
    loadMarkets();
  }

  async function handleResolve(id: string, outcome: 'si' | 'no') {
    const res = await fetch(`/api/admin/markets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome })
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'No se pudo resolver el mercado.'); return; }
    loadMarkets();
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Seguro que quieres eliminar este mercado?')) return;
    await fetch(`/api/admin/markets/${id}`, { method: 'DELETE' });
    loadMarkets();
  }

  if (status === 'loading' || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-brand-text3 font-mono uppercase tracking-wider">Cargando panel...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 pb-24">

      {/* Header */}
      <div className="mb-6">
        <p className="text-[9px] font-bold uppercase tracking-[.1em] text-brand-text3 mb-2">Admin</p>
        <h1 className="font-display text-3xl font-bold text-brand-text mb-2">Panel de administrador</h1>
        <p className="text-xs text-brand-text2">Crea mercados y define resultados.</p>
      </div>

      {/* Formulario crear mercado */}
      <div className="bg-brand-dark rounded border border-white/[0.06] p-6 mb-6 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 0% 0%, rgba(200,16,46,0.15) 0%, transparent 70%)' }} />
        <div className="relative z-10">
          <p className="text-[9px] font-bold uppercase tracking-[.1em] text-white/30 mb-4">Crear nuevo mercado</p>

          <form onSubmit={handleCreate} className="grid gap-3">
            <input
              type="text"
              placeholder="¿Perú clasificará al Mundial 2026?"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-brand-red transition-colors"
            />

            <div className="grid grid-cols-3 gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red transition-colors"
              >
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key} className="bg-brand-dark">{label}</option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Emoji"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={4}
                className="rounded border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-brand-red transition-colors"
              />

              <input
                type="number"
                min={1}
                max={99}
                value={probability}
                onChange={(e) => setProbability(parseInt(e.target.value) || 50)}
                className="rounded border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red transition-colors"
                placeholder="% inicial"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-[.1em] text-white/30 mb-1.5">Fecha de cierre</label>
                <input
                  type="date"
                  required
                  value={closesAt}
                  onChange={(e) => setClosesAt(e.target.value)}
                  className="w-full rounded border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red transition-colors"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-[.1em] text-white/30 mb-1.5">Hora de cierre</label>
                <input
                  type="time"
                  required
                  value={closesAtTime}
                  onChange={(e) => setClosesAtTime(e.target.value)}
                  className="w-full rounded border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red transition-colors"
                />
              </div>
            </div>

            {error && <p className="text-xs font-bold text-brand-red">{error}</p>}

            <button
              type="submit"
              className="w-full rounded bg-brand-red py-3 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-brand-redDark transition-colors"
              style={{ boxShadow: '0 4px 16px rgba(200,16,46,0.3)' }}
            >
              Crear mercado
            </button>
          </form>
        </div>
      </div>

      {/* Lista de mercados */}
      <div className="mb-3">
        <p className="text-[9px] font-bold uppercase tracking-[.1em] text-brand-text3">
          Mercados ({markets.length})
        </p>
      </div>

      <div className="grid gap-2">
        {loading && <p className="text-sm text-brand-text3 font-mono uppercase tracking-wider">Cargando...</p>}

        {markets.map((m) => (
          <div key={m.id} className="rounded border border-brand-border bg-white p-4"
            style={m.resolved && m.outcome ? {} : { borderLeft: '3px solid #C8102E' }}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[.09em] text-brand-red mb-1">
                  {CATEGORY_LABELS[m.category] ?? m.category} {m.emoji}
                  {m.resolved && !m.outcome && (
                    <span className="ml-2 text-orange-500">⚠ Pendiente de resultado</span>
                  )}
                </p>
                <p className="text-[13px] font-bold text-brand-text mb-1">{m.title}</p>
                <div className="flex flex-wrap gap-2 font-mono text-[10px] text-brand-text3">
                  <span>{m.probability}%</span>
                  <span>·</span>
                  <span>{m.volume.toLocaleString()} DICE</span>
                  <span>·</span>
                  <span>{new Date(m.closesAt).toLocaleString('es-PE')}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 items-end flex-shrink-0">
                {/* Si tiene resultado ya resuelto */}
                {m.resolved && m.outcome ? (
                  <span className="rounded px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-green-50 text-green-700">
                    Resuelto: {m.outcome === 'si' ? 'SÍ' : 'NO'}
                  </span>
                ) : (
                  /* Botones para resolver — aparecen tanto si está activo como si está cerrado sin resultado */
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleResolve(m.id, 'si')}
                      className="rounded border border-green-200 bg-green-50 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-green-700 hover:bg-green-100 transition-colors"
                    >
                      SÍ ✓
                    </button>
                    <button
                      onClick={() => handleResolve(m.id, 'no')}
                      className="rounded border border-brand-red/20 bg-brand-redSoft px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-red hover:bg-brand-redMid transition-colors"
                    >
                      NO ✗
                    </button>
                  </div>
                )}
                <button
                  onClick={() => handleDelete(m.id)}
                  className="text-[10px] font-bold uppercase tracking-wider text-brand-text3 hover:text-brand-red transition-colors"
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