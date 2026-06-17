import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const MIN_AMOUNT = 10;

// POST /api/positions — Comprar posición
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
        data: { userId, marketId, direction, amount, price, status: 'activo' }
      }),
      // Guarda snapshot de la nueva probabilidad
      tx.probabilitySnapshot.create({
        data: { marketId, probability: newProbability }
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

// PATCH /api/positions — Vender posición
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const { positionId } = await req.json();

  if (!positionId) {
    return NextResponse.json({ error: 'Falta el ID de la posición.' }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const position = await tx.position.findUnique({
      where: { id: positionId },
      include: { market: true }
    });

    if (!position) throw new Error('Posición no encontrada.');
    if (position.userId !== userId) throw new Error('No autorizado.');
    if (position.status !== 'activo') throw new Error('Esta posición ya no está activa.');
    if (position.market.resolved) throw new Error('Este mercado ya fue resuelto.');

    const currentPrice = position.direction === 'si'
      ? position.market.probability / 100
      : (100 - position.market.probability) / 100;

    const payout = Math.round(position.amount * (currentPrice / position.price));

    const shift = Math.min(3, Math.max(1, Math.round(position.amount / 400)));
    let newProbability = position.market.probability + (position.direction === 'si' ? -shift : shift);
    newProbability = Math.min(99, Math.max(1, newProbability));

    const [updatedPosition, updatedUser] = await Promise.all([
      tx.position.update({
        where: { id: positionId },
        data: { status: 'vendido', payout }
      }),
      tx.user.update({
        where: { id: userId },
        data: { diceBalance: { increment: payout } }
      }),
      tx.market.update({
        where: { id: position.market.id },
        data: { probability: newProbability }
      }),
      // Guarda snapshot al vender también
      tx.probabilitySnapshot.create({
        data: { marketId: position.market.id, probability: newProbability }
      })
    ]);

    return { updatedPosition, updatedUser, payout };
  });

  return NextResponse.json({
    diceBalance: result.updatedUser.diceBalance,
    payout: result.payout,
    position: result.updatedPosition
  });
}