import { useState } from 'react';
import { useProductos, useDeleteProducto } from '@/entities/producto/hooks';
import { useUIStore } from '@/shared/store/uiStore';
import { Button, Skeleton, EmptyState, Badge, Modal } from '@/shared/ui';
import { FormProducto } from './FormProducto';
import type { Producto } from '@/shared/types';

export function GestionProductos() {
  const { data, isLoading } = useProductos({ incluir_eliminados: false, size: 50 });
  const deleteMutation = useDeleteProducto();
  const addToast = useUIStore((s) => s.addToast);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);

  const handleEdit = (producto: Producto) => {
    setEditingProducto(producto);
    setShowFormModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      addToast('success', 'Producto eliminado correctamente');
      setShowDeleteModal(null);
    } catch (error: any) {
      addToast('error', error.response?.data?.detail || 'Error al eliminar el producto');
    }
  };

  const handleCloseForm = () => {
    setShowFormModal(false);
    setEditingProducto(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestión de Productos</h1>
        <Button onClick={() => setShowFormModal(true)}>
          + Nuevo Producto
        </Button>
      </div>

      {!data?.items || data.items.length === 0 ? (
        <EmptyState
          title="No hay productos"
          description="Agregá el primer producto para empezar."
          action={{ label: 'Agregar producto', onClick: () => setShowFormModal(true) }}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.items.map((producto) => (
                <tr key={producto.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {producto.imagen_url ? (
                          <img
                            src={producto.imagen_url}
                            alt={producto.nombre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            Sin img
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="font-medium">{producto.nombre}</div>
                        {producto.descripcion && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {producto.descripcion}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold">${producto.precio_base}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={producto.stock_cantidad === 0 ? 'text-danger font-semibold' : ''}>
                      {producto.stock_cantidad}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={producto.disponible ? 'secondary' : 'gray'}
                      size="sm"
                    >
                      {producto.disponible ? 'Disponible' : 'No disponible'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => handleEdit(producto)}
                      className="text-primary hover:underline mr-4"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(producto.id)}
                      className="text-danger hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de formulario */}
      {showFormModal && (
        <FormProducto
          producto={editingProducto}
          onClose={handleCloseForm}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal !== null && (
        <Modal
          open
          onClose={() => setShowDeleteModal(null)}
          title="¿Eliminar producto?"
        >
          <div className="space-y-6">
            <p className="text-gray-600">
              ¿Estás seguro que querés eliminar este producto? Esta acción no se puede deshacer.
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
