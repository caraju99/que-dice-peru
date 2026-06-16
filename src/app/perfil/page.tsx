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
  perdido: 'Perdido'
};

const STATUS_CLASS: Record<string, string> = {
  activo: 'bg-brand-green/10 text-brand-greenDark',
  ganado: 'bg-brand-green/10 text-brand-greenDark',
  perdido: 'bg-brand-red/10 text-brand-red'
};

export default function ProfilePage() {
  const { status } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState(false);

  // 🔐 redirect login si no está autenticado
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  // 📦 fetch profile seguro
  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/profile')
        .then(async (r) => {
          const data = await r.json();

          if (!r.ok || data.error) {
            setError(true);
            return;
          }

          setProfile(data);
        })
        .catch(() => setError(true));
    }
  }, [status]);

  // ⏳ loading
  if (status === 'loading' || (!profile && !error)) {
    return (
      <p className="p-4 text-sm text-brand-text2">
        Cargando perfil...
      </p>
    );
  }

  // ❌ error state
  if (error) {
    return (
      <p className="p-4 text-sm text-red-500">
        No se pudo cargar el perfil 😢 (revisa login)
      </p>
    );
  }

  // 🧠 initials seguras
  const initials = (
    profile?.user?.name ??
    profile?.user?.email ??
    'US'
  )
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="p-4">

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

            <p className="text-xs text-brand-text2">
              {profile?.user?.email ?? ''}
            </p>
          </div>
        </div>

        {/* STATS */}
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
          <p className="text-sm text-brand-text2">
            Todavía no has hecho ninguna predicción.
          </p>
        )}

        {(profile?.positions ?? []).map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-brand-border bg-white p-3.5"
          >
            <div>
              <p className="text-[13px] font-semibold text-brand-text">
                {p.marketTitle}
              </p>

              <p className="mt-0.5 text-[11px] text-brand-text2">
                Posición: <strong>{p.direction === 'si' ? 'SÍ' : 'NO'}</strong> ·{' '}
                {p.amount.toLocaleString()} DICE
                {p.status === 'activo' && <> · Prob. actual: {p.probability}%</>}
                {p.status !== 'activo' && p.payout != null && (
                  <> · Pago: {p.payout.toLocaleString()} DICE</>
                )}
              </p>
            </div>

            <span
              className={`whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-bold ${
                STATUS_CLASS[p.status ?? 'activo']
              }`}
            >
              {STATUS_LABEL[p.status ?? 'activo']}
            </span>
          </div>
        ))}
      </div>

      {/* LOGROS */}
      <h2 className="mb-2.5 mt-6 font-display text-base font-bold text-brand-text">
        Logros
      </h2>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {(profile?.badges ?? []).map((b) => (
          <div
            key={b.code}
            className={`rounded-card border bg-white p-4 text-center ${
              b.earned ? 'border-brand-green' : 'border-brand-border'
            }`}
          >
            <div className="mb-2 text-3xl">{b.icon}</div>

            <p className="text-xs font-bold text-brand-text">{b.name}</p>

            <p className="mt-0.5 text-[11px] text-brand-text2">
              {b.description}
            </p>

            <p
              className={`mt-1.5 text-[10px] font-bold ${
                b.earned ? 'text-brand-greenDark' : 'text-brand-text2'
              }`}
            >
              {b.earned ? 'Desbloqueado' : 'Bloqueado'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ num, label }: { num: string | number; label: string }) {
  return (
    <div className="rounded-lg bg-brand-surface p-3 text-center">
      <p className="font-display text-lg font-bold text-brand-text">
        {num}
      </p>
      <p className="mt-0.5 text-[10px] text-brand-text2">{label}</p>
    </div>
  );
}