import { useState, useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import {
  useProducto,
  useCreateProducto,
  useUpdateProducto,
  useAssignCategorias,
  useAddIngrediente,
  useUpdateIngredienteCantidad,
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
  const updateCantidadMutation = useUpdateIngredienteCantidad();
  const removeIngredienteMutation = useRemoveIngrediente();
  const { data: categorias } = useCategorias();
  const { data: todosIngredientes } = useIngredientes();
  const addToast = useUIStore((s) => s.addToast);

  const isEditing = !!producto;

  // Fetchea el detalle completo (con categorías e ingredientes) cuando está editando
  const { data: detalle } = useProducto(producto?.id ?? 0);

  const [selectedCats, setSelectedCats] = useState<number[]>([]);
  // Map ingId → cantidad (presencia en el mapa = seleccionado)
  const [ingCantidades, setIngCantidades] = useState<Map<number, number>>(new Map());

  // Inicializa selecciones una vez que llega el detalle
  useEffect(() => {
    if (detalle?.categorias) {
      setSelectedCats(detalle.categorias.map((c) => c.id));
    }
    if (detalle?.ingredientes) {
      setIngCantidades(new Map(detalle.ingredientes.map((i) => [i.ingrediente_id, i.cantidad])));
    }
  }, [detalle]);
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
        const debeActualizarCats = !isEditing || detalle?.categorias !== undefined;
        if (debeActualizarCats) {
          await assignCatsMutation.mutateAsync({ id: savedId, categoria_ids: selectedCats });
        }

        // Sincronizar ingredientes: agregar nuevos, quitar removidos, actualizar cantidades
        const prevData =
          isEditing && detalle?.ingredientes !== undefined
            ? detalle.ingredientes
            : isEditing
            ? null // detalle aún no cargado → no tocar
            : [];

        if (prevData !== null) {
          const prevMap = new Map(prevData.map((i) => [i.ingrediente_id, i.cantidad]));
          const toAdd = [...ingCantidades.entries()].filter(([id]) => !prevMap.has(id));
          const toRemove = [...prevMap.keys()].filter((id) => !ingCantidades.has(id));
          const toUpdate = [...ingCantidades.entries()].filter(
            ([id, qty]) => prevMap.has(id) && prevMap.get(id) !== qty
          );
          await Promise.all([
            ...toAdd.map(([ingrediente_id, cantidad]) =>
              addIngredienteMutation.mutateAsync({ producto_id: savedId, ingrediente_id, cantidad })
            ),
            ...toRemove.map((ingrediente_id) =>
              removeIngredienteMutation.mutateAsync({ producto_id: savedId, ingrediente_id })
            ),
            ...toUpdate.map(([ingrediente_id, cantidad]) =>
              updateCantidadMutation.mutateAsync({ producto_id: savedId, ingrediente_id, cantidad })
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
    updateCantidadMutation.isPending ||
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
              {ingCantidades.size > 0 && (
                <span className="ml-2 text-xs text-primary-500 font-semibold">
                  ({ingCantidades.size} seleccionado{ingCantidades.size !== 1 ? 's' : ''})
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
              <div className="max-h-56 overflow-y-auto space-y-1">
                {!todosIngredientes || todosIngredientes.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay ingredientes disponibles</p>
                ) : (
                  todosIngredientes
                    .filter((ing) => {
                      if (ing.categoria_id == null) return true; // global
                      if (selectedCats.includes(ing.categoria_id)) return true; // match exacto
                      // match por padre: ingrediente asignado a cat padre de una cat del producto
                      const catDelIng = categorias?.find((c) => c.id === ing.categoria_id);
                      return catDelIng != null && selectedCats.some((id) => {
                        const catProducto = categorias?.find((c) => c.id === id);
                        return catProducto?.parent_id === catDelIng.id;
                      });
                    })
                    .filter((ing) => ing.nombre.toLowerCase().includes(ingSearch.toLowerCase()))
                    .map((ing) => {
                      const cantidad = ingCantidades.get(ing.id) ?? 0;
                      const seleccionado = ingCantidades.has(ing.id);
                      return (
                        <div
                          key={ing.id}
                          className={`flex items-center gap-2 rounded p-1 ${seleccionado ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
                        >
                          <input
                            type="checkbox"
                            checked={seleccionado}
                            onChange={(e) => {
                              setIngCantidades((prev) => {
                                const next = new Map(prev);
                                if (e.target.checked) next.set(ing.id, 1);
                                else next.delete(ing.id);
                                return next;
                              });
                            }}
                            className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500 flex-shrink-0"
                          />
                          <span className="text-sm flex-1">{ing.nombre}</span>
                          {ing.es_alergeno && (
                            <Badge variant="danger" size="sm">Alérgeno</Badge>
                          )}
                          {seleccionado && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setIngCantidades((prev) => {
                                    const next = new Map(prev);
                                    const v = (prev.get(ing.id) ?? 1) - 1;
                                    if (v <= 0) next.delete(ing.id);
                                    else next.set(ing.id, v);
                                    return next;
                                  })
                                }
                                className="w-6 h-6 rounded border text-xs flex items-center justify-center hover:bg-gray-100"
                              >
                                −
                              </button>
                              <span className="w-6 text-center text-sm font-semibold">{cantidad}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setIngCantidades((prev) => {
                                    const next = new Map(prev);
                                    next.set(ing.id, (prev.get(ing.id) ?? 1) + 1);
                                    return next;
                                  })
                                }
                                className="w-6 h-6 rounded border text-xs flex items-center justify-center hover:bg-gray-100"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
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

