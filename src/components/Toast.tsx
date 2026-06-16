'use client';

export function Toast({ message }: { message: string | null }) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-green px-6 py-3 text-sm font-bold text-white transition-opacity duration-300 ${
        message ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      {message}
    </div>
  );
}
