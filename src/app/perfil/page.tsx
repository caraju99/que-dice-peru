'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PositionDTO } from '@/lib/types';
import { BadgeUnlockedModal } from '@/components/BadgeUnlockedModal';
import { EarnedBadgeInfo } from '@/lib/checkBadges';

type BadgeInfo = {
  code: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  progressCurrent: number | null;
  progressTarget: number | null;
};

type Profile = {
  user: {
    id: string;
    name: string | null;
    email: string;
    diceBalance: number;
    isAdmin: boolean;
  };
  stats: {
    totalPredictions: number;
    accuracy: number;
    diceBalance: number;
  };
  positions: PositionDTO[];
  badges: BadgeInfo[];
  newBadges?: EarnedBadgeInfo[];
};

const STATUS_LABEL: Record<string, string> = {
  activo: 'Activo',
  cerrado: 'Cerrado',
  ganado: 'Ganado',
  perdido: 'Perdido',
  tx_compra: 'Compra',
  tx_venta: 'Venta'
};

const STATUS_CLASS: Record<string, string> = {
  activo: 'bg-brand-redSoft text-brand-red',
  cerrado: 'bg-brand-surface text-brand-text3',
  ganado: 'bg-green-50 text-green-700',
  perdido: 'bg-brand-surface text-brand-text3',
  tx_compra: 'bg-blue-50 text-blue-700',
  tx_venta: 'bg-yellow-50 text-yellow-700'
};

