import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const days = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

async function main() {
  console.log('Sembrando base de datos...');

  // --- Badges ---
  const badges = [
    { code: 'oraculo_peru', name: 'Oráculo del Perú', description: '90%+ de precisión', icon: '🔮' },
    { code: 'experto_futbol', name: 'Experto en fútbol', description: '10 aciertos en deportes', icon: '⚽' },
    { code: 'analista_economico', name: 'Analista económico', description: '5 aciertos en economía', icon: '📈' },
    { code: 'racha_ganadora', name: 'Racha ganadora', description: '5 aciertos seguidos', icon: '🔥' },
    { code: 'francotirador', name: 'Francotirador', description: 'Predicción perfecta', icon: '🎯' },
    { code: 'predictor_peruano', name: 'Predictor peruano', description: 'Primera predicción', icon: '🇵🇪' },
    { code: 'dice_millonario', name: 'DICE millonario', description: 'Acumula 50,000 DICE', icon: '💰' },
    { code: 'politico_experto', name: 'Político experto', description: '5 aciertos en política', icon: '🌐' }
  ];

  for (const b of badges) {
    await prisma.badge.upsert({
      where: { code: b.code },
      update: {},
      create: b
    });
  }

  // --- Mercados ---
  const markets = [
    { title: '¿Perú clasificará al Mundial 2026?', category: 'deportes', emoji: '⚽', probability: 62, volume: 2841, closesAt: days(45) },
    { title: '¿Alianza Lima ganará la Liga 1 2025?', category: 'deportes', emoji: '🏆', probability: 44, volume: 1932, closesAt: days(120) },
    { title: '¿El Congreso aprobará la nueva ley laboral?', category: 'politica', emoji: '🗳️', probability: 31, volume: 987, closesAt: days(20) },
    { title: '¿El dólar superará S/ 3.90 este mes?', category: 'economia', emoji: '💵', probability: 57, volume: 3210, closesAt: days(8) },
    { title: '¿Bad Bunny se presentará en Lima en 2025?', category: 'cultura', emoji: '🎵', probability: 78, volume: 5430, closesAt: days(60) },
    { title: '¿Habrá cambio de gabinete antes de julio?', category: 'politica', emoji: '📋', probability: 49, volume: 1540, closesAt: days(14) },
    { title: '¿La selección peruana le ganará a Bolivia?', category: 'deportes', emoji: '🎽', probability: 66, volume: 4102, closesAt: days(3) },
    { title: '¿La inflación bajará del 3% este trimestre?', category: 'economia', emoji: '📈', probability: 38, volume: 892, closesAt: days(30) }
  ];

  for (const m of markets) {
    const existing = await prisma.market.findFirst({ where: { title: m.title } });
    if (!existing) {
      await prisma.market.create({ data: m });
    }
  }

  // --- Usuario demo ---
  const demo = await prisma.user.upsert({
    where: { email: 'ale@quedicePeru.pe' },
    update: {},
    create: {
      name: 'Ale Huamán',
      email: 'ale@quedicePeru.pe',
      isAdmin: true,
      diceBalance: 10000
    }
  });

  const earned = ['experto_futbol', 'racha_ganadora', 'predictor_peruano'];
  for (const code of earned) {
    const badge = await prisma.badge.findUnique({ where: { code } });
    if (badge) {
      await prisma.userBadge.upsert({
        where: { userId_badgeId: { userId: demo.id, badgeId: badge.id } },
        update: {},
        create: { userId: demo.id, badgeId: badge.id }
      });
    }
  }

  console.log('Listo. Usuario demo: ale@quedicePeru.pe (también es admin)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
