import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import {
  useCreateProducto,
  useUpdateProducto,
  useAssignCategorias,
  useAddIngrediente,
  useRemoveIngrediente,
} from '@/entities/producto/hooks';
import { useCategorias } from '@/entities/categoria/hooks';
import { useIngredientes } from '@/entities/ingrediente/hooks';
import { useUIStore } from '@/shared/store/uiStore';
import { Modal, Button, Input, Badge } from '@/shared/ui';
import type { Producto } from '@/shared/types';

interface FormProductoProps {
  producto?: Producto | null;
  onClose: () => void;
}

export function FormProducto({ producto, onClose }: FormProductoProps) {
  const createMutation = useCreateProducto();
  const updateMutation = useUpdateProducto();
  const assignCatsMutation = useAssignCategorias();
  const addIngredienteMutation = useAddIngrediente();
  const removeIngredienteMutation = useRemoveIngrediente();
  const { data: categorias } = useCategorias();
  const { data: todosIngredientes } = useIngredientes();
  const addToast = useUIStore((s) => s.addToast);

  const isEditing = !!producto;
  const [selectedCats, setSelectedCats] = useState<number[]>(
    producto?.categorias?.map((c) => c.id) ?? []
  );
  const currentIngIds = new Set(producto?.ingredientes?.map((i) => i.id) ?? []);
  const [selectedIngs, setSelectedIngs] = useState<Set<number>>(new Set(currentIngIds));
  const [showIngSearch, setShowIngSearch] = useState(false);
  const [ingSearch, setIngSearch] = useState('');
  const [catsOpen, setCatsOpen] = useState(false);
  const [ingsOpen, setIngsOpen] = useState(false);

  const formatPrecio = (n: number) =>
    n > 0 ? new Intl.NumberFormat('es-AR').format(n) : '';
  const parsePrecio = (raw: string): number => {
    // Elimina puntos (separador de miles AR) y convierte coma decimal
    const normalized = raw.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  };

  const [rawPrecio, setRawPrecio] = useState(formatPrecio(producto?.precio_base ?? 0));

  const form = useForm({
    defaultValues: {
      nombre: producto?.nombre || '',
      descripcion: producto?.descripcion || '',
      precio_base: producto?.precio_base || 0,
      stock_cantidad: producto?.stock_cantidad || 0,
      disponible: producto?.disponible ?? true,
      imagen_url: producto?.imagen_url || '',
    },
    onSubmit: async ({ value }) => {
      try {
        let savedId: number;

        if (isEditing) {
          await updateMutation.mutateAsync({
            id: producto.id,
            producto: value,
          });
          savedId = producto.id;
          addToast('success', 'Producto actualizado correctamente');
        } else {
          const created = await createMutation.mutateAsync(value);
          savedId = created.id;
          addToast('success', 'Producto creado correctamente');
        }

        // Asignar categorías solo si: es nuevo, o si el producto ya traía sus categorías cargadas
        // (evita borrar la asignación cuando la lista no incluye ese campo)
        const debeActualizarCats = !isEditing || producto.categorias !== undefined;
        if (debeActualizarCats) {
          await assignCatsMutation.mutateAsync({ id: savedId, categoria_ids: selectedCats });
        }

        // Sincronizar ingredientes: agregar los nuevos, quitar los removidos
        // Solo si el producto ya traía sus ingredientes cargados (misma razón)
        const prevIds =
          isEditing && producto.ingredientes !== undefined
            ? new Set(producto.ingredientes.map((i) => i.id))
            : isEditing
            ? null // ingredientes no cargados → no tocar
            : new Set<number>();

        if (prevIds !== null) {
          const toAdd = [...selectedIngs].filter((id) => !prevIds.has(id));
          const toRemove = [...prevIds].filter((id) => !selectedIngs.has(id));
          await Promise.all([
            ...toAdd.map((ingrediente_id) =>
              addIngredienteMutation.mutateAsync({ producto_id: savedId, ingrediente_id })
            ),
            ...toRemove.map((ingrediente_id) =>
              removeIngredienteMutation.mutateAsync({ producto_id: savedId, ingrediente_id })
            ),
          ]);
        }

        onClose();
      } catch (error: any) {
        addToast('error', error.response?.data?.detail || 'Error al guardar el producto');
      }
    },
  });

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    addIngredienteMutation.isPending ||
    removeIngredienteMutation.isPending;

  return (
    <Modal
      open
      onClose={onClose}
      title={isEditing ? 'Editar producto' : 'Nuevo producto'}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-6"
      >
        <form.Field
          name="nombre"
          validators={{
            onChange: ({ value }) =>
              !value || value.trim().length === 0
                ? 'El nombre es obligatorio'
                : undefined,
          }}
          children={(field) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre <span className="text-danger">*</span>
              </label>
              <Input
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              {field.state.meta.errors.length > 0 && (
                <p className="text-sm text-danger mt-1">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        />

        <form.Field
          name="descripcion"
          children={(field) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <form.Field
            name="precio_base"
            validators={{
              onChange: ({ value }) =>
                value <= 0 ? 'El precio debe ser mayor a 0' : undefined,
            }}
            children={(field) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio <span className="text-danger">*</span>
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ej: 18.000"
                  value={rawPrecio}
                  onChange={(e) => {
                    setRawPrecio(e.target.value);
                    field.handleChange(parsePrecio(e.target.value));
                  }}
                  onBlur={field.handleBlur}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-danger mt-1">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          />

          <form.Field
            name="stock_cantidad"
            children={(field) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock
                </label>
                <Input
                  type="number"
                  min={0}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                />
              </div>
            )}
          />
        </div>

        <form.Field
          name="imagen_url"
          children={(field) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de imagen (opcional)
              </label>
              <Input
                type="url"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>
          )}
        />

        <form.Field
          name="disponible"
          children={(field) => (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={field.state.value}
                onChange={(e) => field.handleChange(e.target.checked)}
                className="w-5 h-5 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
              />
              <label className="text-sm font-medium text-gray-700">
                Disponible para la venta
              </label>
            </div>
          )}
        />

        {/* Categorías — colapsable */}
        <div className="border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setCatsOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">
              Categorías
              {selectedCats.length > 0 && (
                <span className="ml-2 text-xs text-primary-500 font-semibold">
                  ({selectedCats.length} seleccionada{selectedCats.length !== 1 ? 's' : ''})
                </span>
              )}
            </span>
            <span className={`text-gray-400 transition-transform duration-200 ${catsOpen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          {catsOpen && (
            <div className="max-h-48 overflow-y-auto space-y-2 p-3">
              {categorias?.length === 0 && (
                <p className="text-sm text-gray-500">No hay categorías disponibles</p>
              )}
              {categorias?.map((cat) => (
                <label key={cat.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded p-1">
                  <input
                    type="checkbox"
                    checked={selectedCats.includes(cat.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCats((prev) => [...prev, cat.id]);
                      } else {
                        setSelectedCats((prev) => prev.filter((id) => id !== cat.id));
                      }
                    }}
                    className="w-5 h-5 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm">{cat.nombre}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Ingredientes — colapsable */}
        <div className="border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => { setIngsOpen((v) => !v); if (ingsOpen) { setShowIngSearch(false); setIngSearch(''); } }}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">
              Ingredientes
              {selectedIngs.size > 0 && (
                <span className="ml-2 text-xs text-primary-500 font-semibold">
                  ({selectedIngs.size} seleccionado{selectedIngs.size !== 1 ? 's' : ''})
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {ingsOpen && (
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); setShowIngSearch((v) => !v); setIngSearch(''); }}
                  className="text-gray-400 hover:text-primary-500 transition-colors text-base"
                  title="Buscar ingrediente"
                >
                  🔍
                </span>
              )}
              <span className={`text-gray-400 transition-transform duration-200 ${ingsOpen ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </div>
          </button>
          {ingsOpen && (
            <div className="p-3 space-y-2">
              {showIngSearch && (
                <Input
                  value={ingSearch}
                  onChange={(e) => setIngSearch(e.target.value)}
                  placeholder="Buscar ingrediente..."
                  className="mb-2"
                />
              )}
              <div className="max-h-48 overflow-y-auto space-y-2">
                {!todosIngredientes || todosIngredientes.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay ingredientes disponibles</p>
                ) : (
                  todosIngredientes
                    .filter((ing) => ing.nombre.toLowerCase().includes(ingSearch.toLowerCase()))
                    .map((ing) => (
                      <label
                        key={ing.id}
                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded p-1"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIngs.has(ing.id)}
                          onChange={(e) => {
                            setSelectedIngs((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(ing.id);
                              else next.delete(ing.id);
                              return next;
                            });
                          }}
                          className="w-5 h-5 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm flex-1">{ing.nombre}</span>
                        {ing.es_alergeno && (
                          <Badge variant="danger" size="sm">Alérgeno</Badge>
                        )}
                      </label>
                    ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button onClick={onClose} variant="ghost" disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? 'Guardando...'
              : isEditing
              ? 'Guardar cambios'
              : 'Crear producto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