function SellModal({
  position,
  onClose,
  onConfirm
}: {
  position: PositionDTO;
  onClose: () => void;
  onConfirm: (positionId: string, sellAmount: number) => Promise<void>;
}) {
  const [sellAmount, setSellAmount] = useState(position.amount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPrice = position.direction === 'si'
    ? position.probability / 100
    : (100 - position.probability) / 100;

  const estimatedPayout = Math.round(sellAmount * (currentPrice / position.price));
  const remainingAmount = position.amount - sellAmount;
  const isPartial = sellAmount < position.amount;

  async function handleConfirm() {
    if (sellAmount < 10) { setError('Mínimo 10 DICE.'); return; }
    if (sellAmount > position.amount) { setError('No puedes cerrar más de lo que tienes.'); return; }
    setLoading(true);
    try {
      await onConfirm(position.id, sellAmount);
    } catch (e: any) {
      setError(e?.message ?? 'Error al cerrar posición.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded border border-brand-border bg-white p-6 shadow-xl">
        <p className="font-display text-lg font-bold text-brand-text mb-1">Cerrar posición</p>
        <p className="text-xs text-brand-text2 mb-4">{position.marketTitle}</p>

        <div className="rounded bg-brand-surface border border-brand-border p-3 mb-4">
          <div className="flex justify-between text-[11px] font-mono text-brand-text2 mb-1.5">
            <span>Dirección</span>
            <span className="font-bold text-brand-text">{position.direction === 'si' ? 'SÍ' : 'NO'}</span>
          </div>
          <div className="flex justify-between text-[11px] font-mono text-brand-text2 mb-1.5">
            <span>Total en posición</span>
            <span className="font-bold text-brand-text">{position.amount.toLocaleString()} DICE</span>
          </div>
          <div className="flex justify-between text-[11px] font-mono text-brand-text2 mb-1.5">
            <span>Precio promedio compra</span>
            <span className="font-bold text-brand-text">{position.price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[11px] font-mono text-brand-text2">
            <span>Precio actual</span>
            <span className="font-bold text-brand-text">{currentPrice.toFixed(2)}</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[9px] font-bold uppercase tracking-[.1em] text-brand-text3">
              Cantidad a cerrar
            </label>
            <div className="flex gap-2">
              <button onClick={() => setSellAmount(Math.round(position.amount / 4))}
                className="text-[9px] font-bold uppercase tracking-wider text-brand-red hover:underline">25%</button>
              <button onClick={() => setSellAmount(Math.round(position.amount / 2))}
                className="text-[9px] font-bold uppercase tracking-wider text-brand-red hover:underline">50%</button>
              <button onClick={() => setSellAmount(Math.round(position.amount * 0.75))}
                className="text-[9px] font-bold uppercase tracking-wider text-brand-red hover:underline">75%</button>
              <button onClick={() => setSellAmount(position.amount)}
                className="text-[9px] font-bold uppercase tracking-wider text-brand-red hover:underline">100%</button>
            </div>
          </div>
          <input
            type="range"
            min={10}
            max={position.amount}
            step={10}
            value={sellAmount}
            onChange={(e) => setSellAmount(parseInt(e.target.value))}
            className="w-full mb-2 accent-brand-red"
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={10}
              max={position.amount}
              step={10}
              value={sellAmount}
              onChange={(e) => setSellAmount(parseInt(e.target.value) || 10)}
              className="flex-1 rounded border border-brand-border2 bg-brand-surface px-3 py-2 text-sm font-mono font-bold text-brand-text focus:outline-none focus:border-brand-red"
            />
            <span className="text-xs text-brand-text3 font-mono">/ {position.amount.toLocaleString()}</span>
          </div>
        </div>

        <div className="rounded bg-brand-surface border border-brand-border p-3 mb-4 space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono text-brand-text2">
            <span>Cerrando</span>
            <span className="font-bold text-brand-text">{sellAmount.toLocaleString()} DICE</span>
          </div>
          <div className="flex justify-between text-[11px] font-mono text-brand-text2">
            <span>Recibirás aprox.</span>
            <span className="font-bold text-brand-red">~{estimatedPayout.toLocaleString()} DICE</span>
          </div>
          <div className="flex justify-between text-[11px] font-mono text-brand-text2">
            <span>P&L estimado</span>
            <span className={`font-bold ${estimatedPayout >= sellAmount ? 'text-green-700' : 'text-brand-red'}`}>
              {estimatedPayout >= sellAmount ? '+' : ''}{(estimatedPayout - sellAmount).toLocaleString()} DICE
            </span>
          </div>
          {isPartial && (
            <div className="flex justify-between text-[11px] font-mono text-brand-text2 pt-1.5 border-t border-brand-border">
              <span>Queda activo</span>
              <span className="font-bold text-brand-text">{remainingAmount.toLocaleString()} DICE</span>
            </div>
          )}
        </div>

        {isPartial && (
          <p className="text-[10px] text-brand-text3 mb-3 text-center">
            ✂️ Cierre parcial — el resto queda activo en tu posición
          </p>
        )}

        {error && <p className="text-xs font-bold text-brand-red mb-3">{error}</p>}

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 rounded border border-brand-border2 py-2.5 text-[11px] font-bold uppercase tracking-wider text-brand-text2 hover:bg-brand-surface transition-colors">
            Cancelar
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className="flex-1 rounded bg-brand-red py-2.5 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-brand-redDark transition-colors disabled:opacity-50">
            {loading ? 'Cerrando...' : isPartial ? 'Cierre parcial' : 'Cerrar todo'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState(false);
  const [sellModal, setSellModal] = useState<PositionDTO | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [tab, setTab] = useState<'activas' | 'historial' | 'resueltas'>('activas');
  const [newBadges, setNewBadges] = useState<EarnedBadgeInfo[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/profile')
        .then(async (r) => {
          const data = await r.json();
          if (!r.ok || data.error) { setError(true); return; }
          setProfile(data);
          if (data.newBadges && data.newBadges.length > 0) {
            setNewBadges(data.newBadges);
          }
        })
        .catch(() => setError(true));
    }
  }, [status]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSell(positionId: string, sellAmount: number) {
    const res = await fetch('/api/positions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positionId, sellAmount })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'No se pudo cerrar la posición.');

    if (data.isPartial) {
      showToast(`Cierre parcial — vendiste ${data.amountToSell.toLocaleString()} DICE · Recibiste ${data.payout.toLocaleString()} DICE`);
    } else {
      showToast(`Posición cerrada — recibiste ${data.payout.toLocaleString()} DICE`);
    }

    setSellModal(null);
    const profileRes = await fetch('/api/profile');
    const profileData = await profileRes.json();
    setProfile(profileData);

    if (data.newBadges && data.newBadges.length > 0) {
      setNewBadges(data.newBadges);
    }
  }

  if (status === 'loading' || (!profile && !error)) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-brand-text3 font-mono uppercase tracking-wider">Cargando perfil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-brand-red font-mono">No se pudo cargar el perfil</p>
      </div>
    );
  }

  const initials = (profile?.user?.name ?? profile?.user?.email ?? 'US').slice(0, 2).toUpperCase();
  const positions = profile?.positions ?? [];

  // Separar por tipo
  const activas = positions.filter(p => p.status === 'activo');
  const historial = positions.filter(p => p.status === 'tx_compra' || p.status === 'tx_venta').sort((a, b) => new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime());
  const resueltas = positions.filter(p => p.status === 'ganado' || p.status === 'perdido' || p.status === 'cerrado');

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 pb-24">

      {/* Header oscuro */}
      <div className="bg-brand-dark rounded border border-white/[0.06] p-6 mb-4 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 100% at 0% 50%, rgba(200,16,46,0.18) 0%, transparent 70%)' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-red font-display text-xl font-bold text-white flex-shrink-0"
              style={{ boxShadow: '0 4px 16px rgba(200,16,46,0.4)' }}>
              {initials}
            </div>
            <div>
              <p className="font-display text-xl font-bold text-white">{profile?.user?.name ?? 'Predictor'}</p>
              <p className="text-[11px] text-white/40 mt-1">{profile?.user?.email ?? ''}</p>
              {profile?.user?.isAdmin && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-brand-red mt-1 block">Admin</span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatCard num={profile?.stats?.totalPredictions ?? 0} label="Predicciones" />
            <StatCard num={`${profile?.stats?.accuracy ?? 0}%`} label="Aciertos" />
            <StatCard num={(profile?.stats?.diceBalance ?? 0).toLocaleString()} label="DICE" gold />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <div className="flex border-b border-brand-border mb-4">
          {[
            { key: 'activas', label: 'Posiciones', count: activas.length },
            { key: 'historial', label: 'Transacciones', count: historial.length },
            { key: 'resueltas', label: 'Mercados cerrados', count: resueltas.length }
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-1.5 px-3 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-colors ${
                tab === t.key ? 'border-brand-red text-brand-red' : 'border-transparent text-brand-text3 hover:text-brand-text'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                  tab === t.key ? 'bg-brand-redSoft text-brand-red' : 'bg-brand-surface text-brand-text3'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* POSICIONES ACTIVAS */}
        {tab === 'activas' && (
          <div className="grid gap-2">
            {activas.length === 0 && (
              <div className="rounded border border-brand-border bg-white p-8 text-center">
                <p className="text-2xl mb-2">🔮</p>
                <p className="text-sm font-bold text-brand-text mb-1">No tienes posiciones activas</p>
                <p className="text-xs text-brand-text2">Entra a los mercados y empieza a predecir</p>
              </div>
            )}
            {activas.map((p) => (
              <div key={p.id} className="rounded border border-brand-border bg-white p-4"
                style={{ borderLeft: '3px solid #C8102E' }}>
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-brand-text mb-1">{p.marketTitle}</p>
                    <div className="flex flex-wrap gap-2 text-[11px] font-mono text-brand-text3">
                      <span className={`font-bold ${p.direction === 'si' ? 'text-brand-red' : 'text-brand-text'}`}>
                        {p.direction === 'si' ? 'SÍ' : 'NO'}
                      </span>
                      <span>·</span>
                      <span>{p.amount.toLocaleString()} DICE</span>
                      <span>·</span>
                      <span>Prob. actual: {p.probability}%</span>
                    </div>
                  </div>
                  <span className="rounded px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-brand-redSoft text-brand-red">
                    Activo
                  </span>
                </div>

                <div className="bg-brand-surface rounded p-3 mb-3">
                  <div className="flex justify-between text-[11px] font-mono mb-1.5">
                    <span className="text-brand-text3">Precio prom. compra</span>
                    <span className="font-bold text-brand-text">{p.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-mono mb-1.5">
                    <span className="text-brand-text3">Precio actual</span>
                    <span className="font-bold text-brand-text">
                      {(p.direction === 'si' ? p.probability / 100 : (100 - p.probability) / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] font-mono mb-1.5">
                    <span className="text-brand-text3">Valor estimado</span>
                    <span className="font-bold text-brand-red">
                      ~{Math.round(p.amount * (
                        (p.direction === 'si' ? p.probability : 100 - p.probability) / 100
                      ) / p.price).toLocaleString()} DICE
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-brand-text3">P&L no realizado</span>
                    {(() => {
                      const currentVal = Math.round(p.amount * ((p.direction === 'si' ? p.probability : 100 - p.probability) / 100) / p.price);
                      const pnl = currentVal - p.amount;
                      return (
                        <span className={`font-bold ${pnl >= 0 ? 'text-green-700' : 'text-brand-red'}`}>
                          {pnl >= 0 ? '+' : ''}{pnl.toLocaleString()} DICE
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <button
                  onClick={() => setSellModal(p)}
                  className="w-full rounded border border-brand-border2 bg-brand-surface py-2 text-[10px] font-bold uppercase tracking-wider text-brand-text2 hover:bg-brand-border transition-colors"
                >
                  Cerrar posición
                </button>
              </div>
            ))}
          </div>
        )}

        {/* HISTORIAL DE TRANSACCIONES */}
        {tab === 'historial' && (
          <div className="grid gap-2">
            {historial.length === 0 && (
              <div className="rounded border border-brand-border bg-white p-8 text-center">
                <p className="text-2xl mb-2">📊</p>
                <p className="text-sm font-bold text-brand-text mb-1">Sin transacciones todavía</p>
                <p className="text-xs text-brand-text2">Aquí aparecerán todas tus compras y ventas</p>
              </div>
            )}
            {historial.map((p) => (
              <div key={p.id} className="rounded border border-brand-border bg-white p-4"
                style={{ borderLeft: `3px solid ${p.status === 'tx_compra' ? '#3B82F6' : '#EAB308'}` }}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-bold uppercase tracking-wider rounded px-2 py-0.5 ${STATUS_CLASS[p.status]}`}>
                        {p.status === 'tx_compra' ? '▲ Compra' : '▼ Venta'}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${p.direction === 'si' ? 'text-brand-red' : 'text-brand-text3'}`}>
                        {p.direction === 'si' ? 'SÍ' : 'NO'}
                      </span>
                    </div>
                    <p className="text-[13px] font-bold text-brand-text mb-1">{p.marketTitle}</p>
                    <div className="flex flex-wrap gap-2 text-[11px] font-mono text-brand-text3">
                      <span>{p.amount.toLocaleString()} DICE</span>
                      <span>·</span>
                      <span>Precio: {p.price.toFixed(2)}</span>
                      {p.payout != null && p.status === 'tx_venta' && (
                        <><span>·</span>
                        <span className="text-green-700 font-bold">Recibido: {p.payout.toLocaleString()} DICE</span></>
                      )}
                    </div>
                    <p className="text-[10px] text-brand-text3 font-mono mt-1">
                      {new Date((p as any).createdAt).toLocaleString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MERCADOS CERRADOS */}
        {tab === 'resueltas' && (
          <div className="grid gap-2">
            {resueltas.length === 0 && (
              <div className="rounded border border-brand-border bg-white p-8 text-center">
                <p className="text-2xl mb-2">🏆</p>
                <p className="text-sm font-bold text-brand-text mb-1">Sin mercados cerrados</p>
                <p className="text-xs text-brand-text2">Aquí aparecerán tus predicciones cuando los mercados se resuelvan</p>
              </div>
            )}
            {resueltas.map((p) => (
              <div key={p.id} className="rounded border border-brand-border bg-white p-4"
                style={p.status === 'ganado' ? { borderLeft: '3px solid #16a34a' } : { borderLeft: '3px solid #9B9B9B' }}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-brand-text mb-1">{p.marketTitle}</p>
                    <div className="flex flex-wrap gap-2 text-[11px] font-mono text-brand-text3">
                      <span className="font-bold text-brand-text">{p.direction === 'si' ? 'SÍ' : 'NO'}</span>
                      <span>·</span>
                      <span>{p.amount.toLocaleString()} DICE</span>
                      {p.payout != null && (
                        <><span>·</span>
                        <span className={p.status === 'ganado' ? 'text-green-700 font-bold' : 'text-brand-text3'}>
                          {p.status === 'ganado' ? `+${p.payout.toLocaleString()} DICE` : 'Sin pago'}
                        </span></>
                      )}
                    </div>
                  </div>
                  <span className={`whitespace-nowrap rounded px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${STATUS_CLASS[p.status]}`}>
                    {STATUS_LABEL[p.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logros */}
      <div>
        <div className="mb-3">
          <p className="text-[9px] font-bold uppercase tracking-[.1em] text-brand-text3 mb-1">Perfil</p>
          <h2 className="font-display text-xl font-bold text-brand-text">Tus logros</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(profile?.badges ?? []).map((b) => {
            const hasProgress = !b.earned && b.progressCurrent !== null && b.progressTarget !== null;
            const pct = hasProgress ? Math.min(100, Math.round((b.progressCurrent! / b.progressTarget!) * 100)) : 0;

            return (
              <div key={b.code}
                className={`rounded border bg-white p-4 text-center ${b.earned ? 'border-brand-red' : 'border-brand-border opacity-70'}`}
                style={b.earned ? { borderLeft: '3px solid #C8102E' } : {}}
              >
                <div className={`text-2xl mb-2 ${!b.earned ? 'grayscale opacity-60' : ''}`}>{b.icon}</div>
                <p className="text-[11px] font-bold text-brand-text mb-1">{b.name}</p>
                <p className="text-[10px] text-brand-text3 mb-2">{b.description}</p>

                {b.earned ? (
                  <p className="text-[9px] font-bold uppercase tracking-wider text-brand-red">
                    ✓ Desbloqueado
                  </p>
                ) : hasProgress ? (
                  <div>
                    <div className="h-1 bg-brand-surface rounded overflow-hidden mb-1">
                      <div className="h-full bg-brand-text3 transition-[width] duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[9px] font-mono font-bold text-brand-text3">
                      {b.progressCurrent!.toLocaleString()} / {b.progressTarget!.toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-[9px] font-bold uppercase tracking-wider text-brand-text3">
                    🔒 Bloqueado
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {sellModal && (
        <SellModal
          position={sellModal}
          onClose={() => setSellModal(null)}
          onConfirm={handleSell}
        />
      )}

      {newBadges.length > 0 && (
        <BadgeUnlockedModal badges={newBadges} onClose={() => setNewBadges([])} />
      )}

      <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-white/10 bg-brand-dark px-6 py-3 text-[12px] font-bold text-white transition-opacity duration-300 z-40 ${toast ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        {toast}
      </div>
    </div>
  );
}

function StatCard({ num, label, gold }: { num: string | number; label: string; gold?: boolean }) {
  return (
    <div className="rounded bg-white/[0.06] border border-white/[0.08] p-3 text-center">
      <p className={`font-mono text-lg font-medium mb-1 ${gold ? 'text-brand-gold' : 'text-white'}`}>{num}</p>
      <p className="text-[9px] font-bold uppercase tracking-[.07em] text-white/30">{label}</p>
    </div>
  );
}