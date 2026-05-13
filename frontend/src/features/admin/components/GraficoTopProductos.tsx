import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTopProductos } from '@/entities/admin/hooks';
import { Skeleton } from '@/shared/ui';

export function GraficoTopProductos() {
  const { data, isLoading } = useTopProductos();

  if (isLoading) {
    return <Skeleton className="h-80 rounded-lg" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Top 5 productos más vendidos</h2>
        <div className="flex items-center justify-center h-48 text-gray-400">
          <p>Sin datos de ventas aún</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Top 5 productos más vendidos</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="nombre"
            width={120}
            tick={{ fontSize: 12 }}
          />
          <Tooltip formatter={(value: number) => [value, 'Unidades vendidas']} />
          <Bar dataKey="total_vendido" fill="#10b981" name="Unidades vendidas" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
