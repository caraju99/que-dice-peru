import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const MIN_AMOUNT = 10;

function calcShift(amount: number, volume: number): number {
  const totalVolume = Math.max(volume + amount, 1);
  const shift = (amount / totalVolume) * 50;
  return Math.min(2, Math.max(0.1, shift));
}

// POST /api/positions — Comprar posición (acumula si ya existe)
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

    const newPrice = direction === 'si' ? market.probability / 100 : (100 - market.probability) / 100;
    const shift = calcShift(amount, market.volume);
    let newProbability = market.probability + (direction === 'si' ? shift : -shift);
    newProbability = Math.min(99, Math.max(1, Math.round(newProbability)));

    // Buscar posición activa existente en mismo mercado y dirección
    const existingPosition = await tx.position.findFirst({
      where: { userId, marketId, direction, status: 'activo' }
    });

    let position;

    if (existingPosition) {
      // Calcular precio promedio ponderado
      const totalAmount = existingPosition.amount + amount;
      const avgPrice = (existingPosition.price * existingPosition.amount + newPrice * amount) / totalAmount;

      position = await tx.position.update({
        where: { id: existingPosition.id },
        data: {
          amount: totalAmount,
          price: avgPrice
        }
      });
    } else {
      // Crear nueva posición
      position = await tx.position.create({
        data: { userId, marketId, direction, amount, price: newPrice, status: 'activo' }
      });
    }

    // Registrar transacción de compra
    await tx.position.create({
      data: {
        userId,
        marketId,
        direction,
        amount,
        price: newPrice,
        status: 'tx_compra',
        parentId: position.id
      }
    });

    const [updatedUser, updatedMarket] = await Promise.all([
      tx.user.update({ where: { id: userId }, data: { diceBalance: user.diceBalance - amount } }),
      tx.market.update({ where: { id: marketId }, data: { probability: newProbability, volume: market.volume + amount } }),
      tx.probabilitySnapshot.create({ data: { marketId, probability: newProbability } })
    ]);

    return { updatedUser, updatedMarket, position };
  });

  return NextResponse.json({
    diceBalance: result.updatedUser.diceBalance,
    market: result.updatedMarket,
    position: result.position
  });
}

// PATCH /api/positions — Cerrar posición (total o parcial)
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const { positionId, sellAmount } = await req.json();

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

    const amountToSell = sellAmount && Number.isInteger(sellAmount) && sellAmount >= MIN_AMOUNT
      ? Math.min(sellAmount, position.amount)
      : position.amount;

    const isPartial = amountToSell < position.amount;
    const remainingAmount = position.amount - amountToSell;

    const currentPrice = position.direction === 'si'
      ? position.market.probability / 100
      : (100 - position.market.probability) / 100;

    const payout = Math.round(amountToSell * (currentPrice / position.price));

    const shift = calcShift(amountToSell, position.market.volume);
    let newProbability = position.market.probability + (position.direction === 'si' ? -shift : shift);
    newProbability = Math.min(99, Math.max(1, Math.round(newProbability)));

    const ops: Promise<any>[] = [
      // Actualizar posición principal
      tx.position.update({
        where: { id: positionId },
        data: {
          amount: isPartial ? remainingAmount : amountToSell,
          status: isPartial ? 'activo' : 'cerrado',
          payout: isPartial ? null : payout
        }
      }),
      // Registrar transacción de venta
      tx.position.create({
        data: {
          userId,
          marketId: position.marketId,
          direction: position.direction,
          amount: amountToSell,
          price: currentPrice,
          status: 'tx_venta',
          payout,
          parentId: positionId
        }
      }),
      // Pagar al usuario
      tx.user.update({
        where: { id: userId },
        data: { diceBalance: { increment: payout } }
      }),
      // Mover mercado
      tx.market.update({
        where: { id: position.market.id },
        data: { probability: newProbability }
      }),
      // Snapshot
      tx.probabilitySnapshot.create({
        data: { marketId: position.market.id, probability: newProbability }
      })
    ];

    const [updatedPosition, , updatedUser] = await Promise.all(ops);

    return { updatedPosition, updatedUser, payout, isPartial, amountToSell, remainingAmount };
  });

  return NextResponse.json({
    diceBalance: result.updatedUser.diceBalance,
    payout: result.payout,
    position: result.updatedPosition,
    isPartial: result.isPartial,
    amountToSell: result.amountToSell,
    remainingAmount: result.remainingAmount
  });
}