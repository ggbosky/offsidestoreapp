import type { AppData, CharStock, Club, EndcapStock, LaceStock, Order, Settings } from '../types';
import { DEFAULT_ACCENT } from '../config';
import { priceForText } from '../lib/pricing';

/**
 * Barvy klubů jsou orientační – upravíte je ve Skladu (tkaničky) a v Nastavení (kluby).
 */
const CLUB_DEFS: Array<{ id: string; name: string; short: string; colors: string[]; colorName: string; hashtag: string }> = [
  { id: 'litvinov', name: 'Litvínov', short: 'LIT', colors: ['#0B4EA2', '#D7141A'], colorName: 'modrá / červená', hashtag: '#litvinov' },
  { id: 'sparta', name: 'Sparta', short: 'SPA', colors: ['#A6192E', '#0A2240', '#F2C230'], colorName: 'rudá / modrá / žlutá', hashtag: '#sparta' },
  { id: 'pardubice', name: 'Pardubice', short: 'PCE', colors: ['#E30613', '#FFFFFF'], colorName: 'červená / bílá', hashtag: '#pardubice' },
  { id: 'jihlava', name: 'Jihlava', short: 'JIH', colors: ['#FFD100', '#C8102E'], colorName: 'žlutá / červená', hashtag: '#jihlava' },
  { id: 'vsetin', name: 'Vsetín', short: 'VSE', colors: ['#1D3F8F', '#E4002B', '#FFFFFF'], colorName: 'modrá / červená / bílá', hashtag: '#vsetin' },
  { id: 'zlin', name: 'Zlín', short: 'ZLN', colors: ['#003F87', '#FFFFFF'], colorName: 'modrá / bílá', hashtag: '#zlin' },
  { id: 'kometa', name: 'Kometa Brno', short: 'KOM', colors: ['#0033A0', '#FFFFFF'], colorName: 'modrá / bílá', hashtag: '#kometa' },
  { id: 'trencin', name: 'Trenčín', short: 'TRE', colors: ['#C8102E', '#FFCD00'], colorName: 'červená / žlutá', hashtag: '#trencin' },
  { id: 'slovan', name: 'Slovan Bratislava', short: 'SLO', colors: ['#5BA4E6', '#FFFFFF'], colorName: 'světle modrá / bílá', hashtag: '#slovan' },
  { id: 'slavia', name: 'Slavia Praha', short: 'SLA', colors: ['#E30613', '#FFFFFF'], colorName: 'červená / bílá', hashtag: '#slavia' },
  { id: 'kladno', name: 'Kladno', short: 'KLA', colors: ['#003C8F', '#FFFFFF', '#E4002B'], colorName: 'modrá / bílá / červená', hashtag: '#kladno' },
  { id: 'trinec', name: 'Třinec', short: 'TRI', colors: ['#D71920', '#FFFFFF', '#0A2240'], colorName: 'červená / bílá / modrá', hashtag: '#trinec' },
];

/** Výchozí zásoby (cm) – některé schválně nízko, aby bylo vidět upozornění. */
const CLUB_STOCK_CM: Record<string, number> = {
  litvinov: 1500, sparta: 1080, pardubice: 1260, jihlava: 720, vsetin: 540, zlin: 630,
  kometa: 1350, trencin: 180, slovan: 450, slavia: 900, kladno: 270, trinec: 810,
};

const GENERIC_LACES: Array<Pick<LaceStock, 'id' | 'name' | 'colors' | 'stockCm'>> = [
  { id: 'lace-cerna', name: 'Černá', colors: ['#16181C'], stockCm: 1800 },
  { id: 'lace-bila', name: 'Bílá', colors: ['#F2F3F5'], stockCm: 1440 },
  { id: 'lace-cerno-bila', name: 'Černo-bílá', colors: ['#16181C', '#F2F3F5'], stockCm: 900 },
  { id: 'lace-ledova', name: 'Ledově modrá', colors: ['#00B4D8', '#CAF0F8'], stockCm: 630 },
  { id: 'lace-neon', name: 'Neon žlutá', colors: ['#E8FF3A'], stockCm: 360 },
];

const CM_PER_BRACELET = 90;

