import { Link } from 'react-router-dom';
import { usePedidos } from '@/entities/pedido/hooks';
import { Skeleton, EmptyState, Badge } from '@/shared/ui';

export function PedidosRecientes() {
  const { data, isLoading, isError } = usePedidos({
    page: 1,
    size: 3,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="Error al cargar pedidos"
        description="No pudimos cargar tus pedidos recientes."
      />
    );
  }

  if (!data?.items || data.items.length === 0) {
    return (
      <EmptyState
        title="No tenés pedidos todavía"
        description="Empezá a comprar en nuestro catálogo."
        action={{ label: 'Ver catálogo', onClick: () => window.location.href = '/catalogo' }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {data.items.map((pedido) => {
        const fecha = new Date(pedido.creado_en).toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });

        return (
          <Link
            key={pedido.id}
            to={`/pedidos/${pedido.id}`}
            className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-semibold">Pedido #{pedido.id}</span>
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
                </div>
                <p className="text-sm text-gray-600">{fecha}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary-500">${pedido.total}</p>
              </div>
            </div>
          </Link>
        );
      })}

      {/* Link "Ver todos" */}
      <Link
        to="/pedidos"
        className="block text-center py-3 text-primary-500 hover:underline font-medium"
      >
        Ver todos mis pedidos →
      </Link>
    </div>
  );
}

