import { prisma } from '@/lib/prisma';

// Revisa y otorga badges nuevos a un usuario. Se llama después de cada compra/venta/resolución.
export async function checkAndAwardBadges(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      positions: { include: { market: true } },
      badges: { include: { badge: true } }
    }
  });

  if (!user) return;

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

  // Lista de condiciones: code -> cumple?
  const conditions: Record<string, boolean> = {
    primera_prediccion: totalPredictions >= 1,
    cinco_predicciones: totalPredictions >= 5,
    diez_predicciones: totalPredictions >= 10,
    veinticinco_predicciones: totalPredictions >= 25,
    cincuenta_predicciones: totalPredictions >= 50,

    primer_acierto: totalWins >= 1,
    cinco_aciertos: totalWins >= 5,
    diez_aciertos: totalWins >= 10,
    precision_70: resolved.length >= 5 && accuracy >= 70,
    precision_90: resolved.length >= 10 && accuracy >= 90,

    experto_futbol: (winsByCategory['deportes'] || 0) >= 3,
    politologo: (winsByCategory['politica'] || 0) >= 3,
    wall_street: (winsByCategory['economia'] || 0) >= 3,
    chismoso_oficial: (winsByCategory['cultura'] || 0) >= 3,

    apostador: totalVolume >= 10000,
    alto_riesgo: maxSingleBet >= 1000,
    millonario_dice: user.diceBalance >= 20000,

    racha_3: maxStreak >= 3,
    racha_5: maxStreak >= 5,
    racha_10: maxStreak >= 10
    // embajador y og_dice se otorgan manualmente desde otros lugares, no aquí
  };

  let totalRewardEarned = 0;
  const newlyEarned: string[] = [];

  for (const [code, met] of Object.entries(conditions)) {
    if (met && !earnedCodes.has(code)) {
      const badge = badgeMap.get(code);
      if (!badge) continue;

      await prisma.userBadge.create({
        data: { userId, badgeId: badge.id }
      });

      totalRewardEarned += badge.reward;
      newlyEarned.push(badge.name);
    }
  }

  if (totalRewardEarned > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { diceBalance: { increment: totalRewardEarned } }
    });
  }

  return { newlyEarned, totalRewardEarned };
}