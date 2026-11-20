import type { ShopifySummary, TrendIdea } from './lib/integrations';

// ───────── Kluby a náramky ─────────

export interface Club {
  id: string;
  /** Plný název, např. HC VERVA LITVÍNOV */
  name: string;
  /** Krátký název pro texty, např. Litvínov */
  short: string;
  /** Zkratka na náramku, např. LIT */
  abbr: string;
  /** Výchozí barva tkaničky (hex) */
  laceColor: string;
  hashtag: string;
}

export type BraceletStatus = 'nabidka' | 'napad' | 'limitka' | 'archiv';

export interface Bracelet {
  id: string;
  name: string;
  clubId: string | null;
  letters: string;
  laceColor: string;
  status: BraceletStatus;
  /** Zmenšená fotka (data URL JPEG) */
  photo?: string;
  notes: string;
  createdAt: string;
}

// ───────── Obsah na sítě ─────────

export type Platform = 'ig-post' | 'ig-reel' | 'ig-story' | 'tiktok';
export type ContentStage = 'idea' | 'prep' | 'edit' | 'scheduled' | 'published';
export type ContentPillar = 'produkt' | 'vyroba' | 'fanousci' | 'zapas' | 'spoluprace' | 'soutez' | 'zakulisi';

export interface ShotItem {
  id: string;
  text: string;
  done: boolean;
}

export interface ContentItem {
  id: string;
  title: string;
  stage: ContentStage;
  pillar: ContentPillar;
  platforms: Platform[];
  /** Datum publikace YYYY-MM-DD */
  date: string | null;
  time: string;
  braceletIds: string[];
  contactIds: string[];
  hook: string;
  caption: string;
  hashtags: string;
  shots: ShotItem[];
  notes: string;
  link: string;
  /** Jak to dopadlo – vlastní poznámka (dosah, komentáře, co fungovalo) */
  result: string;
  createdAt: string;
  updatedAt: string;
}

/** Příležitosti v kalendáři – Black Friday, derby, start play-off… */
export interface KeyDate {
  id: string;
  date: string;
  title: string;
  note: string;
}

// ───────── CRM ─────────

export type ContactKind = 'tvurce' | 'fanklub' | 'klub' | 'hrac' | 'obchod' | 'media' | 'ambasador' | 'jiny';
export type CrmStage = 'tip' | 'osloveno' | 'odpoved' | 'jednani' | 'spoluprace' | 'hotovo' | 'nezajem';
export type InteractionType = 'dm' | 'email' | 'telefon' | 'setkani' | 'naramek' | 'prispevek' | 'poznamka';

export interface Interaction {
  id: string;
  date: string;
  type: InteractionType;
  text: string;
}

export interface Contact {
  id: string;
  name: string;
  kind: ContactKind;
  instagram: string;
  tiktok: string;
  email: string;
  phone: string;
  followers: number | null;
  clubIds: string[];
  stage: CrmStage;
  /** Další krok, např. „Poslat náramek SPA“ */
  nextAction: string;
  /** Kdy se ozvat YYYY-MM-DD */
  nextDate: string | null;
  tags: string[];
  notes: string;
  interactions: Interaction[];
  createdAt: string;
  updatedAt: string;
}

// ───────── Aplikace ─────────

export interface Settings {
  passwordHash: string | null;
  autoLockMinutes: number;
  lastBackupAt: string | null;
  basePrice: number;
  includedChars: number;
  extraCharPrice: number;
  maxChars: number;
  /** Automatické hledání trendů při otevření aplikace (stojí kredit Claude API) */
  autoTrends: 'off' | 'daily';
  /** Výchozí zaměření hledání trendů */
  trendFocus: string;
}

export interface TrendBrief {
  text: string;
  sources: Array<{ title: string; url: string }>;
  at: string;
  focus: string;
}

export interface AppData {
  schemaVersion: 2;
  clubs: Club[];
  bracelets: Bracelet[];
  content: ContentItem[];
  keyDates: KeyDate[];
  contacts: Contact[];
  settings: Settings;
  trendIdeas: TrendIdea[];
  trendBrief: TrendBrief | null;
  shopify: ShopifySummary | null;
}
