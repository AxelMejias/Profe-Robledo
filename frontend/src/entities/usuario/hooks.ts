import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usuariosApi } from './api';
import type { Usuario } from '@/shared/types';

interface UseUsuariosFilters {
  page?: number;
  size?: number;
}

export function useUsuarios(filters: UseUsuariosFilters = {}) {
  return useQuery({
    queryKey: ['usuarios', filters],
    queryFn: () => usuariosApi.fetchUsuarios(filters),
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

export function useUpdateUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, usuario }: { id: number; usuario: Partial<Usuario> }) =>
      usuariosApi.updateUsuario(id, usuario),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
}

export function useUpdateRoles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, roles }: { id: number; roles: string[] }) =>
      usuariosApi.updateRoles(id, roles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
}

export function useToggleEstadoUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) =>
      usuariosApi.toggleEstado(id, activo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
}
