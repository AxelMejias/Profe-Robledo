import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '@/shared/store/cartStore';
import { useUIStore } from '@/shared/store/uiStore';
import { useAuthStore } from '@/shared/store/authStore';
import { Button, EmptyState, Modal } from '@/shared/ui';
import { validarCarrito } from '../api/validarCarrito';

interface CartDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function CartDrawer({ isOpen = true, onClose }: CartDrawerProps) {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const updateCantidad = useCartStore((s) => s.updateCantidad);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const subtotal = useCartStore((s) => s.subtotal);
  const costoEnvio = useCartStore((s) => s.costoEnvio);
  const total = useCartStore((s) => s.total);

  const addToast = useUIStore((s) => s.addToast);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [isValidating, setIsValidating] = useState(false);
  const [advertencias, setAdvertencias] = useState<string[]>([]);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showConfirmRemove, setShowConfirmRemove] = useState<string | null>(null);

  const handleValidar = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsValidating(true);

    try {
      const result = await validarCarrito(
        items.map((i) => ({
          producto_id: i.producto_id,
          cantidad: i.cantidad,
          personalizacion: i.personalizacion,
          // Solo mandamos precio si no hay extras; con extras el precio base
          // siempre difiere del precio del carrito y generaría falsos positivos
          precio: i.extras.length === 0 ? i.precio : undefined,
        }))
      );

      setAdvertencias(result.advertencias ?? []);

      if (result.valido) {
        addToast('success', '✓ Carrito válido. Podés continuar con tu pedido.');
      } else {
        addToast('error', `Problemas con el carrito:\n${result.errores.join('\n')}`);
      }
    } catch (error) {
      addToast('error', 'Error al validar el carrito. Intentá de nuevo.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleCrearPedido = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    onClose?.();
    navigate('/checkout');
  };

  const formatARS = (n: number) =>
    new Intl.NumberFormat('es-AR', { maximumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n);

  const handleDecrementar = (cartKey: string, cantidadActual: number) => {
    if (cantidadActual === 1) {
      setShowConfirmRemove(cartKey);
    } else {
      updateCantidad(cartKey, cantidadActual - 1);
    }
  };

  const handleRemove = (cartKey: string) => {
    removeItem(cartKey);
    setShowConfirmRemove(null);
    addToast('info', 'Producto removido del carrito');
  };

  const handleClearCart = () => {
    clearCart();
    setShowConfirmClear(false);
    addToast('info', 'Carrito vaciado');
  };

  if (items.length === 0) {
    return (
      <div className={`${isOpen ? 'block' : 'hidden'} bg-white rounded-lg shadow-md p-6`}>
        <EmptyState
          title="El carrito está vacío"
          description="Agregá productos del catálogo para empezar tu pedido."
          action={{ label: 'Ver catálogo', onClick: () => navigate('/catalogo') }}
        />
      </div>
    );
  }

  return (
    <>
      <div className={`${isOpen ? 'block' : 'hidden'} bg-white rounded-lg shadow-md p-6 space-y-6`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Tu carrito</h2>
          <button
            onClick={() => setShowConfirmClear(true)}
            className="text-sm text-danger hover:underline"
          >
            Vaciar
          </button>
        </div>

        {/* Items */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {items.map((item) => (
            <div key={item.cartKey} className="flex gap-4 pb-4 border-b">
              {/* Imagen */}
              <div className="w-20 h-20 bg-white rounded-md overflow-hidden flex-shrink-0">
                {item.imagen_url ? (
                  <img
                    src={item.imagen_url}
                    alt={item.nombre}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    Sin imagen
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 space-y-1">
                <Link
                  to={`/producto/${item.producto_id}`}
                  className="font-medium hover:text-primary-500 transition-colors"
                >
                  {item.nombre}
                </Link>

                {item.personalizacion.length > 0 && (
                  <p className="text-xs text-gray-500">
                    Sin: {item.personalizacion.length} ingrediente(s)
                  </p>
                )}
                {item.extras.length > 0 && (
                  <p className="text-xs text-gray-500">
                    Con extra: {item.extras.map((e) => e.cantidad > 1 ? `${e.nombre} ×${e.cantidad}` : e.nombre).join(', ')}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary-500">
                    ${formatARS(item.precio)}
                  </span>

                  {/* Controles de cantidad */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDecrementar(item.cartKey, item.cantidad)}
                      className="w-8 h-8 rounded-md border hover:bg-gray-100 flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">
                      {item.cantidad}
                    </span>
                    <button
                      onClick={() => updateCantidad(item.cartKey, item.cantidad + 1)}
                      className="w-8 h-8 rounded-md border hover:bg-gray-100 flex items-center justify-center"
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleRemove(item.cartKey)}
                      className="ml-2 text-danger hover:text-red-700"
                      title="Remover"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="text-right text-sm text-gray-600">
                  Subtotal: ${formatARS(item.precio * item.cantidad)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Totales */}
        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">${formatARS(subtotal())}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Envío</span>
            <span className="font-medium">${formatARS(costoEnvio())}</span>
          </div>
          <div className="flex justify-between text-xl font-bold pt-2 border-t">
            <span>Total</span>
            <span className="text-primary-500">${formatARS(total())}</span>
          </div>
        </div>

        {/* Advertencias de precio */}
        {advertencias.length > 0 && (
          <div className="space-y-2">
            {advertencias.map((adv, i) => (
              <div key={i} className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md px-3 py-2 text-sm">
                <span className="flex-shrink-0">⚠️</span>
                <span>{adv}</span>
              </div>
            ))}
          </div>
        )}

        {/* Banner para invitados */}
        {!isAuthenticated && (
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 text-blue-800 rounded-md px-3 py-2 text-sm">
            <span className="flex-shrink-0">🔒</span>
            <span>
              Para comprar tenés que{' '}
              <Link to="/login" className="font-semibold underline hover:text-blue-600">
                iniciar sesión
              </Link>
              . Tu carrito se guardará.
            </span>
          </div>
        )}

        {/* Botones de acción */}
        <div className="space-y-3">
          <Button
            onClick={handleValidar}
            variant="ghost"
            size="lg"
            className="w-full"
            disabled={isValidating}
          >
            {isValidating ? 'Validando...' : 'Validar stock'}
          </Button>

          <Button
            onClick={handleCrearPedido}
            size="lg"
            className="w-full"
          >
            {isAuthenticated ? 'Crear pedido' : 'Iniciar sesión para comprar'}
          </Button>
        </div>
      </div>

      {/* Modal de confirmación para vaciar carrito */}
      {showConfirmClear && (
        <Modal
          open
          onClose={() => setShowConfirmClear(false)}
          title="¿Vaciar carrito?"
        >
          <div className="space-y-6">
            <p className="text-gray-600">
              ¿Estás seguro que querés vaciar el carrito? Se perderán todos los productos agregados.
            </p>
            <div className="flex gap-3 justify-end">
              <Button onClick={() => setShowConfirmClear(false)} variant="ghost">
                Cancelar
              </Button>
              <Button onClick={handleClearCart} variant="danger">
                Vaciar carrito
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de confirmación para remover item (cuando cantidad = 1) */}
      {showConfirmRemove !== null && (
        <Modal
          open
          onClose={() => setShowConfirmRemove(null)}
          title="¿Remover producto?"
        >
          <div className="space-y-6">
            <p className="text-gray-600">
              ¿Querés remover este producto del carrito?
            </p>
            <div className="flex gap-3 justify-end">
              <Button onClick={() => setShowConfirmRemove(null)} variant="ghost">
                Cancelar
              </Button>
              <Button onClick={() => handleRemove(showConfirmRemove)} variant="danger">
                Remover
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

