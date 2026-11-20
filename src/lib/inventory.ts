import type { AppData, CharStock, EndcapStock, LaceStock, Order, Settings } from '../types';
import { splitChars } from './pricing';

export const DONE_STATUSES = new Set(['ready', 'shipped']);
export const OPEN_STATUSES = new Set(['new', 'braiding']);

export function braceletsPossible(lace: LaceStock): number {
  if (lace.cmPerBracelet <= 0) return 0;
  return Math.floor(lace.stockCm / lace.cmPerBracelet);
}

export interface MaterialNeed {
  laceId: string | null;
  laceCm: number;
  chars: Record<string, number>;
  endcapId: string;
  endcaps: number;
}

export function materialForOrder(order: Pick<Order, 'laceId' | 'text' | 'endcapId'>, data: Pick<AppData, 'laces' | 'settings'>): MaterialNeed {
  const lace = order.laceId ? data.laces.find((l) => l.id === order.laceId) : undefined;
  const chars: Record<string, number> = {};
  for (const c of splitChars(order.text)) {
    if (c.trim() === '') continue;
    chars[c] = (chars[c] ?? 0) + 1;
  }
  return {
    laceId: lace ? lace.id : null,
    laceCm: lace ? lace.cmPerBracelet : 0,
    chars,
    endcapId: order.endcapId,
    endcaps: data.settings.endcapsPerBracelet,
  };
}

/**
 * Odečte (direction = -1) nebo vrátí (direction = +1) materiál na sklad.
 * Zásoby mohou jít do mínusu – je to vidět jako chybějící materiál.
 */
export function applyMaterial(
  data: Pick<AppData, 'laces' | 'chars' | 'endcaps' | 'settings'>,
  order: Pick<Order, 'laceId' | 'text' | 'endcapId'>,
  direction: -1 | 1,
): { laces: LaceStock[]; chars: CharStock[]; endcaps: EndcapStock[] } {
  const need = materialForOrder(order, data);
  const laces = data.laces.map((l) =>
    l.id === need.laceId ? { ...l, stockCm: l.stockCm + direction * need.laceCm } : l,
  );
  const chars = data.chars.map((c) =>
    need.chars[c.char] ? { ...c, qty: c.qty + direction * need.chars[c.char] } : c,
  );
  for (const [char, n] of Object.entries(need.chars)) {
    if (!chars.some((c) => c.char === char)) chars.push({ char, qty: direction * n });
  }
  const endcaps = data.endcaps.map((e) =>
    e.id === need.endcapId ? { ...e, qty: e.qty + direction * need.endcaps } : e,
  );
  return { laces, chars, endcaps };
}

export interface StockAlert {
  kind: 'lace' | 'char' | 'endcap';
  id: string;
  label: string;
  current: number;
  limit: number;
  unit: string;
}

export function stockAlerts(data: Pick<AppData, 'laces' | 'chars' | 'endcaps' | 'settings'>): StockAlert[] {
  const alerts: StockAlert[] = [];
  for (const l of data.laces) {
    const n = braceletsPossible(l);
    if (n < l.minBracelets) alerts.push({ kind: 'lace', id: l.id, label: l.name, current: n, limit: l.minBracelets, unit: 'náramků' });
  }
  for (const c of data.chars) {
    if (c.qty < data.settings.charMinQty) alerts.push({ kind: 'char', id: c.char, label: `Znak „${c.char}“`, current: c.qty, limit: data.settings.charMinQty, unit: 'ks' });
  }
  for (const e of data.endcaps) {
    if (e.qty < e.minQty) alerts.push({ kind: 'endcap', id: e.id, label: e.name, current: e.qty, limit: e.minQty, unit: 'ks' });
  }
  return alerts;
}

/** Kolik materiálu spotřebují všechny otevřené objednávky (Nová + V pletení). */
export function queueDemand(data: Pick<AppData, 'orders' | 'laces' | 'settings'>) {
  const laceBracelets: Record<string, number> = {};
  const chars: Record<string, number> = {};
  const endcaps: Record<string, number> = {};
  for (const o of data.orders) {
    if (!OPEN_STATUSES.has(o.status)) continue;
    const need = materialForOrder(o, data);
    if (need.laceId) laceBracelets[need.laceId] = (laceBracelets[need.laceId] ?? 0) + 1;
    for (const [c, n] of Object.entries(need.chars)) chars[c] = (chars[c] ?? 0) + n;
    endcaps[need.endcapId] = (endcaps[need.endcapId] ?? 0) + need.endcaps;
  }
  return { laceBracelets, chars, endcaps };
}

/** Znaky z textu, které na skladě nejsou v dostatečném množství. */
export function missingChars(text: string, chars: CharStock[]): string[] {
  const need: Record<string, number> = {};
  for (const c of splitChars(text)) if (c.trim() !== '') need[c] = (need[c] ?? 0) + 1;
  return Object.entries(need)
    .filter(([c, n]) => (chars.find((s) => s.char === c)?.qty ?? 0) < n)
    .map(([c]) => c);
}

export function materialCostPerBracelet(chars: number, s: Settings): number {
  const c = s.costs;
  return c.lacePerBracelet + chars * c.charEach + s.endcapsPerBracelet * c.endcapEach + c.packaging;
}
