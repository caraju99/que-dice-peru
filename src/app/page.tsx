'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Hero } from '@/components/Hero';
import { WalletBar } from '@/components/WalletBar';
import { MarketCard } from '@/components/MarketCard';
import { BuyModal } from '@/components/BuyModal';
import { Toast } from '@/components/Toast';
import { CATEGORY_LABELS, MarketDTO } from '@/lib/types';

const FILTERS = ['todos', ...Object.keys(CATEGORY_LABELS)];

export default function HomePage() {
  const { data: session } = useSession();
  const [markets, setMarkets] = useState<MarketDTO[]>([]);
  const [filter, setFilter] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ market: MarketDTO; direction: 'si' | 'no' } | null>(null);
  const [balance, setBalance] = useState<number>((session?.user as any)?.diceBalance ?? 0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setBalance((session?.user as any)?.diceBalance ?? 0);
  }, [session]);

  useEffect(() => {
    setLoading(true);
    const qs = filter !== 'todos' ? `?category=${filter}` : '';
    fetch(`/api/markets${qs}`)
      .then((r) => r.json())
      .then((data) => setMarkets(data.markets ?? []))
      .finally(() => setLoading(false));
  }, [filter]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  async function handleConfirm(amount: number) {
    if (!modal) return;
    if (!session) {
      showToast('Inicia sesión para predecir');
      return;
    }

    const res = await fetch('/api/positions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketId: modal.market.id, direction: modal.direction, amount })
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error ?? 'No se pudo comprar la posición.');
    }

    setBalance(data.diceBalance);
    setMarkets((prev) => prev.map((m) => (m.id === data.market.id ? data.market : m)));
    setModal(null);
    showToast(`Posición comprada: ${amount.toLocaleString()} DICE en ${modal.direction === 'si' ? 'SÍ' : 'NO'}`);
  }

  return (
    <div>
      <Hero />

      <div className="p-4">
        {session ? (
          <WalletBar balance={balance} />
        ) : (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-brand-border bg-brand-surface p-4">
            <p className="text-sm font-medium text-brand-text2">
              Crea una cuenta gratis y recibe 10,000 DICE Coins para empezar a predecir.
            </p>
            <Link
              href="/login"
              className="rounded-lg bg-brand-green px-4 py-2 text-xs font-semibold text-white hover:bg-brand-greenDark"
            >
              Crear cuenta
            </Link>
          </div>
        )}

        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-brand-text">Mercados activos</h2>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                filter === f
                  ? 'border-brand-green bg-brand-green text-white'
                  : 'border-brand-border bg-brand-surface text-brand-text2 hover:border-brand-green hover:bg-brand-green hover:text-white'
              }`}
            >
              {f === 'todos' ? 'Todos' : CATEGORY_LABELS[f]}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3">
          {loading && <p className="text-sm text-brand-text2">Cargando mercados...</p>}
          {!loading && markets.length === 0 && (
            <p className="text-sm text-brand-text2">No hay mercados en esta categoría todavía.</p>
          )}
          {markets.map((m) => (
            <MarketCard key={m.id} market={m} onBuy={(market, direction) => setModal({ market, direction })} />
          ))}
        </div>
      </div>

      {modal && (
        <BuyModal
          market={modal.market}
          direction={modal.direction}
          diceBalance={balance}
          onClose={() => setModal(null)}
          onConfirm={handleConfirm}
        />
      )}

      <Toast message={toast} />
    </div>
  );
}
