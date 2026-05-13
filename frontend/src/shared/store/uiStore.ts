import { create } from "zustand";

// Estado de UI — sin persistencia, se resetea al recargar.
interface ConfirmModal {
  open: boolean;
  message: string;
  onConfirm: (() => void) | null;
}

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface UIState {
  cartOpen: boolean;
  sidebarOpen: boolean;
  confirmModal: ConfirmModal;
  toasts: Toast[];

  openCart: () => void;
  closeCart: () => void;
  toggleSidebar: () => void;
  openConfirmModal: (message: string, onConfirm: () => void) => void;
  closeConfirmModal: () => void;
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>()((set, get) => ({
  cartOpen: false,
  sidebarOpen: false,
  confirmModal: { open: false, message: "", onConfirm: null },
  toasts: [],

  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  openConfirmModal: (message, onConfirm) =>
    set({ confirmModal: { open: true, message, onConfirm } }),

  closeConfirmModal: () =>
    set({ confirmModal: { open: false, message: "", onConfirm: null } }),

  addToast: (type, message) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    set({ toasts: [...get().toasts, { id, type, message }] });
    // Auto-dismiss después de 5s
    setTimeout(() => get().removeToast(id), 5000);
  },

  removeToast: (id) =>
    set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));
