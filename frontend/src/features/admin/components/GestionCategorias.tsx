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
        <div className="bg-white rounded-lg shadow-sm divide-y">
          {categorias.map((cat) => (
            <div key={cat.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{cat.nombre}</h3>
                {cat.descripcion && (
                  <p className="text-sm text-gray-600">{cat.descripcion}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(cat)}
                  className="text-primary hover:underline text-sm"
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
          ))}
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
