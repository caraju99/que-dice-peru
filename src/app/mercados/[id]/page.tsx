'use client';

import { useEffect, useRef, useState } from 'react';
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

const PERIODS = [
  { key: '1d', label: '1D' },
  { key: '1s', label: '1S' },
  { key: '1m', label: '1M' },
  { key: '1a', label: '1A' },
  { key: 'all', label: 'Todo' }
];

function Chart({ data, color, timestamps }: {
  data: number[];
  color: string;
  timestamps?: string[];
}) {
  const w = 600, h = 160;
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; prob: number; time: string
  } | null>(null);

  if (data.length < 2) {
    return (
      <div className="flex h-40 w-full items-center justify-center rounded-xl bg-brand-surface">
        <p className="text-xs text-brand-text2">
          Sin historial aún — empieza a apostar para ver el gráfico
        </p>
      </div>
    );
  }

  const min = Math.max(0, Math.min(...data) - 5);
  const max = Math.min(100, Math.max(...data) + 5);
  const range = (max - min) || 1;
  const step = w / (data.length - 1);

  const pts = data.map((v, i) => ({
    x: i * step,
    y: h - ((v - min) / range) * (h - 16) - 8,
    v
  }));

  const points = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${points} ${w},${h} 0,${h}`;

  function formatTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `Hace ${days}d`;
    if (hrs > 0) return `Hace ${hrs}h`;
    if (mins > 0) return `Hace ${mins}m`;
    return 'Ahora';
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-brand-surface p-2">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        style={{ height: 160 }}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Grid lines */}
        {[25, 50, 75].map((pct) => {
          const y = h - ((pct - min) / range) * (h - 16) - 8;
          return (
            <g key={pct}>
              <line x1="0" y1={y} x2={w} y2={y} stroke="#E5E5E0" strokeWidth="1" strokeDasharray="4 4" />
              <text x="4" y={y - 3} fontSize="8" fill="#9B9B96">{pct}%</text>
            </g>
          );
        })}

        <polygon points={area} fill={color} opacity="0.08" />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Área interactiva */}
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={8}
            fill="transparent"
            onMouseEnter={() => setTooltip({
              x: p.x,
              y: p.y,
              prob: p.v,
              time: timestamps?.[i] ? formatTime(timestamps[i]) : ''
            })}
          />
        ))}

        {/* Punto actual */}
        <circle
          cx={pts[pts.length - 1].x}
          cy={pts[pts.length - 1].y}
          r={4}
          fill={color}
        />
      </svg>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-brand-border bg-white px-3 py-1.5 shadow-md"
          style={{
            left: `${Math.min(Math.max((tooltip.x / w) * 100, 5), 75)}%`,
            top: 8,
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap'
          }}
        >
          <p className="text-[13px] font-extrabold font-display" style={{ color }}>
            {tooltip.prob}%
          </p>
          {tooltip.time && (
            <p className="text-[10px] text-brand-text2">{tooltip.time}</p>
          )}
        </div>
      )}
    </div>
  );
}

const POLL_INTERVAL = 10000;

export default function MercadoPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [market, setMarket] = useState<MarketDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ direction: 'si' | 'no' } | null>(null);
  const [balance, setBalance] = useState<number>((session?.user as any)?.diceBalance ?? 0);
  const [toast, setToast] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [period, setPeriod] = useState('all');
  const idRef = useRef(id);
  const periodRef = useRef(period);

  useEffect(() => {
    periodRef.current = period;
  }, [period]);

  useEffect(() => {
    setBalance((session?.user as any)?.diceBalance ?? 0);
  }, [session]);

  function fetchMarket(currentPeriod?: string) {
    const p = currentPeriod ?? periodRef.current;
    const qs = p !== 'all' ? `?period=${p}` : '';
    fetch(`/api/markets${qs}`)
      .then((r) => r.json())
      .then((data) => {
        const found = (data.markets ?? []).find((m: MarketDTO) => m.id === idRef.current);
        if (found) {
          setMarket(found);
          setLastUpdated(new Date());
        } else {
          router.push('/');
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchMarket();
  }, [id]);

  useEffect(() => {
    fetchMarket(period);
  }, [period]);

  useEffect(() => {
    const interval = setInterval(() => fetchMarket(), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

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
    fetchMarket();
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
  const hasHistory = market.history && market.history.length >= 2;
  const chartData = hasHistory ? market.history.map((s) => s.probability) : [market.probability];
  const timestamps = hasHistory ? market.history.map((s) => s.createdAt) : undefined;

  return (
    <div className="p-4 pb-20">
      <button onClick={() => router.push('/')} className="mb-4 text-xs font-semibold text-brand-text2 hover:text-brand-text transition-colors">
        ← Volver a mercados
      </button>

      <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm mb-4">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-brand-green">
          {CATEGORY_LABELS[market.category] ?? market.category} {market.emoji}
        </p>
        <h1 className="font-display text-xl font-extrabold leading-snug text-brand-text mb-4">
          {market.title}
        </h1>

        {/* Probabilidad */}
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="font-display text-5xl font-extrabold leading-none text-brand-green">
              {market.probability}%
            </p>
            <p className="text-xs font-semibold text-brand-text2 mt-1">probabilidad de SÍ</p>
            {lastUpdated && (
              <p className="text-[10px] text-brand-text2 mt-1">
                🔴 En vivo · {lastUpdated.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-bold" style={{ color: trendColor }}>
              {trendUp ? '▲ Al alza' : '▼ A la baja'}
            </p>
          </div>
        </div>

        {/* Botones de período */}
        <div className="mb-3 flex gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                period === p.key
                  ? 'bg-brand-green text-white'
                  : 'bg-brand-surface text-brand-text2 hover:bg-brand-green/10'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Gráfico grande */}
        <Chart data={chartData} color={trendColor} timestamps={timestamps} />

        {/* Barra */}
        <div className="relative mt-4 h-3 overflow-hidden rounded-full bg-brand-surface mb-2">
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
            <p className="font-display text-base font-bold text-brand-text">{market.history?.length ?? 0}</p>
            <p className="text-[10px] text-brand-text2">movimientos</p>
          </div>
        </div>

        {/* Botones compra */}
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

        <button
          onClick={shareWhatsApp}
          className="w-full rounded-xl bg-[#25D366] py-2.5 text-sm font-bold text-white hover:bg-[#20BA5A] transition-colors"
        >
          📲 Compartir en WhatsApp
        </button>
      </div>

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