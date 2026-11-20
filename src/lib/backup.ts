import type { AppData } from '../types';
import { createSeedData } from '../data/seed';

export const BACKUP_KIND = 'offsidestore-crm-backup';

export interface BackupFile {
  kind: typeof BACKUP_KIND;
  exportedAt: string;
  app: string;
  data: AppData;
}

export function createBackup(data: AppData, now = new Date()): BackupFile {
  return { kind: BACKUP_KIND, exportedAt: now.toISOString(), app: 'Offsidestore Studio 2.0', data };
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

/** Ověří zálohu a doplní chybějící sekce výchozími hodnotami. */
export function parseBackup(raw: string): AppData {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error('Soubor není platný JSON.');
  }
  const obj = json as Partial<BackupFile> & Partial<AppData>;
  const data = (obj.kind === BACKUP_KIND ? obj.data : obj) as Partial<AppData> | undefined;
  if (!data || typeof data !== 'object' || (!Array.isArray(data.content) && !Array.isArray(data.contacts))) {
    throw new Error('Tohle není záloha Offsidestore Studia (chybí obsah i kontakty).');
  }
  const base = createSeedData({ empty: true });
  const arr = <T,>(v: T[] | undefined, fb: T[]) => (Array.isArray(v) ? v : fb);
  return {
    schemaVersion: 2,
    clubs: arr(data.clubs, base.clubs),
    bracelets: arr(data.bracelets, base.bracelets),
    content: arr(data.content, []),
    keyDates: arr(data.keyDates, base.keyDates),
    contacts: arr(data.contacts, []),
    settings: { ...base.settings, ...(data.settings ?? {}) },
  };
}
