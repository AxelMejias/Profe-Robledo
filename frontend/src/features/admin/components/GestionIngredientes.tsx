import { useState, useRef } from 'react';
import { useForm } from '@tanstack/react-form';
import * as XLSX from 'xlsx';
import {
  useIngredientes,
  useCreateIngrediente,
  useUpdateIngrediente,
  useDeleteIngrediente,
} from '@/entities/ingrediente/hooks';
import { useCategorias } from '@/entities/categoria/hooks';
import { useUIStore } from '@/shared/store/uiStore';
import { Button, Badge, Skeleton, EmptyState, Modal, Input } from '@/shared/ui';
import { ingredientesApi } from '@/entities/ingrediente/api';
import type { Ingrediente } from '@/shared/types';

function FormIngrediente({
  ingrediente,
  onClose,
}: {
  ingrediente?: Ingrediente | null;
  onClose: () => void;
}) {
  const createMutation = useCreateIngrediente();
  const updateMutation = useUpdateIngrediente();
  const addToast = useUIStore((s) => s.addToast);
  const { data: categorias } = useCategorias();
  const isEditing = !!ingrediente;

  // Derivar categoría padre inicial a partir de categoria_id del ingrediente
  const categoriaActual = categorias?.find((c) => c.id === ingrediente?.categoria_id);
  // Si la cat actual tiene padre → su padre es el parentId; si es raíz → ella misma es "padre" en el selector
  const [selectedParentId, setSelectedParentId] = useState<number | null>(
    categoriaActual
      ? (categoriaActual.parent_id ?? categoriaActual.id)
      : null
  );
  const [selectedCatId, setSelectedCatId] = useState<number | null>(
    ingrediente?.categoria_id ?? null
  );

  const rootCats = (categorias ?? []).filter((c) => c.parent_id == null);
  const childCats = (categorias ?? []).filter((c) => c.parent_id === selectedParentId);

  const handleParentChange = (id: number | null) => {
    setSelectedParentId(id);
    setSelectedCatId(null);
  };

  const UNIDADES = [
    { value: 'UNIDAD', label: 'Unidad' },
    { value: 'G',      label: 'Gramos (g)' },
    { value: 'KG',     label: 'Kilogramos (kg)' },
    { value: 'ML',     label: 'Mililitros (ml)' },
    { value: 'L',      label: 'Litros (l)' },
  ];

  const TIPOS_EXTRA = [
    { value: '', label: 'General (todos los productos)' },
    ...(categorias ?? []).map((c) => ({
      value: c.nombre.toLowerCase(),
      label: c.nombre,
    })),
  ];

  const formatARS = (n: number) =>
    n > 0 ? new Intl.NumberFormat('es-AR').format(n) : '';
  const parsePrecio = (raw: string) => {
    const normalized = raw.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  };

  const [rawPrecio, setRawPrecio] = useState(
    formatARS(Number(ingrediente?.precio ?? 0))
  );

  const form = useForm({
    defaultValues: {
      nombre: ingrediente?.nombre ?? '',
      descripcion: ingrediente?.descripcion ?? '',
      es_alergeno: ingrediente?.es_alergeno ?? false,
      unidad_medida: ingrediente?.unidad_medida ?? 'UNIDAD',
      precio: Number(ingrediente?.precio ?? 0),
      tipo_extra: ingrediente?.tipo_extra ?? '',
      disponible_como_extra: ingrediente?.disponible_como_extra ?? false,
    },
    onSubmit: async ({ value }) => {
      try {
        if (isEditing) {
          // Si hay hijo seleccionado usarlo; si no, usar el padre; si no hay padre, null (Global)
          const finalCatId = selectedCatId ?? selectedParentId ?? null;
          await updateMutation.mutateAsync({ id: ingrediente.id, body: {
            ...value,
            tipo_extra: value.tipo_extra || null,
            disponible_como_extra: value.disponible_como_extra,
            categoria_id: finalCatId,
          }});
          addToast('success', 'Ingrediente actualizado');
        } else {
          const finalCatId = selectedCatId ?? selectedParentId ?? null;
          await createMutation.mutateAsync({
            nombre: value.nombre,
            descripcion: value.descripcion || undefined,
            es_alergeno: value.es_alergeno,
            unidad_medida: value.unidad_medida,
            precio: value.precio,
            tipo_extra: value.tipo_extra || null,
            disponible_como_extra: value.disponible_como_extra,
            categoria_id: finalCatId,
          });
          addToast('success', 'Ingrediente creado');
        }
        onClose();
      } catch (error: any) {
        addToast('error', error.response?.data?.detail || 'Error al guardar el ingrediente');
      }
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      open
      onClose={onClose}
      title={isEditing ? 'Editar ingrediente' : 'Nuevo ingrediente'}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-5"
      >
        <form.Field
          name="nombre"
          validators={{
            onChange: ({ value }) =>
              !value.trim() ? 'El nombre es obligatorio' : undefined,
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
                <p className="text-sm text-danger mt-1">{field.state.meta.errors[0]}</p>
              )}
            </div>
          )}
        />

        <form.Field
          name="descripcion"
          children={(field) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (opcional)
              </label>
              <Input
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        />

        <form.Field
          name="es_alergeno"
          children={(field) => (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={field.state.value}
                onChange={(e) => field.handleChange(e.target.checked)}
                className="w-5 h-5 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
              />
              <label className="text-sm font-medium text-gray-700">
                Es alérgeno
              </label>
            </div>
          )}
        />

        <form.Field
          name="unidad_medida"
          children={(field) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unidad de medida <span className="text-danger">*</span>
              </label>
              <select
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                {UNIDADES.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
          )}
        />

        <form.Field
          name="precio"
          validators={{
            onChange: ({ value }) =>
              value < 0 ? 'El precio no puede ser negativo' : undefined,
          }}
          children={(field) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio extra (por unidad)
              </label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Ej: 500"
                value={rawPrecio}
                onChange={(e) => {
                  setRawPrecio(e.target.value);
                  field.handleChange(parsePrecio(e.target.value));
                }}
                onBlur={field.handleBlur}
              />
              <p className="text-xs text-gray-400 mt-1">
                Costo que se agrega al producto cuando el cliente lo elige como extra.
              </p>
              {field.state.meta.errors.length > 0 && (
                <p className="text-sm text-danger mt-1">{field.state.meta.errors[0]}</p>
              )}
            </div>
          )}
        />

        {/* Categoría de producto — selección en cascada padre → subcategoría */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría padre
            </label>
            <select
              value={selectedParentId ?? ''}
              onChange={(e) => handleParentChange(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="">Global (todos los productos)</option>
              {rootCats.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>

          {selectedParentId !== null && childCats.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subcategoría específica
              </label>
              <select
                value={selectedCatId ?? ''}
                onChange={(e) => setSelectedCatId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">Todas las de {rootCats.find((c) => c.id === selectedParentId)?.nombre}</option>
                {childCats.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>
          )}

          <p className="text-xs text-gray-400">
            Limita dónde aparece este ingrediente al editar productos en el panel admin.
            Ingredientes "Global" aparecen en todos los productos.
          </p>
        </div>

        <form.Field
          name="tipo_extra"
          children={(field) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Disponible como extra en qué categoría?
              </label>
              <select
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                {TIPOS_EXTRA.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Controla en qué categoría de productos el cliente puede agregar este ingrediente como extra.
              </p>
            </div>
          )}
        />

        <form.Field
          name="disponible_como_extra"
          children={(field) => (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={field.state.value}
                onChange={(e) => field.handleChange(e.target.checked)}
                className="w-5 h-5 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
              />
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Disponible como extra para el cliente
                </label>
                <p className="text-xs text-gray-400">
                  Si está desactivado, no aparece en el modal de personalización aunque sea de la categoría correcta.
                </p>
              </div>
            </div>
          )}
        />

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button onClick={onClose} variant="ghost" disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear ingrediente'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function GestionIngredientes() {
  const { data: ingredientes, isLoading, refetch } = useIngredientes();
  const deleteMutation = useDeleteIngrediente();
  const addToast = useUIStore((s) => s.addToast);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Ingrediente | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (rows.length === 0) {
        addToast('error', 'El archivo está vacío o no tiene el formato correcto');
        return;
      }

      let creados = 0;
      let errores = 0;

      for (const row of rows) {
        const nombre = String(row['nombre'] || row['Nombre'] || '').trim();
        if (!nombre) continue;

        const descripcion = String(row['descripcion'] || row['Descripción'] || row['Descripcion'] || '').trim() || undefined;
        const raw = String(row['es_alergeno'] || row['Es alérgeno'] || row['alergeno'] || '').trim().toLowerCase();
        const es_alergeno = ['true', '1', 'si', 'sí', 'yes', 'verdadero'].includes(raw);
        const rawUnidad = String(row['unidad_medida'] || row['Unidad'] || row['unidad'] || '').trim().toUpperCase();
        const unidad_medida = ['UNIDAD', 'G', 'KG', 'ML', 'L'].includes(rawUnidad) ? rawUnidad : 'UNIDAD';
        const rawPrecioXlsx = parseFloat(String(row['precio'] || row['Precio'] || '0').replace(/\./g, '').replace(',', '.'));
        const precio = isNaN(rawPrecioXlsx) ? 0 : rawPrecioXlsx;
        const rawTipo = String(row['tipo_extra'] || row['Tipo'] || row['tipo'] || '').trim().toLowerCase();
        const tipo_extra = rawTipo || undefined;
        const rawExtra = String(row['disponible_como_extra'] || row['Extra'] || row['extra'] || '').trim().toLowerCase();
        const disponible_como_extra = ['true', '1', 'si', 'sí', 'yes', 'verdadero'].includes(rawExtra);

        try {
          await ingredientesApi.createIngrediente({ nombre, descripcion, es_alergeno, unidad_medida, precio, tipo_extra, disponible_como_extra });
          creados++;
        } catch {
          errores++;
        }
      }

      addToast('success', `Importación completa: ${creados} creados${errores > 0 ? `, ${errores} errores` : ''}`);
      refetch();
    } catch {
      addToast('error', 'Error al leer el archivo Excel');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      addToast('success', 'Ingrediente eliminado');
      setShowDeleteModal(null);
    } catch (error: any) {
      addToast('error', error.response?.data?.detail || 'Error al eliminar el ingrediente');
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestión de Ingredientes</h1>
        <div className="flex gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportExcel}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="ghost"
            disabled={importing}
          >
            {importing ? 'Importando...' : '📥 Importar Excel'}
          </Button>
          <Button onClick={() => setShowForm(true)}>+ Nuevo Ingrediente</Button>
        </div>
      </div>

      {!ingredientes || ingredientes.length === 0 ? (
        <EmptyState
          title="No hay ingredientes"
          description="Agregá el primer ingrediente para poder asignarlo a los productos."
          action={{ label: 'Agregar ingrediente', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ingrediente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Unidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Precio extra
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Aplica en
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Extra
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Alérgeno
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ingredientes.map((ing) => (
                <tr key={ing.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{ing.nombre}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {ing.descripcion || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {ing.unidad_medida}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {Number(ing.precio) > 0
                      ? `$${new Intl.NumberFormat('es-AR').format(Number(ing.precio))}`
                      : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                    {ing.tipo_extra || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={ing.disponible_como_extra ? 'primary' : 'gray'} size="sm">
                      {ing.disponible_como_extra ? 'Sí' : 'No'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={ing.es_alergeno ? 'danger' : 'gray'} size="sm">
                      {ing.es_alergeno ? 'Sí' : 'No'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => { setEditing(ing); setShowForm(true); }}
                      className="text-primary-500 hover:underline mr-4"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(ing.id)}
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

      {showForm && (
        <FormIngrediente ingrediente={editing} onClose={handleCloseForm} />
      )}

      {showDeleteModal !== null && (
        <Modal open onClose={() => setShowDeleteModal(null)} title="¿Eliminar ingrediente?">
          <div className="space-y-6">
            <p className="text-gray-600">
              ¿Estás seguro? El ingrediente se desvinculará de todos los productos que lo usen.
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
