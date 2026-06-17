'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-brand-border bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">

          <Link href="/" className="shrink-0 font-display text-base font-extrabold text-brand-text">
            ¿Qué Dice <span className="text-brand-green">Perú</span>?
          </Link>

          {/* Links desktop */}
          <nav className="hidden items-center gap-4 text-xs font-semibold text-brand-text2 sm:flex">
            <Link href="/" className="hover:text-brand-text transition-colors">Mercados</Link>
            <Link href="/ranking" className="hover:text-brand-text transition-colors">Ranking</Link>
            {session && <Link href="/perfil" className="hover:text-brand-text transition-colors">Perfil</Link>}
            {(session?.user as any)?.isAdmin && (
              <Link href="/admin" className="hover:text-brand-text transition-colors">Admin</Link>
            )}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {session ? (
              <>
                <div className="hidden text-right sm:block">
                  <p className="font-display text-sm font-bold leading-none">
                    {((session.user as any)?.diceBalance ?? 0).toLocaleString()}
                  </p>
                  <p className="text-[11px] text-brand-text2">DICE Coins</p>
                </div>
                <button
                  onClick={() => signOut()}
                  className="rounded-lg border border-brand-border2 px-3 py-2 text-xs font-medium hover:bg-brand-surface transition-colors"
                >
                  Salir
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="shrink-0 rounded-lg bg-brand-green px-3 py-2 text-[11px] font-semibold text-white hover:bg-brand-greenDark transition-colors"
              >
                Entrar
              </Link>
            )}

            {/* Hamburguesa móvil */}
            <button
              className="flex flex-col gap-1 p-2 sm:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menú"
            >
              <span className={`block h-0.5 w-5 bg-brand-text transition-transform ${menuOpen ? 'translate-y-1.5 rotate-45' : ''}`} />
              <span className={`block h-0.5 w-5 bg-brand-text transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 w-5 bg-brand-text transition-transform ${menuOpen ? '-translate-y-1.5 -rotate-45' : ''}`} />
            </button>
          </div>
        </div>

        {/* Menú móvil desplegable */}
        {menuOpen && (
          <div className="border-t border-brand-border bg-white px-4 py-3 sm:hidden">
            <nav className="flex flex-col gap-3">
              <Link href="/" onClick={() => setMenuOpen(false)} className="text-sm font-semibold text-brand-text2 hover:text-brand-text">Mercados</Link>
              <Link href="/ranking" onClick={() => setMenuOpen(false)} className="text-sm font-semibold text-brand-text2 hover:text-brand-text">Ranking</Link>
              {session && (
                <Link href="/perfil" onClick={() => setMenuOpen(false)} className="text-sm font-semibold text-brand-text2 hover:text-brand-text">Perfil</Link>
              )}
              {(session?.user as any)?.isAdmin && (
                <Link href="/admin" onClick={() => setMenuOpen(false)} className="text-sm font-semibold text-brand-text2 hover:text-brand-text">Admin</Link>
              )}
              {session && (
                <div className="border-t border-brand-border pt-3">
                  <p className="text-xs text-brand-text2">
                    DICE Coins: <strong>{((session.user as any)?.diceBalance ?? 0).toLocaleString()}</strong>
                  </p>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Barra inferior móvil tipo app */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-brand-border bg-white pb-safe sm:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          <Link href="/" className="flex flex-col items-center gap-0.5 px-3 py-1">
            <span className="text-lg">🏠</span>
            <span className="text-[10px] font-semibold text-brand-text2">Inicio</span>
          </Link>
          <Link href="/ranking" className="flex flex-col items-center gap-0.5 px-3 py-1">
            <span className="text-lg">🏆</span>
            <span className="text-[10px] font-semibold text-brand-text2">Ranking</span>
          </Link>
          {session && (
            <Link href="/perfil" className="flex flex-col items-center gap-0.5 px-3 py-1">
              <span className="text-lg">👤</span>
              <span className="text-[10px] font-semibold text-brand-text2">Perfil</span>
            </Link>
          )}
          {!session && (
            <Link href="/login" className="flex flex-col items-center gap-0.5 px-3 py-1">
              <span className="text-lg">👤</span>
              <span className="text-[10px] font-semibold text-brand-text2">Entrar</span>
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}