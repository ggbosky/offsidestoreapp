import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AppData, Bracelet, Club, Contact, ContentItem, ContentStage, CrmStage, Interaction, KeyDate, Settings, TrendBrief } from '../types';
import type { ShopifySummary, TrendIdea } from '../lib/integrations';
import { createSeedData, purgeDemo } from '../data/seed';
import { uid } from '../lib/id';
import { today } from '../lib/dates';

export const STORAGE_KEY = 'offsidestore-crm';

const now = () => new Date().toISOString();

export function newContent(patch: Partial<ContentItem> = {}): ContentItem {
  return {
    id: uid('c'),
    title: '',
    stage: 'idea',
    pillar: 'produkt',
    platforms: ['ig-post'],
    date: null,
    time: '18:00',
    braceletIds: [],
    contactIds: [],
    hook: '',
    caption: '',
    hashtags: '',
    shots: [],
    notes: '',
    link: '',
    result: '',
    createdAt: now(),
    updatedAt: now(),
    ...patch,
  };
}

export function newContact(patch: Partial<Contact> = {}): Contact {
  return {
    id: uid('k'),
    name: '',
    kind: 'tvurce',
    instagram: '',
    tiktok: '',
    email: '',
    phone: '',
    followers: null,
    clubIds: [],
    stage: 'tip',
    nextAction: '',
    nextDate: null,
    tags: [],
    notes: '',
    interactions: [],
    createdAt: now(),
    updatedAt: now(),
    ...patch,
  };
}

export function newBracelet(patch: Partial<Bracelet> = {}): Bracelet {
  return { id: uid('b'), name: '', clubId: null, letters: '', laceColor: '#B01E28', status: 'napad', notes: '', createdAt: now(), ...patch };
}

interface Actions {
  saveContent: (c: ContentItem) => void;
  setContentStage: (id: string, stage: ContentStage) => void;
  deleteContent: (id: string) => void;

  saveContact: (c: Contact) => void;
  setContactStage: (id: string, stage: CrmStage) => void;
  logInteraction: (id: string, i: Omit<Interaction, 'id'>, next?: { nextAction: string; nextDate: string | null }) => void;
  deleteContact: (id: string) => void;

  saveBracelet: (b: Bracelet) => void;
  deleteBracelet: (id: string) => void;

  saveClub: (c: Club) => void;
  deleteClub: (id: string) => void;

  saveKeyDate: (k: KeyDate) => void;
  deleteKeyDate: (id: string) => void;

  setShopify: (s: ShopifySummary | null) => void;
  addTrendResults: (brief: TrendBrief, ideas: TrendIdea[]) => void;
  setTrendStatus: (id: string, status: TrendIdea['status']) => void;
  clearDismissedTrends: () => void;

  updateSettings: (patch: Partial<Settings>) => void;
  replaceAll: (data: AppData) => void;
  resetDemo: () => void;
  markBackup: () => void;
}

export type DataStore = AppData & Actions;

const upsert = <T extends { id: string }>(list: T[], item: T): T[] =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];

export function pickData(s: AppData): AppData {
  const { schemaVersion, clubs, bracelets, content, keyDates, contacts, settings, trendIdeas, trendBrief, shopify } = s;
  return { schemaVersion, clubs, bracelets, content, keyDates, contacts, settings, trendIdeas, trendBrief, shopify };
}

