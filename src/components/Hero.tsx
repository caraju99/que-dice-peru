'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

type Stats = {
  markets: number;
  users: number;
  accuracy: number;
};

export function Hero() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => setStats(null));
  }, []);

  return (
    <>
      {/* ===== HERO NEGRO ===== */}
      <div className="relative overflow-hidden bg-brand-dark px-6 py-14 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(200,16,46,0.18) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl">

          {/* Badge */}
          <div className="mb-8 flex items-center gap-3">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-red flex-shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-[.08em] text-white/50">
              {stats ? `${stats.users.toLocaleString()} predictores activos` : 'Cargando...'}
            </span>
            <span className="h-3 w-px bg-white/15" />
            <span className="text-[11px] font-bold uppercase tracking-[.06em] text-brand-red">
              En vivo
            </span>
          </div>

          {/* Título */}
          <h1 className="font-display text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl mb-5">
            El mercado
            <br />
            donde <span className="text-brand-red">Perú</span>
            <br />
            <span className="italic text-white/70">predice el futuro.</span>
          </h1>

          {/* Descripción */}
          <p className="mb-8 max-w-md text-[15px] leading-relaxed text-white/50">
            Política, deportes, economía y cultura. El mercado muestra qué cree realmente el país —
            en probabilidades reales, no opiniones.
          </p>

          {/* Botones */}
          <div className="flex flex-wrap gap-3 mb-14">
            {!session && (
              <Link
                href="/login"
                className="rounded bg-brand-red px-6 py-3 text-[12px] font-bold uppercase tracking-wider text-white hover:bg-brand-redDark transition-colors"
                style={{ boxShadow: '0 4px 20px rgba(200,16,46,0.4)' }}
              >
                Crear cuenta gratis
              </Link>
            )}

            {/* FIX: aquí faltaba el <a> */}
            <a
              href="#mercados"
              className="rounded border border-white/15 px-6 py-3 text-[12px] font-bold uppercase tracking-wider text-white/60 hover:text-white hover:border-white/30 transition-colors"
            >
              Ver mercados
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-0 border-t border-white/[0.07] pt-8">
            <Stat num={stats ? stats.markets.toString() : '—'} label="Mercados activos" />
            <Stat num={stats ? stats.users.toLocaleString() : '—'} label="Predictores" />
            <Stat num="S/ 0" label="En juego" />
            <Stat num={stats ? `${stats.accuracy}%` : '—'} label="Precisión prom." />
          </div>

        </div>
      </div>

      {/* ===== SECCIÓN CREMA — CÓMO FUNCIONA ===== */}
      <div className="bg-brand-surface border-b border-brand-border px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-[9px] font-bold uppercase tracking-[.1em] text-brand-text3 mb-2">
            Cómo funciona
          </p>
          <p className="font-display text-2xl font-bold text-brand-text mb-2">
            Tres pasos para predecir
          </p>
          <p className="text-xs text-brand-text2 mb-8">
            Sin dinero real. Solo tu criterio y tus DICE.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <Step
              num="01 — Registro"
              title="Crea tu cuenta gratis"
              desc="Entra con Google y recibe 10,000 DICE al instante. Sin tarjeta, sin depósito."
            />
            <Step
              num="02 — Predicción"
              title="Elige un mercado"
              desc="Compra SÍ o NO según lo que creas. Tu apuesta mueve la probabilidad del mercado."
            />
            <Step
              num="03 — Ranking"
              title="Compite y sube"
              desc="Si aciertas ganas DICE y subes en el ranking. El mejor predictor del Perú eres tú."
            />
          </div>
        </div>
      </div>
    </>
  );
}

function Stat({ num, label }: { num: string; label: string }) {
  return (
    <div className="pr-6">
      <p className="font-mono text-xl font-medium text-white mb-1">{num}</p>
      <p className="text-[10px] font-bold uppercase tracking-[.07em] text-white/50">
        {label}
      </p>
    </div>
  );
}

function Step({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="rounded border border-brand-border bg-white p-5 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 left-0 w-0.5 h-full bg-brand-red" />
      <p className="font-mono text-[10px] text-brand-red mb-3 uppercase tracking-wider">
        {num}
      </p>
      <p className="font-display text-sm font-bold text-brand-text mb-2">
        {title}
      </p>
      <p className="text-xs leading-relaxed text-brand-text2">
        {desc}
      </p>
    </div>
  );
}