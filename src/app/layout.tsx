import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: '¿Qué Dice Perú? — El mercado donde Perú predice el futuro',
  description:
    'Predice eventos de política, deportes, cultura y economía. El mercado muestra qué cree realmente el país.'
};

function Footer() {
  return (
    <footer className="mt-8 bg-brand-dark text-white">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-4">

          {/* Logo y tagline */}
          <div className="sm:col-span-1">
            <p className="font-display text-lg font-extrabold">
              ¿Qué Dice <span className="text-brand-green">Perú</span>?
            </p>
            <p className="mt-2 text-xs leading-relaxed text-white/50">
              El mercado donde Perú predice el futuro. Convierte la opinión colectiva en probabilidades medibles.
            </p>
          </div>

          {/* Plataforma */}
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/40">
              Plataforma
            </p>
            <div className="flex flex-col gap-2">
              <a href="/" className="text-xs text-white/70 hover:text-white transition-colors">Mercados</a>
              <a href="/ranking" className="text-xs text-white/70 hover:text-white transition-colors">Ranking</a>
              <a href="/perfil" className="text-xs text-white/70 hover:text-white transition-colors">Mi perfil</a>
              <a href="/admin" className="text-xs text-white/70 hover:text-white transition-colors">Admin</a>
            </div>
          </div>

          {/* Categorías */}
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/40">
              Categorías
            </p>
            <div className="flex flex-col gap-2">
              <a href="/?category=politica" className="text-xs text-white/70 hover:text-white transition-colors">Política</a>
              <a href="/?category=deportes" className="text-xs text-white/70 hover:text-white transition-colors">Deportes</a>
              <a href="/?category=economia" className="text-xs text-white/70 hover:text-white transition-colors">Economía</a>
              <a href="/?category=cultura" className="text-xs text-white/70 hover:text-white transition-colors">Cultura</a>
              <a href="/?category=gaming" className="text-xs text-white/70 hover:text-white transition-colors">Gaming / IA</a>
            </div>
          </div>

          {/* Compañía */}
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/40">
              Compañía
            </p>
            <div className="flex flex-col gap-2">
              <a href="#" className="text-xs text-white/70 hover:text-white transition-colors">Cómo funciona</a>
              <a href="#" className="text-xs text-white/70 hover:text-white transition-colors">Términos y condiciones</a>
              <a href="#" className="text-xs text-white/70 hover:text-white transition-colors">Privacidad</a>
              <a href="#" className="text-xs text-white/70 hover:text-white transition-colors">Contacto</a>
            </div>
          </div>

        </div>

        {/* Disclaimer */}
        <div className="mt-8 rounded-xl bg-white/5 p-4 text-[11px] leading-relaxed text-white/50">
          🇵🇪 ¿Qué Dice Perú? es una plataforma de entretenimiento y predicción social. Los DICE Coins no tienen valor monetario real y no pueden comprarse, venderse ni canjearse por dinero. Esta es una versión de prueba (MVP).
        </div>

        {/* Bottom */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-[11px] text-white/40">
          <span>© 2025 ¿Qué Dice Perú? — Hecho con 🇵🇪 en Lima</span>
          <span>v0.2 · MVP</span>
        </div>
      </div>

      {/* Espacio para barra móvil */}
      <div className="h-16 sm:hidden" />
    </footer>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <Navbar />
          <main className="mx-auto max-w-3xl">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}