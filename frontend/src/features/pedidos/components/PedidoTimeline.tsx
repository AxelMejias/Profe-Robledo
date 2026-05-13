import type { HistorialEstadoPedido } from '@/shared/types';

interface PedidoTimelineProps {
  historial: HistorialEstadoPedido[];
  estadoActual: string;
}

const ESTADOS_ORDEN = [
  'PENDIENTE',
  'CONFIRMADO',
  'EN_PREP',
  'EN_CAMINO',
  'ENTREGADO',
];

function getEstadoColor(estado: string, completado: boolean, actual: boolean): string {
  if (estado === 'CANCELADO') return 'bg-danger text-white';
  if (actual) return 'bg-primary-500 text-white animate-pulse';
  if (completado) return 'bg-secondary text-white';
  return 'bg-gray-300 text-gray-600';
}

function getEstadoIcon(estado: string): string {
  switch (estado) {
    case 'PENDIENTE':
      return '📝';
    case 'CONFIRMADO':
      return '✓';
    case 'EN_PREP':
      return '👨‍🍳';
    case 'EN_CAMINO':
      return '🚚';
    case 'ENTREGADO':
      return '✓✓';
    case 'CANCELADO':
      return '✕';
    default:
      return '●';
  }
}

export function PedidoTimeline({ historial, estadoActual }: PedidoTimelineProps) {
  const esCancelado = estadoActual === 'CANCELADO';

  // Obtener índice del estado actual en el flujo normal
  const indiceActual = ESTADOS_ORDEN.indexOf(estadoActual);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-6">Estado del pedido</h2>

      {/* Timeline horizontal (desktop) */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-8">
          {ESTADOS_ORDEN.map((estado, idx) => {
            const completado = idx < indiceActual || (idx === indiceActual && !esCancelado);
            const actual = idx === indiceActual && !esCancelado;

            return (
              <div key={estado} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  {/* Icono */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${getEstadoColor(
                      estado,
                      completado,
                      actual
                    )}`}
                  >
                    {getEstadoIcon(estado)}
                  </div>
                  {/* Nombre */}
                  <span className="text-xs mt-2 text-center text-gray-700">
                    {estado.replace('_', ' ')}
                  </span>
                </div>

                {/* Línea de conexión */}
                {idx < ESTADOS_ORDEN.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-all ${
                      completado ? 'bg-secondary' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Badge de cancelado si aplica */}
        {esCancelado && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✕</span>
              <div>
                <p className="font-semibold text-danger">Pedido cancelado</p>
                {historial.find((h) => h.estado_hacia === 'CANCELADO')?.observacion && (
                  <p className="text-sm text-gray-600 mt-1">
                    Motivo: {historial.find((h) => h.estado_hacia === 'CANCELADO')?.observacion}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Timeline vertical (mobile) */}
      <div className="md:hidden space-y-4">
        {historial.map((item, idx) => {
          const fecha = new Date(item.creado_en).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });

          const esUltimo = idx === historial.length - 1;

          return (
            <div key={item.id} className="flex gap-4">
              {/* Icono y línea */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    esUltimo
                      ? 'bg-primary-500 text-white'
                      : 'bg-secondary text-white'
                  }`}
                >
                  {getEstadoIcon(item.estado_hacia)}
                </div>
                {!esUltimo && (
                  <div className="w-0.5 h-full bg-gray-300 my-2" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 pb-4">
                <p className="font-semibold">
                  {item.estado_desde ? `${item.estado_desde} → ` : ''}
                  {item.estado_hacia}
                </p>
                <p className="text-sm text-gray-600">{fecha}</p>
                {item.usuario_id && (
                  <p className="text-xs text-gray-500">Por usuario #{item.usuario_id}</p>
                )}
                {item.observacion && (
                  <p className="text-sm text-gray-600 italic mt-1">{item.observacion}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

