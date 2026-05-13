import { useNavigate } from 'react-router-dom';
import { usePedido } from '@/entities/pedido/hooks';
import { usePagosByPedido } from '@/entities/pago/hooks';
import { Button, Skeleton } from '@/shared/ui';

interface PagoRechazadoProps {
  pedidoId: number;
}

const MOTIVOS_RECHAZO: Record<string, string> = {
  'cc_rejected_insufficient_amount': 'Fondos insuficientes',
  'cc_rejected_bad_filled_card_number': 'Número de tarjeta inválido',
  'cc_rejected_bad_filled_date': 'Fecha de vencimiento inválida',
  'cc_rejected_bad_filled_security_code': 'Código de seguridad inválido',
  'cc_rejected_call_for_authorize': 'Tarjeta requiere autorización del banco',
  'cc_rejected_card_disabled': 'Tarjeta deshabilitada',
  'cc_rejected_duplicated_payment': 'Pago duplicado',
  'cc_rejected_high_risk': 'Pago rechazado por prevención de fraude',
  'cc_rejected_other_reason': 'Tarjeta rechazada por el banco',
};

export function PagoRechazado({ pedidoId }: PagoRechazadoProps) {
  const navigate = useNavigate();
  const { data: pedido, isLoading: loadingPedido } = usePedido(pedidoId);
  const { data: pagos, isLoading: loadingPagos } = usePagosByPedido(pedidoId);

  if (loadingPedido || loadingPagos) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  // Obtener último pago rechazado
  const ultimoPago = pagos?.[pagos.length - 1];
  const motivoRechazo = ultimoPago?.mp_status
    ? MOTIVOS_RECHAZO[ultimoPago.mp_status] || 'El pago fue rechazado'
    : 'El pago fue rechazado';

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        {/* Ícono */}
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-6xl">❌</span>
          </div>
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-danger mb-4">
          Pago rechazado
        </h1>

        {/* Mensaje */}
        <p className="text-lg text-gray-700 mb-6">
          {motivoRechazo}
        </p>

        {/* Detalles del pedido */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Número de pedido</span>
              <span className="text-xl font-bold">#{pedido?.id}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-gray-600">Monto</span>
              <span className="text-xl font-semibold">${pedido?.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Estado del pedido</span>
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                <span>⏳</span>
                PENDIENTE
              </span>
            </div>
          </div>
        </div>

        {/* Sugerencias */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-left">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Sugerencias para reintentar:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Verificá que tu tarjeta tenga fondos suficientes</li>
            <li>Revisá que los datos de la tarjeta sean correctos</li>
            <li>Intentá con otra tarjeta de crédito/débito</li>
            <li>Contactá a tu banco si el problema persiste</li>
          </ul>
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate(`/pago-mp/${pedidoId}`)}
            size="lg"
          >
            Reintentar pago
          </Button>
          <Button
            onClick={() => navigate(`/pedidos/${pedidoId}`)}
            variant="ghost"
            size="lg"
          >
            Ver detalle del pedido
          </Button>
        </div>

        {/* Alternativa */}
        <div className="mt-6">
          <p className="text-sm text-gray-600">
            También podés{' '}
            <button
              onClick={() => navigate(`/pedidos/${pedidoId}`)}
              className="text-primary hover:underline"
            >
              cancelar este pedido
            </button>
            {' '}y pagar en efectivo al recibir.
          </p>
        </div>
      </div>
    </div>
  );
}
