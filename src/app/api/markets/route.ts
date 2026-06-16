import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// SOLO GET (para aislar el error)
export async function GET() {
  try {
    const markets = await prisma.market.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ markets });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'error' }, { status: 500 });
  }
}