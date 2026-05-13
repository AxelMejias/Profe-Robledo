import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pagosApi } from './api';

interface CrearPagoRequest {
  pedido_id: number;
  token: string;
}

export function useCrearPreference() {
  return useMutation({
    mutationFn: (pedido_id: number) => pagosApi.crearPreference(pedido_id),
  });
}

export function useCrearPago() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CrearPagoRequest) => pagosApi.crearPago(payload),
    onSuccess: (_, { pedido_id }) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos', pedido_id] });
      queryClient.invalidateQueries({ queryKey: ['pagos', pedido_id] });
    },
  });
}

export function usePagosByPedido(pedido_id: number) {
  return useQuery({
    queryKey: ['pagos', pedido_id],
    queryFn: () => pagosApi.fetchPagosByPedido(pedido_id),
    enabled: !!pedido_id,
    staleTime: 1 * 60 * 1000, // 1 min
  });
}
