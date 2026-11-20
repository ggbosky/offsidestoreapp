/**
 * Centrální konfigurace Offsidestore.
 * Tady se mění heslo, logo a výchozí ceník.
 */

export const BRAND = {
  name: 'OFFSIDESTORE',
  claim: 'Nos svůj klub. Kdekoliv.',
  web: 'offsidestore.cz',
  /**
   * Vlastní logo: nahrajte soubor do složky `public/brand/` (SVG nebo PNG)
   * a nastavte cestu, např. 'brand/logo.svg'.
   * null = použije se vestavěný vektorový placeholder (src/components/Logo.tsx).
   */
  logoSrc: null as string | null,
};

/**
 * Výchozí heslo: "offside2026"
 * Ukládá se pouze jeho SHA-256 hash. Nový hash vygenerujete:
 *   npm run hash-password -- "NoveHeslo"
 * Priorita: heslo změněné v Nastavení > VITE_APP_PASSWORD_HASH (.env) > tento hash.
 */
export const DEFAULT_PASSWORD_HASH =
  '0ebaa2b5cd8300c94b5df9899aac66c0d9e8147c6cf5ad93e53e9be2f92bc621';

export const ENV_PASSWORD_HASH: string | undefined =
  (import.meta.env?.VITE_APP_PASSWORD_HASH as string | undefined) || undefined;

/** Po kolika neúspěšných pokusech se zadávání na chvíli zablokuje. */
export const LOCK_MAX_ATTEMPTS = 5;
export const LOCK_COOLDOWN_SECONDS = 30;

/** Akcentové barvy na výběr (Nastavení → Vzhled). */
export const ACCENT_PRESETS = [
  { name: 'Ledová modrá', hex: '#00B4D8' },
  { name: 'Brankářská červená', hex: '#E63946' },
  { name: 'Neon led', hex: '#4CC9F0' },
  { name: 'Zlatý puk', hex: '#F4B942' },
  { name: 'Mantinel zelená', hex: '#2EC4B6' },
];

export const DEFAULT_ACCENT = '#00B4D8';
