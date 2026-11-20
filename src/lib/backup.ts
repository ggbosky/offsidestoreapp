import type { AppData } from '../types';
import { createSeedData } from '../data/seed';

export const BACKUP_KIND = 'offsidestore-backup';

export interface BackupFile {
  kind: typeof BACKUP_KIND;
  exportedAt: string;
  app: string;
  data: AppData;
}

export function createBackup(data: AppData, now = new Date()): BackupFile {
  return { kind: BACKUP_KIND, exportedAt: now.toISOString(), app: 'Offsidestore Výroba 1.0', data };
}

export function backupFileName(now = new Date()): string {
  const d = now.toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
  return `offsidestore-zaloha_${d}.json`;
}

export function downloadJson(obj: unknown, fileName: string) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Ověří a „doplní“ data ze zálohy. Přijímá jak celý soubor zálohy, tak holá data.
 * Chybějící sekce doplní z výchozích hodnot, aby import nikdy nerozbil aplikaci.
 */
export function parseBackup(raw: string): AppData {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error('Soubor není platný JSON.');
  }
  const obj = json as Partial<BackupFile> & Partial<AppData>;
  const data = (obj.kind === BACKUP_KIND ? obj.data : obj) as Partial<AppData> | undefined;
  if (!data || typeof data !== 'object') throw new Error('Soubor neobsahuje data Offsidestore.');
  if (!Array.isArray(data.orders) || !Array.isArray(data.laces)) {
    throw new Error('V záloze chybí objednávky nebo sklad – nejde o zálohu Offsidestore.');
  }
  const base = createSeedData({ empty: true });
  return {
    schemaVersion: 1,
    orders: data.orders,
    laces: data.laces,
    chars: Array.isArray(data.chars) ? data.chars : base.chars,
    endcaps: Array.isArray(data.endcaps) ? data.endcaps : base.endcaps,
    clubs: Array.isArray(data.clubs) ? data.clubs : base.clubs,
    settings: {
      ...base.settings,
      ...(data.settings ?? {}),
      pricing: { ...base.settings.pricing, ...(data.settings?.pricing ?? {}) },
      costs: { ...base.settings.costs, ...(data.settings?.costs ?? {}) },
    },
    orderSeq: typeof data.orderSeq === 'number' ? data.orderSeq : data.orders.length + 1,
  };
}
