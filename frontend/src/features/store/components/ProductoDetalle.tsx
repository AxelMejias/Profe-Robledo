import { useState } from 'react';
import { useProducto } from '@/entities/producto/hooks';
import { useCartStore } from '@/shared/store/cartStore';
import { useUIStore } from '@/shared/store/uiStore';
import { Button, Badge, Skeleton, EmptyState } from '@/shared/ui';
import { PersonalizacionModal } from './PersonalizacionModal';
import type { Ingrediente } from '@/shared/types';

interface ProductoDetalleProps {
  productoId: number;
}

export function ProductoDetalle({ productoId }: ProductoDetalleProps) {
  const { data: producto, isLoading, isError } = useProducto(productoId);
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
        message="El producto que buscás no existe o fue eliminado."
        actionLabel="Volver al catálogo"
        onAction={() => window.location.href = '/catalogo'}
      />
    );
  }

  const isDisponible = producto.disponible && producto.stock_cantidad > 0;
  const ingredientesRemovibles = producto.ingredientes?.filter((i) => {
    // Asumimos que todos los ingredientes son removibles por defecto
    // En producción, esto vendría de la relación ProductoIngrediente.es_removible
    return true;
  }) ?? [];

  const handleAgregarSimple = () => {
    if (!isDisponible) return;

    addItem({
      producto_id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio_base,
      imagen_url: producto.imagen_url ?? null,
      personalizacion: [],
    });

    addToast({
      id: crypto.randomUUID(),
      type: 'success',
      message: `${producto.nombre} agregado al carrito`,
    });
  };

  const handleAgregarConPersonalizacion = (ingredientesExcluidos: number[]) => {
    addItem({
      producto_id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio_base,
      imagen_url: producto.imagen_url ?? null,
      personalizacion: ingredientesExcluidos,
    });

    addToast({
      id: crypto.randomUUID(),
      type: 'success',
      message: `${producto.nombre} agregado al carrito con personalización`,
    });

    setShowPersonalizacion(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="grid md:grid-cols-2 gap-8 p-6">
          {/* Imagen */}
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {producto.imagen_url ? (
              <img
                src={producto.imagen_url}
                alt={producto.nombre}
                className="w-full h-full object-cover"
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
              <div className="text-4xl font-bold text-primary">
                ${producto.precio_base}
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
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Categorías
                </h3>
                <div className="flex flex-wrap gap-2">
                  {producto.categorias.map((cat) => (
                    <Badge key={cat.id} variant="secondary">
                      {cat.nombre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Ingredientes */}
            {producto.ingredientes && producto.ingredientes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Ingredientes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {producto.ingredientes.map((ing) => (
                    <Badge
                      key={ing.id}
                      variant={ing.es_alergeno ? 'danger' : 'default'}
                    >
                      {ing.nombre}
                      {ing.es_alergeno && ' ⚠ Alérgeno'}
                    </Badge>
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

              {isDisponible && ingredientesRemovibles.length > 0 && (
                <Button
                  onClick={() => setShowPersonalizacion(true)}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  Personalizar (sin ingredientes)
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
          onConfirm={handleAgregarConPersonalizacion}
          onCancel={() => setShowPersonalizacion(false)}
        />
      )}
    </div>
  );
}
