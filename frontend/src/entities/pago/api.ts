import api from '@/shared/api/axios';
import type { Pago } from '@/shared/types';

interface CrearPagoRequest {
  pedido_id: number;
  token: string;
}

export const pagosApi = {
  crearPago: async (payload: CrearPagoRequest): Promise<Pago> => {
    const { data } = await api.post('/pagos/crear', payload);
    return data;
  },

  fetchPagosByPedido: async (pedido_id: number): Promise<Pago[]> => {
    const { data } = await api.get(`/pagos/${pedido_id}`);
    return Array.isArray(data) ? data : [data];
  },
};
