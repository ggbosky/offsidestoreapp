/** Práce s daty ve formátu YYYY-MM-DD (lokální čas). */

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const today = () => toISODate(new Date());

export function addDays(iso: string, days: number): string {
  const d = fromISO(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Rozdíl ve dnech (b - a). */
export function diffDays(a: string, b: string): number {
  return Math.round((fromISO(b).getTime() - fromISO(a).getTime()) / 86_400_000);
}

/** Pondělí týdne, ve kterém je datum. */
export function startOfWeek(iso: string): string {
  const d = fromISO(iso);
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return toISODate(d);
}

const DOW = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
const MONTHS = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'];

export const dowShort = (iso: string) => DOW[fromISO(iso).getDay()];
export const monthName = (m: number) => MONTHS[m];

export function formatShort(iso: string): string {
  const d = fromISO(iso);
  return `${DOW[d.getDay()]} ${d.getDate()}. ${d.getMonth() + 1}.`;
}

/** „dnes“, „zítra“, „za 3 dny“, „před 2 dny“ */
export function relative(iso: string, base = today()): string {
  const n = diffDays(base, iso);
  if (n === 0) return 'dnes';
  if (n === 1) return 'zítra';
  if (n === -1) return 'včera';
  if (n > 1) return n < 5 ? `za ${n} dny` : `za ${n} dní`;
  const k = -n;
  return k < 5 ? `před ${k} dny` : `před ${k} dny`;
}
