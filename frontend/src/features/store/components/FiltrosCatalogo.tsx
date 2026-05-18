import { useState, useEffect } from 'react';
import { useCategorias } from '@/entities/categoria/hooks';
import { useIngredientes } from '@/entities/ingrediente/hooks';
import { Input, Skeleton } from '@/shared/ui';

interface FiltrosCatalogoProps {
  onCategoriaChange?: (categoria_id?: number) => void;
  onBusquedaChange?: (busqueda: string) => void;
  onPrecioChange?: (min: number, max: number) => void;
  onAlergenos?: (ids: number[]) => void;
  selectedCategoria?: number;
}

export function FiltrosCatalogo({
  onCategoriaChange,
  onBusquedaChange,
  onPrecioChange,
  onAlergenos,
  selectedCategoria,
}: FiltrosCatalogoProps) {
  const { data: categorias, isLoading } = useCategorias();
  const { data: ingredientes } = useIngredientes();
  const alergenos = ingredientes?.filter((i) => i.es_alergeno) ?? [];

  const [busqueda, setBusqueda] = useState('');
  const [precioMin, setPrecioMin] = useState(0);
  const [precioMax, setPrecioMax] = useState(0);
  const [alergenosExcluidos, setAlergenosExcluidos] = useState<number[]>([]);
  const [alergenosOpen, setAlergenosOpen] = useState(false);

  // Debounce búsqueda 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      onBusquedaChange?.(busqueda);
    }, 400);
    return () => clearTimeout(timer);
  }, [busqueda, onBusquedaChange]);

  const toggleAlergeno = (id: number) => {
    const next = alergenosExcluidos.includes(id)
      ? alergenosExcluidos.filter((a) => a !== id)
      : [...alergenosExcluidos, id];
    setAlergenosExcluidos(next);
    onAlergenos?.(next);
  };

  const handleLimpiarFiltros = () => {
    setBusqueda('');
    setPrecioMin(0);
    setPrecioMax(0);
    setAlergenosExcluidos([]);
    onCategoriaChange?.(undefined);
    onBusquedaChange?.('');
    onPrecioChange?.(0, 0);
    onAlergenos?.([]);
  };

  return (
    <aside className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filtros</h2>
        <button
          onClick={handleLimpiarFiltros}
          className="text-sm text-primary-500 hover:underline"
        >
          Limpiar
        </button>
      </div>

      {/* Búsqueda */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Buscar</label>
        <Input
          type="text"
          placeholder="Ej: pizza, hamburguesa..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Categorías */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Categoría</label>

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
                !selectedCategoria ? 'bg-primary-500 text-white' : 'hover:bg-gray-100'
              }`}
            >
              Todas
            </button>
            {categorias?.filter((c) => c.parent_id != null).map((categoria) => (
              <button
                key={categoria.id}
                onClick={() => onCategoriaChange?.(categoria.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedCategoria === categoria.id
                    ? 'bg-primary-500 text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                {categoria.nombre}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sin alérgenos — colapsable */}
      {alergenos.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setAlergenosOpen((v) => !v)}
            className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-primary-500 transition-colors"
          >
            <span>
              Sin alérgenos
              {alergenosExcluidos.length > 0 && (
                <span className="ml-1 text-xs text-red-500 font-semibold">
                  ({alergenosExcluidos.length} excluido{alergenosExcluidos.length !== 1 ? 's' : ''})
                </span>
              )}
            </span>
            <span
              className={`text-gray-400 transition-transform duration-200 ${
                alergenosOpen ? 'rotate-180' : ''
              }`}
            >
              ▼
            </span>
          </button>

          {alergenosOpen && (
            <div className="mt-2 space-y-1 max-h-64 overflow-y-auto pr-1">
              {alergenos.map((ing) => {
                const excluido = alergenosExcluidos.includes(ing.id);
                return (
                  <button
                    key={ing.id}
                    type="button"
                    onClick={() => toggleAlergeno(ing.id)}
                    className="w-full flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-1 py-1 text-left"
                  >
                    <div
                      className={`w-4 h-4 flex-shrink-0 rounded border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                        excluido
                          ? 'bg-red-500 border-red-500 text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {excluido && '✕'}
                    </div>
                    <span
                      className={`text-sm transition-colors ${
                        excluido ? 'text-red-500 line-through' : 'text-gray-700'
                      }`}
                    >
                      {ing.nombre}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Rango de precio */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Rango de precio</label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={0}
            value={precioMin || ''}
            onChange={(e) => {
              const val = Number(e.target.value);
              setPrecioMin(val);
              onPrecioChange?.(val, precioMax);
            }}
            placeholder="Mín"
            className="w-24"
          />
          <span className="text-gray-500">–</span>
          <Input
            type="number"
            min={0}
            value={precioMax || ''}
            onChange={(e) => {
              const val = Number(e.target.value);
              setPrecioMax(val);
              onPrecioChange?.(precioMin, val);
            }}
            placeholder="Máx"
            className="w-24"
          />
        </div>
      </div>
    </aside>
  );
}
