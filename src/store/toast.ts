import { create } from 'zustand';

export type ToastKind = 'ok' | 'warn' | 'error' | 'info';
export interface Toast { id: number; kind: ToastKind; text: string }

interface ToastState {
  toasts: Toast[];
  push: (text: string, kind?: ToastKind) => void;
  dismiss: (id: number) => void;
}

let seq = 1;
export const useToast = create<ToastState>((set, get) => ({
  toasts: [],
  push: (text, kind = 'ok') => {
    const id = seq++;
    set({ toasts: [...get().toasts, { id, kind, text }] });
    setTimeout(() => get().dismiss(id), kind === 'error' ? 6000 : 3500);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export const toast = (text: string, kind?: ToastKind) => useToast.getState().push(text, kind);
