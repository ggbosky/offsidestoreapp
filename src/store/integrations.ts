import { create } from 'zustand';
import type { GoogleTrend, IntegrationStatus } from '../lib/integrations';
import { api } from '../lib/api';

/** Stav propojení (Shopify, Claude, Gemini) a živé Google Trends – jen v paměti. */
interface IntegrationsState {
  status: IntegrationStatus | null;
  serverError: string | null;
  google: GoogleTrend[];
  googleAt: number;
  googleError: string | null;
  loadStatus: () => Promise<void>;
  loadGoogle: (force?: boolean) => Promise<void>;
}

export const useIntegrations = create<IntegrationsState>((set, get) => ({
  status: null,
  serverError: null,
  google: [],
  googleAt: 0,
  googleError: null,
  loadStatus: async () => {
    try {
      set({ status: await api.status(), serverError: null });
    } catch (e) {
      set({ status: null, serverError: (e as Error).message });
    }
  },
  loadGoogle: async (force = false) => {
    if (!force && Date.now() - get().googleAt < 20 * 60_000 && get().google.length) return;
    try {
      set({ google: await api.googleTrends('CZ'), googleAt: Date.now(), googleError: null });
    } catch (e) {
      set({ googleError: (e as Error).message });
    }
  },
}));
