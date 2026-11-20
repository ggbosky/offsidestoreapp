import { create } from 'zustand';
import type { Bracelet, Contact, ContentItem } from '../types';

export type TabId = 'dashboard' | 'content' | 'crm' | 'bracelets' | 'generator' | 'settings';

/** Stav rozhraní: aktivní záložka a otevřené editory (sdílené napříč stránkami). */
interface UiState {
  tab: TabId;
  setTab: (t: TabId) => void;
  content: ContentItem | null;
  contact: Contact | null;
  bracelet: Bracelet | null;
  openContent: (c: ContentItem | null) => void;
  openContact: (c: Contact | null) => void;
  openBracelet: (b: Bracelet | null) => void;
}

export const useUi = create<UiState>((set) => ({
  tab: 'dashboard',
  setTab: (tab) => set({ tab }),
  content: null,
  contact: null,
  bracelet: null,
  openContent: (content) => set({ content }),
  openContact: (contact) => set({ contact }),
  openBracelet: (bracelet) => set({ bracelet }),
}));
