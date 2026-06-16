import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id }
  });

  return user?.isAdmin ? user : null;
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }

  const body = await req.json();
  const { outcome } = body;

  if (outcome !== 'si' && outcome !== 'no') {
    return NextResponse.json(
      { error: 'El resultado debe ser "si" o "no".' },
      { status: 400 }
    );
  }

  const market = await prisma.market.findUnique({
    where: { id: params.id },
    include: { positions: true }
  });

  if (!market) {
    return NextResponse.json({ error: 'Mercado no encontrado.' }, { status: 404 });
  }

  if (market.resolved) {
    return NextResponse.json({ error: 'Ya fue resuelto.' }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.market.update({
      where: { id: market.id },
      data: {
        resolved: true,
        outcome,
        probability: outcome === 'si' ? 100 : 0
      }
    });

    for (const position of market.positions) {
      if (position.status !== 'activo') continue;

      const won = position.direction === outcome;
      const payout = won ? Math.round(position.amount / position.price) : 0;

      await tx.position.update({
        where: { id: position.id },
        data: {
          status: won ? 'ganado' : 'perdido',
          payout
        }
      });

      if (won && payout > 0) {
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
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }

  await prisma.market.delete({
    where: { id: params.id }
  });

  return NextResponse.json({ success: true });
}