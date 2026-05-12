import { create } from "zustand";

// Estado de UI — sin persistencia, se resetea al recargar.
interface ConfirmModal {
  open: boolean;
  message: string;
  onConfirm: (() => void) | null;
}

interface UIState {
  cartOpen: boolean;
  sidebarOpen: boolean;
  confirmModal: ConfirmModal;

  openCart: () => void;
  closeCart: () => void;
  toggleSidebar: () => void;
  openConfirmModal: (message: string, onConfirm: () => void) => void;
  closeConfirmModal: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  cartOpen: false,
  sidebarOpen: false,
  confirmModal: { open: false, message: "", onConfirm: null },

  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  openConfirmModal: (message, onConfirm) =>
    set({ confirmModal: { open: true, message, onConfirm } }),

  closeConfirmModal: () =>
    set({ confirmModal: { open: false, message: "", onConfirm: null } }),
}));
