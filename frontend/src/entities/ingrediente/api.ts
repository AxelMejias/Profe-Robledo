import api from '@/shared/api/axios';
import type { Ingrediente } from '@/shared/types';

export interface IngredienteCreate {
  nombre: string;
  descripcion?: string;
  es_alergeno: boolean;
  unidad_medida?: string;
  precio?: number;
  tipo_extra?: string;
  disponible_como_extra?: boolean;
}

export interface IngredienteUpdate {
  nombre?: string;
  descripcion?: string;
  es_alergeno?: boolean;
  unidad_medida?: string;
  precio?: number;
  tipo_extra?: string;
  disponible_como_extra?: boolean;
}

export const ingredientesApi = {
  fetchIngredientes: async (): Promise<Ingrediente[]> => {
    const { data } = await api.get('/ingredientes');
    return data;
  },

  fetchIngredienteById: async (id: number): Promise<Ingrediente> => {
    const { data } = await api.get(`/ingredientes/${id}`);
    return data;
  },

  createIngrediente: async (body: IngredienteCreate): Promise<Ingrediente> => {
    const { data } = await api.post('/ingredientes', body);
    return data;
  },

  updateIngrediente: async (id: number, body: IngredienteUpdate): Promise<Ingrediente> => {
    const { data } = await api.put(`/ingredientes/${id}`, body);
    return data;
  },

  deleteIngrediente: async (id: number): Promise<void> => {
    await api.delete(`/ingredientes/${id}`);
  },
};
