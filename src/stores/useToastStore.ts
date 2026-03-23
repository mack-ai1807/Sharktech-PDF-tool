/**
 * useToastStore.ts
 * Lightweight global toast notification system.
 * Use the `toast` helper anywhere: toast.success("Done!"), toast.error("Failed")
 */
import { create } from "zustand";

export interface ToastItem {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface ToastState {
  toasts: ToastItem[];
  add: (type: ToastItem["type"], message: string) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  add: (type, message) => {
    const id = Math.random().toString(36).slice(2, 9);
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      3500
    );
  },
  remove: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Call anywhere — no React hook needed */
export const toast = {
  success: (msg: string) => useToastStore.getState().add("success", msg),
  error:   (msg: string) => useToastStore.getState().add("error", msg),
  info:    (msg: string) => useToastStore.getState().add("info", msg),
};
