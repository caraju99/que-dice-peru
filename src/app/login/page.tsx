'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleDemoLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const res = await signIn('demo', { redirect: false, name, email });
    setLoading(false);
    if (res?.ok) router.push('/');
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-2xl font-extrabold text-brand-text">Crea tu cuenta</h1>
      <p className="mt-2 text-sm text-brand-text2">
        Recibe 10,000 DICE Coins y empieza a predecir el futuro del Perú.
      </p>

      <button
        onClick={() => signIn('google')}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-brand-border2 py-2.5 text-sm font-medium hover:bg-brand-surface"
      >
        Continuar con Google
      </button>

      <div className="my-5 flex items-center gap-3 text-xs text-brand-text2">
        <div className="h-px flex-1 bg-brand-border" />
        <span>o entra con una cuenta de prueba</span>
        <div className="h-px flex-1 bg-brand-border" />
      </div>

      <form onSubmit={handleDemoLogin} className="space-y-3">
        <input
          type="text"
          placeholder="Nombre (opcional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-brand-border2 px-3 py-2 text-sm focus:outline focus:outline-2 focus:outline-brand-green"
        />
        <input
          type="email"
          placeholder="tu@email.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-brand-border2 px-3 py-2 text-sm focus:outline focus:outline-2 focus:outline-brand-green"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-green py-2.5 text-sm font-semibold text-white hover:bg-brand-greenDark disabled:opacity-60"
        >
          {loading ? 'Entrando...' : 'Entrar / crear cuenta'}
        </button>
      </form>

      <p className="mt-4 text-[11px] text-brand-text2">
        La cuenta de prueba no requiere contraseña — está pensada para desarrollo. Antes de
        producción, reemplázala por un proveedor de email real (magic link) o solo deja Google.
      </p>
    </div>
  );
}
