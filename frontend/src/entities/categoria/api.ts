import api from '@/shared/api/axios';
import type { Categoria } from '@/shared/types';

export const categoriasApi = {
  fetchCategorias: async (): Promise<Categoria[]> => {
    const { data } = await api.get('/categorias');
    return data;
  },

  fetchCategoriaById: async (id: number): Promise<Categoria> => {
    const { data } = await api.get(`/categorias/${id}`);
    return data;
  },

  createCategoria: async (categoria: Partial<Categoria>): Promise<Categoria> => {
    const { data } = await api.post('/categorias', categoria);
    return data;
  },

  updateCategoria: async (id: number, categoria: Partial<Categoria>): Promise<Categoria> => {
    const { data } = await api.put(`/categorias/${id}`, categoria);
    return data;
  },

  deleteCategoria: async (id: number): Promise<void> => {
    await api.delete(`/categorias/${id}`);
  },
};
