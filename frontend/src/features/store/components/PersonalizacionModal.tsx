import { useState } from 'react';
import { Modal, Button, Badge } from '@/shared/ui';
import type { Producto, Ingrediente } from '@/shared/types';

interface PersonalizacionModalProps {
  producto: Producto;
  ingredientes: Ingrediente[];
  onConfirm: (ingredientesExcluidos: number[]) => void;
  onCancel: () => void;
}

export function PersonalizacionModal({
  producto,
  ingredientes,
  onConfirm,
  onCancel,
}: PersonalizacionModalProps) {
  const [excluidos, setExcluidos] = useState<number[]>([]);

  const toggleIngrediente = (id: number) => {
    setExcluidos((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    );
  };

  const handleConfirmar = () => {
    onConfirm(excluidos);
  };

  return (
    <Modal
      isOpen
      onClose={onCancel}
      title={`Personalizar ${producto.nombre}`}
    >
      <div className="space-y-6">
        <p className="text-sm text-gray-600">
          Seleccioná los ingredientes que querés excluir de tu pedido.
        </p>

        {/* Lista de ingredientes */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {ingredientes.map((ing) => (
            <label
              key={ing.id}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={excluidos.includes(ing.id)}
                onChange={() => toggleIngrediente(ing.id)}
                className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
              />

              <div className="flex-1 flex items-center gap-2">
                <span className="font-medium">{ing.nombre}</span>
                {ing.es_alergeno && (
                  <Badge variant="danger" size="sm">
                    ⚠ Alérgeno
                  </Badge>
                )}
              </div>
            </label>
          ))}
        </div>

        {/* Resumen de exclusiones */}
        {excluidos.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Ingredientes excluidos ({excluidos.length}):
            </p>
            <div className="flex flex-wrap gap-2">
              {excluidos.map((id) => {
                const ing = ingredientes.find((i) => i.id === id);
                return ing ? (
                  <Badge key={id} variant="secondary">
                    {ing.nombre}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 justify-end">
          <Button onClick={onCancel} variant="outline">
            Cancelar
          </Button>
          <Button onClick={handleConfirmar}>
            Agregar al carrito
          </Button>
        </div>
      </div>
    </Modal>
  );
}
