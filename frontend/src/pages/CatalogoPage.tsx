import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CatalogoGrid, FiltrosCatalogo } from '@/features/store';

export function CatalogoPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [categoriaId, setCategoriaId] = useState<number | undefined>(
    searchParams.get('categoria') ? Number(searchParams.get('categoria')) : undefined
  );
  const [busqueda, setBusqueda] = useState('');
  const [precioMin, setPrecioMin] = useState(0);
  const [precioMax, setPrecioMax] = useState(0);
  const [excluirAlergenos, setExcluirAlergenos] = useState<number[]>([]);

  const handleCategoriaChange = (id?: number) => {
    setCategoriaId(id);
    setPage(1);
    if (id) {
      searchParams.set('categoria', String(id));
    } else {
      searchParams.delete('categoria');
    }
    setSearchParams(searchParams);
  };

  const handleBusquedaChange = (term: string) => {
    setBusqueda(term);
    setPage(1);
  };

  const handlePrecioChange = (min: number, max: number) => {
    setPrecioMin(min);
    setPrecioMax(max);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Catálogo de Productos</h1>

      <div className="grid lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <FiltrosCatalogo
            selectedCategoria={categoriaId}
            onCategoriaChange={handleCategoriaChange}
            onBusquedaChange={handleBusquedaChange}
            onPrecioChange={handlePrecioChange}
            onAlergenos={(ids) => { setExcluirAlergenos(ids); setPage(1); }}
          />
        </aside>

        <main className="lg:col-span-3">
          <CatalogoGrid
            filters={{
              page,
              size: 12,
              categoria_id: categoriaId,
              search: busqueda || undefined,
              precio_min: precioMin > 0 ? precioMin : undefined,
              precio_max: precioMax > 0 ? precioMax : undefined,
              excluir_alergenos: excluirAlergenos.length > 0 ? excluirAlergenos : undefined,
            }}
            onPageChange={setPage}
          />
        </main>
      </div>
    </div>
  );
}
