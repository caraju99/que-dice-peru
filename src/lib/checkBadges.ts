import { prisma } from '@/lib/prisma';

export type EarnedBadgeInfo = {
  code: string;
  name: string;
  description: string;
  icon: string;
  reward: number;
};

export type BadgeProgress = {
  code: string;
  current: number;
  target: number;
};

// Revisa y otorga badges nuevos a un usuario. Se llama después de cada compra/venta/resolución.
export async function checkAndAwardBadges(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      positions: { include: { market: true } },
      badges: { include: { badge: true } }
    }
  });

  if (!user) return null;

  const earnedCodes = new Set(user.badges.map(b => b.badge.code));
  const allBadges = await prisma.badge.findMany();
  const badgeMap = new Map(allBadges.map(b => [b.code, b]));

  // Solo posiciones principales (no transacciones individuales)
  const mainPositions = user.positions.filter(p =>
    p.status !== 'tx_compra' && p.status !== 'tx_venta'
  );

  const totalPredictions = mainPositions.length;
  const resolved = mainPositions.filter(p => p.status === 'ganado' || p.status === 'perdido');
  const won = resolved.filter(p => p.status === 'ganado');
  const totalWins = won.length;
  const accuracy = resolved.length > 0 ? (totalWins / resolved.length) * 100 : 0;

  // Volumen total apostado (compras)
  const totalVolume = user.positions
    .filter(p => p.status === 'tx_compra' || p.status === 'activo')
    .reduce((sum, p) => sum + p.amount, 0);

  // Apuesta más grande en una sola posición
  const maxSingleBet = mainPositions.reduce((max, p) => Math.max(max, p.amount), 0);

  // Aciertos por categoría
  const winsByCategory: Record<string, number> = {};
  for (const p of won) {
    const cat = p.market.category;
    winsByCategory[cat] = (winsByCategory[cat] || 0) + 1;
  }

  // Racha actual (basada en las últimas posiciones resueltas, ordenadas por fecha)
  const resolvedSorted = [...resolved].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  let currentStreak = 0;
  let maxStreak = 0;
  for (const p of resolvedSorted) {
    if (p.status === 'ganado') {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  // Lista de condiciones: code -> { met, current, target }
  const conditions: Record<string, { met: boolean; current: number; target: number }> = {
    primera_prediccion: { met: totalPredictions >= 1, current: totalPredictions, target: 1 },
    cinco_predicciones: { met: totalPredictions >= 5, current: totalPredictions, target: 5 },
    diez_predicciones: { met: totalPredictions >= 10, current: totalPredictions, target: 10 },
    veinticinco_predicciones: { met: totalPredictions >= 25, current: totalPredictions, target: 25 },
    cincuenta_predicciones: { met: totalPredictions >= 50, current: totalPredictions, target: 50 },

    primer_acierto: { met: totalWins >= 1, current: totalWins, target: 1 },
    cinco_aciertos: { met: totalWins >= 5, current: totalWins, target: 5 },
    diez_aciertos: { met: totalWins >= 10, current: totalWins, target: 10 },
    precision_70: { met: resolved.length >= 5 && accuracy >= 70, current: Math.round(accuracy), target: 70 },
    precision_90: { met: resolved.length >= 10 && accuracy >= 90, current: Math.round(accuracy), target: 90 },

    experto_futbol: { met: (winsByCategory['deportes'] || 0) >= 3, current: winsByCategory['deportes'] || 0, target: 3 },
    politologo: { met: (winsByCategory['politica'] || 0) >= 3, current: winsByCategory['politica'] || 0, target: 3 },
    wall_street: { met: (winsByCategory['economia'] || 0) >= 3, current: winsByCategory['economia'] || 0, target: 3 },
    chismoso_oficial: { met: (winsByCategory['cultura'] || 0) >= 3, current: winsByCategory['cultura'] || 0, target: 3 },

    apostador: { met: totalVolume >= 10000, current: totalVolume, target: 10000 },
    alto_riesgo: { met: maxSingleBet >= 1000, current: maxSingleBet, target: 1000 },
    millonario_dice: { met: user.diceBalance >= 20000, current: user.diceBalance, target: 20000 },

    racha_3: { met: maxStreak >= 3, current: maxStreak, target: 3 },
    racha_5: { met: maxStreak >= 5, current: maxStreak, target: 5 },
    racha_10: { met: maxStreak >= 10, current: maxStreak, target: 10 }
    // embajador y og_dice se otorgan manualmente desde otros lugares, no aquí
  };

  let totalRewardEarned = 0;
  const newlyEarned: EarnedBadgeInfo[] = [];

  for (const [code, info] of Object.entries(conditions)) {
    if (info.met && !earnedCodes.has(code)) {
      const badge = badgeMap.get(code);
      if (!badge) continue;

      await prisma.userBadge.create({
        data: { userId, badgeId: badge.id }
      });

      totalRewardEarned += badge.reward;
      newlyEarned.push({
        code: badge.code,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        reward: badge.reward
      });
    }
  }

  if (totalRewardEarned > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { diceBalance: { increment: totalRewardEarned } }
    });
  }

  // Progreso de badges no ganados (para mostrar "7/10" en el perfil)
  const progress: BadgeProgress[] = Object.entries(conditions)
    .filter(([code]) => !earnedCodes.has(code))
    .map(([code, info]) => ({ code, current: info.current, target: info.target }));

  return { newlyEarned, totalRewardEarned, progress };
}