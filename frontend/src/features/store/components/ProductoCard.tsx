import { Link } from 'react-router-dom';
import { useCartStore } from '@/shared/store/cartStore';
import { useUIStore } from '@/shared/store/uiStore';
import { Button } from '@/shared/ui';
import type { Producto } from '@/shared/types';

interface ProductoCardProps {
  producto: Producto;
}

export function ProductoCard({ producto }: ProductoCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const addToast = useUIStore((s) => s.addToast);

  const isDisponible = producto.disponible && producto.stock_cantidad > 0;

  const handleAgregar = (e: React.MouseEvent) => {
    e.preventDefault(); // Evitar navegación del Link padre

    if (!isDisponible) return;

    addItem({
      producto_id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio_base,
      imagen_url: producto.imagen_url ?? null,
      personalizacion: [],
    });

    addToast('success', `${producto.nombre} agregado al carrito`);
  };

  return (
    <Link
      to={`/producto/${producto.id}`}
      className="group block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {/* Imagen */}
      <div className="aspect-square bg-gray-100 overflow-hidden">
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Sin imagen
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
          {producto.nombre}
        </h3>

        {producto.descripcion && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {producto.descripcion}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary">
            ${producto.precio_base}
          </span>

          <Button
            onClick={handleAgregar}
            disabled={!isDisponible}
            size="sm"
            variant={isDisponible ? 'primary' : 'ghost'}
          >
            {isDisponible ? 'Agregar' : 'No disponible'}
          </Button>
        </div>
      </div>
    </Link>
  );
}
