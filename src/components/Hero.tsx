export function Hero() {
  return (
    <div className="border-b border-brand-border bg-white px-4 py-9">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 text-[11px] font-medium text-brand-text2">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-green" />
        3,241 usuarios activos ahora
      </div>

      <h1 className="font-display text-3xl font-extrabold leading-tight text-brand-text">
        Todos tienen una opinión.
        <br />
        <span className="text-brand-green">Ahora Perú puede medirla.</span>
      </h1>

      <p className="mb-5 mt-3 max-w-md text-[15px] leading-relaxed text-brand-text2">
        Predice eventos de política, deportes, cultura y economía. El mercado muestra qué cree
        realmente el país. Sin dinero real, solo tu visión y tus DICE Coins.
      </p>

      <div className="mt-6 flex flex-wrap gap-6">
        <Stat num="47" label="Mercados activos" />
        <Stat num="12,840" label="Predictores" />
        <Stat num="S/ 0" label="Dinero en juego" />
        <Stat num="68%" label="Precisión promedio" />
      </div>
    </div>
  );
}

function Stat({ num, label }: { num: string; label: string }) {
  return (
    <div>
      <p className="font-display text-xl font-bold text-brand-text">{num}</p>
      <p className="mt-0.5 text-[11px] text-brand-text2">{label}</p>
    </div>
  );
}
