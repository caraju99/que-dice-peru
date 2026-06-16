import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const MIN_AMOUNT = 10;

// POST /api/positions
// body: { marketId: string, direction: "si" | "no", amount: number }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Debes iniciar sesión para predecir.' }, { status: 401 });
  }

  const body = await req.json();
  const { marketId, direction, amount } = body as {
    marketId: string;
    direction: 'si' | 'no';
    amount: number;
  };

  if (!marketId || (direction !== 'si' && direction !== 'no')) {
    return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });
  }

  if (!Number.isInteger(amount) || amount < MIN_AMOUNT) {
    return NextResponse.json({ error: `El mínimo es ${MIN_AMOUNT} DICE Coins.` }, { status: 400 });
  }

  const userId = (session.user as any).id as string;

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    const market = await tx.market.findUnique({ where: { id: marketId } });

    if (!user) throw new Error('Usuario no encontrado.');
    if (!market || market.resolved) throw new Error('Este mercado ya no está disponible.');
    if (user.diceBalance < amount) throw new Error('No tienes suficientes DICE Coins.');

    const price = direction === 'si' ? market.probability / 100 : (100 - market.probability) / 100;

    // Mueve la probabilidad del mercado: comprar SÍ la sube, comprar NO la baja.
    // Movimiento simple proporcional al tamaño de la apuesta (máx. 5 puntos).
    const shift = Math.min(5, Math.max(1, Math.round(amount / 200)));
    let newProbability = market.probability + (direction === 'si' ? shift : -shift);
    newProbability = Math.min(99, Math.max(1, newProbability));

    const [updatedUser, updatedMarket, position] = await Promise.all([
      tx.user.update({
        where: { id: userId },
        data: { diceBalance: user.diceBalance - amount }
      }),
      tx.market.update({
        where: { id: marketId },
        data: { probability: newProbability, volume: market.volume + amount }
      }),
      tx.position.create({
        data: {
          userId,
          marketId,
          direction,
          amount,
          price,
          status: 'activo'
        }
      })
    ]);

    return { updatedUser, updatedMarket, position };
  });

  return NextResponse.json({
    diceBalance: result.updatedUser.diceBalance,
    market: result.updatedMarket,
    position: result.position
  });
}
