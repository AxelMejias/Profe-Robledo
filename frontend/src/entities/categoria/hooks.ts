import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriasApi } from './api';
import type { Categoria } from '@/shared/types';

export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: categoriasApi.fetchCategorias,
    staleTime: 10 * 60 * 1000, // 10 min - las categorías cambian poco
  });
}

export function useCategoria(id: number) {
  return useQuery({
    queryKey: ['categorias', id],
    queryFn: () => categoriasApi.fetchCategoriaById(id),
    enabled: !!id,
  });
}

export function useCreateCategoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoria: Partial<Categoria>) => categoriasApi.createCategoria(categoria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    },
  });
}

export function useUpdateCategoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, categoria }: { id: number; categoria: Partial<Categoria> }) =>
      categoriasApi.updateCategoria(id, categoria),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      queryClient.invalidateQueries({ queryKey: ['categorias', id] });
    },
  });
}

export function useDeleteCategoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => categoriasApi.deleteCategoria(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    },
  });
}
