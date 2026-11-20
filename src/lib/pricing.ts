/** Normalizace textu náramku: velká písmena, bez nadbytečných mezer. */
export function normalizeText(text: string): string {
  return text.toLocaleUpperCase('cs-CZ').replace(/\s+/g, ' ').trimStart();
}

export function splitChars(text: string): string[] {
  return Array.from(text);
}

/** Počet znaků bez mezer. */
export function countChars(text: string): number {
  return splitChars(text).filter((c) => c.trim() !== '').length;
}

export function priceForText(text: string, s: { basePrice: number; includedChars: number; extraCharPrice: number }): number {
  return s.basePrice + Math.max(0, countChars(text) - s.includedChars) * s.extraCharPrice;
}
