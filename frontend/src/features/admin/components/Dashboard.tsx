import { useKPIs } from '@/entities/admin/hooks';
import { Skeleton } from '@/shared/ui';
import { GraficoIngresos7Dias } from './GraficoIngresos7Dias';
import { GraficoPedidosPorEstado } from './GraficoPedidosPorEstado';
import { GraficoTopProductos } from './GraficoTopProductos';

export function Dashboard() {
  const { data: kpis, isLoading } = useKPIs();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Panel de Administración</h1>

      {/* KPIs Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Pedidos"
            value={kpis?.total_pedidos || 0}
            icon="📦"
            color="bg-blue-500"
          />
          <KPICard
            title="Ingresos Hoy"
            value={`$${kpis?.ingresos_hoy || 0}`}
            icon="💰"
            color="bg-green-500"
          />
          <KPICard
            title="Pedidos Pendientes"
            value={kpis?.pedidos_pendientes || 0}
            icon="⏳"
            color="bg-yellow-500"
          />
          <KPICard
            title="Productos Sin Stock"
            value={kpis?.sin_stock || 0}
            icon="⚠️"
            color="bg-red-500"
          />
        </div>
      )}

      {/* Gráficos */}
      <div className="grid lg:grid-cols-2 gap-6">
        <GraficoIngresos7Dias />
        <GraficoPedidosPorEstado />
      </div>

      {/* Top productos */}
      <GraficoTopProductos />
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

function KPICard({ title, value, icon, color }: KPICardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className={`${color} w-14 h-14 rounded-full flex items-center justify-center text-3xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
