import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ingredientesApi, type IngredienteCreate, type IngredienteUpdate } from './api';

export function useIngredientes() {
  return useQuery({
    queryKey: ['ingredientes'],
    queryFn: ingredientesApi.fetchIngredientes,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateIngrediente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: IngredienteCreate) => ingredientesApi.createIngrediente(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredientes'] });
    },
  });
}

export function useUpdateIngrediente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: IngredienteUpdate }) =>
      ingredientesApi.updateIngrediente(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredientes'] });
    },
  });
}

export function useDeleteIngrediente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ingredientesApi.deleteIngrediente(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredientes'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
  });
}
