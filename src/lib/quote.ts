import type { Settings } from '../types';
import { applyDiscount, countChars, priceForChars } from './pricing';
import { materialCostPerBracelet } from './inventory';

export interface QuoteLine {
  text: string;
  chars: number;
  listPrice: number;
  price: number;
  cost: number;
  valid: boolean;
}

export interface Quote {
  pieces: number;
  subtotal: number;
  discountAmount: number;
  total: number;
  cost: number;
  margin: number;
  marginPct: number;
  perPiece: number;
}

function summarize(subtotal: number, total: number, cost: number, pieces: number): Quote {
  const margin = total - cost;
  return {
    pieces,
    subtotal,
    discountAmount: subtotal - total,
    total,
    cost,
    margin,
    marginPct: total > 0 ? (margin / total) * 100 : 0,
    perPiece: pieces > 0 ? total / pieces : 0,
  };
}

/** Rychlá kalkulace: N kusů se stejným počtem znaků. */
export function quoteUniform(pieces: number, chars: number, discount: number, mode: 'pct' | 'czk', s: Settings): Quote {
  const n = Math.max(0, Math.floor(pieces));
  const subtotal = priceForChars(chars, s.pricing) * n;
  const total = applyDiscount(subtotal, discount, mode);
  const cost = materialCostPerBracelet(chars, s) * n;
  return summarize(subtotal, total, cost, n);
}

/** Týmová objednávka: každý řádek = jeden náramek; sleva v %. */
export function quoteLines(texts: string[], discountPct: number, s: Settings): { lines: QuoteLine[]; quote: Quote } {
  const lines = texts.map<QuoteLine>((text) => {
    const chars = countChars(text);
    const listPrice = priceForChars(chars, s.pricing);
    return {
      text,
      chars,
      listPrice,
      price: applyDiscount(listPrice, discountPct, 'pct'),
      cost: materialCostPerBracelet(chars, s),
      valid: chars >= 1 && chars <= s.pricing.maxChars,
    };
  });
  const ok = lines.filter((l) => l.valid);
  const quote = summarize(
    ok.reduce((a, l) => a + l.listPrice, 0),
    ok.reduce((a, l) => a + l.price, 0),
    ok.reduce((a, l) => a + l.cost, 0),
    ok.length,
  );
  return { lines, quote };
}

/** Doporučená množstevní sleva (jen návrh, dá se přepsat). */
export function suggestedDiscountPct(pieces: number): number {
  if (pieces >= 30) return 20;
  if (pieces >= 20) return 15;
  if (pieces >= 10) return 10;
  if (pieces >= 5) return 5;
  return 0;
}
