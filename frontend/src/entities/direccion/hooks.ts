import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { direccionesApi } from './api';
import type { DireccionEntrega } from '@/shared/types';

export function useDirecciones() {
  return useQuery({
    queryKey: ['direcciones'],
    queryFn: direccionesApi.fetchDirecciones,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

export function useCreateDireccion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (direccion: Partial<DireccionEntrega>) => direccionesApi.createDireccion(direccion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['direcciones'] });
    },
  });
}

export function useUpdateDireccion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, direccion }: { id: number; direccion: Partial<DireccionEntrega> }) =>
      direccionesApi.updateDireccion(id, direccion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['direcciones'] });
    },
  });
}

export function useDeleteDireccion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => direccionesApi.deleteDireccion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['direcciones'] });
    },
  });
}

export function useMarcarPrincipal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => direccionesApi.marcarPrincipal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['direcciones'] });
    },
  });
}
