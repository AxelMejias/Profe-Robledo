import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import {
  useIngredientes,
  useCreateIngrediente,
  useUpdateIngrediente,
  useDeleteIngrediente,
} from '@/entities/ingrediente/hooks';
import { useUIStore } from '@/shared/store/uiStore';
import { Button, Badge, Skeleton, EmptyState, Modal, Input } from '@/shared/ui';
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
  const isEditing = !!ingrediente;

  const form = useForm({
    defaultValues: {
      nombre: ingrediente?.nombre ?? '',
      descripcion: ingrediente?.descripcion ?? '',
      es_alergeno: ingrediente?.es_alergeno ?? false,
    },
    onSubmit: async ({ value }) => {
      try {
        if (isEditing) {
          await updateMutation.mutateAsync({ id: ingrediente.id, body: value });
          addToast('success', 'Ingrediente actualizado');
        } else {
          await createMutation.mutateAsync({
            nombre: value.nombre,
            descripcion: value.descripcion || undefined,
            es_alergeno: value.es_alergeno,
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
  const { data: ingredientes, isLoading } = useIngredientes();
  const deleteMutation = useDeleteIngrediente();
  const addToast = useUIStore((s) => s.addToast);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Ingrediente | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);

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
        <Button onClick={() => setShowForm(true)}>+ Nuevo Ingrediente</Button>
      </div>

      {!ingredientes || ingredientes.length === 0 ? (
        <EmptyState
          title="No hay ingredientes"
          description="Agregá el primer ingrediente para poder asignarlo a los productos."
          action={{ label: 'Agregar ingrediente', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
