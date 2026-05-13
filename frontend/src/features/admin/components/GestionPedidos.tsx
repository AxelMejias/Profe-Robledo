import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePedidos } from '@/entities/pedido/hooks';
import { Skeleton, Badge, Button } from '@/shared/ui';

const ESTADOS = ['', 'PENDIENTE', 'CONFIRMADO', 'EN_PREP', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO'];

export function GestionPedidos() {
  const [estadoFilter, setEstadoFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = usePedidos({
    page,
    size: 20,
    estado_codigo: estadoFilter || undefined,
  });

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestión de Pedidos</h1>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filtrar por estado
        </label>
        <div className="flex flex-wrap gap-2">
          {ESTADOS.map((estado) => (
            <button
              key={estado || 'todos'}
              onClick={() => {
                setEstadoFilter(estado);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                estadoFilter === estado
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {estado || 'Todos'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de pedidos */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Total
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.items.map((pedido) => (
              <tr key={pedido.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  #{pedido.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {new Date(pedido.creado_en).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge
                    variant={
                      pedido.estado_codigo === 'ENTREGADO'
                        ? 'secondary'
                        : pedido.estado_codigo === 'CANCELADO'
                        ? 'danger'
                        : 'gray'
                    }
                    size="sm"
                  >
                    {pedido.estado_codigo}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-semibold">
                  ${pedido.total}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <Link
                    to={`/pedidos/${pedido.id}`}
                    className="text-primary-500 hover:underline text-sm"
                  >
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {data && data.pages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
            variant="ghost"
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-600">
            Página {page} de {data.pages}
          </span>
          <Button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === data.pages}
            variant="ghost"
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}

