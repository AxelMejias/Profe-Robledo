import api from '@/shared/api/axios';
import type { Usuario, PaginatedResponse } from '@/shared/types';

interface FetchUsuariosParams {
  page?: number;
  size?: number;
}

export const usuariosApi = {
  fetchUsuarios: async (params: FetchUsuariosParams = {}): Promise<PaginatedResponse<Usuario>> => {
    const { data } = await api.get('/usuarios', { params });
    return data;
  },

  updateUsuario: async (id: number, usuario: Partial<Usuario>): Promise<Usuario> => {
    const { data } = await api.patch(`/usuarios/${id}`, usuario);
    return data;
  },

  updateRoles: async (id: number, roles: string[]): Promise<Usuario> => {
    const { data } = await api.put(`/usuarios/${id}/roles`, { roles });
    return data;
  },
};
