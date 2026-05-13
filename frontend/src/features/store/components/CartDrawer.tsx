import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '@/shared/store/cartStore';
import { useUIStore } from '@/shared/store/uiStore';
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

  const [isValidating, setIsValidating] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showConfirmRemove, setShowConfirmRemove] = useState<number | null>(null);

  const handleValidar = async () => {
    setIsValidating(true);

    try {
      const result = await validarCarrito(
        items.map((i) => ({
          producto_id: i.producto_id,
          cantidad: i.cantidad,
          personalizacion: i.personalizacion,
        }))
      );

      if (result.valido) {
        addToast({
          id: crypto.randomUUID(),
          type: 'success',
          message: '✓ Carrito válido. Podés continuar con tu pedido.',
        });
      } else {
        addToast({
          id: crypto.randomUUID(),
          type: 'error',
          message: `Problemas con el carrito:\n${result.errores.join('\n')}`,
        });
      }
    } catch (error) {
      addToast({
        id: crypto.randomUUID(),
        type: 'error',
        message: 'Error al validar el carrito. Intentá de nuevo.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleCrearPedido = () => {
    onClose?.();
    navigate('/checkout');
  };

  const handleDecrementar = (producto_id: number, cantidadActual: number) => {
    if (cantidadActual === 1) {
      setShowConfirmRemove(producto_id);
    } else {
      updateCantidad(producto_id, cantidadActual - 1);
    }
  };

  const handleRemove = (producto_id: number) => {
    removeItem(producto_id);
    setShowConfirmRemove(null);
    addToast({
      id: crypto.randomUUID(),
      type: 'info',
      message: 'Producto removido del carrito',
    });
  };

  const handleClearCart = () => {
    clearCart();
    setShowConfirmClear(false);
    addToast({
      id: crypto.randomUUID(),
      type: 'info',
      message: 'Carrito vaciado',
    });
  };

  if (items.length === 0) {
    return (
      <div className={`${isOpen ? 'block' : 'hidden'} bg-white rounded-lg shadow-sm p-6`}>
        <EmptyState
          title="El carrito está vacío"
          message="Agregá productos del catálogo para empezar tu pedido."
          actionLabel="Ver catálogo"
          onAction={() => navigate('/catalogo')}
        />
      </div>
    );
  }

  return (
    <>
      <div className={`${isOpen ? 'block' : 'hidden'} bg-white rounded-lg shadow-sm p-6 space-y-6`}>
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
            <div key={item.producto_id} className="flex gap-4 pb-4 border-b">
              {/* Imagen */}
              <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                {item.imagen_url ? (
                  <img
                    src={item.imagen_url}
                    alt={item.nombre}
                    className="w-full h-full object-cover"
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
                  className="font-medium hover:text-primary transition-colors"
                >
                  {item.nombre}
                </Link>

                {item.personalizacion.length > 0 && (
                  <p className="text-xs text-gray-600">
                    Sin: {item.personalizacion.length} ingrediente(s)
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">
                    ${item.precio}
                  </span>

                  {/* Controles de cantidad */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDecrementar(item.producto_id, item.cantidad)}
                      className="w-8 h-8 rounded-md border hover:bg-gray-100 flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">
                      {item.cantidad}
                    </span>
                    <button
                      onClick={() => updateCantidad(item.producto_id, item.cantidad + 1)}
                      className="w-8 h-8 rounded-md border hover:bg-gray-100 flex items-center justify-center"
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleRemove(item.producto_id)}
                      className="ml-2 text-danger hover:text-red-700"
                      title="Remover"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="text-right text-sm text-gray-600">
                  Subtotal: ${item.precio * item.cantidad}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Totales */}
        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">${subtotal()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Envío</span>
            <span className="font-medium">${costoEnvio()}</span>
          </div>
          <div className="flex justify-between text-xl font-bold pt-2 border-t">
            <span>Total</span>
            <span className="text-primary">${total()}</span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="space-y-3">
          <Button
            onClick={handleValidar}
            variant="outline"
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
            Crear pedido
          </Button>
        </div>
      </div>

      {/* Modal de confirmación para vaciar carrito */}
      {showConfirmClear && (
        <Modal
          isOpen
          onClose={() => setShowConfirmClear(false)}
          title="¿Vaciar carrito?"
        >
          <div className="space-y-6">
            <p className="text-gray-600">
              ¿Estás seguro que querés vaciar el carrito? Se perderán todos los productos agregados.
            </p>
            <div className="flex gap-3 justify-end">
              <Button onClick={() => setShowConfirmClear(false)} variant="outline">
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
          isOpen
          onClose={() => setShowConfirmRemove(null)}
          title="¿Remover producto?"
        >
          <div className="space-y-6">
            <p className="text-gray-600">
              ¿Querés remover este producto del carrito?
            </p>
            <div className="flex gap-3 justify-end">
              <Button onClick={() => setShowConfirmRemove(null)} variant="outline">
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
