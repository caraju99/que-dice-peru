import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      positions: {
        include: { market: true },
        orderBy: { createdAt: 'desc' }
      },
      badges: { include: { badge: true } }
    }
  });

  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
  }

  const resolved = user.positions.filter((p) => p.status !== 'activo');
  const won = resolved.filter((p) => p.status === 'ganado').length;
  const accuracy = resolved.length > 0 ? Math.round((won / resolved.length) * 100) : 0;

  const allBadges = await prisma.badge.findMany();
  const earnedCodes = new Set(user.badges.map((b) => b.badge.code));

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      diceBalance: user.diceBalance,
      isAdmin: user.isAdmin
    },
    stats: {
      totalPredictions: user.positions.length,
      accuracy,
      diceBalance: user.diceBalance
    },
    positions: user.positions.map((p) => ({
      id: p.id,
      marketId: p.marketId,
      marketTitle: p.market.title,
      direction: p.direction,
      amount: p.amount,
      price: p.price,
      status: p.status,
      payout: p.payout,
      probability: p.market.probability
    })),
    badges: allBadges.map((b) => ({
      code: b.code,
      name: b.name,
      description: b.description,
      icon: b.icon,
      earned: earnedCodes.has(b.code)
    }))
  });
}