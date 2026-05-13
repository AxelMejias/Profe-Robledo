import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePedidos } from '@/entities/pedido/hooks';
import { useAuthStore } from '@/shared/store/authStore';
import { Skeleton, EmptyState, Badge, Button } from '@/shared/ui';
import type { Pedido } from '@/shared/types';

const ESTADOS_PEDIDO = [
  { codigo: '', nombre: 'Todos' },
  { codigo: 'PENDIENTE', nombre: 'Pendiente' },
  { codigo: 'CONFIRMADO', nombre: 'Confirmado' },
  { codigo: 'EN_PREP', nombre: 'En preparación' },
  { codigo: 'EN_CAMINO', nombre: 'En camino' },
  { codigo: 'ENTREGADO', nombre: 'Entregado' },
  { codigo: 'CANCELADO', nombre: 'Cancelado' },
];

function getEstadoBadgeVariant(estado: string): 'default' | 'primary' | 'secondary' | 'danger' {
  switch (estado) {
    case 'PENDIENTE':
      return 'default';
    case 'CONFIRMADO':
      return 'primary';
    case 'EN_PREP':
    case 'EN_CAMINO':
      return 'secondary';
    case 'ENTREGADO':
      return 'primary';
    case 'CANCELADO':
      return 'danger';
    default:
      return 'default';
  }
}

export function PedidosList() {
  const hasRole = useAuthStore((s) => s.hasRole);
  const isAdminOrPedidos = hasRole('ADMIN') || hasRole('PEDIDOS');

  const [page, setPage] = useState(1);
  const [estadoFilter, setEstadoFilter] = useState('');

  const { data, isLoading, isError } = usePedidos({
    page,
    size: 10,
    estado_codigo: estadoFilter || undefined,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <Skeleton className="h-12 w-64" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <EmptyState
          title="Error al cargar pedidos"
          message="No pudimos cargar tus pedidos. Intentá de nuevo más tarde."
          actionLabel="Reintentar"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  if (!data?.items || data.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <EmptyState
          title="No tenés pedidos todavía"
          message="Explorá nuestro catálogo y hacé tu primer pedido."
          actionLabel="Ir al catálogo"
          onAction={() => window.location.href = '/catalogo'}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mis Pedidos</h1>
        {isAdminOrPedidos && (
          <span className="text-sm text-gray-600">Vista de administrador</span>
        )}
      </div>

      {/* Filtro por estado (solo admin/pedidos) */}
      {isAdminOrPedidos && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtrar por estado
          </label>
          <div className="flex flex-wrap gap-2">
            {ESTADOS_PEDIDO.map((estado) => (
              <button
                key={estado.codigo}
                onClick={() => {
                  setEstadoFilter(estado.codigo);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  estadoFilter === estado.codigo
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {estado.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lista de pedidos */}
      <div className="space-y-4">
        {data.items.map((pedido) => (
          <PedidoCard key={pedido.id} pedido={pedido} />
        ))}
      </div>

      {/* Paginación */}
      {data.pages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
            variant="outline"
          >
            Anterior
          </Button>

          <span className="text-sm text-gray-600">
            Página {page} de {data.pages}
          </span>

          <Button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === data.pages}
            variant="outline"
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}

interface PedidoCardProps {
  pedido: Pedido;
}

function PedidoCard({ pedido }: PedidoCardProps) {
  const fecha = new Date(pedido.creado_en).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Link
      to={`/pedidos/${pedido.id}`}
      className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Pedido #{pedido.id}</h3>
            <Badge variant={getEstadoBadgeVariant(pedido.estado_codigo)}>
              {pedido.estado_codigo}
            </Badge>
          </div>

          <p className="text-sm text-gray-600">
            {fecha}
          </p>

          {pedido.notas && (
            <p className="text-sm text-gray-600 italic">
              Nota: {pedido.notas}
            </p>
          )}
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-primary">
            ${pedido.total}
          </div>
          <div className="text-xs text-gray-500">
            Subtotal: ${pedido.subtotal}
          </div>
          {pedido.descuento > 0 && (
            <div className="text-xs text-secondary">
              Descuento: -${pedido.descuento}
            </div>
          )}
          <div className="text-xs text-gray-500">
            Envío: ${pedido.costo_envio}
          </div>
        </div>
      </div>
    </Link>
  );
}
