import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  producto_id: number;
  nombre: string;
  precio: number;
  imagen_url: string | null;
  cantidad: number;
  // IDs de ingredientes que el cliente quiere excluir (RN-CR04, RN-CR05)
  personalizacion: number[];
}

interface CartState {
  items: CartItem[];

  // Acciones
  addItem: (item: Omit<CartItem, "cantidad">, cantidad?: number) => void;
  removeItem: (producto_id: number) => void;
  updateCantidad: (producto_id: number, cantidad: number) => void;
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
        const existing = get().items.find(
          (i) => i.producto_id === item.producto_id
        );
        if (existing) {
          // Si ya existe, incrementa la cantidad (RN-CR03)
          set({
            items: get().items.map((i) =>
              i.producto_id === item.producto_id
                ? { ...i, cantidad: i.cantidad + cantidad }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, cantidad }] });
        }
      },

      removeItem: (producto_id) =>
        set({ items: get().items.filter((i) => i.producto_id !== producto_id) }),

      updateCantidad: (producto_id, cantidad) => {
        if (cantidad <= 0) {
          get().removeItem(producto_id);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.producto_id === producto_id ? { ...i, cantidad } : i
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
      name: "food-store-cart",
      // Persistimos los items completos — el carrito sobrevive al cierre del navegador (RN-CR02)
      partialize: (state) => ({ items: state.items }),
    }
  )
);
