import api from '@/shared/api/axios';
import type { DireccionEntrega } from '@/shared/types';

export const direccionesApi = {
  fetchDirecciones: async (): Promise<DireccionEntrega[]> => {
    const { data } = await api.get('/direcciones');
    return data;
  },

  createDireccion: async (direccion: Partial<DireccionEntrega>): Promise<DireccionEntrega> => {
    const { data } = await api.post('/direcciones', direccion);
    return data;
  },

  updateDireccion: async (id: number, direccion: Partial<DireccionEntrega>): Promise<DireccionEntrega> => {
    const { data } = await api.put(`/direcciones/${id}`, direccion);
    return data;
  },

  deleteDireccion: async (id: number): Promise<void> => {
    await api.delete(`/direcciones/${id}`);
  },

  marcarPrincipal: async (id: number): Promise<DireccionEntrega> => {
    const { data } = await api.patch(`/direcciones/${id}/principal`);
    return data;
  },
};
