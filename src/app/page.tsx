'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Hero } from '@/components/Hero';
import { WalletBar } from '@/components/WalletBar';
import { MarketCard } from '@/components/MarketCard';
import { BuyModal } from '@/components/BuyModal';
import { Toast } from '@/components/Toast';
import { CATEGORY_LABELS, MarketDTO } from '@/lib/types';

const FILTERS = ['todos', ...Object.keys(CATEGORY_LABELS)];
const POLL_INTERVAL = 10000; // 10 segundos

export default function HomePage() {
  const { data: session } = useSession();
  const [markets, setMarkets] = useState<MarketDTO[]>([]);
  const [allMarkets, setAllMarkets] = useState<MarketDTO[]>([]);
  const [filter, setFilter] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ market: MarketDTO; direction: 'si' | 'no' } | null>(null);
  const [balance, setBalance] = useState<number>((session?.user as any)?.diceBalance ?? 0);
  const [toast, setToast] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const filterRef = useRef(filter);

  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  useEffect(() => {
    setBalance((session?.user as any)?.diceBalance ?? 0);
  }, [session]);

  function fetchMarkets(currentFilter: string, showLoading = false) {
    if (showLoading) setLoading(true);
    const qs = currentFilter !== 'todos' ? `?category=${currentFilter}` : '';
    fetch(`/api/markets${qs}`)
      .then((r) => r.json())
      .then((data) => {
        setMarkets(data.markets ?? []);
        setLastUpdated(new Date());
      })
      .finally(() => setLoading(false));
  }

  function fetchAllMarkets() {
    fetch('/api/markets')
      .then((r) => r.json())
      .then((data) => setAllMarkets(data.markets ?? []));
  }

  // Carga inicial
  useEffect(() => {
    fetchAllMarkets();
    fetchMarkets(filter, true);
  }, []);

  // Recarga cuando cambia el filtro
  useEffect(() => {
    fetchMarkets(filter, true);
  }, [filter]);

  // Polling cada 10 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMarkets(filterRef.current, false);
      fetchAllMarkets();
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const featured = allMarkets.length > 0
    ? allMarkets.reduce((a, b) => a.volume > b.volume ? a : b)
    : null;

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
    setAllMarkets((prev) => prev.map((m) => (m.id === data.market.id ? data.market : m)));
    setModal(null);
    showToast(`Posición comprada: ${amount.toLocaleString()} DICE en ${modal.direction === 'si' ? 'SÍ' : 'NO'}`);
  }

  return (
    <div>
      <Hero />

      <div className="p-4">

        {/* Banner mercado del día */}
        {featured && (
          <div className="mb-4 rounded-2xl border border-brand-border p-4"
            style={{ background: 'linear-gradient(135deg, #F5EED7 0%, #EFE4C4 100%)' }}
          >
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-black/8 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-dark">
              🔥 Mercado más popular
            </div>
            <p className="font-display text-base font-extrabold leading-snug text-brand-dark mb-3">
              {featured.title}
            </p>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-display text-4xl font-extrabold text-brand-greenDark leading-none">
                  {featured.probability}%
                </p>
                <p className="text-xs font-semibold text-brand-dark/60 mt-0.5">
                  probabilidad de SÍ
                </p>
                <p className="text-xs text-brand-dark/50 mt-1">
                  👥 {featured.volume.toLocaleString()} DICE en juego
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setModal({ market: featured, direction: 'si' })}
                  className="rounded-lg border border-brand-green/30 bg-brand-green/15 px-4 py-2 text-xs font-bold text-brand-greenDark hover:bg-brand-green/25 transition-colors"
                >
                  COMPRAR SÍ
                </button>
                <button
                  onClick={() => setModal({ market: featured, direction: 'no' })}
                  className="rounded-lg border border-brand-red/25 bg-brand-red/10 px-4 py-2 text-xs font-bold text-brand-red hover:bg-brand-red/20 transition-colors"
                >
                  COMPRAR NO
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Wallet o prompt de login */}
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
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-[10px] text-brand-text2">
                🔴 En vivo · {lastUpdated.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            <Link href="/tendencias" className="text-xs font-semibold text-brand-green hover:underline">
              Ver tendencias →
            </Link>
          </div>
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