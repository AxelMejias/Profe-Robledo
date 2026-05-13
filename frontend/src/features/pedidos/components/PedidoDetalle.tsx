import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePedido, useCancelarPedido, useAvanzarEstado } from '@/entities/pedido/hooks';
import { useAuthStore } from '@/shared/store/authStore';
import { useUIStore } from '@/shared/store/uiStore';
import { Skeleton, EmptyState, Badge, Button, Modal, Input } from '@/shared/ui';
import { PedidoTimeline } from './PedidoTimeline';

interface PedidoDetalleProps {
  pedidoId: number;
}

export function PedidoDetalle({ pedidoId }: PedidoDetalleProps) {
  const navigate = useNavigate();
  const hasRole = useAuthStore((s) => s.hasRole);
  const user = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);

  // Polling cada 30s para detectar cambios
  const { data: pedido, isLoading, isError } = usePedido(pedidoId, {
    refetchInterval: 30000,
  });

  const cancelarMutation = useCancelarPedido();
  const avanzarMutation = useAvanzarEstado();

  const [showCancelarModal, setShowCancelarModal] = useState(false);
  const [showAvanzarModal, setShowAvanzarModal] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [observacionAvance, setObservacionAvance] = useState('');

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (isError || !pedido) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <EmptyState
          title="Pedido no encontrado"
          description="El pedido que buscás no existe o no tenés acceso."
          action={{ label: 'Volver a mis pedidos', onClick: () => navigate('/pedidos') }}
        />
      </div>
    );
  }

  const isAdminOrPedidos = hasRole('ADMIN') || hasRole('PEDIDOS');
  const isPropietario = user?.id === pedido.usuario_id;

  const puedeCancel = () => {
    if (pedido.estado_codigo === 'ENTREGADO' || pedido.estado_codigo === 'CANCELADO') {
      return false;
    }
    if (pedido.estado_codigo === 'PENDIENTE' || pedido.estado_codigo === 'CONFIRMADO') {
      return isPropietario || isAdminOrPedidos;
    }
    // EN_PREP, EN_CAMINO solo admin
    return isAdminOrPedidos;
  };

  const puedeAvanzar = () => {
    return isAdminOrPedidos && pedido.estado_codigo !== 'ENTREGADO' && pedido.estado_codigo !== 'CANCELADO';
  };

  const handleCancelar = async () => {
    try {
      await cancelarMutation.mutateAsync({
        id: pedido.id,
        motivo: motivoCancelacion || undefined,
      });

      addToast('success', 'Pedido cancelado correctamente');

      setShowCancelarModal(false);
      setMotivoCancelacion('');
    } catch (error: any) {
      addToast('error', error.response?.data?.detail || 'Error al cancelar el pedido');
    }
  };

  const handleAvanzar = async () => {
    const FSM: Record<string, string> = {
      CONFIRMADO: 'EN_PREP',
      EN_PREP: 'EN_CAMINO',
      EN_CAMINO: 'ENTREGADO',
    };
    const nuevoEstado = FSM[pedido.estado_codigo];
    if (!nuevoEstado) return;

    try {
      await avanzarMutation.mutateAsync({
        id: pedido.id,
        nuevo_estado: nuevoEstado,
        motivo: observacionAvance || undefined,
      });

      addToast('success', 'Estado avanzado correctamente');

      setShowAvanzarModal(false);
      setObservacionAvance('');
    } catch (error: any) {
      addToast('error', error.response?.data?.detail || 'Error al avanzar el estado');
    }
  };

  const direccionSnapshot = pedido.direccion_snapshot
    ? JSON.parse(pedido.direccion_snapshot)
    : null;

  const fecha = new Date(pedido.creado_en).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Pedido #{pedido.id}</h1>
            <Badge variant={pedido.estado_codigo === 'CANCELADO' ? 'danger' : 'primary'}>
              {pedido.estado_codigo}
            </Badge>
          </div>
          <p className="text-gray-600">{fecha}</p>
        </div>

        <div className="flex gap-3">
          {puedeCancel() && (
            <Button
              onClick={() => setShowCancelarModal(true)}
              variant="danger"
              disabled={cancelarMutation.isPending}
            >
              Cancelar pedido
            </Button>
          )}
          {puedeAvanzar() && (
            <Button
              onClick={() => setShowAvanzarModal(true)}
              disabled={avanzarMutation.isPending}
            >
              Avanzar estado
            </Button>
          )}
        </div>
      </div>

      {/* Timeline */}
      {pedido.historial && (
        <PedidoTimeline
          historial={pedido.historial}
          estadoActual={pedido.estado_codigo}
        />
      )}

      {/* Items del pedido */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Productos</h2>
        <div className="space-y-4">
          {pedido.detalles?.map((detalle) => (
            <div key={detalle.id} className="flex justify-between items-start border-b pb-4">
              <div className="flex-1">
                <p className="font-medium">{detalle.nombre_snapshot}</p>
                {detalle.personalizacion.length > 0 && (
                  <p className="text-sm text-gray-600">
                    Sin: {detalle.personalizacion.length} ingrediente(s)
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  ${detalle.precio_snapshot} × {detalle.cantidad}
                </p>
              </div>
              <p className="font-semibold text-primary">${detalle.subtotal}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dirección de entrega */}
      {direccionSnapshot && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Dirección de entrega</h2>
          <div className="text-gray-700">
            {direccionSnapshot.alias && (
              <p className="font-medium">{direccionSnapshot.alias}</p>
            )}
            <p>{direccionSnapshot.linea1}</p>
            {direccionSnapshot.linea2 && <p>{direccionSnapshot.linea2}</p>}
            <p>
              {direccionSnapshot.ciudad}, CP {direccionSnapshot.codigo_postal}
            </p>
            {direccionSnapshot.referencia && (
              <p className="text-sm text-gray-600 mt-2">
                Referencia: {direccionSnapshot.referencia}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Totales */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Resumen</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">${pedido.subtotal}</span>
          </div>
          {pedido.descuento > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Descuento</span>
              <span className="font-medium text-secondary">-${pedido.descuento}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Envío</span>
            <span className="font-medium">${pedido.costo_envio}</span>
          </div>
          <div className="flex justify-between pt-2 border-t text-xl">
            <span className="font-bold">Total</span>
            <span className="font-bold text-primary">${pedido.total}</span>
          </div>
        </div>

        {pedido.notas && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-gray-700">Notas:</p>
            <p className="text-sm text-gray-600 italic">{pedido.notas}</p>
          </div>
        )}
      </div>

      {/* Pagos (si existen) */}
      {pedido.pagos && pedido.pagos.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Historial de pagos</h2>
          <div className="space-y-3">
            {pedido.pagos.map((pago) => (
              <div key={pago.id} className="flex justify-between items-center border-b pb-3">
                <div>
                  <p className="font-medium">${pago.monto}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(pago.creado_en).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <Badge variant={pago.mp_status === 'approved' ? 'secondary' : 'danger'}>
                  {pago.mp_status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de cancelación */}
      {showCancelarModal && (
        <Modal
          open
          onClose={() => setShowCancelarModal(false)}
          title="¿Cancelar pedido?"
        >
          <div className="space-y-6">
            <p className="text-gray-600">
              {pedido.estado_codigo === 'CONFIRMADO'
                ? '⚠ El pedido ya fue confirmado. Al cancelarlo, el stock se restaurará.'
                : '¿Estás seguro que querés cancelar este pedido?'}
            </p>

            {(isAdminOrPedidos || pedido.estado_codigo === 'EN_PREP' || pedido.estado_codigo === 'EN_CAMINO') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de cancelación {isAdminOrPedidos && '(obligatorio)'}
                </label>
                <Input
                  value={motivoCancelacion}
                  onChange={(e) => setMotivoCancelacion(e.target.value)}
                  placeholder="Ej: Cliente solicitó cancelación"
                />
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button onClick={() => setShowCancelarModal(false)} variant="ghost">
                Volver
              </Button>
              <Button
                onClick={handleCancelar}
                variant="danger"
                disabled={cancelarMutation.isPending}
              >
                {cancelarMutation.isPending ? 'Cancelando...' : 'Confirmar cancelación'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de avanzar estado */}
      {showAvanzarModal && (
        <Modal
          open
          onClose={() => setShowAvanzarModal(false)}
          title="Avanzar estado del pedido"
        >
          <div className="space-y-6">
            <p className="text-gray-600">
              Se avanzará el pedido al siguiente estado según el flujo FSM.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observación (opcional)
              </label>
              <Input
                value={observacionAvance}
                onChange={(e) => setObservacionAvance(e.target.value)}
                placeholder="Ej: Pedido listo para despacho"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button onClick={() => setShowAvanzarModal(false)} variant="ghost">
                Cancelar
              </Button>
              <Button
                onClick={handleAvanzar}
                disabled={avanzarMutation.isPending}
              >
                {avanzarMutation.isPending ? 'Avanzando...' : 'Avanzar estado'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
