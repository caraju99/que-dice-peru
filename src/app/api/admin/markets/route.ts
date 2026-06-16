import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
  return user?.isAdmin ? user : null;
}

// GET /api/admin/markets — lista todos los mercados (incluye resueltos)
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });

  const markets = await prisma.market.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ markets });
}

// POST /api/admin/markets — crea un nuevo mercado
// body: { title, category, emoji?, probability?, closesAt }
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });

  const body = await req.json();
  const { title, category, emoji, probability, closesAt } = body;

  if (!title || !category || !closesAt) {
    return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 });
  }

  const market = await prisma.market.create({
    data: {
      title,
      category,
      emoji: emoji || null,
      probability: probability ?? 50,
      closesAt: new Date(closesAt)
    }
  });

  return NextResponse.json({ market });
}
