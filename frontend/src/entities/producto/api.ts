import api from '@/shared/api/axios';
import type { Producto, PaginatedResponse } from '@/shared/types';

interface FetchProductosParams {
  page?: number;
  size?: number;
  categoria_id?: number;
  search?: string;
  precio_min?: number;
  precio_max?: number;
  disponible?: boolean;
  incluir_eliminados?: boolean;
  excluir_alergenos?: number[];
}

export const productosApi = {
  fetchProductos: async (params: FetchProductosParams = {}): Promise<PaginatedResponse<Producto>> => {
    const { data } = await api.get('/productos', { params });
    return data;
  },

  fetchProductoById: async (id: number): Promise<Producto> => {
    const { data } = await api.get(`/productos/${id}`);
    return data;
  },

  createProducto: async (producto: Partial<Producto>): Promise<Producto> => {
    const { data } = await api.post('/productos', producto);
    return data;
  },

  updateProducto: async (id: number, producto: Partial<Producto>): Promise<Producto> => {
    const { data } = await api.put(`/productos/${id}`, producto);
    return data;
  },

  deleteProducto: async (id: number): Promise<void> => {
    await api.delete(`/productos/${id}`);
  },

  updateStock: async (id: number, cantidad: number): Promise<Producto> => {
    const { data } = await api.patch(`/productos/${id}/stock`, { cantidad });
    return data;
  },

  assignCategorias: async (id: number, categoria_ids: number[]): Promise<Producto> => {
    const { data } = await api.put(`/productos/${id}/categorias`, { categoria_ids });
    return data;
  },

  toggleDisponibilidad: async (id: number, disponible: boolean): Promise<Producto> => {
    const { data } = await api.patch(`/productos/${id}/disponibilidad`, { disponible });
    return data;
  },

  addIngrediente: async (
    producto_id: number,
    ingrediente_id: number,
    es_removible = true
  ): Promise<void> => {
    await api.post(`/productos/${producto_id}/ingredientes`, { ingrediente_id, es_removible });
  },

  removeIngrediente: async (producto_id: number, ingrediente_id: number): Promise<void> => {
    await api.delete(`/productos/${producto_id}/ingredientes/${ingrediente_id}`);
  },
};
