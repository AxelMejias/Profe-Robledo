import { useState, useEffect } from 'react';
import { useCategorias } from '@/entities/categoria/hooks';
import { Input, Skeleton } from '@/shared/ui';

interface FiltrosCatalogoProps {
  onCategoriaChange?: (categoria_id?: number) => void;
  onBusquedaChange?: (busqueda: string) => void;
  onPrecioChange?: (min: number, max: number) => void;
  selectedCategoria?: number;
}

export function FiltrosCatalogo({
  onCategoriaChange,
  onBusquedaChange,
  onPrecioChange,
  selectedCategoria,
}: FiltrosCatalogoProps) {
  const { data: categorias, isLoading } = useCategorias();
  const [busqueda, setBusqueda] = useState('');
  const [precioMin, setPrecioMin] = useState(0);
  const [precioMax, setPrecioMax] = useState(5000);

  // Debounce búsqueda 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      onBusquedaChange?.(busqueda);
    }, 500);

    return () => clearTimeout(timer);
  }, [busqueda, onBusquedaChange]);

  const handleLimpiarFiltros = () => {
    setBusqueda('');
    setPrecioMin(0);
    setPrecioMax(5000);
    onCategoriaChange?.(undefined);
    onBusquedaChange?.('');
    onPrecioChange?.(0, 5000);
  };

  return (
    <aside className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filtros</h2>
        <button
          onClick={handleLimpiarFiltros}
          className="text-sm text-primary hover:underline"
        >
          Limpiar
        </button>
      </div>

      {/* Búsqueda */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Buscar
        </label>
        <Input
          type="text"
          placeholder="Ej: pizza, hamburguesa..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Categorías */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Categoría
        </label>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 rounded" />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            <button
              onClick={() => onCategoriaChange?.(undefined)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                !selectedCategoria
                  ? 'bg-primary text-white'
                  : 'hover:bg-gray-100'
              }`}
            >
              Todas
            </button>

            {categorias?.map((categoria) => (
              <button
                key={categoria.id}
                onClick={() => onCategoriaChange?.(categoria.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedCategoria === categoria.id
                    ? 'bg-primary text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                {categoria.nombre}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Rango de precio */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Rango de precio
        </label>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={0}
              value={precioMin}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPrecioMin(val);
                onPrecioChange?.(val, precioMax);
              }}
              placeholder="Mín"
              className="w-24"
            />
            <span className="text-gray-500">-</span>
            <Input
              type="number"
              min={0}
              value={precioMax}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPrecioMax(val);
                onPrecioChange?.(precioMin, val);
              }}
              placeholder="Máx"
              className="w-24"
            />
          </div>

          <div className="text-xs text-gray-500">
            ${precioMin} - ${precioMax}
          </div>
        </div>
      </div>
    </aside>
  );
}
