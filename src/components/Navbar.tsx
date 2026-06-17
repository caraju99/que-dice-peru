'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-20 border-b border-brand-border bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">

        <Link
          href="/"
          className="shrink-0 font-display text-base font-extrabold text-brand-text"
        >
          ¿Qué Dice <span className="text-brand-green">Perú</span>?
        </Link>

        <nav className="flex items-center gap-3 text-xs font-medium text-brand-text2 whitespace-nowrap">
          <Link href="/" className="hover:text-brand-text">
            Mercados
          </Link>

          <Link href="/ranking" className="hover:text-brand-text">
            Ranking
          </Link>

          {session && (
            <Link href="/perfil" className="hover:text-brand-text">
              Perfil
            </Link>
          )}

          {(session?.user as any)?.isAdmin && (
            <Link href="/admin" className="hover:text-brand-text">
              Admin
            </Link>
          )}
        </nav>

        {session ? (
          <div className="flex items-center gap-2 shrink-0">

            <div className="hidden text-right sm:block">
              <p className="font-display text-sm font-bold leading-none">
                {((session.user as any)?.diceBalance ?? 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-brand-text2">
                DICE Coins
              </p>
            </div>

            <button
              onClick={() => signOut()}
              className="rounded-lg border border-brand-border2 px-2 py-2 text-xs font-medium hover:bg-brand-surface"
            >
              Salir
            </button>

          </div>

        ) : (

          <Link
            href="/login"
            className="shrink-0 rounded-lg bg-brand-green px-3 py-2 text-[11px] font-semibold text-white hover:bg-brand-greenDark"
          >
            Entrar
          </Link>

        )}

      </div>
    </header>
  );
}