import { useState } from 'react';
import { useDirecciones, useDeleteDireccion, useMarcarPrincipal } from '@/entities/direccion/hooks';
import { useUIStore } from '@/shared/store/uiStore';
import { Skeleton, EmptyState, Badge, Button, Modal } from '@/shared/ui';
import { FormDireccion } from './FormDireccion';
import type { DireccionEntrega } from '@/shared/types';

export function ListaDirecciones() {
  const { data: direcciones, isLoading, isError } = useDirecciones();
  const deleteMutation = useDeleteDireccion();
  const marcarPrincipalMutation = useMarcarPrincipal();
  const addToast = useUIStore((s) => s.addToast);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingDireccion, setEditingDireccion] = useState<DireccionEntrega | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);

  const handleEdit = (direccion: DireccionEntrega) => {
    setEditingDireccion(direccion);
    setShowFormModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      addToast('success', 'Dirección eliminada correctamente');
      setShowDeleteModal(null);
    } catch (error: any) {
      addToast('error', error.response?.data?.detail || 'Error al eliminar la dirección');
    }
  };

  const handleMarcarPrincipal = async (id: number) => {
    try {
      await marcarPrincipalMutation.mutateAsync(id);
      addToast('success', 'Dirección principal actualizada');
    } catch (error: any) {
      addToast('error', error.response?.data?.detail || 'Error al marcar como principal');
    }
  };

  const handleCloseForm = () => {
    setShowFormModal(false);
    setEditingDireccion(null);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <Skeleton className="h-12 w-64" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <EmptyState
          title="Error al cargar direcciones"
          description="No pudimos cargar tus direcciones. Intentá de nuevo más tarde."
          action={{ label: 'Reintentar', onClick: () => window.location.reload() }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mis direcciones</h1>
        <Button onClick={() => setShowFormModal(true)}>
          Agregar dirección
        </Button>
      </div>

      {/* Lista de direcciones */}
      {!direcciones || direcciones.length === 0 ? (
        <EmptyState
          title="No tenés direcciones guardadas"
          description="Agregá una dirección de entrega para poder hacer pedidos."
          action={{ label: 'Agregar primera dirección', onClick: () => setShowFormModal(true) }}
        />
      ) : (
        <div className="space-y-4">
          {direcciones.map((dir) => (
            <div
              key={dir.id}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Alias y badge principal */}
                  {dir.alias && (
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{dir.alias}</h3>
                      {dir.es_principal && (
                        <Badge variant="primary">Principal</Badge>
                      )}
                    </div>
                  )}

                  {/* Dirección completa */}
                  <div className="text-gray-700 space-y-1">
                    <p>{dir.linea1}</p>
                    {dir.linea2 && <p>{dir.linea2}</p>}
                    <p>
                      {dir.ciudad}, CP {dir.codigo_postal}
                    </p>
                    {dir.referencia && (
                      <p className="text-sm text-gray-600 italic">
                        Ref: {dir.referencia}
                      </p>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex flex-col gap-2 ml-4">
                  {!dir.es_principal && (
                    <Button
                      onClick={() => handleMarcarPrincipal(dir.id)}
                      variant="ghost"
                      size="sm"
                      disabled={marcarPrincipalMutation.isPending}
                    >
                      Marcar principal
                    </Button>
                  )}
                  <Button
                    onClick={() => handleEdit(dir)}
                    variant="ghost"
                    size="sm"
                  >
                    Editar
                  </Button>
                  <Button
                    onClick={() => setShowDeleteModal(dir.id)}
                    variant="danger"
                    size="sm"
                    disabled={deleteMutation.isPending}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de formulario */}
      {showFormModal && (
        <FormDireccion
          direccion={editingDireccion}
          onClose={handleCloseForm}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal !== null && (
        <Modal
          open
          onClose={() => setShowDeleteModal(null)}
          title="¿Eliminar dirección?"
        >
          <div className="space-y-6">
            <p className="text-gray-600">
              ¿Estás seguro que querés eliminar esta dirección? Esta acción no se puede deshacer.
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
