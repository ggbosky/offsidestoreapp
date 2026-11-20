import type { AppData } from '../types';
import type { GoogleTrend } from './integrations';
import { summaryForPrompt } from './shopifyStats';
import { addDays, today } from './dates';
import { laceName } from '../config';

export interface TrendRequestBody {
  focus: string;
  today: string;
  clubs: Array<{ name: string; short: string; abbr: string; lace: string }>;
  shopify: string;
  googleTrends: GoogleTrend[];
  recentContent: string[];
  upcoming: string[];
}

/** Sestaví zadání pro hledání trendů – jen souhrny, žádné kontakty ani osobní údaje. */
export function buildTrendRequest(d: Pick<AppData, 'clubs' | 'content' | 'keyDates' | 'shopify'>, focus: string, googleTrends: GoogleTrend[]): TrendRequestBody {
  const t = today();
  return {
    focus: focus.trim(),
    today: t,
    clubs: d.clubs.map((c) => ({ name: c.name, short: c.short, abbr: c.abbr, lace: laceName(c.laceColor).toLowerCase() })),
    shopify: summaryForPrompt(d.shopify),
    googleTrends: googleTrends.slice(0, 20),
    recentContent: d.content
      .filter((c) => !c.date || c.date >= addDays(t, -21))
      .slice(-25)
      .map((c) => c.title)
      .filter(Boolean),
    upcoming: d.keyDates.filter((k) => k.date >= t && k.date <= addDays(t, 30)).map((k) => `${k.date} ${k.title}`),
  };
}
