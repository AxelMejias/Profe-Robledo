import { useForm } from '@tanstack/react-form';
import { useCreateCategoria, useUpdateCategoria } from '@/entities/categoria/hooks';
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

  const isEditing = !!categoria;

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
            categoria: value,
          });
          addToast({
            id: crypto.randomUUID(),
            type: 'success',
            message: 'Categoría actualizada correctamente',
          });
        } else {
          await createMutation.mutateAsync(value);
          addToast({
            id: crypto.randomUUID(),
            type: 'success',
            message: 'Categoría creada correctamente',
          });
        }
        onClose();
      } catch (error: any) {
        addToast({
          id: crypto.randomUUID(),
          type: 'error',
          message: error.response?.data?.detail || 'Error al guardar la categoría',
        });
      }
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
        />

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline" disabled={isPending}>
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
