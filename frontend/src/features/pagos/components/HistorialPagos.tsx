import { usePagosByPedido } from '@/entities/pago/hooks';
import { Skeleton, EmptyState } from '@/shared/ui';
import { EstadoPago } from './EstadoPago';
import type { Pago } from '@/shared/types';

interface HistorialPagosProps {
  pedidoId: number;
}

export function HistorialPagos({ pedidoId }: HistorialPagosProps) {
  const { data: pagos, isLoading, isError } = usePagosByPedido(pedidoId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="Error al cargar historial de pagos"
        description="No pudimos cargar el historial. Intentá de nuevo más tarde."
      />
    );
  }

  if (!pagos || pagos.length === 0) {
    return (
      <EmptyState
        title="Sin pagos registrados"
        description="Este pedido aún no tiene pagos procesados."
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Historial de pagos</h2>

      <div className="space-y-4">
        {pagos.map((pago, index) => (
          <PagoItem key={pago.id} pago={pago} index={index} />
        ))}
      </div>

      {pagos.length > 1 && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600">
            Total de intentos: {pagos.length}
          </p>
        </div>
      )}
    </div>
  );
}

interface PagoItemProps {
  pago: Pago;
  index: number;
}

function PagoItem({ pago, index }: PagoItemProps) {
  const fecha = new Date(pago.creado_en).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm font-medium text-gray-600">
            Intento {index + 1}
          </span>
          <EstadoPago estado={pago.mp_status} />
        </div>

        <div className="space-y-1 text-sm text-gray-600">
          <p>Fecha: {fecha}</p>
          <p>Monto: ${pago.monto}</p>
          {pago.mp_payment_id && (
            <p className="text-xs">ID MP: {pago.mp_payment_id}</p>
          )}
          <p className="text-xs text-gray-500">
            Ref: {pago.external_reference}
          </p>
        </div>
      </div>

      {/* Monto destacado */}
      <div className="text-right">
        <p className="text-xl font-bold text-primary-500">${pago.monto}</p>
      </div>
    </div>
  );
}

