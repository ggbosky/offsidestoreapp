import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AppData, Club, CustomLace, EndcapStock, LaceStock, Order, OrderStatus, SalesChannel, Settings } from '../types';
import { createSeedData } from '../data/seed';
import { applyMaterial, DONE_STATUSES } from '../lib/inventory';
import { normalizeText, priceForText } from '../lib/pricing';
import { orderNumber, uid } from '../lib/id';

export const STORAGE_KEY = 'offsidestore-data';

export interface OrderInput {
  customer: string;
  channel: SalesChannel;
  clubId: string | null;
  laceId: string | null;
  customLace?: CustomLace;
  text: string;
  endcapId: string;
  note: string;
  /** Sleva v Kč na kus. */
  discount: number;
  status?: OrderStatus;
}

interface DataActions {
  addOrder: (input: OrderInput) => Order;
  addOrders: (inputs: OrderInput[]) => number;
  updateOrder: (id: string, input: OrderInput) => void;
  setStatus: (id: string, status: OrderStatus) => void;
  deleteOrder: (id: string) => void;

  upsertLace: (lace: LaceStock) => void;
  removeLace: (id: string) => void;
  addLaceStock: (id: string, cm: number) => void;

  setCharQty: (char: string, qty: number) => void;
  addChar: (char: string, qty: number) => void;
  removeChar: (char: string) => void;
  addToAllChars: (n: number) => void;

  upsertEndcap: (e: EndcapStock) => void;
  removeEndcap: (id: string) => void;

  upsertClub: (c: Club) => void;
  removeClub: (id: string) => void;

  updateSettings: (patch: Partial<Settings>) => void;
  replaceAll: (data: AppData) => void;
  resetDemo: () => void;
  markBackup: () => void;
}

export type DataStore = AppData & DataActions;

const now = () => new Date().toISOString();

function pickData(s: DataStore): AppData {
  const { schemaVersion, orders, laces, chars, endcaps, clubs, settings, orderSeq } = s;
  return { schemaVersion, orders, laces, chars, endcaps, clubs, settings, orderSeq };
}

function buildOrderFields(input: OrderInput, s: AppData) {
  const text = normalizeText(input.text).trim();
  const listPrice = priceForText(text, s.settings.pricing);
  const price = Math.max(0, listPrice - Math.max(0, input.discount || 0));
  return {
    customer: input.customer.trim(),
    channel: input.channel,
    clubId: input.clubId,
    laceId: input.laceId,
    customLace: input.laceId ? undefined : input.customLace,
    text,
    endcapId: input.endcapId,
    note: input.note.trim(),
    listPrice,
    price,
  };
}

export const useData = create<DataStore>()(
  persist(
    (set, get) => ({
      ...createSeedData(),

      addOrder: (input) => {
        const s = get();
        const status = input.status ?? 'new';
        const order: Order = {
          id: uid('ord'),
          number: orderNumber(s.orderSeq),
          createdAt: now(),
          updatedAt: now(),
          status: 'new',
          materialDeducted: false,
          ...buildOrderFields(input, s),
        };
        set({ orders: [...s.orders, order], orderSeq: s.orderSeq + 1 });
        if (status !== 'new') get().setStatus(order.id, status);
        return get().orders.find((o) => o.id === order.id)!;
      },

      addOrders: (inputs) => {
        inputs.forEach((i) => get().addOrder(i));
        return inputs.length;
      },

      updateOrder: (id, input) => {
        const s = get();
        const old = s.orders.find((o) => o.id === id);
        if (!old) return;
        const fields = buildOrderFields(input, s);
        let stock: Partial<AppData> = {};
        // Pokud už byl materiál odečten a mění se tkanička/text/koncovky, přepočítat sklad.
        if (old.materialDeducted) {
          const returned = applyMaterial(s, old, +1);
          stock = applyMaterial({ ...s, ...returned }, fields, -1);
        }
        set({
          ...stock,
          orders: s.orders.map((o) => (o.id === id ? { ...o, ...fields, updatedAt: now() } : o)),
        });
        if (input.status && input.status !== old.status) get().setStatus(id, input.status);
      },

      setStatus: (id, status) => {
        const s = get();
        const order = s.orders.find((o) => o.id === id);
        if (!order || order.status === status) return;
        const shouldBeDeducted = DONE_STATUSES.has(status);
        let stock: Partial<AppData> = {};
        if (shouldBeDeducted && !order.materialDeducted) stock = applyMaterial(s, order, -1);
        if (!shouldBeDeducted && order.materialDeducted) stock = applyMaterial(s, order, +1);
        const t = now();
        set({
          ...stock,
          orders: s.orders.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status,
                  materialDeducted: shouldBeDeducted,
                  updatedAt: t,
                  doneAt: shouldBeDeducted ? o.doneAt ?? t : undefined,
                  shippedAt: status === 'shipped' ? t : undefined,
                }
              : o,
          ),
        });
      },

      deleteOrder: (id) => set((s) => ({ orders: s.orders.filter((o) => o.id !== id) })),

      upsertLace: (lace) =>
        set((s) => ({
          laces: s.laces.some((l) => l.id === lace.id) ? s.laces.map((l) => (l.id === lace.id ? lace : l)) : [...s.laces, lace],
        })),
      removeLace: (id) => set((s) => ({ laces: s.laces.filter((l) => l.id !== id) })),
      addLaceStock: (id, cm) =>
        set((s) => ({ laces: s.laces.map((l) => (l.id === id ? { ...l, stockCm: Math.round(l.stockCm + cm) } : l)) })),

      setCharQty: (char, qty) => set((s) => ({ chars: s.chars.map((c) => (c.char === char ? { ...c, qty } : c)) })),
      addChar: (char, qty) =>
        set((s) => {
          const ch = normalizeText(char).trim();
          if (!ch) return {};
          if (s.chars.some((c) => c.char === ch)) return { chars: s.chars.map((c) => (c.char === ch ? { ...c, qty: c.qty + qty } : c)) };
          return { chars: [...s.chars, { char: ch, qty }] };
        }),
      removeChar: (char) => set((s) => ({ chars: s.chars.filter((c) => c.char !== char) })),
      addToAllChars: (n) => set((s) => ({ chars: s.chars.map((c) => ({ ...c, qty: c.qty + n })) })),

      upsertEndcap: (e) =>
        set((s) => ({
          endcaps: s.endcaps.some((x) => x.id === e.id) ? s.endcaps.map((x) => (x.id === e.id ? e : x)) : [...s.endcaps, e],
        })),
      removeEndcap: (id) => set((s) => ({ endcaps: s.endcaps.filter((e) => e.id !== id) })),

      upsertClub: (c) =>
        set((s) => ({ clubs: s.clubs.some((x) => x.id === c.id) ? s.clubs.map((x) => (x.id === c.id ? c : x)) : [...s.clubs, c] })),
      removeClub: (id) => set((s) => ({ clubs: s.clubs.filter((c) => c.id !== id) })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      replaceAll: (data) => set({ ...data }),
      resetDemo: () => {
        const keepSecurity = get().settings;
        const seed = createSeedData();
        set({ ...seed, settings: { ...seed.settings, passwordHash: keepSecurity.passwordHash, accent: keepSecurity.accent } });
      },
      markBackup: () => set((s) => ({ settings: { ...s.settings, lastBackupAt: now() } })),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => pickData(s),
    },
  ),
);

export const getAppData = () => pickData(useData.getState());
