import { create } from "zustand";

// Estado del proceso de pago con MercadoPago.
// NO persiste en localStorage — es estado de sesión efímero.
export type PaymentStatus =
  | "idle"
  | "processing"
  | "approved"
  | "rejected"
  | "pending"
  | "error";

interface PaymentState {
  status: PaymentStatus;
  mpPaymentId: number | null;
  statusDetail: string | null;

  setPaymentStatus: (
    status: PaymentStatus,
    mpPaymentId?: number | null,
    statusDetail?: string | null
  ) => void;
  reset: () => void;
}

export const usePaymentStore = create<PaymentState>()((set) => ({
  status: "idle",
  mpPaymentId: null,
  statusDetail: null,

  setPaymentStatus: (status, mpPaymentId = null, statusDetail = null) =>
    set({ status, mpPaymentId, statusDetail }),

  reset: () => set({ status: "idle", mpPaymentId: null, statusDetail: null }),
}));
