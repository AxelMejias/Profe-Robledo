import { useState } from 'react';
import { Modal, Button, Badge } from '@/shared/ui';
import type { Producto, ProductoIngredienteInfo, Ingrediente } from '@/shared/types';

const MAX_EXTRA = 5;

const formatARS = (n: number) =>
  new Intl.NumberFormat('es-AR', { maximumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n);

interface ExtraSeleccionado {
  ingrediente_id: number;
  nombre: string;
  precio: number;
  cantidad: number;
}

interface PersonalizacionModalProps {
  producto: Producto;
  ingredientes: ProductoIngredienteInfo[];   // removibles del producto
  extrasDisponibles: Ingrediente[];          // todos los ingredientes de la categoría
  onConfirm: (excluidos: number[], extras: ExtraSeleccionado[]) => void;
  onCancel: () => void;
}

export function PersonalizacionModal({
  producto,
  ingredientes,
  extrasDisponibles,
  onConfirm,
  onCancel,
}: PersonalizacionModalProps) {
  const [excluidos, setExcluidos] = useState<number[]>([]);
  const [extrasQty, setExtrasQty] = useState<Record<number, number>>({});

  const toggleExcluido = (id: number) => {
    setExcluidos((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const incrementExtra = (id: number) => {
    setExtrasQty((prev) => ({ ...prev, [id]: Math.min((prev[id] ?? 0) + 1, MAX_EXTRA) }));
  };

  const decrementExtra = (id: number) => {
    setExtrasQty((prev) => {
      const newQty = (prev[id] ?? 0) - 1;
      if (newQty <= 0) {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: newQty };
    });
  };

  const extrasSeleccionados: ExtraSeleccionado[] = Object.entries(extrasQty)
    .filter(([, qty]) => qty > 0)
    .map(([idStr, qty]) => {
      const id = Number(idStr);
      const ing = extrasDisponibles.find((e) => e.id === id);
      return ing
        ? { ingrediente_id: ing.id, nombre: ing.nombre, precio: Number(ing.precio), cantidad: qty }
        : null;
    })
    .filter(Boolean) as ExtraSeleccionado[];

  const precioExtras = extrasSeleccionados.reduce((sum, e) => sum + e.precio * e.cantidad, 0);
  const precioTotal = Number(producto.precio_base) + precioExtras;

  return (
    <Modal open onClose={onCancel} title={`Personalizar ${producto.nombre}`} size="md">
      <div className="space-y-6">

        {/* Quitar ingredientes */}
        {ingredientes.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Quitar ingredientes</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {ingredientes.map((ing) => (
                <label
                  key={ing.ingrediente_id}
                  className="flex items-center gap-3 p-2 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={excluidos.includes(ing.ingrediente_id)}
                    onChange={() => toggleExcluido(ing.ingrediente_id)}
                    className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-400"
                  />
                  <span className="text-sm flex-1">{ing.nombre}</span>
                  {ing.es_alergeno && (
                    <Badge variant="danger" size="sm">Alérgeno</Badge>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Agregar extras con cantidad */}
        {extrasDisponibles.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Agregar extras</p>
            <p className="text-xs text-gray-400 mb-2">Máximo {MAX_EXTRA} unidades por ingrediente</p>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {extrasDisponibles.map((ing) => {
                const qty = extrasQty[ing.id] ?? 0;
                return (
                  <div
                    key={ing.id}
                    className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                      qty > 0 ? 'border-primary-400 bg-primary-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-sm flex-1">{ing.nombre}</span>
                    {Number(ing.precio) > 0 && (
                      <span className="text-xs text-gray-500">
                        +${formatARS(Number(ing.precio))}/u
                      </span>
                    )}
                    {ing.es_alergeno && (
                      <Badge variant="danger" size="sm">Alérgeno</Badge>
                    )}
                    {/* Stepper */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => decrementExtra(ing.id)}
                        disabled={qty === 0}
                        className="w-7 h-7 rounded border flex items-center justify-center font-bold disabled:opacity-30 hover:bg-gray-100 transition-colors"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                      <button
                        type="button"
                        onClick={() => incrementExtra(ing.id)}
                        disabled={qty >= MAX_EXTRA}
                        className="w-7 h-7 rounded border flex items-center justify-center font-bold disabled:opacity-30 hover:bg-gray-100 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Resumen de precio */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-1">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Precio base</span>
            <span>${formatARS(Number(producto.precio_base))}</span>
          </div>
          {extrasSeleccionados.map((e) => (
            <div key={e.ingrediente_id} className="flex justify-between text-sm text-primary-500">
              <span>
                {e.nombre}{e.cantidad > 1 ? ` ×${e.cantidad}` : ''}
              </span>
              <span>+${formatARS(e.precio * e.cantidad)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
            <span>Total</span>
            <span>${formatARS(precioTotal)}</span>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 justify-end">
          <Button onClick={onCancel} variant="ghost">Cancelar</Button>
          <Button onClick={() => onConfirm(excluidos, extrasSeleccionados)}>
            Agregar al carrito
          </Button>
        </div>
      </div>
    </Modal>
  );
}
