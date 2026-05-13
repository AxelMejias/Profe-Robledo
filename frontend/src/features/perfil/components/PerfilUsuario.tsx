import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useAuthStore } from '@/shared/store/authStore';
import { useUIStore } from '@/shared/store/uiStore';
import { Button, Badge, Input } from '@/shared/ui';
import { PedidosRecientes } from './PedidosRecientes';
import axios from '@/shared/api/axios';

const ROLE_COLORS: Record<string, 'primary' | 'secondary' | 'danger' | 'gray'> = {
  ADMIN: 'danger',
  STOCK: 'primary',
  PEDIDOS: 'secondary',
  CLIENT: 'gray',
};

export function PerfilUsuario() {
  const user = useAuthStore((s) => s.user) as any;
  const addToast = useUIStore((s) => s.addToast);

  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm({
    defaultValues: {
      nombre: user?.nombre || '',
      apellido: user?.apellido || '',
      telefono: user?.telefono || '',
    },
    onSubmit: async ({ value }) => {
      setIsUpdating(true);

      try {
        await axios.patch('/auth/me', value);
        
        addToast('success', 'Perfil actualizado correctamente');

        setIsEditing(false);
        window.location.reload();
      } catch (error: any) {
        addToast('error', error.response?.data?.detail || 'Error al actualizar el perfil');
      } finally {
        setIsUpdating(false);
      }
    },
  });

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  const fechaRegistro = new Date((user as any).creado_en).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Mi perfil</h1>

      {/* Datos del perfil */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Información personal</h2>
            <p className="text-sm text-gray-600">
              Miembro desde {fechaRegistro}
            </p>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="ghost">
              Editar perfil
            </Button>
          )}
        </div>

        {isEditing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            {/* Nombre */}
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

            {/* Apellido */}
            <form.Field
              name="apellido"
              validators={{
                onChange: ({ value }) =>
                  !value || value.trim().length === 0
                    ? 'El apellido es obligatorio'
                    : undefined,
              }}
              children={(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido <span className="text-danger">*</span>
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

            {/* Email (deshabilitado) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <Input
                value={user.email}
                disabled
                className="bg-gray-100 cursor-not-allowed"
                title="El email no se puede cambiar"
              />
              <p className="text-xs text-gray-500 mt-1">
                El email no se puede cambiar
              </p>
            </div>

            {/* Teléfono */}
            <form.Field
              name="telefono"
              children={(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono (opcional)
                  </label>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Ej: +54 9 11 1234-5678"
                  />
                </div>
              )}
            />

            {/* Botones */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="submit"
                disabled={isUpdating}
              >
                {isUpdating ? 'Guardando...' : 'Guardar cambios'}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  form.reset();
                }}
                variant="ghost"
                disabled={isUpdating}
              >
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Nombre completo</p>
              <p className="text-lg font-medium">
                {user.nombre} {user.apellido}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-lg font-medium">{user.email}</p>
            </div>

            {user.telefono && (
              <div>
                <p className="text-sm text-gray-600">Teléfono</p>
                <p className="text-lg font-medium">{user.telefono}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-600 mb-2">Roles</p>
              <div className="flex flex-wrap gap-2">
                {user.roles.map((rol: string) => (
                  <Badge
                    key={rol}
                    variant={ROLE_COLORS[rol] || 'gray'}
                  >
                    {rol}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pedidos recientes */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Mis pedidos recientes</h2>
        <PedidosRecientes />
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Acciones rápidas</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Mis direcciones */}
          <Button
            onClick={() => window.location.href = '/perfil/direcciones'}
            variant="ghost"
            size="lg"
          >
            📍 Gestionar direcciones
          </Button>

          {/* Catálogo */}
          <Button
            onClick={() => window.location.href = '/catalogo'}
            variant="ghost"
            size="lg"
          >
            🛒 Ir al catálogo
          </Button>
        </div>
      </div>
    </div>
  );
}
