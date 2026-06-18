'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-brand-dark">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 h-14">

          <Link href="/" className="shrink-0 flex items-center gap-0.5">
            <span className="font-display text-xl font-black text-white tracking-tight">DICE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-red mb-3 flex-shrink-0"></span>
          </Link>

          <nav className="hidden items-center gap-6 sm:flex">
            <Link href="/" className="text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">Mercados</Link>
            <Link href="/tendencias" className="text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">Tendencias</Link>
            <Link href="/ranking" className="text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">Ranking</Link>
            {session && <Link href="/perfil" className="text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">Perfil</Link>}
            {(session?.user as any)?.isAdmin && (
              <Link href="/admin" className="text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">Admin</Link>
            )}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {session ? (
              <>
                <div className="hidden items-center gap-2 rounded border border-white/10 bg-white/[0.07] px-3 py-1.5 sm:flex">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/35">DICE</span>
                  <span className="font-mono text-sm font-medium text-brand-gold">
                    {((session.user as any)?.diceBalance ?? 0).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="rounded border border-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/50 hover:text-white transition-colors"
                >
                  Salir
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded bg-brand-red px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-brand-redDark transition-colors"
              >
                Entrar
              </Link>
            )}

            <button
              className="flex flex-col gap-1 p-2 sm:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menú"
            >
              <span className={`block h-px w-5 bg-white/60 transition-transform ${menuOpen ? 'translate-y-1.5 rotate-45' : ''}`} />
              <span className={`block h-px w-5 bg-white/60 transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-px w-5 bg-white/60 transition-transform ${menuOpen ? '-translate-y-1.5 -rotate-45' : ''}`} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-white/[0.06] bg-brand-dark px-6 py-4 sm:hidden">
            <nav className="flex flex-col gap-4">
              <Link href="/" onClick={() => setMenuOpen(false)} className="text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white">Mercados</Link>
              <Link href="/tendencias" onClick={() => setMenuOpen(false)} className="text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white">Tendencias</Link>
              <Link href="/ranking" onClick={() => setMenuOpen(false)} className="text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white">Ranking</Link>
              {session && (
                <Link href="/perfil" onClick={() => setMenuOpen(false)} className="text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white">Perfil</Link>
              )}
              {(session?.user as any)?.isAdmin && (
                <Link href="/admin" onClick={() => setMenuOpen(false)} className="text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white">Admin</Link>
              )}
              {session && (
                <div className="border-t border-white/[0.06] pt-4">
                  <p className="text-[11px] text-white/35 uppercase tracking-widest">
                    DICE: <span className="text-brand-gold font-mono">{((session.user as any)?.diceBalance ?? 0).toLocaleString()}</span>
                  </p>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Barra inferior móvil */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/[0.06] bg-brand-dark pb-safe sm:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          <Link href="/" className="flex flex-col items-center gap-0.5 px-3 py-1">
            <span className="text-lg">🏠</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/35">Inicio</span>
          </Link>
          <Link href="/tendencias" className="flex flex-col items-center gap-0.5 px-3 py-1">
            <span className="text-lg">📈</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/35">Tendencias</span>
          </Link>
          <Link href="/ranking" className="flex flex-col items-center gap-0.5 px-3 py-1">
            <span className="text-lg">🏆</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/35">Ranking</span>
          </Link>
          {session ? (
            <Link href="/perfil" className="flex flex-col items-center gap-0.5 px-3 py-1">
              <span className="text-lg">👤</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/35">Perfil</span>
            </Link>
          ) : (
            <Link href="/login" className="flex flex-col items-center gap-0.5 px-3 py-1">
              <span className="text-lg">👤</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/35">Entrar</span>
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}