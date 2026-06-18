'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PositionDTO } from '@/lib/types';

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
  badges: {
    code: string;
    name: string;
    description: string;
    icon: string;
    earned: boolean;
  }[];
};

const STATUS_LABEL: Record<string, string> = {
  activo: 'Activo',
  ganado: 'Ganado',
  perdido: 'Perdido',
  vendido: 'Vendido'
};

const STATUS_CLASS: Record<string, string> = {
  activo: 'bg-brand-redSoft text-brand-red',
  ganado: 'bg-green-50 text-green-700',
  perdido: 'bg-brand-surface text-brand-text3',
  vendido: 'bg-yellow-50 text-yellow-700'
};

export default function ProfilePage() {
  const { status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState(false);
  const [selling, setSelling] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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
        })
        .catch(() => setError(true));
    }
  }, [status]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSell(positionId: string) {
    setSelling(positionId);
    try {
      const res = await fetch('/api/positions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionId })
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? 'No se pudo vender.'); return; }
      showToast(`Vendido — recibiste ${data.payout.toLocaleString()} DICE`);
      const profileRes = await fetch('/api/profile');
      const profileData = await profileRes.json();
      setProfile(profileData);
    } catch {
      showToast('Error al vender la posición.');
    } finally {
      setSelling(null);
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
              <p className="font-display text-xl font-bold text-white">
                {profile?.user?.name ?? 'Predictor'}
              </p>
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

      {/* Predicciones */}
      <div className="mb-6">
        <div className="mb-3">
          <p className="text-[9px] font-bold uppercase tracking-[.1em] text-brand-text3 mb-1">Historial</p>
          <h2 className="font-display text-xl font-bold text-brand-text">Mis predicciones</h2>
        </div>

        <div className="grid gap-2">
          {(profile?.positions ?? []).length === 0 && (
            <div className="rounded border border-brand-border bg-white p-8 text-center">
              <p className="text-2xl mb-2">🔮</p>
              <p className="text-sm font-bold text-brand-text mb-1">Todavía no has predicho</p>
              <p className="text-xs text-brand-text2">Entra a los mercados y empieza a predecir</p>
            </div>
          )}

          {(profile?.positions ?? []).map((p) => (
            <div key={p.id} className="rounded border border-brand-border bg-white p-4"
              style={p.status === 'ganado' ? { borderLeft: '3px solid #16a34a' } :
                     p.status === 'activo' ? { borderLeft: '3px solid #C8102E' } : {}}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-brand-text mb-1">{p.marketTitle}</p>
                  <div className="flex flex-wrap gap-2 text-[11px] font-mono text-brand-text3">
                    <span>Posición: <strong className="text-brand-text">{p.direction === 'si' ? 'SÍ' : 'NO'}</strong></span>
                    <span>·</span>
                    <span>{p.amount.toLocaleString()} DICE</span>
                    {p.status === 'activo' && <><span>·</span><span>Prob. actual: {p.probability}%</span></>}
                    {p.status !== 'activo' && p.payout != null && <><span>·</span><span className="text-green-700 font-bold">+{p.payout.toLocaleString()} DICE</span></>}
                  </div>
                </div>
                <span className={`whitespace-nowrap rounded px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${STATUS_CLASS[p.status ?? 'activo']}`}>
                  {STATUS_LABEL[p.status ?? 'activo']}
                </span>
              </div>

              {p.status === 'activo' && (
                <div className="mt-3 flex items-center justify-between border-t border-brand-border pt-3">
                  <p className="text-[11px] text-brand-text3 font-mono">
                    Valor est.: <strong className="text-brand-text">
                      ~{Math.round(p.amount * (
                        (p.direction === 'si' ? p.probability : 100 - p.probability) / 100
                      ) / (p.price)).toLocaleString()} DICE
                    </strong>
                  </p>
                  <button
                    onClick={() => handleSell(p.id)}
                    disabled={selling === p.id}
                    className="rounded border border-yellow-300 bg-yellow-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-yellow-700 hover:bg-yellow-100 transition-colors disabled:opacity-50"
                  >
                    {selling === p.id ? 'Vendiendo...' : 'Vender'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Logros */}
      <div>
        <div className="mb-3">
          <p className="text-[9px] font-bold uppercase tracking-[.1em] text-brand-text3 mb-1">Perfil</p>
          <h2 className="font-display text-xl font-bold text-brand-text">Tus logros</h2>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(profile?.badges ?? []).map((b) => (
            <div
              key={b.code}
              className={`rounded border bg-white p-4 text-center ${
                b.earned ? 'border-brand-red' : 'border-brand-border opacity-50'
              }`}
              style={b.earned ? { borderLeft: '3px solid #C8102E' } : {}}
            >
              <div className="text-2xl mb-2">{b.icon}</div>
              <p className="text-[11px] font-bold text-brand-text mb-1">{b.name}</p>
              <p className="text-[10px] text-brand-text3">{b.description}</p>
              <p className={`text-[9px] font-bold uppercase tracking-wider mt-2 ${
                b.earned ? 'text-brand-red' : 'text-brand-text3'
              }`}>
                {b.earned ? '✓ Desbloqueado' : '🔒 Bloqueado'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Toast */}
      <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-white/10 bg-brand-dark px-6 py-3 text-[12px] font-bold text-white transition-opacity duration-300 ${toast ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
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