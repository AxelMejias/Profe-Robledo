import { useQuery } from '@tanstack/react-query';
import { adminApi } from './api';

export function useKPIs() {
  return useQuery({
    queryKey: ['admin', 'kpis'],
    queryFn: adminApi.fetchKPIs,
    staleTime: 1 * 60 * 1000, // 1 min
  });
}

export function useMetricasPorEstado() {
  return useQuery({
    queryKey: ['admin', 'metricas-por-estado'],
    queryFn: adminApi.fetchMetricasPorEstado,
    staleTime: 1 * 60 * 1000,
  });
}

export function useIngresos7Dias() {
  return useQuery({
    queryKey: ['admin', 'ingresos-7-dias'],
    queryFn: adminApi.fetchIngresos7Dias,
    staleTime: 1 * 60 * 1000,
  });
}

export function useTopProductos() {
  return useQuery({
    queryKey: ['admin', 'top-productos'],
    queryFn: adminApi.fetchTopProductos,
    staleTime: 5 * 60 * 1000,
  });
}
