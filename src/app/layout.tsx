import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans, DM_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/Navbar';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap'
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap'
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'DICE — El mercado de predicciones del Perú',
  description: 'Predice eventos de política, deportes, cultura y economía. El mercado revela qué cree realmente el país.'
};

function Footer() {
  return (
    <footer className="bg-brand-dark text-white mt-8">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-4">
          <div className="sm:col-span-1">
            <div className="flex items-center gap-0.5 mb-3">
              <span className="font-display text-xl font-black text-white tracking-tight">DICE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-red mb-3 flex-shrink-0"></span>
            </div>
            <p className="text-xs leading-relaxed text-white/40">
              El mercado de predicciones del Perú. Opinión colectiva en probabilidades reales.
            </p>
          </div>
          <div>
            <p className="mb-4 text-[9px] font-bold uppercase tracking-[.1em] text-white/28">Plataforma</p>
            <div className="flex flex-col gap-2.5">
              <a href="/" className="text-xs text-white/50 hover:text-white transition-colors">Mercados</a>
              <a href="/tendencias" className="text-xs text-white/50 hover:text-white transition-colors">Tendencias</a>
              <a href="/ranking" className="text-xs text-white/50 hover:text-white transition-colors">Ranking</a>
              <a href="/perfil" className="text-xs text-white/50 hover:text-white transition-colors">Mi perfil</a>
              <a href="/admin" className="text-xs text-white/50 hover:text-white transition-colors">Admin</a>
            </div>
          </div>
          <div>
            <p className="mb-4 text-[9px] font-bold uppercase tracking-[.1em] text-white/28">Categorías</p>
            <div className="flex flex-col gap-2.5">
              <a href="/?category=politica" className="text-xs text-white/50 hover:text-white transition-colors">Política</a>
              <a href="/?category=deportes" className="text-xs text-white/50 hover:text-white transition-colors">Deportes</a>
              <a href="/?category=economia" className="text-xs text-white/50 hover:text-white transition-colors">Economía</a>
              <a href="/?category=cultura" className="text-xs text-white/50 hover:text-white transition-colors">Cultura</a>
              <a href="/?category=gaming" className="text-xs text-white/50 hover:text-white transition-colors">Gaming / IA</a>
            </div>
          </div>
          <div>
            <p className="mb-4 text-[9px] font-bold uppercase tracking-[.1em] text-white/28">Compañía</p>
            <div className="flex flex-col gap-2.5">
              <a href="#" className="text-xs text-white/50 hover:text-white transition-colors">Cómo funciona</a>
              <a href="#" className="text-xs text-white/50 hover:text-white transition-colors">Términos</a>
              <a href="#" className="text-xs text-white/50 hover:text-white transition-colors">Privacidad</a>
              <a href="#" className="text-xs text-white/50 hover:text-white transition-colors">Contacto</a>
            </div>
          </div>
        </div>
        <div className="mt-10 rounded border border-white/[0.06] bg-white/[0.03] p-4 text-[11px] leading-relaxed text-white/30">
          🇵🇪 DICE es una plataforma de entretenimiento y predicción social. Los DICE Coins no tienen valor monetario real y no pueden canjearse por dinero. dice.pe · MVP
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-6 text-[10px] text-white/25 font-mono tracking-wider">
          <span>© {new Date().getFullYear()} DICE — Hecho en Lima, Perú</span>
          <span>v0.3 · dice.pe</span>
        </div>
      </div>
      <div className="h-16 sm:hidden" />
    </footer>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${playfair.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body>
        <Providers>
          <Navbar />
          <main className="mx-auto max-w-7xl">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}