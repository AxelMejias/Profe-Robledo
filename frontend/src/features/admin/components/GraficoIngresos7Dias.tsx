import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useIngresos7Dias } from '@/entities/admin/hooks';
import { Skeleton } from '@/shared/ui';

export function GraficoIngresos7Dias() {
  const { data, isLoading } = useIngresos7Dias();

  if (isLoading) {
    return <Skeleton className="h-80 rounded-lg" />;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Ingresos últimos 7 días</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data || []}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="fecha"
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getDate()}/${date.getMonth() + 1}`;
            }}
          />
          <YAxis />
          <Tooltip
            formatter={(value: number) => [`$${value}`, 'Ingresos']}
            labelFormatter={(label) => {
              const date = new Date(label);
              return date.toLocaleDateString('es-AR');
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Ingresos"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
