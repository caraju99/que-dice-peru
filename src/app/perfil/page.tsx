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
  activo: 'bg-brand-green/10 text-brand-greenDark',
  ganado: 'bg-brand-green/10 text-brand-greenDark',
  perdido: 'bg-brand-red/10 text-brand-red',
  vendido: 'bg-yellow-100 text-yellow-700'
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
      if (!res.ok) {
        showToast(data.error ?? 'No se pudo vender.');
        return;
      }
      showToast(`Vendido — recibiste ${data.payout.toLocaleString()} DICE Coins`);
      // Refresca el perfil
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
    return <p className="p-4 text-sm text-brand-text2">Cargando perfil...</p>;
  }

  if (error) {
    return <p className="p-4 text-sm text-red-500">No se pudo cargar el perfil 😢</p>;
  }

  const initials = (profile?.user?.name ?? profile?.user?.email ?? 'US').slice(0, 2).toUpperCase();

  return (
    <div className="p-4 pb-20">

      {/* HEADER */}
      <div className="mb-3.5 rounded-card border border-brand-border bg-white p-4">
        <div className="mb-4 flex items-center gap-3.5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-green font-display text-xl font-extrabold text-white">
            {initials}
          </div>
          <div>
            <p className="font-display text-lg font-extrabold text-brand-text">
              {profile?.user?.name ?? 'Predictor'}
            </p>
            <p className="text-xs text-brand-text2">{profile?.user?.email ?? ''}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatCard num={profile?.stats?.totalPredictions ?? 0} label="Predicciones" />
          <StatCard num={`${profile?.stats?.accuracy ?? 0}%`} label="Aciertos" />
          <StatCard num={(profile?.stats?.diceBalance ?? 0).toLocaleString()} label="DICE disponibles" />
          <StatCard num={profile?.user?.isAdmin ? 'Sí' : 'No'} label="Administrador" />
        </div>
      </div>

      {/* PREDICCIONES */}
      <h2 className="mb-2.5 font-display text-base font-bold text-brand-text">
        Mis predicciones
      </h2>

      <div className="grid gap-2">
        {(profile?.positions ?? []).length === 0 && (
          <p className="text-sm text-brand-text2">Todavía no has hecho ninguna predicción.</p>
        )}

        {(profile?.positions ?? []).map((p) => (
          <div
            key={p.id}
            className="rounded-card border border-brand-border bg-white p-3.5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-brand-text">{p.marketTitle}</p>
                <p className="mt-0.5 text-[11px] text-brand-text2">
                  Posición: <strong>{p.direction === 'si' ? 'SÍ' : 'NO'}</strong> · {p.amount.toLocaleString()} DICE
                  {p.status === 'activo' && <> · Prob. actual: {p.probability}%</>}
                  {p.status !== 'activo' && p.payout != null && <> · Recibiste: {p.payout.toLocaleString()} DICE</>}
                </p>
              </div>
              <span className={`whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-bold ${STATUS_CLASS[p.status ?? 'activo']}`}>
                {STATUS_LABEL[p.status ?? 'activo']}
              </span>
            </div>

            {/* Botón vender — solo posiciones activas */}
            {p.status === 'activo' && (
              <div className="mt-3 flex items-center justify-between border-t border-brand-border pt-3">
                <p className="text-[11px] text-brand-text2">
                  Valor actual estimado:{' '}
                  <strong className="text-brand-text">
                    ~{Math.round(p.amount * (
                      (p.direction === 'si' ? p.probability : 100 - p.probability) / 100
                    ) / (p.price)).toLocaleString()} DICE
                  </strong>
                </p>
                <button
                  onClick={() => handleSell(p.id)}
                  disabled={selling === p.id}
                  className="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-1.5 text-xs font-bold text-yellow-700 hover:bg-yellow-100 transition-colors disabled:opacity-50"
                >
                  {selling === p.id ? 'Vendiendo...' : 'Vender posición'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* LOGROS */}
      <h2 className="mb-2.5 mt-6 font-display text-base font-bold text-brand-text">Logros</h2>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {(profile?.badges ?? []).map((b) => (
          <div
            key={b.code}
            className={`rounded-card border bg-white p-4 text-center ${b.earned ? 'border-brand-green' : 'border-brand-border'}`}
          >
            <div className="mb-2 text-3xl">{b.icon}</div>
            <p className="text-xs font-bold text-brand-text">{b.name}</p>
            <p className="mt-0.5 text-[11px] text-brand-text2">{b.description}</p>
            <p className={`mt-1.5 text-[10px] font-bold ${b.earned ? 'text-brand-greenDark' : 'text-brand-text2'}`}>
              {b.earned ? 'Desbloqueado' : 'Bloqueado'}
            </p>
          </div>
        ))}
      </div>

      {/* TOAST */}
      <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-dark px-6 py-3 text-sm font-bold text-white transition-opacity duration-300 ${toast ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        {toast}
      </div>
    </div>
  );
}

function StatCard({ num, label }: { num: string | number; label: string }) {
  return (
    <div className="rounded-lg bg-brand-surface p-3 text-center">
      <p className="font-display text-lg font-bold text-brand-text">{num}</p>
      <p className="mt-0.5 text-[10px] text-brand-text2">{label}</p>
    </div>
  );
}