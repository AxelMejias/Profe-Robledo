import { useForm } from '@tanstack/react-form';
import { useCreateDireccion, useUpdateDireccion } from '@/entities/direccion/hooks';
import { useUIStore } from '@/shared/store/uiStore';
import { Modal, Button, Input } from '@/shared/ui';
import type { DireccionEntrega } from '@/shared/types';

interface FormDireccionProps {
  direccion?: DireccionEntrega | null;
  onClose: () => void;
}

export function FormDireccion({ direccion, onClose }: FormDireccionProps) {
  const createMutation = useCreateDireccion();
  const updateMutation = useUpdateDireccion();
  const addToast = useUIStore((s) => s.addToast);

  const isEditing = !!direccion;

  const form = useForm({
    defaultValues: {
      alias: direccion?.alias || '',
      linea1: direccion?.linea1 || '',
      linea2: direccion?.linea2 || '',
      ciudad: direccion?.ciudad || '',
      codigo_postal: direccion?.codigo_postal || '',
      referencia: direccion?.referencia || '',
    },
    onSubmit: async ({ value }) => {
      try {
        if (isEditing) {
          await updateMutation.mutateAsync({
            id: direccion.id,
            direccion: value,
          });
          addToast('success', 'Dirección actualizada correctamente');
        } else {
          await createMutation.mutateAsync(value);
          addToast('success', 'Dirección agregada correctamente');
        }
        onClose();
      } catch (error: any) {
        addToast('error', error.response?.data?.detail || 'Error al guardar la dirección');
      }
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      open
      onClose={onClose}
      title={isEditing ? 'Editar dirección' : 'Agregar dirección'}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-6"
      >
        {/* Alias (opcional) */}
        <form.Field
          name="alias"
          children={(field) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alias (opcional)
              </label>
              <Input
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Ej: Casa, Trabajo, Casa de mi mamá"
              />
              <p className="text-xs text-gray-500 mt-1">
                Un nombre para identificar fácilmente esta dirección
              </p>
            </div>
          )}
        />

        {/* Linea 1 (requerida) */}
        <form.Field
          name="linea1"
          validators={{
            onChange: ({ value }) =>
              !value || value.trim().length === 0
                ? 'La dirección es obligatoria'
                : undefined,
          }}
          children={(field) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección <span className="text-danger">*</span>
              </label>
              <Input
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="Ej: Av. Corrientes 1234"
              />
              {field.state.meta.errors.length > 0 && (
                <p className="text-sm text-danger mt-1">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        />

        {/* Linea 2 (opcional) */}
        <form.Field
          name="linea2"
          children={(field) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Piso / Departamento (opcional)
              </label>
              <Input
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Ej: 5to A"
              />
            </div>
          )}
        />

        {/* Ciudad (requerida) */}
        <form.Field
          name="ciudad"
          validators={{
            onChange: ({ value }) =>
              !value || value.trim().length === 0
                ? 'La ciudad es obligatoria'
                : undefined,
          }}
          children={(field) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ciudad <span className="text-danger">*</span>
              </label>
              <Input
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="Ej: Buenos Aires"
              />
              {field.state.meta.errors.length > 0 && (
                <p className="text-sm text-danger mt-1">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        />

        {/* Código postal (requerido, validación formato) */}
        <form.Field
          name="codigo_postal"
          validators={{
            onChange: ({ value }) => {
              if (!value || value.trim().length === 0) {
                return 'El código postal es obligatorio';
              }
              if (!/^\d{4,}$/.test(value)) {
                return 'Código postal inválido (mínimo 4 dígitos)';
              }
              return undefined;
            },
          }}
          children={(field) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código postal <span className="text-danger">*</span>
              </label>
              <Input
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="Ej: 1414"
              />
              {field.state.meta.errors.length > 0 && (
                <p className="text-sm text-danger mt-1">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        />

        {/* Referencia (opcional) */}
        <form.Field
          name="referencia"
          children={(field) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referencia (opcional)
              </label>
              <textarea
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Ej: Casa con portón verde, tocar timbre 3 veces"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Información adicional para facilitar la entrega
              </p>
            </div>
          )}
        />

        {/* Botones */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button onClick={onClose} variant="ghost" disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? 'Guardando...'
              : isEditing
              ? 'Guardar cambios'
              : 'Agregar dirección'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

