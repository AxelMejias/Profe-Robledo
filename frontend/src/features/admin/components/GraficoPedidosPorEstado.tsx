import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMetricasPorEstado } from '@/entities/admin/hooks';
import { Skeleton } from '@/shared/ui';

export function GraficoPedidosPorEstado() {
  const { data, isLoading } = useMetricasPorEstado();

  if (isLoading) {
    return <Skeleton className="h-80 rounded-lg" />;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold mb-2">Pedidos por estado</h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data || []}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="estado" />
          <YAxis />
          <Tooltip formatter={(value: number) => [`${value}`, 'Cantidad']} />
          <Legend />
          <Bar dataKey="cantidad" fill="#10b981" name="Cantidad de pedidos" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
