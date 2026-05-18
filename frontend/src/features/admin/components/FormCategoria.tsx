import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useCreateCategoria, useUpdateCategoria } from '@/entities/categoria/hooks';
import { useCategorias } from '@/entities/categoria/hooks';
import { useUIStore } from '@/shared/store/uiStore';
import { Modal, Button, Input } from '@/shared/ui';
import type { Categoria } from '@/shared/types';

interface FormCategoriaProps {
  categoria?: Categoria | null;
  onClose: () => void;
}

export function FormCategoria({ categoria, onClose }: FormCategoriaProps) {
  const createMutation = useCreateCategoria();
  const updateMutation = useUpdateCategoria();
  const addToast = useUIStore((s) => s.addToast);
  const { data: todasCategorias } = useCategorias();

  const isEditing = !!categoria;

  // Solo categorías raíz (sin padre) pueden ser padre, y no puede ser la misma que se edita
  const posiblesParent = (todasCategorias ?? []).filter(
    (c) => c.parent_id == null && c.id !== categoria?.id
  );

  const [parentId, setParentId] = useState<number | null>(categoria?.parent_id ?? null);

  const form = useForm({
    defaultValues: {
      nombre: categoria?.nombre || '',
      descripcion: categoria?.descripcion || '',
    },
    onSubmit: async ({ value }) => {
      try {
        if (isEditing) {
          await updateMutation.mutateAsync({
            id: categoria.id,
            categoria: { ...value, parent_id: parentId },
          });
          addToast('success', 'Categoría actualizada correctamente');
        } else {
          await createMutation.mutateAsync({ ...value, parent_id: parentId ?? undefined });
          addToast('success', 'Categoría creada correctamente');
        }
        onClose();
      } catch (error: any) {
        addToast('error', error.response?.data?.detail || 'Error al guardar la categoría');
      }
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      open
      onClose={onClose}
      title={isEditing ? 'Editar categoría' : 'Nueva categoría'}
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
                Descripción (opcional)
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

        {/* Categoría padre (opcional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoría padre (opcional)
          </label>
          <select
            value={parentId ?? ''}
            onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="">Sin padre (categoría raíz)</option>
            {posiblesParent.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Si seleccionás una categoría padre, esta quedará como subcategoría dentro de ella.
          </p>
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
              : 'Crear categoría'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

