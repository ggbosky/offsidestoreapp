import type { Club } from '../types';
import type { ClubCount, ShopifyOrder, ShopifySummary } from './integrations';
import { normalizeText } from './pricing';

const SKIP = /p[řr][íi]platek|doprava|shipping|d[áa]rkov[áy] karta|gift/i;
const TEXT_KEY = /zkrat|p[íi]sm|n[áa]pis|text|letters/i;
const CLUB_KEY = /klub|t[ýy]m|club/i;
const COLOR_KEY = /barv|color|colour/i;

export function detectClub(item: { title: string; productHandle: string | null; attributes: Array<{ key: string; value: string }> }, clubs: Club[]): Club | null {
  const attr = item.attributes.find((a) => CLUB_KEY.test(a.key))?.value;
  const hay = [item.title, item.productHandle ?? '', attr ?? ''].join(' ');
  const m = item.title.match(/[–-]\s*([A-ZÁ-Ž]{2,4})\s*$/);
  if (m) {
    const c = clubs.find((k) => k.abbr === m[1]);
    if (c) return c;
  }
  const h = item.productHandle?.match(/-([a-z]{2,4})$/);
  if (h) {
    const c = clubs.find((k) => k.abbr.toLowerCase() === h[1]);
    if (c) return c;
  }
  const low = hay.toLocaleLowerCase('cs');
  return clubs.find((k) => low.includes(k.name.toLocaleLowerCase('cs')) || (attr && attr.toUpperCase().includes(k.abbr))) ?? null;
}

export function nextMilestone(total: number): number {
  const steps = [50, 100, 250, 500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7500, 10000];
  return steps.find((s) => s > total) ?? Math.ceil((total + 1) / 5000) * 5000;
}

/** Spočítá z objednávek, co je dobré vědět pro obsah – kluby, trend, nápisy, barvy, dny. Žádné tržby. */
export function summarizeOrders(
  orders: ShopifyOrder[],
  clubs: Club[],
  opts: { days: number; now?: Date; totalOrdersAllTime?: number | null } ,
): Omit<ShopifySummary, 'products' | 'repeatCustomers' | 'warnings' | 'fetchedAt'> {
  const now = opts.now ?? new Date();
  const mid = now.getTime() - (opts.days * 86_400_000) / 2;
  const byClub = new Map<string, ClubCount>();
  const texts = new Map<string, number>();
  const colors = new Map<string, number>();
  const byWeekday = [0, 0, 0, 0, 0, 0, 0];
  let bracelets = 0;
  let custom = 0;

  for (const o of orders) {
    const t = new Date(o.createdAt);
    const late = t.getTime() >= mid;
    for (const li of o.lineItems) {
      if (SKIP.test(li.title) || (li.productHandle && SKIP.test(li.productHandle))) continue;
      const q = Math.max(0, li.quantity);
      if (!q) continue;
      bracelets += q;
      byWeekday[(t.getDay() + 6) % 7] += q;
      const club = detectClub(li, clubs);
      const key = club?.id ?? '_vlastni';
      const entry = byClub.get(key) ?? { clubId: club?.id ?? null, label: club?.short ?? 'Vlastní / bez klubu', abbr: club?.abbr ?? '—', count: 0, firstHalf: 0, secondHalf: 0 };
      entry.count += q;
      if (late) entry.secondHalf += q;
      else entry.firstHalf += q;
      byClub.set(key, entry);

      const textAttr = li.attributes.find((a) => TEXT_KEY.test(a.key))?.value;
      if (textAttr) {
        custom += q;
        const txt = normalizeText(textAttr).trim();
        if (txt) texts.set(txt, (texts.get(txt) ?? 0) + q);
      }
      const color = li.attributes.find((a) => COLOR_KEY.test(a.key))?.value;
      if (color) colors.set(color.trim(), (colors.get(color.trim()) ?? 0) + q);
    }
  }

  return {
    days: opts.days,
    orders: orders.length,
    bracelets,
    customBracelets: custom,
    byClub: [...byClub.values()].sort((a, b) => b.count - a.count),
    repeatedTexts: [...texts.entries()]
      .filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([text, count]) => ({ text, count })),
    colors: [...colors.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })),
    byWeekday,
    totalOrdersAllTime: opts.totalOrdersAllTime ?? null,
    nextMilestone: opts.totalOrdersAllTime != null ? nextMilestone(opts.totalOrdersAllTime) : null,
  };
}

/** Kluby, kterým rostou prodeje (druhá polovina období vs. první). */
export function risingClubs(s: Pick<ShopifySummary, 'byClub'>, minCount = 3) {
  return s.byClub
    .filter((c) => c.clubId && c.count >= minCount && c.secondHalf > c.firstHalf)
    .map((c) => ({ ...c, growth: c.firstHalf ? Math.round(((c.secondHalf - c.firstHalf) / c.firstHalf) * 100) : 100 }))
    .sort((a, b) => b.growth - a.growth);
}

/** Krátké shrnutí pro AI – jen agregace, žádné osobní údaje. */
export function summaryForPrompt(s: ShopifySummary | null): string {
  if (!s) return 'Data ze Shopify nejsou k dispozici.';
  const days = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
  const best = s.byWeekday.indexOf(Math.max(...s.byWeekday));
  return [
    `Posledních ${s.days} dní: ${s.orders} objednávek, ${s.bracelets} náramků (z toho ${s.customBracelets} s vlastním nápisem).`,
    `Pořadí klubů: ${s.byClub.slice(0, 8).map((c) => `${c.label} ${c.count}`).join(', ')}.`,
    risingClubs(s).length ? `Rostou: ${risingClubs(s).slice(0, 3).map((c) => `${c.label} +${c.growth} %`).join(', ')}.` : '',
    s.repeatedTexts.length ? `Opakované nápisy: ${s.repeatedTexts.slice(0, 6).map((t) => `${t.text} (${t.count}×)`).join(', ')}.` : '',
    s.bracelets ? `Nejsilnější den: ${days[best]}.` : '',
    s.totalOrdersAllTime != null ? `Celkem objednávek: ${s.totalOrdersAllTime}, další milník: ${s.nextMilestone}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export function parseGoogleTrendsRss(xml: string) {
  const items = xml.split('<item>').slice(1);
  const tag = (s: string, t: string) => {
    const m = s.match(new RegExp(`<${t}>([\\s\\S]*?)</${t}>`));
    return m ? decode(m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim()) : '';
  };
  return items.map((raw) => ({
    title: tag(raw, 'title'),
    traffic: tag(raw, 'ht:approx_traffic'),
    pubDate: tag(raw, 'pubDate'),
    news: raw
      .split('<ht:news_item>')
      .slice(1)
      .map((n) => ({ title: tag(n, 'ht:news_item_title'), url: tag(n, 'ht:news_item_url'), source: tag(n, 'ht:news_item_source') }))
      .filter((n) => n.title),
  }));
}

function decode(s: string) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}
