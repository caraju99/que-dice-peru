import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: '¿Qué Dice Perú? — El mercado donde Perú predice el futuro',
  description:
    'Predice eventos de política, deportes, cultura y economía. El mercado muestra qué cree realmente el país.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <Navbar />
          <main className="mx-auto max-w-3xl">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
