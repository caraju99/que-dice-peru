import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { outcome } = await req.json();

    const market = await prisma.market.findUnique({
      where: { id: params.id },
      include: { positions: true }
    });

    if (!market) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.market.update({
        where: { id: params.id },
        data: {
          resolved: true,
          outcome
        }
      });

      for (const position of market.positions) {
        const won = position.direction === outcome;
        const payout = won ? Math.round(position.amount / position.price) : 0;

        await tx.position.update({
          where: { id: position.id },
          data: {
            status: won ? 'ganado' : 'perdido',
            payout
          }
        });

        if (won) {
          await tx.user.update({
            where: { id: position.userId },
            data: {
              diceBalance: { increment: payout }
            }
          });
        }
      }
    });

    return NextResponse.json({ success: true });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  await prisma.market.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}