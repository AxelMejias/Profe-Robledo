import api from '@/shared/api/axios';
import type { Pedido, PaginatedResponse, CrearPedidoRequest } from '@/shared/types';

interface FetchPedidosParams {
  page?: number;
  size?: number;
  estado_codigo?: string;
}

export const pedidosApi = {
  fetchPedidos: async (params: FetchPedidosParams = {}): Promise<PaginatedResponse<Pedido>> => {
    const { data } = await api.get('/pedidos', { params });
    return data;
  },

  fetchPedidoById: async (id: number): Promise<Pedido> => {
    const { data } = await api.get(`/pedidos/${id}`);
    return data;
  },

  createPedido: async (pedido: CrearPedidoRequest): Promise<Pedido> => {
    const { data } = await api.post('/pedidos', pedido);
    return data;
  },

  avanzarEstado: async (id: number, observacion?: string): Promise<Pedido> => {
    const { data } = await api.patch(`/pedidos/${id}/estado`, { observacion });
    return data;
  },

  cancelarPedido: async (id: number, motivo?: string): Promise<Pedido> => {
    const { data } = await api.delete(`/pedidos/${id}`, { data: { motivo } });
    return data;
  },
};
