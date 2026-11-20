import type { Bracelet, Club, Contact } from '../types';
import type { ShopifyProduct, ShopifyRepeatCustomer, ShopifySummary } from './integrations';
import { newBracelet, newContact } from '../store/data';
import { risingClubs } from './shopifyStats';
import { today } from './dates';

const STATUS: Record<string, Bracelet['status']> = { ACTIVE: 'nabidka', DRAFT: 'napad', ARCHIVED: 'archiv' };

/** Produkty ze Shopify → knihovna náramků (fotka, stav). Klubové náramky se spárují podle zkratky. */
export function syncBraceletsFromProducts(products: ShopifyProduct[], bracelets: Bracelet[], clubs: Club[]) {
  let updated = 0;
  let added = 0;
  const out = [...bracelets];
  for (const p of products) {
    if (!/n[áa]ramek/i.test(p.title) || /konfigura/i.test(p.handle)) continue;
    const abbr = p.title.match(/[–-]\s*([A-ZÁ-Ž]{2,4})\s*$/)?.[1] ?? p.handle.match(/-([a-z]{2,4})$/)?.[1]?.toUpperCase();
    const club = clubs.find((c) => c.abbr === abbr);
    const idx = out.findIndex((b) => (club && b.clubId === club.id) || b.name === p.title);
    const patch = { photo: p.imageUrl ?? undefined, status: STATUS[p.status] ?? 'nabidka' };
    if (idx >= 0) {
      out[idx] = { ...out[idx], ...patch, photo: patch.photo ?? out[idx].photo };
      updated++;
    } else {
      out.push(newBracelet({ name: p.title.replace(/^N[áa]ramek\s*/i, ''), clubId: club?.id ?? null, letters: abbr ?? '', laceColor: club?.laceColor ?? '#B01E28', ...patch }));
      added++;
    }
  }
  return { bracelets: out, updated, added };
}

/** Stálí zákazníci ze Shopify → kontakty (ambasadoři). Duplicitní e-maily přeskočí. */
export function importRepeatCustomers(customers: ShopifyRepeatCustomer[], contacts: Contact[]): Contact[] {
  const known = new Set(contacts.map((c) => c.email.toLowerCase()).filter(Boolean));
  return customers
    .filter((c) => !c.email || !known.has(c.email.toLowerCase()))
    .map((c) =>
      newContact({
        name: c.name || c.email || 'Zákazník',
        kind: 'ambasador',
        email: c.email ?? '',
        stage: 'tip',
        tags: ['shopify', 'stálý zákazník'],
        nextAction: 'Poděkovat a nabídnout repost / slevu pro kamaráda',
        notes: `Ze Shopify: ${c.orders} objednávek${c.city ? `, ${c.city}` : ''}. Před zveřejněním čehokoliv se zeptat na souhlas.`,
        interactions: [{ id: `shp-${Date.now()}`, date: today(), type: 'poznamka', text: `Importováno ze Shopify (${c.orders} objednávek).` }],
      }),
    );
}

export interface DataTip {
  id: string;
  title: string;
  text: string;
  contentTitle: string;
}

/** Nápady na obsah přímo z čísel (bez AI). */
export function tipsFromShopify(s: ShopifySummary): DataTip[] {
  const tips: DataTip[] = [];
  for (const c of risingClubs(s).slice(0, 2)) {
    tips.push({
      id: `rise-${c.abbr}`,
      title: `${c.label} roste +${c.growth} %`,
      text: `Fanoušci ${c.label} teď kupují víc. Dej jim příspěvek s ${c.abbr} – ideálně k nejbližšímu zápasu.`,
      contentTitle: `${c.abbr} – fanoušci ${c.label} jedou`,
    });
  }
  if (s.totalOrdersAllTime != null && s.nextMilestone) {
    const left = s.nextMilestone - s.totalOrdersAllTime;
    if (left <= Math.max(25, s.nextMilestone * 0.1)) {
      tips.push({
        id: 'milestone',
        title: `Do ${s.nextMilestone}. objednávky chybí ${left}`,
        text: 'Milník = skvělý důvod na oslavný post nebo giveaway pro toho, kdo objedná jubilejní kus.',
        contentTitle: `Milník: ${s.nextMilestone}. objednávka`,
      });
    }
  }
  const top = s.repeatedTexts[0];
  if (top) {
    tips.push({
      id: `text-${top.text}`,
      title: `Nejčastější vlastní nápis: ${top.text} (${top.count}×)`,
      text: 'Ukaž ho v příspěvku „co si nejčastěji necháváte vyplést“. Konkrétní zákazníky jen se souhlasem.',
      contentTitle: `Váš nejoblíbenější nápis: ${top.text}`,
    });
  }
  if (s.bracelets > 0) {
    const days = ['pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota', 'neděle'];
    const best = s.byWeekday.indexOf(Math.max(...s.byWeekday));
    tips.push({
      id: 'weekday',
      title: `Nejvíc objednávek: ${days[best]}`,
      text: `Produktové příspěvky plánuj na den předem (${days[(best + 6) % 7]} večer), ať jsou v kurzu, když lidi nakupují.`,
      contentTitle: '',
    });
  }
  return tips;
}
