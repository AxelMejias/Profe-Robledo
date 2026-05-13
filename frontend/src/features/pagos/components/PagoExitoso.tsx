import { useNavigate } from 'react-router-dom';
import { usePedido } from '@/entities/pedido/hooks';
import { Button, Skeleton } from '@/shared/ui';

interface PagoExitosoProps {
  pedidoId: number;
}

export function PagoExitoso({ pedidoId }: PagoExitosoProps) {
  const navigate = useNavigate();
  const { data: pedido, isLoading } = usePedido(pedidoId);

  if (isLoading || !pedido) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        {/* Ícono animado */}
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
            <span className="text-6xl">✅</span>
          </div>
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-green-700 mb-4">
          ¡Pago aprobado!
        </h1>

        {/* Mensaje */}
        <p className="text-lg text-gray-700 mb-6">
          Tu pago fue procesado correctamente y tu pedido está confirmado.
        </p>

        {/* Detalles del pedido */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Número de pedido</span>
              <span className="text-2xl font-bold text-primary-500">#{pedido.id}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-gray-600">Total pagado</span>
              <span className="text-xl font-semibold">${pedido.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Estado</span>
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <span>✓</span>
                CONFIRMADO
              </span>
            </div>
          </div>
        </div>

        {/* Mensaje de seguimiento */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-gray-700">
            📧 Te enviamos un email de confirmación con los detalles de tu pedido.
          </p>
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate(`/pedidos/${pedido.id}`)}
            size="lg"
          >
            Ver detalle del pedido
          </Button>
          <Button
            onClick={() => navigate('/catalogo')}
            variant="ghost"
            size="lg"
          >
            Seguir comprando
          </Button>
        </div>
      </div>
    </div>
  );
}

