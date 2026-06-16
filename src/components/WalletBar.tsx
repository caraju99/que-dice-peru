export function WalletBar({ balance }: { balance: number }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-brand-border bg-brand-surface p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-green font-display text-lg font-extrabold text-white">
          D
        </div>
        <div>
          <p className="font-display text-xl font-bold text-brand-text">{balance.toLocaleString()}</p>
          <p className="text-[11px] font-medium text-brand-text2">DICE Coins disponibles</p>
        </div>
      </div>
    </div>
  );
}
