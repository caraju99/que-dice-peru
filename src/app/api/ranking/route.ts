import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function calcStreak(positions: { status: string }[]): number {
  let streak = 0;
  for (let i = positions.length - 1; i >= 0; i--) {
    if (positions[i].status === 'ganado') streak++;
    else break;
  }
  return streak;
}

function calcStreakFactor(streak: number): number {
  if (streak >= 10) return 1.5;
  if (streak >= 5) return 1.25;
  if (streak >= 3) return 1.1;
  return 1.0;
}

function calcDiceScore(
  accuracy: number,
  total: number,
  diceGanados: number,
  streak: number
): number {
  const precisionFactor = accuracy / 100;
  const expFactor = Math.log(total + 1);
  const volumeFactor = Math.log(diceGanados + 1);
  const streakFactor = calcStreakFactor(streak);
  return Math.round(precisionFactor * expFactor * volumeFactor * streakFactor * 1000);
}

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get('category');

  const users = await prisma.user.findMany({
    include: {
      positions: {
        where: {
          status: { in: ['ganado', 'perdido'] },
          ...(category && category !== 'global'
            ? { market: { category } }
            : {})
        },
        orderBy: { createdAt: 'asc' }
      },
      badges: { include: { badge: true } }
    }
  });

  const ranking = users
    .map((u) => {
      const total = u.positions.length;
      if (total < 1) return null;

      const won = u.positions.filter((p) => p.status === 'ganado').length;
      const accuracy = Math.round((won / total) * 100);

      const diceGanados = u.positions
        .filter((p) => p.status === 'ganado')
        .reduce((sum, p) => sum + (p.payout ?? 0), 0);

      const streak = calcStreak(u.positions);
      const streakFactor = calcStreakFactor(streak);
      const diceScore = calcDiceScore(accuracy, total, diceGanados, streak);
      const topBadge = u.badges[0]?.badge.name ?? 'Predictor novato';

      return {
        id: u.id,
        name: u.name ?? 'Predictor anónimo',
        accuracy,
        total,
        diceGanados,
        streak,
        streakFactor,
        diceScore,
        badge: topBadge
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.diceScore - a.diceScore)
    .slice(0, 20);

  return NextResponse.json({ ranking });
}
