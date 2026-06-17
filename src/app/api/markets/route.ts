import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getPeriodDate(period: string | null): Date | null {
  const now = new Date();
  switch (period) {
    case '1d': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '1s': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '1m': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '1a': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default: return null; // all time
  }
}

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get('category');
    const period = req.nextUrl.searchParams.get('period');
    const periodDate = getPeriodDate(period);

    const markets = await prisma.market.findMany({
      where: {
        resolved: false,
        ...(category && category !== 'todos' ? { category } : {})
      },
      orderBy: { createdAt: 'desc' },
      include: {
        snapshots: {
          where: periodDate ? { createdAt: { gte: periodDate } } : {},
          orderBy: { createdAt: 'asc' },
          take: 50
        }
      }
    });

    const marketsWithHistory = markets.map((m) => ({
      ...m,
      history: m.snapshots.map((s) => ({
        probability: s.probability,
        createdAt: s.createdAt
      }))
    }));

    return NextResponse.json({ markets: marketsWithHistory });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'error' }, { status: 500 });
  }
}