import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItemExtra {
  ingrediente_id: number;
  nombre: string;
  precio: number; // precio por unidad
  cantidad: number;
}

export interface CartItem {
  cartKey: string; // producto_id + personalizacion + extras — identifica una configuración única
  producto_id: number;
  nombre: string;
  precio: number; // precio total incluyendo extras
  imagen_url: string | null;
  cantidad: number;
  personalizacion: number[]; // IDs de ingredientes excluidos (RN-CR04, RN-CR05)
  extras: CartItemExtra[];   // ingredientes agregados extra
}

interface CartState {
  items: CartItem[];

  // Acciones
  addItem: (item: Omit<CartItem, "cantidad">, cantidad?: number) => void;
  removeItem: (cartKey: string) => void;
  updateCantidad: (cartKey: string, cantidad: number) => void;
  clearCart: () => void;

  // Selectores — suscribirse por slice para evitar re-renders innecesarios
  itemCount: () => number;
  subtotal: () => number;
  costoEnvio: () => number;
  total: () => number;
}

const COSTO_ENVIO = 50;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, cantidad = 1) => {
        const existing = get().items.find((i) => i.cartKey === item.cartKey);
        if (existing) {
          // Si ya existe la misma configuración, incrementa la cantidad (RN-CR03)
          set({
            items: get().items.map((i) =>
              i.cartKey === item.cartKey
                ? { ...i, cantidad: i.cantidad + cantidad }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, cantidad }] });
        }
      },

      removeItem: (cartKey) =>
        set({ items: get().items.filter((i) => i.cartKey !== cartKey) }),

      updateCantidad: (cartKey, cantidad) => {
        if (cantidad <= 0) {
          get().removeItem(cartKey);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.cartKey === cartKey ? { ...i, cantidad } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      itemCount: () => get().items.reduce((acc, i) => acc + i.cantidad, 0),

      subtotal: () =>
        get().items.reduce((acc, i) => acc + i.precio * i.cantidad, 0),

      costoEnvio: () => (get().items.length > 0 ? COSTO_ENVIO : 0),

      total: () => get().subtotal() + get().costoEnvio(),
    }),
    {
      name: "food-store-cart-v3",
      // Persistimos los items completos — el carrito sobrevive al cierre del navegador (RN-CR02)
      partialize: (state) => ({ items: state.items }),
    }
  )
);
