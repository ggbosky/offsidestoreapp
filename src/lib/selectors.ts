import type { AppData, Contact, ContentItem } from '../types';
import { addDays, today } from './dates';

/** Obsah, který měl vyjít a ještě není publikovaný. */
export function overdueContent(content: ContentItem[], t = today()): ContentItem[] {
  return content.filter((c) => c.date && c.date < t && c.stage !== 'published').sort((a, b) => a.date!.localeCompare(b.date!));
}

export function upcomingContent(content: ContentItem[], days = 7, t = today()): ContentItem[] {
  const end = addDays(t, days);
  return content
    .filter((c) => c.date && c.date >= t && c.date <= end && c.stage !== 'published')
    .sort((a, b) => (a.date! + a.time).localeCompare(b.date! + b.time));
}

/** Kontakty, kterým se mám ozvat (do N dní, včetně zpožděných). */
export function dueFollowUps(contacts: Contact[], days = 3, t = today()): Contact[] {
  const end = addDays(t, days);
  return contacts
    .filter((c) => c.nextDate && c.nextDate <= end && c.stage !== 'hotovo' && c.stage !== 'nezajem')
    .sort((a, b) => a.nextDate!.localeCompare(b.nextDate!));
}

export function attentionCount(d: Pick<AppData, 'content' | 'contacts'>, t = today()) {
  return {
    content: overdueContent(d.content, t).length + d.content.filter((c) => c.date === t && c.stage !== 'published').length,
    contacts: d.contacts.filter((c) => c.nextDate && c.nextDate <= t && c.stage !== 'hotovo' && c.stage !== 'nezajem').length,
  };
}

/** Rozložení publikovaného obsahu podle pilířů za posledních N dní. */
export function pillarMix(content: ContentItem[], days = 30, t = today()) {
  const from = addDays(t, -days);
  const mix: Record<string, number> = {};
  for (const c of content) {
    if (!c.date || c.date < from || c.date > addDays(t, days)) continue;
    mix[c.pillar] = (mix[c.pillar] ?? 0) + 1;
  }
  return mix;
}
