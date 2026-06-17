'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export function Hero() {
  const { data: session } = useSession();

  return (
    <div className="border-b border-brand-border bg-gradient-to-b from-white to-brand-surface px-4 py-10">
      
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-3 py-1.5 text-[11px] font-semibold text-brand-text2 shadow-sm">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-green" />
        3,241 usuarios activos ahora
      </div>

      <h1 className="font-display text-3xl font-extrabold leading-tight text-brand-text">
        Todos tienen una opinión.
        <br />
        <span className="text-brand-green">
          Ahora Perú puede medirla.
        </span>
      </h1>

      <p className="mb-6 mt-3 max-w-md text-[15px] leading-relaxed text-brand-text2">
        Predice eventos de política, deportes, cultura y economía.
        El mercado muestra qué cree realmente el país.
        Sin dinero real, solo tu visión y tus DICE Coins.
      </p>

      <div className="flex flex-wrap gap-3">
        {!session && (
          <Link
            href="/login"
            className="rounded-lg bg-brand-green px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-greenDark transition-colors"
          >
            Crear cuenta gratis
          </Link>
        )}

        <a
          href="#mercados"
          className="rounded-lg border border-brand-border2 px-5 py-2.5 text-sm font-semibold text-brand-text hover:bg-brand-surface transition-colors"
        >
          Ver mercados
        </a>
      </div>


      <div className="mt-8 flex flex-wrap gap-6">
        <Stat num="47" label="Mercados activos" />
        <Stat num="12,840" label="Predictores" />
        <Stat num="S/ 0" label="Dinero en juego" />
        <Stat num="68%" label="Precisión promedio" />
      </div>


      <div className="mt-10 border-t border-brand-border pt-8">

        <p className="mb-1 font-display text-base font-bold text-brand-text">
          ¿Cómo funciona?
        </p>

        <p className="mb-5 text-xs text-brand-text2">
          Tres pasos y ya estás prediciendo el futuro del Perú.
        </p>


        <div className="grid gap-3 sm:grid-cols-3">

          <Step
            num="1"
            title="Crea tu cuenta gratis"
            desc="Regístrate y recibe 10,000 DICE Coins sin tarjetas, sin dinero real."
          />

          <Step
            num="2"
            title="Elige un mercado y predice"
            desc="Política, deportes, economía o cultura. Compra SÍ o NO según lo que creas."
          />

          <Step
            num="3"
            title="Sube en el ranking"
            desc="Si aciertas, ganas DICE Coins y subes posiciones. Compite por ser el mejor predictor del Perú."
          />

        </div>

      </div>

    </div>
  );
}


function Stat({ num, label }: { num: string; label: string }) {
  return (
    <div>
      <p className="font-display text-xl font-bold text-brand-text">
        {num}
      </p>

      <p className="mt-0.5 text-[11px] text-brand-text2">
        {label}
      </p>
    </div>
  );
}



function Step({
  num,
  title,
  desc
}: {
  num: string;
  title: string;
  desc: string;
}) {

  return (
    <div className="rounded-xl border border-brand-border bg-white p-4 shadow-sm">

      <div className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-green/10 text-xs font-bold text-brand-greenDark">
        {num}
      </div>


      <p className="mb-1 font-display text-sm font-bold text-brand-text">
        {title}
      </p>


      <p className="text-xs leading-relaxed text-brand-text2">
        {desc}
      </p>

    </div>
  );
}