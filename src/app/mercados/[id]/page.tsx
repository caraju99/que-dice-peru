'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { BuyModal } from '@/components/BuyModal';
import { Toast } from '@/components/Toast';
import { MarketDTO } from '@/lib/types';

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
  const w = 200, h = 48;
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
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function MercadoPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [market, setMarket] = useState<MarketDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ direction: 'si' | 'no' } | null>(null);
  const [balance, setBalance] = useState<number>((session?.user as any)?.diceBalance ?? 0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setBalance((session?.user as any)?.diceBalance ?? 0);
  }, [session]);

  useEffect(() => {
    fetch('/api/markets')
      .then((r) => r.json())
      .then((data) => {
        const found = (data.markets ?? []).find((m: MarketDTO) => m.id === id);
        if (found) setMarket(found);
        else router.push('/');
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  async function handleConfirm(amount: number) {
    if (!market || !session) return;
    const res = await fetch('/api/positions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketId: market.id, direction: modal?.direction, amount })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Error al comprar.');
    setBalance(data.diceBalance);
    setMarket(data.market);
    setModal(null);
    showToast(`Posición comprada: ${amount.toLocaleString()} DICE en ${modal?.direction === 'si' ? 'SÍ' : 'NO'}`);
  }

  function shareWhatsApp() {
    if (!market) return;
    const url = `https://que-dice-peru-cp93.vercel.app/mercados/${market.id}`;
    const text = `🇵🇪 *¿Qué Dice Perú?*\n\n"${market.title}"\n\nEl mercado cree que hay un *${market.probability}%* de probabilidad de que SÍ pase.\n\n¿Qué crees tú? Predice gratis 👇\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  if (loading) return <p className="p-4 text-sm text-brand-text2">Cargando mercado...</p>;
  if (!market) return null;

  const no = 100 - market.probability;
  const daysLeft = Math.max(0, Math.ceil((new Date(market.closesAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const trendUp = market.probability >= 50;
  const trendColor = trendUp ? '#00C853' : '#E63946';

  return (
    <div className="p-4 pb-20">

      {/* Breadcrumb */}
      <button onClick={() => router.push('/')} className="mb-4 text-xs font-semibold text-brand-text2 hover:text-brand-text transition-colors">
        ← Volver a mercados
      </button>

      {/* Header */}
      <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm mb-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-brand-green">
          {CATEGORY_LABELS[market.category] ?? market.category} {market.emoji}
        </p>
        <h1 className="font-display text-xl font-extrabold leading-snug text-brand-text mb-4">
          {market.title}
        </h1>

        {/* Probabilidad grande */}
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <div>
            <p className="font-display text-5xl font-extrabold leading-none text-brand-green">
              {market.probability}%
            </p>
            <p className="text-xs font-semibold text-brand-text2 mt-1">probabilidad de SÍ</p>
          </div>
          <Sparkline probability={market.probability} color={trendColor} />
        </div>

        {/* Barra */}
        <div className="relative h-3 overflow-hidden rounded-full bg-brand-surface mb-2">
          <div className="h-full rounded-full bg-brand-green transition-[width] duration-700" style={{ width: `${market.probability}%` }} />
          <div className="absolute right-0 top-0 h-full rounded-full bg-brand-red" style={{ width: `${no}%` }} />
        </div>
        <div className="flex justify-between text-xs font-semibold text-brand-text2 mb-4">
          <span>SÍ: {market.probability}%</span>
          <span>NO: {no}%</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-xl bg-brand-surface p-3 text-center">
            <p className="font-display text-base font-bold text-brand-text">{market.volume.toLocaleString()}</p>
            <p className="text-[10px] text-brand-text2">DICE en juego</p>
          </div>
          <div className="rounded-xl bg-brand-surface p-3 text-center">
            <p className="font-display text-base font-bold text-brand-text">{daysLeft}d</p>
            <p className="text-[10px] text-brand-text2">restantes</p>
          </div>
          <div className="rounded-xl bg-brand-surface p-3 text-center">
            <p className="font-display text-base font-bold" style={{ color: trendColor }}>
              {trendUp ? '▲ Sube' : '▼ Baja'}
            </p>
            <p className="text-[10px] text-brand-text2">tendencia</p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setModal({ direction: 'si' })}
            className="flex-1 rounded-xl border border-brand-green/30 bg-brand-green/10 py-3 text-sm font-bold text-brand-greenDark hover:bg-brand-green/20 transition-colors"
          >
            COMPRAR SÍ · {market.probability}¢
          </button>
          <button
            onClick={() => setModal({ direction: 'no' })}
            className="flex-1 rounded-xl border border-brand-red/25 bg-brand-red/[0.08] py-3 text-sm font-bold text-brand-red hover:bg-brand-red/20 transition-colors"
          >
            COMPRAR NO · {no}¢
          </button>
        </div>

        {/* Compartir */}
        <button
          onClick={shareWhatsApp}
          className="w-full rounded-xl bg-[#25D366] py-2.5 text-sm font-bold text-white hover:bg-[#20BA5A] transition-colors"
        >
          📲 Compartir en WhatsApp
        </button>
      </div>

      {/* Info adicional */}
      <div className="rounded-xl border border-brand-border bg-white p-4 text-sm text-brand-text2">
        <p className="font-bold text-brand-text mb-1">¿Cómo funciona?</p>
        <p className="text-xs leading-relaxed">
          Compra SÍ si crees que va a pasar, o NO si crees que no. El precio refleja la probabilidad que el mercado le da al evento. Si aciertas cuando se resuelva el mercado, recibes DICE Coins proporcionales a tu apuesta.
        </p>
      </div>

      {modal && market && (
        <BuyModal
          market={market}
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