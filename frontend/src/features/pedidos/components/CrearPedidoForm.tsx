import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreatePedido } from '@/entities/pedido/hooks';
import { useDirecciones } from '@/entities/direccion/hooks';
import { useCartStore } from '@/shared/store/cartStore';
import { useUIStore } from '@/shared/store/uiStore';
import { Button, EmptyState, Badge, Skeleton } from '@/shared/ui';

const FORMAS_PAGO = [
  { codigo: 'EFECTIVO', nombre: 'Efectivo', descripcion: 'Pago en efectivo al recibir' },
  { codigo: 'MERCADOPAGO', nombre: 'MercadoPago', descripcion: 'Tarjeta de crédito/débito' },
];

export function CrearPedidoForm() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const total = useCartStore((s) => s.total);
  const addToast = useUIStore((s) => s.addToast);

  const { data: direcciones, isLoading: loadingDirecciones } = useDirecciones();
  const createPedido = useCreatePedido();

  const [direccionSeleccionada, setDireccionSeleccionada] = useState<number | null>(null);
  const [formaPagoSeleccionada, setFormaPagoSeleccionada] = useState<string>('EFECTIVO');
  const [notas, setNotas] = useState('');

  // Preseleccionar dirección principal si existe
  useState(() => {
    if (direcciones && !direccionSeleccionada) {
      const principal = direcciones.find((d) => d.es_principal);
      if (principal) {
        setDireccionSeleccionada(principal.id);
      }
    }
  });

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <EmptyState
          title="El carrito está vacío"
          message="Agregá productos al carrito antes de crear un pedido."
          actionLabel="Ir al catálogo"
          onAction={() => navigate('/catalogo')}
        />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!direccionSeleccionada) {
      addToast({
        id: crypto.randomUUID(),
        type: 'error',
        message: 'Seleccioná una dirección de entrega',
      });
      return;
    }

    try {
      const pedido = await createPedido.mutateAsync({
        direccion_id: direccionSeleccionada,
        forma_pago_codigo: formaPagoSeleccionada,
        notas: notas || undefined,
        items: items.map((item) => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          personalizacion: item.personalizacion,
        })),
      });

      addToast({
        id: crypto.randomUUID(),
        type: 'success',
        message: `Pedido #${pedido.id} creado correctamente`,
      });

      clearCart();

      // Si es MP, redirigir al checkout
      if (formaPagoSeleccionada === 'MERCADOPAGO') {
        navigate(`/pago-mp/${pedido.id}`);
      } else {
        navigate(`/pedidos/${pedido.id}`);
      }
    } catch (error: any) {
      addToast({
        id: crypto.randomUUID(),
        type: 'error',
        message: error.response?.data?.detail || 'Error al crear el pedido',
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Crear pedido</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selección de dirección */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Dirección de entrega</h2>
            <button
              type="button"
              onClick={() => navigate('/perfil/direcciones')}
              className="text-sm text-primary hover:underline"
            >
              Gestionar direcciones
            </button>
          </div>

          {loadingDirecciones ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : !direcciones || direcciones.length === 0 ? (
            <EmptyState
              title="No tenés direcciones"
              message="Agregá una dirección de entrega para continuar."
              actionLabel="Agregar dirección"
              onAction={() => navigate('/perfil/direcciones')}
            />
          ) : (
            <div className="space-y-3">
              {direcciones.map((dir) => (
                <label
                  key={dir.id}
                  className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    direccionSeleccionada === dir.id
                      ? 'border-primary bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="direccion"
                    value={dir.id}
                    checked={direccionSeleccionada === dir.id}
                    onChange={() => setDireccionSeleccionada(dir.id)}
                    className="sr-only"
                  />
                  <div className="flex items-start justify-between">
                    <div>
                      {dir.alias && (
                        <p className="font-medium flex items-center gap-2">
                          {dir.alias}
                          {dir.es_principal && <Badge size="sm">Principal</Badge>}
                        </p>
                      )}
                      <p className="text-sm text-gray-700">{dir.linea1}</p>
                      {dir.linea2 && <p className="text-sm text-gray-600">{dir.linea2}</p>}
                      <p className="text-sm text-gray-600">
                        {dir.ciudad}, CP {dir.codigo_postal}
                      </p>
                    </div>
                    {direccionSeleccionada === dir.id && (
                      <span className="text-primary text-xl">✓</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Forma de pago */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Forma de pago</h2>
          <div className="space-y-3">
            {FORMAS_PAGO.map((fp) => (
              <label
                key={fp.codigo}
                className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formaPagoSeleccionada === fp.codigo
                    ? 'border-primary bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="forma_pago"
                  value={fp.codigo}
                  checked={formaPagoSeleccionada === fp.codigo}
                  onChange={() => setFormaPagoSeleccionada(fp.codigo)}
                  className="sr-only"
                />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{fp.nombre}</p>
                    <p className="text-sm text-gray-600">{fp.descripcion}</p>
                  </div>
                  {formaPagoSeleccionada === fp.codigo && (
                    <span className="text-primary text-xl">✓</span>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Notas adicionales */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Notas adicionales (opcional)</h2>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Ej: Tocar timbre, no hay portero eléctrico"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Resumen */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Resumen del pedido</h2>
          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <div key={item.producto_id} className="flex justify-between text-sm">
                <span>
                  {item.nombre} × {item.cantidad}
                </span>
                <span>${item.precio * item.cantidad}</span>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t">
            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span className="text-primary">${total()}</span>
            </div>
          </div>
        </div>

        {/* Botón de envío */}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={createPedido.isPending || !direccionSeleccionada}
        >
          {createPedido.isPending
            ? 'Creando pedido...'
            : formaPagoSeleccionada === 'MERCADOPAGO'
            ? 'Continuar al pago'
            : 'Crear pedido'}
        </Button>
      </form>
    </div>
  );
}
