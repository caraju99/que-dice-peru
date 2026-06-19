import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const badges = [
  { code: 'primera_prediccion', name: 'Primera predicción', description: 'Hiciste tu primera predicción', icon: '🎯', reward: 100 },
  { code: 'cinco_predicciones', name: 'Cinco en la mira', description: '5 predicciones realizadas', icon: '🔥', reward: 150 },
  { code: 'diez_predicciones', name: 'Diez seguidas', description: '10 predicciones realizadas', icon: '💪', reward: 250 },
  { code: 'veinticinco_predicciones', name: 'Veinticinco', description: '25 predicciones realizadas', icon: '🏅', reward: 400 },
  { code: 'cincuenta_predicciones', name: 'Cincuenta', description: '50 predicciones realizadas', icon: '👑', reward: 750 },

  { code: 'primer_acierto', name: 'Primer acierto', description: 'Ganaste tu primera predicción', icon: '🎯', reward: 150 },
  { code: 'cinco_aciertos', name: 'Buen ojo', description: '5 predicciones acertadas', icon: '🔮', reward: 250 },
  { code: 'diez_aciertos', name: 'Mente maestra', description: '10 predicciones acertadas', icon: '🧠', reward: 500 },
  { code: 'precision_70', name: 'Francotirador', description: '70% de precisión (mín. 5 predicciones)', icon: '⭐', reward: 500 },
  { code: 'precision_90', name: 'Oráculo del Perú', description: '90% de precisión (mín. 10 predicciones)', icon: '💎', reward: 1000 },

  { code: 'experto_futbol', name: 'Experto en fútbol', description: '3 aciertos en deportes', icon: '⚽', reward: 200 },
  { code: 'politologo', name: 'Politólogo', description: '3 aciertos en política', icon: '🗳️', reward: 200 },
  { code: 'wall_street', name: 'Wall Street', description: '3 aciertos en economía', icon: '💵', reward: 200 },
  { code: 'chismoso_oficial', name: 'Chismoso oficial', description: '3 aciertos en cultura/farándula', icon: '🎭', reward: 200 },

  { code: 'apostador', name: 'Apostador', description: 'Acumulaste 10,000 DICE en apuestas totales', icon: '💰', reward: 300 },
  { code: 'alto_riesgo', name: 'Alto riesgo', description: 'Apostaste 1,000+ DICE en una sola posición', icon: '🎰', reward: 200 },
  { code: 'millonario_dice', name: 'Millonario DICE', description: 'Llegaste a tener 20,000 DICE de saldo', icon: '🏦', reward: 500 },

  { code: 'racha_3', name: 'Racha x3', description: '3 aciertos seguidos', icon: '🔥', reward: 200 },
  { code: 'racha_5', name: 'Racha x5', description: '5 aciertos seguidos', icon: '🔥🔥', reward: 500 },
  { code: 'racha_10', name: 'Racha x10', description: '10 aciertos seguidos', icon: '🔥🔥🔥', reward: 1200 },

  { code: 'embajador', name: 'Embajador', description: 'Compartiste un mercado por WhatsApp', icon: '📲', reward: 100 },
  { code: 'og_dice', name: 'OG de DICE', description: 'Fuiste de los primeros en probar la plataforma', icon: '🥇', reward: 500 }
];

async function main() {
  console.log(`Creando ${badges.length} badges...`);

  for (const b of badges) {
    await prisma.badge.upsert({
      where: { code: b.code },
      update: {
        name: b.name,
        description: b.description,
        icon: b.icon,
        reward: b.reward
      },
      create: b
    });
    console.log(`✅ Creado/actualizado: ${b.name}`);
  }

  console.log('🎉 Listo! Todos los badges fueron creados.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  