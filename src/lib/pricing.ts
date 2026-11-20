import type { PricingSettings } from '../types';

/** Normalizace textu náramku: velká písmena, bez nadbytečných mezer. */
export function normalizeText(text: string): string {
  return text.toLocaleUpperCase('cs-CZ').replace(/\s+/g, ' ').trimStart();
}

/** Rozloží text na jednotlivé znaky (správně i pro ♥, ★ apod.). */
export function splitChars(text: string): string[] {
  return Array.from(text);
}

/** Počet placených znaků = všechno kromě mezer. */
export function countChars(text: string): number {
  return splitChars(text).filter((c) => c.trim() !== '').length;
}

/** Cena za kus: základ (do N znaků) + příplatek za každý další znak. */
export function priceForChars(chars: number, p: PricingSettings): number {
  const extra = Math.max(0, chars - p.includedChars);
  return p.basePrice + extra * p.extraCharPrice;
}

export function priceForText(text: string, p: PricingSettings): number {
  return priceForChars(countChars(text), p);
}

export type TextValidation = { ok: true } | { ok: false; message: string };

export function validateText(text: string, p: PricingSettings): TextValidation {
  const n = countChars(text);
  if (n < 1) return { ok: false, message: 'Zadejte alespoň 1 znak.' };
  if (n > p.maxChars) return { ok: false, message: `Maximum je ${p.maxChars} znaků (máte ${n}).` };
  return { ok: true };
}

export function applyDiscount(amount: number, discount: number, mode: 'pct' | 'czk'): number {
  if (mode === 'pct') return Math.max(0, Math.round(amount * (1 - Math.min(100, Math.max(0, discount)) / 100)));
  return Math.max(0, Math.round(amount - Math.max(0, discount)));
}

const czk = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 });
export const formatCzk = (n: number) => czk.format(Math.round(n));

const pct = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 1 });
export const formatPct = (n: number) => `${pct.format(n)} %`;
