import { create } from 'zustand';

/**
 * Stav odemčení je ZÁMĚRNĚ jen v paměti – po obnovení stránky nebo zavření okna
 * se aplikace vždy znovu zamkne.
 */
interface LockState {
  unlocked: boolean;
  unlock: () => void;
  lock: () => void;
}

export const useLock = create<LockState>((set) => ({
  unlocked: false,
  unlock: () => set({ unlocked: true }),
  lock: () => set({ unlocked: false }),
}));
