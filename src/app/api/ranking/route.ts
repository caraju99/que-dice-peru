import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/ranking?category=futbol
// Calcula la precisión (% de aciertos) de cada usuario sobre sus
// posiciones ya resueltas (ganado/perdido) y devuelve el top 20.
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
        }
      },
      badges: { include: { badge: true } }
    }
  });

  const ranking = users
    .map((u) => {
      const total = u.positions.length;
      const won = u.positions.filter((p) => p.status === 'ganado').length;
      const accuracy = total > 0 ? Math.round((won / total) * 100) : 0;
      const topBadge = u.badges[0]?.badge.name ?? 'Predictor novato';

      return {
        id: u.id,
        name: u.name ?? 'Predictor anónimo',
        accuracy,
        total,
        badge: topBadge
      };
    })
    .filter((u) => u.total > 0)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 20);

  return NextResponse.json({ ranking });
}
