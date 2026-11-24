/**
 * Sdílené typy mezi lokálním serverem (server/) a aplikací.
 * Žádné klíče ani tajemství – ty zůstávají v .env na serveru.
 */

export interface IntegrationStatus {
  shopify: { configured: boolean; store: string | null; mode: 'client_credentials' | 'admin_token' | null };
  anthropic: { configured: boolean; model: string };
  gemini: { configured: boolean; model: string };
}

// ───────── Shopify ─────────

export interface ShopifyLineItem {
  title: string;
  quantity: number;
  sku: string | null;
  variantTitle: string | null;
  productHandle: string | null;
  attributes: Array<{ key: string; value: string }>;
}

export interface ShopifyOrder {
  createdAt: string;
  lineItems: ShopifyLineItem[];
}

export interface ShopifyProduct {
  title: string;
  handle: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED' | string;
  imageUrl: string | null;
  url: string | null;
}

export interface ShopifyRepeatCustomer {
  name: string;
  email: string | null;
  city: string | null;
  orders: number;
}

export interface ClubCount {
  clubId: string | null;
  label: string;
  abbr: string;
  count: number;
  /** Kusy v první polovině období (pro trend) */
  firstHalf: number;
  /** Kusy v druhé polovině období */
  secondHalf: number;
}

export interface ShopifySummary {
  fetchedAt: string;
  days: number;
  orders: number;
  bracelets: number;
  customBracelets: number;
  byClub: ClubCount[];
  /** Nápisy z konfigurátoru, které se opakují (≥ 2×) */
  repeatedTexts: Array<{ text: string; count: number }>;
  colors: Array<{ name: string; count: number }>;
  /** Po–Ne */
  byWeekday: number[];
  totalOrdersAllTime: number | null;
  nextMilestone: number | null;
  products: ShopifyProduct[];
  repeatCustomers: ShopifyRepeatCustomer[] | null;
  warnings: string[];
}

// ───────── Trendy ─────────

export interface GoogleTrend {
  title: string;
  traffic: string;
  pubDate: string;
  news: Array<{ title: string; url: string; source: string }>;
}

export type TrendRisk = 'nizke' | 'stredni' | 'vysoke';
export type TrendFormat = 'meme' | 'carousel' | 'reel' | 'story' | 'tiktok' | 'foto';

export interface TrendIdea {
  id: string;
  createdAt: string;
  trend: string;
  whyNow: string;
  sources: Array<{ title: string; url: string }>;
  format: TrendFormat;
  concept: string;
  /** Text na obrázek (meme) – „NAHOŘE / DOLE“ */
  imageText?: string;
  hook: string;
  caption: string;
  hashtags: string;
  /** Prompt pro úpravu fotky (Gemini / Nano Banana) */
  imagePrompt: string;
  /** Kolik dní má trend smysl */
  shelfLifeDays: number;
  risk: TrendRisk;
  riskNote: string;
  clubs: string[];
  status: 'novy' | 'sledovat' | 'pouzito' | 'zahozeno';
}

export interface TrendResearchResult {
  brief: string;
  ideas: Omit<TrendIdea, 'id' | 'createdAt' | 'status'>[];
  sources: Array<{ title: string; url: string }>;
}
