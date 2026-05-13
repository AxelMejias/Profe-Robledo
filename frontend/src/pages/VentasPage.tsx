import { Link } from 'react-router-dom';
import { usePedidos } from '@/entities/pedido/hooks';
import { Badge, Skeleton } from '@/shared/ui';

const estadoVariant = (estado: string) => {
  if (estado === 'ENTREGADO') return 'secondary';
  if (estado === 'CANCELADO') return 'danger';
  return 'gray';
};

export function VentasPage() {
  const { data, isLoading } = usePedidos({ page: 1, size: 5 });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
      <p className="text-gray-500 text-sm">Últimas 5 ventas de la tienda</p>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <div className="bg-white rounded-lg shadow-sm p-10 text-center text-gray-500">
          No hay ventas registradas todavía.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Detalle</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.items.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">#{pedido.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {pedido.usuario_nombre ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(pedido.creado_en).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={estadoVariant(pedido.estado_codigo)} size="sm">
                      {pedido.estado_codigo}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 font-semibold">
                    ${new Intl.NumberFormat('es-AR').format(Number(pedido.total))}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/pedidos/${pedido.id}`}
                      className="text-primary-500 hover:underline text-sm"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Botón ir a admin/pedidos */}
      <div className="flex justify-center pt-4">
        <Link
          to="/admin/pedidos"
          className="flex flex-col items-center gap-2 px-8 py-5 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-primary-300 transition-all group"
        >
          <span className="text-4xl group-hover:scale-110 transition-transform">🛒</span>
          <span className="text-sm font-medium text-gray-700 group-hover:text-primary-500 transition-colors">
            Para ver Más Ventas
          </span>
        </Link>
      </div>
    </div>
  );
}
