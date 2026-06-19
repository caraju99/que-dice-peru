import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  const badge = await prisma.badge.findUnique({ where: { code: 'embajador' } });
  if (!badge) {
    return NextResponse.json({ error: 'Badge no encontrado.' }, { status: 404 });
  }

  // Verificar si ya lo tiene
  const existing = await prisma.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId: badge.id } }
  });

  if (existing) {
    return NextResponse.json({ alreadyEarned: true });
  }

  // Otorgar el badge y el premio
  await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { diceBalance: { increment: badge.reward } }
  });

  return NextResponse.json({
    earned: true,
    reward: badge.reward,
    diceBalance: updatedUser.diceBalance
  });
}