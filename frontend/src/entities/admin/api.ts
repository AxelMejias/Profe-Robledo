import api from '@/shared/api/axios';
import type { MetricasKPI, MetricaPorEstado, MetricaIngresoDia } from '@/shared/types';

export const adminApi = {
  fetchKPIs: async (): Promise<MetricasKPI> => {
    const { data } = await api.get('/admin/metricas');
    return data;
  },

  fetchMetricasPorEstado: async (): Promise<MetricaPorEstado[]> => {
    const { data } = await api.get('/admin/metricas/por-estado');
    return data;
  },

  fetchIngresos7Dias: async (): Promise<MetricaIngresoDia[]> => {
    const { data } = await api.get('/admin/metricas/ingresos-7-dias');
    return data;
  },
};
