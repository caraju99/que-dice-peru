import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const mercados = [
  {
    title: '¿Argentina gana vs Austria?',
    category: 'deportes',
    emoji: '⚽',
    probability: 68,
    closesAt: new Date('2026-06-22T13:45:00-05:00')
  },
  {
    title: '¿Messi anota vs Austria?',
    category: 'deportes',
    emoji: '🥅',
    probability: 48,
    closesAt: new Date('2026-06-22T13:45:00-05:00')
  },
  {
    title: '¿Argentina clasifica a los 16avos?',
    category: 'deportes',
    emoji: '🏆',
    probability: 88,
    closesAt: new Date('2026-06-27T17:45:00-05:00')
  },
  {
    title: '¿Colombia clasifica a los 16avos?',
    category: 'deportes',
    emoji: '🇨🇴',
    probability: 62,
    closesAt: new Date('2026-06-27T16:15:00-05:00')
  },
  {
    title: '¿Argentina gana el Mundial 2026?',
    category: 'deportes',
    emoji: '🏆',
    probability: 22,
    closesAt: new Date('2026-07-19T13:59:00-05:00')
  },
  {
    title: '¿Francia llega a la final?',
    category: 'deportes',
    emoji: '🇫🇷',
    probability: 18,
    closesAt: new Date('2026-07-19T13:59:00-05:00')
  },
  {
    title: '¿Brasil sale campeón de su grupo?',
    category: 'deportes',
    emoji: '🇧🇷',
    probability: 65,
    closesAt: new Date('2026-06-25T23:59:00-05:00')
  },
  {
    title: '¿El dólar baja de S/ 3.45 antes de fin de junio?',
    category: 'economia',
    emoji: '💵',
    probability: 65,
    closesAt: new Date('2026-06-30T23:59:00-05:00')
  },
  {
    title: '¿Nuevo gabinete antes de agosto?',
    category: 'politica',
    emoji: '🗳️',
    probability: 35,
    closesAt: new Date('2026-07-31T23:59:00-05:00')
  },
  {
    title: '¿La inflación baja del 3% este trimestre?',
    category: 'economia',
    emoji: '📈',
    probability: 40,
    closesAt: new Date('2026-09-30T23:59:00-05:00')
  },
  {
    title: '¿Bad Bunny anuncia un nuevo concierto en Lima para 2027?',
    category: 'cultura',
    emoji: '🎵',
    probability: 40,
    closesAt: new Date('2026-12-31T23:59:00-05:00')
  },
  {
    title: '¿Magaly saca un ampay esta semana?',
    category: 'cultura',
    emoji: '📺',
    probability: 55,
    closesAt: new Date('2026-06-26T23:59:00-05:00')
  },
  {
    title: '¿Alianza Lima termina primero en la Liga 1?',
    category: 'deportes',
    emoji: '🏆',
    probability: 30,
    closesAt: new Date('2026-11-30T23:59:00-05:00')
  },
  {
    title: '¿Bitcoin llega a $70,000 en junio?',
    category: 'gaming',
    emoji: '₿',
    probability: 38,
    closesAt: new Date('2026-06-30T23:59:00-05:00')
  },
  {
    title: '¿SPCX (SpaceX) cae a $150 o menos este mes?',
    category: 'gaming',
    emoji: '🚀',
    probability: 20,
    closesAt: new Date('2026-06-30T23:59:00-05:00')
  },
  {
    title: '¿Rockstar lanza un nuevo tráiler de GTA VI en julio?',
    category: 'gaming',
    emoji: '🎮',
    probability: 80,
    closesAt: new Date('2026-07-31T23:59:00-05:00')
  },
  {
    title: '¿Diego Flores compra una cajetilla de cigarros en 2026?',
    category: 'cultura',
    emoji: '🚬',
    probability: 50,
    closesAt: new Date('2026-12-31T23:59:00-05:00')
  },
  {
    title: '¿Lucas Cuba se mete al mar en verano 2027?',
    category: 'cultura',
    emoji: '🌊',
    probability: 50,
    closesAt: new Date('2027-03-31T23:59:00-05:00')
  },
  {
    title: '¿Silvia abre El Tambo en verano 2027?',
    category: 'cultura',
    emoji: '🏪',
    probability: 50,
    closesAt: new Date('2027-03-31T23:59:00-05:00')
  }
];

async function main() {
  console.log(`Creando ${mercados.length} mercados...`);

  for (const m of mercados) {
    const created = await prisma.market.create({
      data: {
        title: m.title,
        category: m.category,
        emoji: m.emoji,
        probability: m.probability,
        closesAt: m.closesAt,
        volume: 0,
        resolved: false
      }
    });
    console.log(`✅ Creado: ${created.title}`);
  }

  console.log('🎉 Listo! Todos los mercados fueron creados.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });