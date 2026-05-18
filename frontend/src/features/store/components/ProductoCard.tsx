import { Link } from 'react-router-dom';
import { useCartStore } from '@/shared/store/cartStore';
import { useUIStore } from '@/shared/store/uiStore';
import { Button } from '@/shared/ui';
import type { Producto } from '@/shared/types';

interface ProductoCardProps {
  producto: Producto;
}

const formatARS = (n: number) =>
  new Intl.NumberFormat('es-AR', { maximumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n);

export function ProductoCard({ producto }: ProductoCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const addToast = useUIStore((s) => s.addToast);

  const isDisponible = producto.disponible && producto.stock_cantidad > 0;

  const handleAgregar = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isDisponible) return;
    addItem({
      cartKey: `${producto.id}--`,
      producto_id: producto.id,
      nombre: producto.nombre,
      precio: Number(producto.precio_base),
      imagen_url: producto.imagen_url ?? null,
      personalizacion: [],
      extras: [],
    });
    addToast('success', `${producto.nombre} agregado al carrito`);
  };

  return (
    <Link
      to={`/producto/${producto.id}`}
      className="group flex flex-col bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
    >
      {/* Imagen — altura fija para cards más compactas */}
      <div className="h-44 bg-white overflow-hidden flex-shrink-0">
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            loading="lazy"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            Sin imagen
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary-500 transition-colors">
          {producto.nombre}
        </h3>

        {producto.descripcion && (
          <p className="text-sm text-gray-500 line-clamp-2 flex-1">
            {producto.descripcion}
          </p>
        )}

        <div className="flex items-center justify-between pt-2 mt-auto border-t border-gray-100">
          <span className="text-xl font-bold text-primary-500">
            ${formatARS(Number(producto.precio_base))}
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

