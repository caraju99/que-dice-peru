import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const [marketsCount, usersCount, positions] = await Promise.all([
    prisma.market.count({ where: { resolved: false } }),
    prisma.user.count(),
    prisma.position.findMany({
      where: { status: { in: ['ganado', 'perdido'] } }
    })
  ]);

  const won = positions.filter((p) => p.status === 'ganado').length;
  const accuracy = positions.length > 0
    ? Math.round((won / positions.length) * 100)
    : 0;

  return NextResponse.json({
    markets: marketsCount,
    users: usersCount,
    accuracy
  });
}