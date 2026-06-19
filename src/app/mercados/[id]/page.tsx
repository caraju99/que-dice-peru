'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { BuyModal } from '@/components/BuyModal';
import { Toast } from '@/components/Toast';
import { BadgeUnlockedModal } from '@/components/BadgeUnlockedModal';
import { MarketDTO } from '@/lib/types';
import { EarnedBadgeInfo } from '@/lib/checkBadges';

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
  const w = 600, h = 200;
  const [tooltip, setTooltip] = useState<{ x: number; y: number; prob: number; time: string } | null>(null);

  if (data.length < 2) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded bg-brand-surface border border-brand-border">
        <div className="text-center">
          <p className="text-3xl mb-2">📊</p>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-text3">Sin historial aún</p>
          <p className="text-[11px] text-brand-text3 mt-1">Apuesta para ver el gráfico</p>
        </div>
      </div>
    );
  }

  const min = Math.max(0, Math.min(...data) - 5);
  const max = Math.min(100, Math.max(...data) + 5);
  const range = (max - min) || 1;
  const step = w / (data.length - 1);

  const pts = data.map((v, i) => ({
    x: i * step,
    y: h - ((v - min) / range) * (h - 20) - 10,
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
    <div className="relative w-full overflow-hidden rounded bg-brand-surface border border-brand-border px-3 pt-3 pb-1">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 200 }} onMouseLeave={() => setTooltip(null)}>
        {[25, 50, 75].map((pct) => {
          const y = h - ((pct - min) / range) * (h - 20) - 10;
          if (y < 0 || y > h) return null;
          return (
            <g key={pct}>
              <line x1="0" y1={y} x2={w} y2={y} stroke="rgba(17,17,17,0.06)" strokeWidth="1" strokeDasharray="4 4" />
              <text x="6" y={y - 4} fontSize="9" fill="rgba(17,17,17,0.3)" fontFamily="DM Mono, monospace">{pct}%</text>
            </g>
          );
        })}
        <polygon points={area} fill={color} opacity="0.08" />
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={8} fill="transparent"
            onMouseEnter={() => setTooltip({
              x: p.x, y: p.y, prob: p.v,
              time: timestamps?.[i] ? formatTime(timestamps[i]) : ''
            })}
          />
        ))}
        <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r={4} fill={color} />
      </svg>
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded border border-brand-border bg-white px-3 py-2 shadow-md"
          style={{
            left: `${Math.min(Math.max((tooltip.x / w) * 100, 8), 72)}%`,
            top: 8,
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap'
          }}
        >
          <p className="font-mono text-sm font-bold" style={{ color }}>{tooltip.prob}%</p>
          {tooltip.time && <p className="text-[10px] text-brand-text3 mt-0.5">{tooltip.time}</p>}
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
  const [newBadges, setNewBadges] = useState<EarnedBadgeInfo[]>([]);
  const idRef = useRef(id);
  const periodRef = useRef(period);

  useEffect(() => { periodRef.current = period; }, [period]);
  useEffect(() => { setBalance((session?.user as any)?.diceBalance ?? 0); }, [session]);

  function fetchMarket(currentPeriod?: string) {
    const p = currentPeriod ?? periodRef.current;
    const qs = p !== 'all' ? `?period=${p}` : '';
    fetch(`/api/markets${qs}`)
      .then((r) => r.json())
      .then((data) => {
        const found = (data.markets ?? []).find((m: MarketDTO) => m.id === idRef.current);
        if (found) { setMarket(found); setLastUpdated(new Date()); }
        else router.push('/');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchMarket(); }, [id]);
  useEffect(() => { fetchMarket(period); }, [period]);
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

    if (data.newBadges && data.newBadges.length > 0) {
      setNewBadges(data.newBadges);
    }
  }

  async function shareWhatsApp() {
    if (!market) return;
    const url = `https://dice.pe/mercados/${market.id}`;
    const text = `🇵🇪 *DICE — Mercado de predicciones*\n\n"${market.title}"\n\nEl mercado dice: *${market.probability}%* de SÍ.\n\n¿Qué crees tú? 👇\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');

    // Intentar otorgar el badge Embajador (no bloqueante)
    if (session) {
      try {
        const res = await fetch('/api/badges/embajador', { method: 'POST' });
        const data = await res.json();
        if (data.earned) {
          setBalance((prev) => prev + data.reward);
          setNewBadges([{
            code: 'embajador',
            name: 'Embajador',
            description: 'Compartiste un mercado por WhatsApp',
            icon: '📲',
            reward: data.reward
          }]);
        }
      } catch {
        // silencioso, no afecta la experiencia de compartir
      }
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm text-brand-text3 font-mono uppercase tracking-wider">Cargando...</p>
    </div>
  );
  if (!market) return null;

  const no = 100 - market.probability;
  const daysLeft = Math.max(0, Math.ceil((new Date(market.closesAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const isClosed = new Date(market.closesAt).getTime() < Date.now() || market.resolved;
  const trendUp = market.probability >= 50;
  const trendColor = '#C8102E';
  const hasHistory = market.history && market.history.length >= 2;
  const chartData = hasHistory ? market.history.map((s) => s.probability) : [market.probability];
  const timestamps = hasHistory ? market.history.map((s) => s.createdAt) : undefined;

  return (
    <div className="mx-auto max-w-3xl px-6 py-6 pb-24">

      {/* Breadcrumb */}
      <button
        onClick={() => router.push('/')}
        className="mb-6 text-[11px] font-bold uppercase tracking-wider text-brand-text3 hover:text-brand-text transition-colors"
      >
        ← Volver a mercados
      </button>

      {/* Header oscuro */}
      <div className="bg-brand-dark rounded border border-white/[0.06] p-6 mb-3 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 100% 100% at 0% 0%, rgba(200,16,46,0.22) 0%, transparent 65%)' }} />
        <div className="relative z-10">
          <p className="text-[9px] font-bold uppercase tracking-[.1em] text-brand-red mb-3">
            {CATEGORY_LABELS[market.category] ?? market.category} {market.emoji}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white leading-snug mb-6">
            {market.title}
          </h1>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <p className="font-mono text-6xl font-medium text-white leading-none">
                {market.probability}%
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mt-2">
                Probabilidad de SÍ
              </p>
              {lastUpdated && (
                <p className="text-[10px] text-white/25 mt-1.5 font-mono">
                  🔴 En vivo · {lastUpdated.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-brand-red">
                {isClosed ? '🔒 Cerrado' : trendUp ? '▲ Al alza' : '▼ A la baja'}
              </p>
              <p className="text-[10px] text-white/25 mt-1 font-mono">
                Cierra {new Date(market.closesAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
              </p>
              <p className="text-[10px] text-white/25 font-mono">{daysLeft}d restantes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Períodos + Gráfico */}
      <div className="bg-white border border-brand-border rounded p-4 mb-3">
        <div className="flex gap-1.5 mb-4">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                period === p.key
                  ? 'bg-brand-dark text-white'
                  : 'bg-brand-surface text-brand-text3 hover:text-brand-text'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <Chart data={chartData} color={trendColor} timestamps={timestamps} />
      </div>

      {/* Barra */}
      <div className="bg-white border border-brand-border rounded p-4 mb-3">
        <div className="flex justify-between text-[10px] font-mono font-bold mb-2">
          <span className="text-brand-red">SÍ {market.probability}%</span>
          <span className="text-brand-text2">NO {no}%</span>
        </div>
        <div className="relative h-2 bg-brand-surface rounded overflow-hidden">
          <div className="h-full bg-brand-red transition-[width] duration-700" style={{ width: `${market.probability}%` }} />
          <div className="absolute right-0 top-0 h-full bg-brand-dark transition-[width] duration-700" style={{ width: `${no}%` }} />
        </div>
      </div>

      {/* Stats + Botones en grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white border border-brand-border rounded p-4">
          <p className="text-[9px] font-bold uppercase tracking-[.1em] text-brand-text3 mb-2">Stats</p>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-[11px] text-brand-text2">DICE en juego</span>
              <span className="font-mono text-[11px] font-bold text-brand-text">{market.volume.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[11px] text-brand-text2">Movimientos</span>
              <span className="font-mono text-[11px] font-bold text-brand-text">{market.history?.length ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[11px] text-brand-text2">Días restantes</span>
              <span className="font-mono text-[11px] font-bold text-brand-text">{daysLeft}d</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-brand-border rounded p-4">
          <p className="text-[9px] font-bold uppercase tracking-[.1em] text-brand-text3 mb-2">Predice ahora</p>
          {isClosed ? (
            <div className="rounded bg-brand-surface border border-brand-border p-3 text-center">
              <p className="text-xs font-bold text-brand-text3">🔒 Mercado cerrado</p>
              <p className="text-[10px] text-brand-text3 mt-1">Ya no se aceptan predicciones</p>
            </div>
          ) : session ? (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setModal({ direction: 'si' })}
                className="w-full rounded bg-brand-red py-2.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-brand-redDark transition-colors"
              >
                Comprar SÍ · {market.probability}¢
              </button>
              <button
                onClick={() => setModal({ direction: 'no' })}
                className="w-full rounded border border-brand-border2 bg-brand-surface py-2.5 text-[10px] font-bold uppercase tracking-wider text-brand-text2 hover:bg-brand-border transition-colors"
              >
                Comprar NO · {no}¢
              </button>
            </div>
          ) : (
            <p className="text-xs text-brand-text2">
              <a href="/login" className="text-brand-red font-bold hover:underline">Entra</a> para predecir
            </p>
          )}
        </div>
      </div>

      {/* Compartir */}
      <button
        onClick={shareWhatsApp}
        className="w-full rounded bg-[#25D366] py-3 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-[#20BA5A] transition-colors mb-3"
      >
        📲 Compartir en WhatsApp
      </button>

      {/* Cómo funciona */}
      <div className="bg-brand-surface border border-brand-border rounded p-4">
        <p className="text-[9px] font-bold uppercase tracking-[.1em] text-brand-text3 mb-2">Cómo funciona</p>
        <p className="text-xs leading-relaxed text-brand-text2">
          Compra SÍ si crees que va a pasar, NO si crees que no. El precio refleja la probabilidad actual del mercado. Si aciertas cuando se resuelva, recibes DICE proporcionales a tu apuesta.
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

      {newBadges.length > 0 && (
        <BadgeUnlockedModal badges={newBadges} onClose={() => setNewBadges([])} />
      )}

      <Toast message={toast} />
    </div>
  );
}