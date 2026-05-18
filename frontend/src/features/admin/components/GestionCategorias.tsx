import { useState } from 'react';
import { useCategorias, useDeleteCategoria } from '@/entities/categoria/hooks';
import { useUIStore } from '@/shared/store/uiStore';
import { Button, Skeleton, EmptyState, Modal } from '@/shared/ui';
import { FormCategoria } from './FormCategoria';
import type { Categoria } from '@/shared/types';

export function GestionCategorias() {
  const { data: categorias, isLoading } = useCategorias();
  const deleteMutation = useDeleteCategoria();
  const addToast = useUIStore((s) => s.addToast);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);

  const handleEdit = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    setShowFormModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      addToast('success', 'Categoría eliminada correctamente');
      setShowDeleteModal(null);
    } catch (error: any) {
      addToast('error', error.response?.data?.detail || 'Error al eliminar la categoría');
    }
  };

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestión de Categorías</h1>
        <Button onClick={() => setShowFormModal(true)}>
          + Nueva Categoría
        </Button>
      </div>

      {!categorias || categorias.length === 0 ? (
        <EmptyState
          title="No hay categorías"
          description="Agregá la primera categoría para empezar."
          action={{ label: 'Agregar categoría', onClick: () => setShowFormModal(true) }}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-md divide-y">
          {[...categorias]
            .sort((a, b) => {
              // Raíces primero, luego hijos agrupados por padre
              const aRoot = a.parent_id == null ? a.id : a.parent_id;
              const bRoot = b.parent_id == null ? b.id : b.parent_id;
              if (aRoot !== bRoot) return aRoot - bRoot;
              if (a.parent_id == null && b.parent_id != null) return -1;
              if (a.parent_id != null && b.parent_id == null) return 1;
              return a.id - b.id;
            })
            .map((cat) => {
              const esPadre = categorias.some((c) => c.parent_id === cat.id);
              const padre = categorias.find((c) => c.id === cat.parent_id);
              return (
                <div
                  key={cat.id}
                  className={`p-4 hover:bg-gray-50 flex items-center justify-between ${cat.parent_id != null ? 'pl-8 bg-gray-50/50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {cat.parent_id != null && (
                      <span className="text-gray-300 text-sm select-none">└</span>
                    )}
                    <div>
                      <h3 className="font-semibold">{cat.nombre}</h3>
                      {cat.descripcion && (
                        <p className="text-sm text-gray-600">{cat.descripcion}</p>
                      )}
                      {padre && (
                        <p className="text-xs text-gray-400">Dentro de: {padre.nombre}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {esPadre && (
                      <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Categoría padre
                      </span>
                    )}
                    {cat.parent_id != null && (
                      <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        Subcategoría
                      </span>
                    )}
                    <button
                      onClick={() => handleEdit(cat)}
                      className="text-primary-500 hover:underline text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(cat.id)}
                      className="text-danger hover:underline text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {showFormModal && (
        <FormCategoria
          categoria={editingCategoria}
          onClose={() => {
            setShowFormModal(false);
            setEditingCategoria(null);
          }}
        />
      )}

      {showDeleteModal !== null && (
        <Modal
          open
          onClose={() => setShowDeleteModal(null)}
          title="¿Eliminar categoría?"
        >
          <div className="space-y-6">
            <p className="text-gray-600">
              ¿Estás seguro que querés eliminar esta categoría?
            </p>
            <div className="flex gap-3 justify-end">
              <Button onClick={() => setShowDeleteModal(null)} variant="ghost">
                Cancelar
              </Button>
              <Button
                onClick={() => handleDelete(showDeleteModal)}
                variant="danger"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

