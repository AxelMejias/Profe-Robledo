import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productosApi } from './api';
import type { Producto } from '@/shared/types';

interface UseProductosFilters {
  page?: number;
  size?: number;
  categoria_id?: number;
  search?: string;
  precio_min?: number;
  precio_max?: number;
  disponible?: boolean;
  incluir_eliminados?: boolean;
  excluir_alergenos?: number[];
}

export function useProductos(filters: UseProductosFilters = {}) {
  return useQuery({
    queryKey: ['productos', filters],
    queryFn: () => productosApi.fetchProductos(filters),
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

export function useProducto(id: number) {
  return useQuery({
    queryKey: ['productos', id],
    queryFn: () => productosApi.fetchProductoById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateProducto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (producto: Partial<Producto>) => productosApi.createProducto(producto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
  });
}

export function useUpdateProducto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, producto }: { id: number; producto: Partial<Producto> }) =>
      productosApi.updateProducto(id, producto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['productos', id] });
    },
  });
}

export function useDeleteProducto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => productosApi.deleteProducto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
  });
}

export function useUpdateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, cantidad }: { id: number; cantidad: number }) =>
      productosApi.updateStock(id, cantidad),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['productos', id] });
    },
  });
}

export function useAssignCategorias() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, categoria_ids }: { id: number; categoria_ids: number[] }) =>
      productosApi.assignCategorias(id, categoria_ids),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['productos', id] });
    },
  });
}

export function useToggleDisponibilidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, disponible }: { id: number; disponible: boolean }) =>
      productosApi.toggleDisponibilidad(id, disponible),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['productos', id] });
    },
  });
}

export function useAddIngrediente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      producto_id,
      ingrediente_id,
      es_removible,
    }: {
      producto_id: number;
      ingrediente_id: number;
      es_removible?: boolean;
    }) => productosApi.addIngrediente(producto_id, ingrediente_id, es_removible),
    onSuccess: (_, { producto_id }) => {
      queryClient.invalidateQueries({ queryKey: ['productos', producto_id] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
  });
}

export function useRemoveIngrediente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      producto_id,
      ingrediente_id,
    }: {
      producto_id: number;
      ingrediente_id: number;
    }) => productosApi.removeIngrediente(producto_id, ingrediente_id),
    onSuccess: (_, { producto_id }) => {
      queryClient.invalidateQueries({ queryKey: ['productos', producto_id] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
  });
}
