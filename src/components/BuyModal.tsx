'use client';

import { useEffect, useState } from 'react';
import { MarketDTO } from '@/lib/types';

type Props = {
  market: MarketDTO;
  direction: 'si' | 'no';
  diceBalance: number;
  onClose: () => void;
  onConfirm: (amount: number) => Promise<void>;
};

const MIN_AMOUNT = 10;

export function BuyModal({ market, direction, diceBalance, onClose, onConfirm }: Props) {
  const [amount, setAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const price = direction === 'si' ? market.probability / 100 : (100 - market.probability) / 100;
  const gain = price > 0 ? Math.round(amount * (1 / price - 1)) : 0;
  const remaining = diceBalance - amount;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleConfirm() {
    setError(null);
    if (amount < MIN_AMOUNT) {
      setError(`El mínimo es ${MIN_AMOUNT} DICE Coins.`);
      return;
    }
    if (amount > diceBalance) {
      setError('No tienes suficientes DICE Coins.');
      return;
    }
    setLoading(true);
    try {
      await onConfirm(amount);
    } catch (e: any) {
      setError(e?.message ?? 'Algo salió mal.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-brand-border bg-white p-6">
        <p className="font-display text-[17px] font-bold text-brand-text">
          Comprar posición — {direction === 'si' ? 'SÍ' : 'NO'}
        </p>
        <p className="mb-4 mt-1 text-xs font-medium text-brand-text2">{market.title}</p>

        <div className="mb-4 flex gap-2">
          <div
            className={`flex-1 rounded-lg p-2 text-center text-[13px] font-bold ${
              direction === 'si'
                ? 'border-[1.5px] border-brand-green bg-brand-green/10 text-brand-greenDark'
                : 'border border-brand-border bg-brand-surface text-brand-text2'
            }`}
          >
            SÍ · {market.probability}¢
          </div>
          <div
            className={`flex-1 rounded-lg p-2 text-center text-[13px] font-bold ${
              direction === 'no'
                ? 'border-[1.5px] border-brand-red bg-brand-red/10 text-brand-red'
                : 'border border-brand-border bg-brand-surface text-brand-text2'
            }`}
          >
            NO · {100 - market.probability}¢
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <input
            type="number"
            value={amount}
            min={MIN_AMOUNT}
            max={10000}
            step={10}
            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
            className="flex-1 rounded-lg border border-brand-border2 bg-brand-surface px-3 py-2 text-[15px] font-bold text-brand-text focus:outline focus:outline-2 focus:outline-brand-green"
          />
          <span className="text-xs font-semibold text-brand-text2">DICE</span>
        </div>

        <div className="mb-4 space-y-1 rounded-lg bg-brand-surface p-3 text-xs font-medium text-brand-text2">
          <div className="flex justify-between">
            <span>Precio por acción</span>
            <span className="font-bold text-brand-text">{price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Ganancia si aciertas</span>
            <span className="font-bold text-brand-greenDark">+{gain.toLocaleString()} DICE</span>
          </div>
          <div className="flex justify-between">
            <span>DICE restantes</span>
            <span className="font-bold text-brand-text">{remaining.toLocaleString()}</span>
          </div>
        </div>

        {error && <p className="mb-3 text-xs font-semibold text-brand-red">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-brand-border2 py-2 text-sm font-medium hover:bg-brand-surface"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 rounded-lg bg-brand-green py-2 text-sm font-semibold text-white hover:bg-brand-greenDark disabled:opacity-60"
          >
            {loading ? 'Comprando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
