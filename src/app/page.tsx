'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Hero } from '@/components/Hero';
import { WalletBar } from '@/components/WalletBar';
import { MarketCard } from '@/components/MarketCard';
import { BuyModal } from '@/components/BuyModal';
import { Toast } from '@/components/Toast';
import { BadgeUnlockedModal } from '@/components/BadgeUnlockedModal';
import { CATEGORY_LABELS, MarketDTO } from '@/lib/types';
import { EarnedBadgeInfo } from '@/lib/checkBadges';

const FILTERS = ['todos', ...Object.keys(CATEGORY_LABELS)];
const POLL_INTERVAL = 10000;

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
  const [newBadges, setNewBadges] = useState<EarnedBadgeInfo[]>([]);
  const filterRef = useRef(filter);

  useEffect(() => { filterRef.current = filter; }, [filter]);
  useEffect(() => { setBalance((session?.user as any)?.diceBalance ?? 0); }, [session]);

  function fetchMarkets(currentFilter: string, showLoading = false) {
    if (showLoading) setLoading(true);
    const qs = currentFilter !== 'todos' ? `?category=${currentFilter}` : '';
    fetch(`/api/markets${qs}`)
      .then((r) => r.json())
      .then((data) => { setMarkets(data.markets ?? []); setLastUpdated(new Date()); })
      .finally(() => setLoading(false));
  }

  function fetchAllMarkets() {
    fetch('/api/markets')
      .then((r) => r.json())
      .then((data) => setAllMarkets(data.markets ?? []));
  }

  useEffect(() => { fetchAllMarkets(); fetchMarkets(filter, true); }, []);
  useEffect(() => { fetchMarkets(filter, true); }, [filter]);
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
    if (!session) { showToast('Inicia sesión para predecir'); return; }
    const res = await fetch('/api/positions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketId: modal.market.id, direction: modal.direction, amount })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'No se pudo comprar la posición.');
    setBalance(data.diceBalance);
    setMarkets((prev) => prev.map((m) => (m.id === data.market.id ? data.market : m)));
    setAllMarkets((prev) => prev.map((m) => (m.id === data.market.id ? data.market : m)));
    setModal(null);
    showToast(`Posición comprada: ${amount.toLocaleString()} DICE en ${modal.direction === 'si' ? 'SÍ' : 'NO'}`);

    if (data.newBadges && data.newBadges.length > 0) {
      setNewBadges(data.newBadges);
    }
  }

  function handleBadgeEarned(badges: EarnedBadgeInfo[], rewardBalance: number) {
    setBalance(rewardBalance);
    setNewBadges(badges);
  }

  return (
    <div>
      <Hero />

      {/* Banner mercado más popular */}
      {featured && (
        <div className="mx-auto max-w-7xl px-6 pt-6">
          <div className="rounded bg-brand-dark border border-white/[0.06] p-5 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0"
              style={{ background: 'linear-gradient(135deg, rgba(200,16,46,0.2) 0%, transparent 60%)' }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-red flex-shrink-0" />
                <span className="text-[9px] font-bold uppercase tracking-[.1em] text-brand-red">
                  Mercado más popular
                </span>
              </div>
              <p className="font-display text-lg font-bold text-white leading-snug mb-4 max-w-2xl">
                {featured.title}
              </p>
              <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-mono text-5xl font-medium text-white leading-none">
                    {featured.probability}%
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mt-1">
                    Probabilidad de SÍ
                  </p>
                  <p className="text-[11px] text-white/30 mt-1 font-mono">
                    {featured.volume.toLocaleString()} DICE en juego
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setModal({ market: featured, direction: 'si' })}
                    className="rounded bg-brand-red px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-brand-redDark transition-colors"
                  >
                    Comprar SÍ · {featured.probability}¢
                  </button>
                  <button
                    onClick={() => setModal({ market: featured, direction: 'no' })}
                    className="rounded border border-white/15 bg-white/[0.06] px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/70 hover:text-white transition-colors"
                  >
                    Comprar NO · {100 - featured.probability}¢
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 pt-6 pb-20">

        {/* Wallet o prompt de login */}
        {session ? (
          <WalletBar balance={balance} />
        ) : (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded border border-brand-border bg-brand-surface p-4">
            <p className="text-sm font-medium text-brand-text2">
              Crea una cuenta gratis y recibe 10,000 DICE Coins para empezar a predecir.
            </p>
            <Link
              href="/login"
              className="rounded bg-brand-red px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-brand-redDark transition-colors"
            >
              Crear cuenta
            </Link>
          </div>
        )}

        {/* Header mercados */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[.1em] text-brand-text3 mb-1">Mercados activos</p>
            <h2 className="font-display text-lg font-bold text-brand-text">Predice y mueve el mercado</h2>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-[10px] text-brand-text3 font-mono">
                🔴 {lastUpdated.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            <Link href="/tendencias" className="text-[11px] font-bold uppercase tracking-wider text-brand-red hover:underline">
              Tendencias →
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                filter === f
                  ? 'border-brand-dark bg-brand-dark text-white'
                  : 'border-brand-border2 bg-white text-brand-text2 hover:border-brand-dark hover:bg-brand-dark hover:text-white'
              }`}
            >
              {f === 'todos' ? 'Todos' : CATEGORY_LABELS[f]}
            </button>
          ))}
        </div>

        {/* Lista de mercados */}
        <div className="grid gap-3">
          {loading && <p className="text-sm text-brand-text2">Cargando mercados...</p>}
          {!loading && markets.length === 0 && (
            <p className="text-sm text-brand-text2">No hay mercados en esta categoría todavía.</p>
          )}
          {markets.map((m) => (
            <MarketCard
              key={m.id}
              market={m}
              onBuy={(market, direction) => setModal({ market, direction })}
              onBadgeEarned={handleBadgeEarned}
            />
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

      {newBadges.length > 0 && (
        <BadgeUnlockedModal badges={newBadges} onClose={() => setNewBadges([])} />
      )}

      <Toast message={toast} />
    </div>
  );
}