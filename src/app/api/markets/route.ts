import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/markets?category=deportes
// Devuelve los mercados activos
export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get('category');

  const markets = await prisma.market.findMany({
    where: {
      resolved: false,
      ...(category && category !== 'todos' ? { category } : {})
    },
    orderBy: { volume: 'desc' }
  });

  return NextResponse.json({ markets });
}


// POST /api/markets
// Crear nuevo mercado
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const market = await prisma.market.create({
      data: {
        title: body.title,
        category: body.category,
        emoji: body.emoji || null,
        volume: Number(body.volume) || 50,
        closesAt: new Date(body.closesAt)
      }
    });

    return NextResponse.json({ market });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: 'No se pudo crear el mercado' },
      { status: 500 }
    );
  }
}