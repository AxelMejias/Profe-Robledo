import { useProductos } from '@/entities/producto/hooks';
import { Skeleton, EmptyState } from '@/shared/ui';
import { ProductoCard } from './ProductoCard';

interface CatalogoGridProps {
  filters?: {
    page?: number;
    size?: number;
    categoria_id?: number;
    search?: string;
    precio_min?: number;
    precio_max?: number;
    excluir_alergenos?: number[];
  };
  onPageChange?: (page: number) => void;
}

export function CatalogoGrid({ filters = {}, onPageChange }: CatalogoGridProps) {
  const { data, isLoading, isError } = useProductos({
    page: filters.page ?? 1,
    size: filters.size ?? 12,
    categoria_id: filters.categoria_id,
    search: filters.search,
    precio_min: filters.precio_min,
    precio_max: filters.precio_max,
    excluir_alergenos: filters.excluir_alergenos,
    disponible: true,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-80 rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="Error al cargar productos"
        description="No pudimos cargar el catálogo. Intentá de nuevo más tarde."
        action={{ label: 'Reintentar', onClick: () => window.location.reload() }}
      />
    );
  }

  if (!data?.items || data.items.length === 0) {
    return (
      <EmptyState
        title="No encontramos productos"
        description="No hay productos que coincidan con tu búsqueda. Probá con otros filtros."
        action={{ label: 'Limpiar filtros', onClick: () => window.location.href = '/catalogo' }}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Grid de productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data.items.map((producto) => (
          <ProductoCard key={producto.id} producto={producto} />
        ))}
      </div>

      {/* Paginación */}
      {data.pages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => onPageChange?.(data.page - 1)}
            disabled={data.page === 1}
            className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Anterior
          </button>

          <span className="text-sm text-gray-600">
            Página {data.page} de {data.pages}
          </span>

          <button
            onClick={() => onPageChange?.(data.page + 1)}
            disabled={data.page === data.pages}
            className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
