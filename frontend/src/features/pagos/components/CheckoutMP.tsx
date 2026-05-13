import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardPayment } from '@mercadopago/sdk-react';
import { useCrearPago } from '@/entities/pago/hooks';
import { usePedido } from '@/entities/pedido/hooks';
import { useUIStore } from '@/shared/store/uiStore';
import { initMP } from '../lib/initMP';

interface CheckoutMPProps {
  pedidoId: number;
}

export function CheckoutMP({ pedidoId }: CheckoutMPProps) {
  const navigate = useNavigate();
  const addToast = useUIStore((s) => s.addToast);
  const crearPago = useCrearPago();

  const { data: pedido, isLoading: loadingPedido } = usePedido(pedidoId);

  const [isProcessing, setIsProcessing] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);

  // Inicializar MP SDK
  useEffect(() => {
    initMP();
  }, []);

  // Polling de estado del pedido después de crear el pago
  const { data: pedidoPolling } = usePedido(pedidoId, {
    refetchInterval: pollingActive ? 5000 : undefined, // Poll cada 5s si está activo
  });

  // Detectar cambio de estado PENDIENTE → CONFIRMADO (pago aprobado)
  useEffect(() => {
    if (pollingActive && pedidoPolling) {
      if (pedidoPolling.estado_codigo === 'CONFIRMADO') {
        setPollingActive(false);
        navigate(`/pago-exitoso/${pedidoId}`);
      } else if (pedidoPolling.estado_codigo === 'CANCELADO') {
        // Pago rechazado (pedido cancelado por falta de confirmación)
        setPollingActive(false);
        navigate(`/pago-rechazado/${pedidoId}`);
      }
    }
  }, [pollingActive, pedidoPolling, pedidoId, navigate]);

  // Timeout del polling (2 minutos)
  useEffect(() => {
    if (pollingActive) {
      const timeout = setTimeout(() => {
        setPollingActive(false);
        addToast('info', 'Pago en proceso. Te notificaremos por email cuando se confirme.');
        navigate(`/pedidos/${pedidoId}`);
      }, 120000); // 2 minutos

      return () => clearTimeout(timeout);
    }
  }, [pollingActive, pedidoId, navigate, addToast]);

  const handleSubmit = async (formData: any) => {
    if (!formData.token) {
      addToast('error', 'Error al tokenizar la tarjeta. Intentá de nuevo.');
      return;
    }

    setIsProcessing(true);

    try {
      await crearPago.mutateAsync({
        pedido_id: pedidoId,
        token: formData.token,
      });

      addToast('info', 'Procesando pago... Esperá un momento.');

      // Activar polling para detectar confirmación
      setPollingActive(true);
    } catch (error: any) {
      setIsProcessing(false);
      addToast('error', error.response?.data?.detail || 'Error al procesar el pago. Intentá de nuevo.');
    }
  };

  const handleError = (error: any) => {
    console.error('CardPayment error:', error);
    addToast('error', 'Error en el formulario de pago. Revisá los datos ingresados.');
  };

  if (loadingPedido || !pedido) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-6">Pago con MercadoPago</h1>

        {/* Resumen del pedido */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Pedido #{pedido.id}</p>
              <p className="text-2xl font-bold text-primary">${pedido.total}</p>
            </div>
          </div>
        </div>

        {/* Formulario de MP */}
        {isProcessing || pollingActive ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            <p className="text-lg font-medium">Procesando pago...</p>
            <p className="text-sm text-gray-600 text-center">
              No cierres esta ventana. Estamos confirmando tu pago.
            </p>
          </div>
        ) : (
          <CardPayment
            initialization={{
              amount: pedido.total,
            }}
            onSubmit={handleSubmit}
            onError={handleError}
          />
        )}

        {/* Advertencia */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-gray-700">
            🔒 Tus datos de tarjeta son procesados de forma segura por MercadoPago.
            No almacenamos información de tu tarjeta.
          </p>
        </div>
      </div>
    </div>
  );
}
