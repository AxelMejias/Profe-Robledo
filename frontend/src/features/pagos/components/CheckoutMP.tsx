import { useState } from 'react';
import { useCrearPreference } from '@/entities/pago/hooks';
import { usePedido } from '@/entities/pedido/hooks';
import { useUIStore } from '@/shared/store/uiStore';
import { Button, Skeleton } from '@/shared/ui';

interface CheckoutMPProps {
  pedidoId: number;
}

export function CheckoutMP({ pedidoId }: CheckoutMPProps) {
  const addToast = useUIStore((s) => s.addToast);
  const crearPreference = useCrearPreference();
  const { data: pedido, isLoading } = usePedido(pedidoId);
  const [redirecting, setRedirecting] = useState(false);

  const handlePagar = async () => {
    setRedirecting(true);
    try {
      const { init_point } = await crearPreference.mutateAsync(pedidoId);
      window.location.href = init_point;
    } catch (error: any) {
      setRedirecting(false);
      addToast('error', error.response?.data?.detail || 'Error al iniciar el pago. Intentá de nuevo.');
    }
  };

  if (isLoading || !pedido) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
        <h1 className="text-2xl font-bold">Pago con MercadoPago</h1>

        {/* Resumen del pedido */}
        <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Pedido #{pedido.id}</p>
          <p className="text-3xl font-bold text-primary-500">
            ${new Intl.NumberFormat('es-AR').format(Number(pedido.total))}
          </p>
        </div>

        {/* Métodos disponibles */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Podés pagar con:</p>
          <div className="grid grid-cols-3 gap-3 text-center text-xs text-gray-600">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-2xl mb-1">💳</p>
              <p>Tarjeta de crédito / débito</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-2xl mb-1">🏦</p>
              <p>Transferencia bancaria</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-2xl mb-1">💰</p>
              <p>Saldo en MercadoPago</p>
            </div>
          </div>
        </div>

        {/* Botón principal */}
        {redirecting ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
            <p className="text-sm text-gray-600">Redirigiendo a MercadoPago...</p>
          </div>
        ) : (
          <Button
            onClick={handlePagar}
            disabled={crearPreference.isPending}
            className="w-full py-4 text-lg"
          >
            Ir a pagar con MercadoPago
          </Button>
        )}

        {/* Nota de seguridad */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-gray-700">
            🔒 Serás redirigido al sitio seguro de MercadoPago para completar el pago.
            Food Store no almacena datos de tu tarjeta.
          </p>
        </div>
      </div>
    </div>
  );
}
