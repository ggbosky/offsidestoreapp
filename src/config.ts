/**
 * Centrální konfigurace Offsidestore – barvy webu offsidestore.cz, heslo, logo.
 */

export const BRAND = {
  name: 'OFFSIDESTORE',
  claim: 'Nos svůj klub. Kdekoliv.',
  web: 'offsidestore.cz',
  /** Červená z tlačítek webu offsidestore.cz */
  red: '#EC0016',
  redDeep: '#B01E28',
  burgundy: '#340A0E',
  /**
   * Vlastní logo jako soubor: nahrajte do public/brand/ a nastavte např. 'brand/logo.svg'.
   * null = vestavěný vektorový znak (svislá offside čára + dva puky).
   */
  logoSrc: null as string | null,
};

/**
 * Stažení desktopové aplikace pro Windows (tlačítko na úvodní obrazovce webové verze).
 * Odkazuje na konkrétní, už prověřené sestavení – antiviry (Avast…) hodnotí každý soubor zvlášť,
 * takže nové sestavení by se kontrolovalo znovu. Po vydání nové verze stačí změnit tag zde.
 */
export const DOWNLOAD = {
  releaseTag: 'studio-2',
  repo: 'ggbosky/offsidestoreapp',
  get installer() {
    return `https://github.com/${this.repo}/releases/download/${this.releaseTag}/Offsidestore-Studio-Instalace.zip`;
  },
  get portable() {
    return `https://github.com/${this.repo}/releases/download/${this.releaseTag}/Offsidestore-Studio-Windows.zip`;
  },
  get page() {
    return `https://github.com/${this.repo}/releases/tag/${this.releaseTag}`;
  },
};

/** Běží uvnitř desktopové aplikace (Electron servíruje z 127.0.0.1:43117)? */
export const IS_DESKTOP_APP = typeof location !== 'undefined' && location.port === '43117';

/** Barvy tkaniček z konfigurátoru na offsidestore.cz */
export const LACE_COLORS: Array<{ hex: string; name: string }> = [
  { hex: '#B01E28', name: 'Červená' },
  { hex: '#0B4EA2', name: 'Modrá' },
  { hex: '#3FA9E0', name: 'Světle modrá' },
  { hex: '#0F9D4F', name: 'Zelená' },
  { hex: '#111111', name: 'Černá' },
  { hex: '#F2C300', name: 'Žlutá' },
  { hex: '#FF6B00', name: 'Oranžová' },
  { hex: '#C0C0C0', name: 'Stříbrná' },
  { hex: '#7A4A2B', name: 'Hnědá' },
  { hex: '#FFFFFF', name: 'Bílá' },
];

export const laceName = (hex: string) =>
  LACE_COLORS.find((c) => c.hex.toLowerCase() === hex.toLowerCase())?.name ?? hex.toUpperCase();

/**
 * Výchozí heslo: "offside2026" – ukládá se jen SHA-256 hash.
 * Nový hash:  npm run hash-password -- "NoveHeslo"
 * Priorita: heslo změněné v Nastavení > VITE_APP_PASSWORD_HASH (.env) > tento hash.
 */
export const DEFAULT_PASSWORD_HASH = '0ebaa2b5cd8300c94b5df9899aac66c0d9e8147c6cf5ad93e53e9be2f92bc621';

export const ENV_PASSWORD_HASH: string | undefined =
  (import.meta.env?.VITE_APP_PASSWORD_HASH as string | undefined) || undefined;

export const LOCK_MAX_ATTEMPTS = 5;
export const LOCK_COOLDOWN_SECONDS = 30;
