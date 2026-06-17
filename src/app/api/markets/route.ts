import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get('category');

    const markets = await prisma.market.findMany({
      where: {
        resolved: false,
        ...(category && category !== 'todos' ? { category } : {})
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ markets });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'error' }, { status: 500 });
  }
}