export const useData = create<DataStore>()(
  persist(
    (set, get) => ({
      ...createSeedData(),

      saveContent: (c) => set((s) => ({ content: upsert(s.content, { ...c, updatedAt: now() }) })),
      setContentStage: (id, stage) =>
        set((s) => ({
          content: s.content.map((c) =>
            c.id === id ? { ...c, stage, date: stage === 'published' && !c.date ? today() : c.date, updatedAt: now() } : c,
          ),
        })),
      deleteContent: (id) => set((s) => ({ content: s.content.filter((c) => c.id !== id) })),

      saveContact: (c) => set((s) => ({ contacts: upsert(s.contacts, { ...c, updatedAt: now() }) })),
      setContactStage: (id, stage) => set((s) => ({ contacts: s.contacts.map((c) => (c.id === id ? { ...c, stage, updatedAt: now() } : c)) })),
      logInteraction: (id, i, next) =>
        set((s) => ({
          contacts: s.contacts.map((c) =>
            c.id === id
              ? {
                  ...c,
                  interactions: [{ ...i, id: uid('i') }, ...c.interactions],
                  ...(next ?? {}),
                  stage: c.stage === 'tip' && i.type !== 'poznamka' ? 'osloveno' : c.stage,
                  updatedAt: now(),
                }
              : c,
          ),
        })),
      deleteContact: (id) =>
        set((s) => ({
          contacts: s.contacts.filter((c) => c.id !== id),
          content: s.content.map((c) => ({ ...c, contactIds: c.contactIds.filter((x) => x !== id) })),
        })),

      saveBracelet: (b) => set((s) => ({ bracelets: upsert(s.bracelets, b) })),
      deleteBracelet: (id) =>
        set((s) => ({
          bracelets: s.bracelets.filter((b) => b.id !== id),
          content: s.content.map((c) => ({ ...c, braceletIds: c.braceletIds.filter((x) => x !== id) })),
        })),

      saveClub: (c) => set((s) => ({ clubs: upsert(s.clubs, c) })),
      deleteClub: (id) => set((s) => ({ clubs: s.clubs.filter((c) => c.id !== id) })),

      saveKeyDate: (k) => set((s) => ({ keyDates: upsert(s.keyDates, k).sort((a, b) => a.date.localeCompare(b.date)) })),
      deleteKeyDate: (id) => set((s) => ({ keyDates: s.keyDates.filter((k) => k.id !== id) })),

      setShopify: (shopify) => set({ shopify }),
      addTrendResults: (trendBrief, ideas) =>
        set((s) => ({ trendBrief, trendIdeas: [...ideas, ...s.trendIdeas.filter((i) => i.status !== 'novy' || Date.now() - Date.parse(i.createdAt) < 3 * 86_400_000)].slice(0, 120) })),
      setTrendStatus: (id, status) => set((s) => ({ trendIdeas: s.trendIdeas.map((i) => (i.id === id ? { ...i, status } : i)) })),
      clearDismissedTrends: () => set((s) => ({ trendIdeas: s.trendIdeas.filter((i) => i.status !== 'zahozeno') })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      replaceAll: (data) => set({ ...data }),
      resetDemo: () => {
        const keep = get().settings;
        const seed = createSeedData({ demo: true });
        set({ ...seed, settings: { ...seed.settings, passwordHash: keep.passwordHash, autoLockMinutes: keep.autoLockMinutes } });
      },
      markBackup: () => set((s) => ({ settings: { ...s.settings, lastBackupAt: now() } })),
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => pickData(s),
      // starší uložená data doplní o nové sekce a nastavení
      merge: (persisted, current) => {
        let p = (persisted ?? {}) as Partial<AppData>;
        // Starší verze začínala s ukázkovými kontakty a obsahem – jednorázově je odstraníme.
        if (p.settings && !('demoPurged' in p.settings)) {
          p = { ...p, ...purgeDemo({ content: p.content ?? [], contacts: p.contacts ?? [], bracelets: p.bracelets ?? current.bracelets }) };
        }
        return { ...current, ...p, settings: { ...current.settings, ...(p.settings ?? {}), demoPurged: true } };
      },
      // po načtení hned uložit (aby se případné smazání ukázek propsalo do úložiště)
      onRehydrateStorage: () => (state) => {
        if (state) queueMicrotask(() => state.updateSettings({}));
      },
    },
  ),
);

export const getAppData = () => pickData(useData.getState());
