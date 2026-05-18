import { useState } from 'react';
import { useProductos, useUpdateStock } from '@/entities/producto/hooks';
import { useUIStore } from '@/shared/store/uiStore';
import { Skeleton, Button, Input } from '@/shared/ui';

const stockBadge = (qty: number) => {
  if (qty < 10)  return { label: 'Bajo',  cls: 'bg-red-100 text-red-700' };
  if (qty < 50)  return { label: 'Medio', cls: 'bg-orange-100 text-orange-700' };
  if (qty > 100) return { label: 'Alto',  cls: 'bg-green-100 text-green-700' };
  return null;
};

export function GestionStock() {
  const { data, isLoading } = useProductos({ size: 50 });
  const updateStockMutation = useUpdateStock();
  const addToast = useUIStore((s) => s.addToast);

  const [editingStock, setEditingStock] = useState<Record<number, number>>({});

  const handleStockChange = (id: number, cantidad: number) => {
    setEditingStock((prev) => ({ ...prev, [id]: cantidad }));
  };

  const handleSaveStock = async (id: number, currentStock: number) => {
    const newStock = editingStock[id];
    
    if (newStock === undefined || newStock === currentStock) return;

    try {
      await updateStockMutation.mutateAsync({ id, cantidad: newStock });
      addToast('success', 'Stock actualizado correctamente');
      
      // Limpiar el estado editado
      setEditingStock((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (error: any) {
      addToast('error', error.response?.data?.detail || 'Error al actualizar el stock');
    }
  };

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestión de Stock</h1>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Producto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Stock Actual
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Nuevo Stock
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.items.map((producto) => (
              <tr
                key={producto.id}
                className={`hover:bg-gray-50 ${
                  producto.stock_cantidad === 0 ? 'bg-red-50' : ''
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium">{producto.nombre}</div>
                  {producto.stock_cantidad === 0 && (
                    <div className="text-xs text-danger">Sin stock</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${producto.stock_cantidad === 0 ? 'text-danger' : ''}`}>
                      {producto.stock_cantidad}
                    </span>
                    {(() => {
                      const badge = stockBadge(producto.stock_cantidad);
                      return badge ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>
                          {badge.label}
                        </span>
                      ) : null;
                    })()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Input
                    type="number"
                    min={0}
                    value={editingStock[producto.id] ?? producto.stock_cantidad}
                    onChange={(e) =>
                      handleStockChange(producto.id, Number(e.target.value))
                    }
                    className="w-24"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <Button
                    onClick={() => handleSaveStock(producto.id, producto.stock_cantidad)}
                    size="sm"
                    disabled={
                      updateStockMutation.isPending ||
                      editingStock[producto.id] === undefined ||
                      editingStock[producto.id] === producto.stock_cantidad
                    }
                  >
                    Guardar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
