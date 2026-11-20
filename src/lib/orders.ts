import type { AppData, Order, OrderStatus, SalesChannel } from '../types';

export const STATUS_ORDER: OrderStatus[] = ['new', 'braiding', 'ready', 'shipped'];

export const STATUS_META: Record<OrderStatus, { label: string; short: string; cls: string; dot: string }> = {
  new: { label: 'Nová', short: 'Nová', cls: 'bg-accent/15 text-accent border-accent/30', dot: 'bg-accent' },
  braiding: { label: 'V pletení', short: 'Pletu', cls: 'bg-warn/15 text-warn border-warn/30', dot: 'bg-warn' },
  ready: { label: 'Hotovo k odeslání', short: 'Hotovo', cls: 'bg-ok/15 text-ok border-ok/30', dot: 'bg-ok' },
  shipped: { label: 'Odesláno', short: 'Odesláno', cls: 'bg-white/5 text-ink-muted border-white/10', dot: 'bg-ink-faint' },
};

export const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  new: { status: 'braiding', label: 'Začít plést' },
  braiding: { status: 'ready', label: 'Hotovo' },
  ready: { status: 'shipped', label: 'Odesláno' },
};

export const CHANNELS: Record<SalesChannel, string> = {
  web: 'E-shop',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  osobne: 'Osobně',
  jine: 'Jiné',
};

export interface ResolvedLace {
  key: string;
  name: string;
  colors: string[];
  inStock: boolean;
}

export function resolveLace(order: Pick<Order, 'laceId' | 'customLace'>, data: Pick<AppData, 'laces'>): ResolvedLace {
  if (order.laceId) {
    const l = data.laces.find((x) => x.id === order.laceId);
    if (l) return { key: l.id, name: l.name, colors: l.colors, inStock: true };
    return { key: order.laceId, name: 'Neznámá tkanička', colors: ['#6B7380'], inStock: false };
  }
  const c = order.customLace ?? { name: 'Vlastní barva', colors: ['#6B7380'] };
  return { key: `custom:${c.name}:${c.colors.join('')}`, name: `${c.name} (mimo sklad)`, colors: c.colors, inStock: false };
}

export function clubName(order: Pick<Order, 'clubId'>, data: Pick<AppData, 'clubs'>): string | null {
  return order.clubId ? data.clubs.find((c) => c.id === order.clubId)?.name ?? null : null;
}

const dt = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });
export const formatDate = (iso: string) => dt.format(new Date(iso));

/** Řazení pro frontu: rozpletené nahoru, pak nejstarší. */
export function queueSort(a: Order, b: Order): number {
  const RANK: Record<OrderStatus, number> = { braiding: 0, new: 1, ready: 2, shipped: 3 };
  const rank = (o: Order) => RANK[o.status];
  return rank(a) - rank(b) || a.createdAt.localeCompare(b.createdAt);
}
