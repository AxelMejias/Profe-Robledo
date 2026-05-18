import { useState } from 'react';
import { useProducto } from '@/entities/producto/hooks';
import { useIngredientes } from '@/entities/ingrediente/hooks';
import { useCartStore } from '@/shared/store/cartStore';
import { useUIStore } from '@/shared/store/uiStore';
import { Button, Skeleton, EmptyState } from '@/shared/ui';
import { PersonalizacionModal } from './PersonalizacionModal';
import type { CartItemExtra } from '@/shared/store/cartStore';

const formatARS = (n: number) =>
  new Intl.NumberFormat('es-AR', { maximumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n);

interface ProductoDetalleProps {
  productoId: number;
}

export function ProductoDetalle({ productoId }: ProductoDetalleProps) {
  const { data: producto, isLoading, isError } = useProducto(productoId);
  const { data: todosIngredientes } = useIngredientes();
  const addItem = useCartStore((s) => s.addItem);
  const addToast = useUIStore((s) => s.addToast);

  const [showPersonalizacion, setShowPersonalizacion] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <Skeleton className="h-96 rounded-lg" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (isError || !producto) {
    return (
      <EmptyState
        title="Producto no encontrado"
        description="El producto que buscás no existe o fue eliminado."
        action={{ label: 'Volver al catálogo', onClick: () => window.location.href = '/catalogo' }}
      />
    );
  }

  const isDisponible = producto.disponible && producto.stock_cantidad > 0;
  const ingredientesRemovibles = producto.ingredientes?.filter((i) => i.es_removible) ?? [];

  // Todos los ingredientes de la misma categoría del producto, incluyendo los que ya tiene (para agregar extra)
  const productCategoryNames = (producto.categorias ?? []).map((c) => c.nombre.toLowerCase());
  const extrasDisponibles = (todosIngredientes ?? []).filter((i) => {
    if (!i.disponible_como_extra) return false;
    if (!i.tipo_extra) return true;
    return productCategoryNames.some((cat) => cat.startsWith(i.tipo_extra!));
  });

  const puedePersonalizar = isDisponible && (ingredientesRemovibles.length > 0 || extrasDisponibles.length > 0);

  const makeCartKey = (excluidos: number[], extras: CartItemExtra[]) =>
    `${producto.id}-${[...excluidos].sort().join(',')}-${[...extras].sort((a, b) => a.ingrediente_id - b.ingrediente_id).map((e) => `${e.ingrediente_id}x${e.cantidad}`).join(',')}`;

  const handleAgregarSimple = () => {
    if (!isDisponible) return;
    addItem({
      cartKey: makeCartKey([], []),
      producto_id: producto.id,
      nombre: producto.nombre,
      precio: Number(producto.precio_base),
      imagen_url: producto.imagen_url ?? null,
      personalizacion: [],
      extras: [],
    });
    addToast('success', `${producto.nombre} agregado al carrito`);
  };

  const handleAgregarConPersonalizacion = (excluidos: number[], extras: CartItemExtra[]) => {
    const precioExtras = extras.reduce((sum, e) => sum + e.precio * e.cantidad, 0);
    addItem({
      cartKey: makeCartKey(excluidos, extras),
      producto_id: producto.id,
      nombre: producto.nombre,
      precio: Number(producto.precio_base) + precioExtras,
      imagen_url: producto.imagen_url ?? null,
      personalizacion: excluidos,
      extras,
    });
    const msg = precioExtras > 0
      ? `${producto.nombre} agregado con extras (+$${formatARS(precioExtras)})`
      : `${producto.nombre} agregado al carrito`;
    addToast('success', msg);
    setShowPersonalizacion(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid md:grid-cols-2 gap-8 p-6">
          {/* Imagen */}
          <div className="aspect-square bg-white rounded-lg overflow-hidden">
            {producto.imagen_url ? (
              <img
                src={producto.imagen_url}
                alt={producto.nombre}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Sin imagen
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{producto.nombre}</h1>
              {producto.descripcion && (
                <p className="text-gray-600">{producto.descripcion}</p>
              )}
            </div>

            {/* Precio y stock */}
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary-500">
                ${formatARS(Number(producto.precio_base))}
              </div>
              <div className="text-sm text-gray-600">
                {producto.stock_cantidad > 0 ? (
                  <span>Stock disponible: {producto.stock_cantidad}</span>
                ) : (
                  <span className="text-danger">Sin stock</span>
                )}
              </div>
            </div>

            {/* Categorías */}
            {producto.categorias && producto.categorias.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Categorías</h3>
                <div className="flex flex-wrap gap-2">
                  {producto.categorias.map((cat) => (
                    <span
                      key={cat.id}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border border-gray-200 text-gray-700 bg-gray-100"
                    >
                      {cat.nombre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Ingredientes — alérgenos con borde rojo */}
            {producto.ingredientes && producto.ingredientes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Ingredientes</h3>
                <div className="flex flex-wrap gap-2">
                  {producto.ingredientes.map((ing) => (
                    <span
                      key={ing.ingrediente_id}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border ${
                        ing.es_alergeno
                          ? 'border-red-400 text-red-600 bg-white'
                          : 'border-gray-200 text-gray-700 bg-gray-100'
                      }`}
                    >
                      {ing.nombre}{ing.cantidad > 1 ? ` ×${ing.cantidad}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="space-y-3">
              <Button
                onClick={handleAgregarSimple}
                disabled={!isDisponible}
                size="lg"
                className="w-full"
              >
                {isDisponible ? 'Agregar al carrito' : 'No disponible'}
              </Button>

              {puedePersonalizar && (
                <Button
                  onClick={() => setShowPersonalizacion(true)}
                  variant="ghost"
                  size="lg"
                  className="w-full"
                >
                  Personalizar pedido
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de personalización */}
      {showPersonalizacion && (
        <PersonalizacionModal
          producto={producto}
          ingredientes={ingredientesRemovibles}
          extrasDisponibles={extrasDisponibles}
          onConfirm={handleAgregarConPersonalizacion}
          onCancel={() => setShowPersonalizacion(false)}
        />
      )}
    </div>
  );
}
