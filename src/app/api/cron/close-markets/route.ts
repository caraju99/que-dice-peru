import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Este endpoint lo ejecuta Vercel Cron cada hora automáticamente.
// Cierra los mercados cuya fecha de cierre ya pasó.
export async function GET() {
  try {
    const now = new Date();

    // Busca mercados activos que ya vencieron
    const expiredMarkets = await prisma.market.findMany({
      where: {
        resolved: false,
        closesAt: { lte: now }
      }
    });

    if (expiredMarkets.length === 0) {
      return NextResponse.json({ message: 'No hay mercados vencidos.', closed: 0 });
    }

    // Los marca como cerrados (pendientes de resolución)
    await prisma.market.updateMany({
      where: {
        id: { in: expiredMarkets.map((m) => m.id) }
      },
      data: {
        resolved: true,
        outcome: null // Sin resultado aún — el admin lo pone manualmente
      }
    });

    console.log(`Cerrados ${expiredMarkets.length} mercados vencidos.`);

    return NextResponse.json({
      message: `${expiredMarkets.length} mercados cerrados automáticamente.`,
      closed: expiredMarkets.length,
      markets: expiredMarkets.map((m) => ({ id: m.id, title: m.title }))
    });

  } catch (error) {
    console.error('Error en cron:', error);
    return NextResponse.json({ error: 'Error al cerrar mercados.' }, { status: 500 });
  }
}
