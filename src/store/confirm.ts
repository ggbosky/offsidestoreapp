import { create } from 'zustand';

/**
 * Vlastní potvrzovací dialog místo window.confirm()
 * (funguje stejně v prohlížeči, Electronu, Tauri i v náhledu na claude.ai).
 */
interface ConfirmState {
  message: string | null;
  resolve: ((ok: boolean) => void) | null;
  close: (ok: boolean) => void;
}

export const useConfirm = create<ConfirmState>((set, get) => ({
  message: null,
  resolve: null,
  close: (ok) => {
    get().resolve?.(ok);
    set({ message: null, resolve: null });
  },
}));

export function askConfirm(message: string): Promise<boolean> {
  useConfirm.getState().resolve?.(false);
  return new Promise((resolve) => useConfirm.setState({ message, resolve }));
}
