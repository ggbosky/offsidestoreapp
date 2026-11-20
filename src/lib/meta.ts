import type { BraceletStatus, ContactKind, ContentPillar, ContentStage, CrmStage, InteractionType, Platform } from '../types';

export const CONTENT_STAGES: Array<{ id: ContentStage; label: string; hint: string }> = [
  { id: 'idea', label: 'Nápad', hint: 'Zásobník nápadů' },
  { id: 'prep', label: 'Natočit / nafotit', hint: 'Co je potřeba nafotit' },
  { id: 'edit', label: 'Střih a text', hint: 'Úprava, popisek' },
  { id: 'scheduled', label: 'Naplánováno', hint: 'Má datum, čeká na publikaci' },
  { id: 'published', label: 'Publikováno', hint: 'Venku – zapiš, jak to dopadlo' },
];

export const STAGE_DOT: Record<ContentStage, string> = {
  idea: 'bg-ink-faint',
  prep: 'bg-sky',
  edit: 'bg-warn',
  scheduled: 'bg-brand',
  published: 'bg-ok',
};

export const PLATFORMS: Record<Platform, { label: string; short: string }> = {
  'ig-post': { label: 'IG příspěvek', short: 'IG' },
  'ig-reel': { label: 'IG Reels', short: 'Reel' },
  'ig-story': { label: 'IG Story', short: 'Story' },
  tiktok: { label: 'TikTok', short: 'TT' },
};

export const PILLARS: Record<ContentPillar, { label: string; color: string; hint: string }> = {
  produkt: { label: 'Produkt', color: '#EC0016', hint: 'Detail náramku, nový klub, barva' },
  vyroba: { label: 'Výroba', color: '#F2C300', hint: 'Pletení, timelapse, dílna' },
  fanousci: { label: 'Fanoušci', color: '#3FA9E0', hint: 'Fotky zákazníků, repost, komunita' },
  zapas: { label: 'Zápas', color: '#0F9D4F', hint: 'Zápasový den, derby, play-off' },
  spoluprace: { label: 'Spolupráce', color: '#FF6B00', hint: 'Tvůrci, hráči, fankluby' },
  soutez: { label: 'Soutěž', color: '#C0C0C0', hint: 'Giveaway, anketa' },
  zakulisi: { label: 'Zákulisí', color: '#7A4A2B', hint: 'Příběh značky, balení' },
};

export const CRM_STAGES: Array<{ id: CrmStage; label: string; cls: string }> = [
  { id: 'tip', label: 'Tip', cls: 'border-line-2 text-muted' },
  { id: 'osloveno', label: 'Osloveno', cls: 'border-sky/40 text-sky' },
  { id: 'odpoved', label: 'Odpověděl/a', cls: 'border-warn/40 text-warn' },
  { id: 'jednani', label: 'Domlouváme', cls: 'border-orange/50 text-orange' },
  { id: 'spoluprace', label: 'Spolupráce běží', cls: 'border-brand/60 text-brand' },
  { id: 'hotovo', label: 'Hotovo', cls: 'border-ok/40 text-ok' },
  { id: 'nezajem', label: 'Nezájem', cls: 'border-line text-faint' },
];

export const crmStage = (id: CrmStage) => CRM_STAGES.find((s) => s.id === id)!;

export const CONTACT_KINDS: Record<ContactKind, string> = {
  tvurce: 'Tvůrce / influencer',
  fanklub: 'Fanklub / fanoušci',
  klub: 'Klub',
  hrac: 'Hráč / hráčka',
  obchod: 'Fanshop / obchod',
  media: 'Média / podcast',
  ambasador: 'Ambasador / věrný zákazník',
  jiny: 'Jiný',
};

export const INTERACTIONS: Record<InteractionType, string> = {
  dm: 'Zpráva (DM)',
  email: 'E-mail',
  telefon: 'Telefon',
  setkani: 'Setkání',
  naramek: 'Poslán náramek',
  prispevek: 'Příspěvek / zmínka',
  poznamka: 'Poznámka',
};

export const BRACELET_STATUS: Record<BraceletStatus, { label: string; cls: string }> = {
  nabidka: { label: 'V nabídce', cls: 'bg-ok/15 text-ok' },
  napad: { label: 'Nápad', cls: 'bg-white/10 text-muted' },
  limitka: { label: 'Limitka', cls: 'bg-brand/15 text-brand' },
  archiv: { label: 'Archiv', cls: 'bg-white/5 text-faint' },
};

export function formatFollowers(n: number | null): string {
  if (!n) return '';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace('.', ',')} tis.`;
  return String(n);
}
