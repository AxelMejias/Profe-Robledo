import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pedidosApi } from './api';
import type { CrearPedidoRequest } from '@/shared/types';

interface UsePedidosFilters {
  page?: number;
  size?: number;
  estado_codigo?: string;
}

export function usePedidos(filters: UsePedidosFilters = {}) {
  return useQuery({
    queryKey: ['pedidos', filters],
    queryFn: () => pedidosApi.fetchPedidos(filters),
    staleTime: 2 * 60 * 1000, // 2 min
  });
}

export function usePedido(id: number, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ['pedidos', id],
    queryFn: () => pedidosApi.fetchPedidoById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    refetchInterval: options?.refetchInterval, // Para polling
  });
}

export function useCreatePedido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pedido: CrearPedidoRequest) => pedidosApi.createPedido(pedido),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    },
  });
}

export function useAvanzarEstado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, nuevo_estado, motivo }: { id: number; nuevo_estado: string; motivo?: string }) =>
      pedidosApi.avanzarEstado(id, nuevo_estado, motivo),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos', id] });
    },
  });
}

export function useCancelarPedido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo?: string }) =>
      pedidosApi.cancelarPedido(id, motivo),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos', id] });
    },
  });
}
