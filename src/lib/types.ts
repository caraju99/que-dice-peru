export const CATEGORIES = ['deportes', 'politica', 'economia', 'cultura', 'gaming'] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<string, string> = {
  deportes: 'Deportes',
  politica: 'Política',
  economia: 'Economía',
  cultura: 'Cultura',
  gaming: 'Gaming / Tecnología'
};

export type MarketDTO = {
  id: string;
  title: string;
  category: string;
  emoji: string | null;
  probability: number;
  volume: number;
  closesAt: string;
  resolved: boolean;
  outcome: string | null;
};

export type PositionDTO = {
  id: string;
  marketId: string;
  marketTitle: string;
  direction: 'si' | 'no';
  amount: number;
  price: number;
  status: string;
  payout: number | null;
  probability: number;
};