export const DEFAULT_SETTINGS: Settings = {
  pricing: { basePrice: 290, includedChars: 3, extraCharPrice: 12, maxChars: 12 },
  costs: { lacePerBracelet: 28, charEach: 3, endcapEach: 6, packaging: 14 },
  endcapsPerBracelet: 2,
  charMinQty: 5,
  accent: DEFAULT_ACCENT,
  passwordHash: null,
  autoLockMinutes: 15,
  lastBackupAt: null,
};

function buildLaces(): LaceStock[] {
  const club = CLUB_DEFS.map<LaceStock>((c) => ({
    id: `lace-${c.id}`,
    name: `${c.name} (${c.colorName})`,
    colors: c.colors,
    stockCm: CLUB_STOCK_CM[c.id] ?? 900,
    cmPerBracelet: CM_PER_BRACELET,
    minBracelets: 5,
  }));
  const generic = GENERIC_LACES.map<LaceStock>((g) => ({ ...g, cmPerBracelet: CM_PER_BRACELET, minBracelets: 4 }));
  return [...club, ...generic];
}

function buildClubs(): Club[] {
  return CLUB_DEFS.map((c) => ({ id: c.id, name: c.name, short: c.short, laceId: `lace-${c.id}`, hashtag: c.hashtag }));
}

function buildChars(): CharStock[] {
  const low: Record<string, number> = { Q: 2, X: 3, W: 4, '★': 4, Y: 6 };
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const digits = '0123456789'.split('');
  const symbols = ['♥', '★', '#', '-', '.', '&'];
  const vowelsBoost = new Set(['A', 'E', 'I', 'O', 'S', 'T', 'N', 'R', 'L', 'K']);
  return [...letters, ...digits, ...symbols].map((char) => ({
    char,
    qty: low[char] ?? (vowelsBoost.has(char) ? 40 : /\d/.test(char) ? 30 : 20),
  }));
}

function buildEndcaps(): EndcapStock[] {
  return [
    { id: 'endcap-silver', name: 'Stříbrné (nerez)', finish: 'silver', qty: 120, minQty: 20 },
    { id: 'endcap-black', name: 'Černé matné', finish: 'black', qty: 34, minQty: 10 },
    { id: 'endcap-gold', name: 'Zlaté', finish: 'gold', qty: 8, minQty: 10 },
  ];
}

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 3600_000).toISOString();
}

function demoOrders(settings: Settings): Order[] {
  const mk = (o: Omit<Order, 'listPrice' | 'price' | 'updatedAt'>): Order => {
    const listPrice = priceForText(o.text, settings.pricing);
    return { ...o, listPrice, price: listPrice, updatedAt: o.createdAt };
  };
  const year = new Date().getFullYear();
  return [
    mk({
      id: 'demo-1', number: `OS-${year}-0001`, createdAt: hoursAgo(30), customer: 'Petr Novák', channel: 'instagram',
      clubId: 'litvinov', laceId: 'lace-litvinov', text: 'LVT 1945', endcapId: 'endcap-silver',
      note: 'Dárek k narozeninám – přibalit kartičku „Vše nejlepší“.', status: 'braiding', materialDeducted: false,
    }),
    mk({
      id: 'demo-2', number: `OS-${year}-0002`, createdAt: hoursAgo(20), customer: 'Lucie Dvořáková', channel: 'web',
      clubId: 'kometa', laceId: 'lace-kometa', text: 'KOMETA', endcapId: 'endcap-black',
      note: '', status: 'new', materialDeducted: false,
    }),
    mk({
      id: 'demo-3', number: `OS-${year}-0003`, createdAt: hoursAgo(4), customer: 'Tomáš Horák', channel: 'tiktok',
      clubId: null, laceId: 'lace-cerno-bila', text: '#88 ♥', endcapId: 'endcap-gold',
      note: 'Vlastní barva – černo-bílá, zlaté koncovky. Mezera mezi číslem a srdcem.', status: 'new', materialDeducted: false,
    }),
  ];
}

export function createSeedData(opts: { empty?: boolean } = {}): AppData {
  const settings = { ...DEFAULT_SETTINGS, pricing: { ...DEFAULT_SETTINGS.pricing }, costs: { ...DEFAULT_SETTINGS.costs } };
  return {
    schemaVersion: 1,
    orders: opts.empty ? [] : demoOrders(settings),
    laces: buildLaces(),
    chars: buildChars(),
    endcaps: buildEndcaps(),
    clubs: buildClubs(),
    settings,
    orderSeq: opts.empty ? 1 : 4,
  };
}
