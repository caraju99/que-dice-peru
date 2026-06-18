export function WalletBar({ balance }: { balance: number }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded border border-white/[0.06] bg-brand-dark px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-red font-display text-sm font-bold text-white flex-shrink-0">
          D
        </div>
        <div>
          <p className="font-mono text-lg font-medium text-brand-gold leading-none">
            {balance.toLocaleString()}
          </p>
          <p className="text-[9px] font-bold uppercase tracking-[.07em] text-white/30 mt-0.5">
            DICE disponibles
          </p>
        </div>
      </div>
      <div className="text-[9px] font-bold uppercase tracking-wider text-white/20">
        🔴 En vivo
      </div>
    </div>
  );
}