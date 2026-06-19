'use client';

import { useEffect, useState } from 'react';
import { EarnedBadgeInfo } from '@/lib/checkBadges';

type Props = {
  badges: EarnedBadgeInfo[];
  onClose: () => void;
};

export function BadgeUnlockedModal({ badges, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(t);
  }, [index]);

  if (!badges || badges.length === 0) return null;

  const badge = badges[index];
  const isLast = index === badges.length - 1;

  function handleNext() {
    setShow(false);
    setTimeout(() => {
      if (isLast) {
        onClose();
      } else {
        setIndex((i) => i + 1);
      }
    }, 200);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={handleNext}
    >
      {/* Confetti simple con CSS */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="absolute block w-2 h-2 rounded-sm"
            style={{
              left: `${(i * 4.3) % 100}%`,
              top: '-10px',
              backgroundColor: i % 3 === 0 ? '#C8102E' : i % 3 === 1 ? '#E8C547' : '#FFFFFF',
              animation: `confetti-fall ${2 + (i % 3)}s linear ${i * 0.08}s infinite`,
              opacity: show ? 1 : 0
            }}
          />
        ))}
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-sm transition-all duration-300 ${
          show ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
      >
        <div className="bg-brand-dark rounded border border-white/10 p-8 text-center relative overflow-hidden"
          style={{ boxShadow: '0 20px 60px rgba(200,16,46,0.4)' }}>
          <div className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 100% 80% at 50% 0%, rgba(232,197,71,0.25) 0%, transparent 70%)' }} />

          <div className="relative z-10">
            <p className="text-[9px] font-bold uppercase tracking-[.15em] text-brand-gold mb-4">
              🎉 Logro desbloqueado
            </p>

            <div
              className={`mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white/[0.06] border-2 border-brand-gold text-5xl transition-transform duration-500 ${
                show ? 'scale-100 rotate-0' : 'scale-50 rotate-12'
              }`}
              style={{ boxShadow: '0 0 30px rgba(232,197,71,0.3)' }}
            >
              {badge.icon}
            </div>

            <p className="font-display text-2xl font-bold text-white mb-2">
              {badge.name}
            </p>
            <p className="text-xs text-white/50 mb-6 leading-relaxed">
              {badge.description}
            </p>

            <div className="inline-flex items-center gap-2 rounded-full bg-brand-gold/15 border border-brand-gold/30 px-5 py-2.5 mb-6">
              <span className="text-lg">💰</span>
              <span className="font-mono text-lg font-bold text-brand-gold">
                +{badge.reward.toLocaleString()} DICE
              </span>
            </div>

            {badges.length > 1 && (
              <p className="text-[10px] font-mono text-white/30 mb-3">
                {index + 1} de {badges.length}
              </p>
            )}

            <button
              onClick={handleNext}
              className="w-full rounded bg-brand-red py-3 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-brand-redDark transition-colors"
            >
              {isLast ? 'Continuar' : 'Siguiente logro →'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}