import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { category } = req.query;

    const markets = await prisma.market.findMany({
      where: {
        resolved: false,
        ...(category && category !== 'todos' ? { category } : {})
      },
      orderBy: { volume: 'desc' }
    });

    return res.status(200).json({ markets });
  }

  if (req.method === 'POST') {
    try {
      const body = req.body;

      const market = await prisma.market.create({
        data: {
          title: body.title,
          category: body.category,
          emoji: body.emoji || null,
          volume: Number(body.volume) || 50,
          closesAt: new Date(body.closesAt)
        }
      });

      return res.status(200).json({ market });
    } catch (error) {
      return res.status(500).json({ error: 'No se pudo crear el mercado' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}