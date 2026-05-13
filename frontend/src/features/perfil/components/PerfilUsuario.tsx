import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useAuthStore } from '@/shared/store/authStore';
import { useUIStore } from '@/shared/store/uiStore';
import { Button, Badge, Input } from '@/shared/ui';
import { PedidosRecientes } from './PedidosRecientes';
import axios from '@/shared/api/axios';

async function changePassword(passwordActual: string, passwordNuevo: string): Promise<void> {
  await axios.put('/auth/me/password', {
    password_actual: passwordActual,
    password_nuevo: passwordNuevo,
  });
}

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
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const passwordForm = useForm({
    defaultValues: {
      password_actual: '',
      password_nuevo: '',
      confirmar_password: '',
    },
    onSubmit: async ({ value }) => {
      setPasswordError(null);

      if (value.password_nuevo !== value.confirmar_password) {
        setPasswordError('Las contraseñas nuevas no coinciden');
        return;
      }

      setIsUpdatingPassword(true);
      try {
        await changePassword(value.password_actual, value.password_nuevo);
        addToast('success', 'Contraseña actualizada correctamente');
        setIsChangingPassword(false);
        passwordForm.reset();
      } catch (error: any) {
        const code = error.response?.headers?.['x-error-code'];
        if (code === 'INVALID_CURRENT_PASSWORD') {
          setPasswordError('La contraseña actual es incorrecta');
        } else {
          const raw = error.response?.data?.detail;
          setPasswordError(Array.isArray(raw) ? raw.map((e: any) => e.msg || String(e)).join(', ') : (raw || 'Error al cambiar la contraseña'));
        }
      } finally {
        setIsUpdatingPassword(false);
      }
    },
  });

  const form = useForm({
    defaultValues: {
      nombre: user?.nombre || '',
      apellido: user?.apellido || '',
      telefono: user?.telefono || '',
    },
    onSubmit: async ({ value }) => {
      setIsUpdating(true);

      try {
        const { data: updatedUser } = await axios.patch('/auth/me', value);

        // Actualizar el authStore con los nuevos datos para que el perfil se refleje sin recargar
        useAuthStore.setState({ user: updatedUser });

        addToast('success', 'Perfil actualizado correctamente');
        setIsEditing(false);
      } catch (error: any) {
        const raw = error.response?.data?.detail;
        const msg = Array.isArray(raw) ? raw.map((e: any) => e.msg || String(e)).join(', ') : (raw || 'Error al actualizar el perfil');
        addToast('error', msg);
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

      {/* Cambiar contraseña */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Cambiar contraseña</h2>
          {!isChangingPassword && (
            <Button onClick={() => setIsChangingPassword(true)} variant="ghost">
              Cambiar
            </Button>
          )}
        </div>

        {isChangingPassword && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              passwordForm.handleSubmit();
            }}
            className="space-y-4"
          >
            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-3 py-2 text-sm">
                {passwordError}
              </div>
            )}

            <passwordForm.Field
              name="password_actual"
              validators={{
                onChange: ({ value }) => !value ? 'Requerido' : undefined,
              }}
              children={(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña actual <span className="text-danger">*</span>
                  </label>
                  <Input
                    type="password"
                    value={field.state.value}
                    onChange={(e) => { field.handleChange(e.target.value); setPasswordError(null); }}
                    onBlur={field.handleBlur}
                    autoComplete="current-password"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-danger mt-1">{field.state.meta.errors[0]}</p>
                  )}
                </div>
              )}
            />

            <passwordForm.Field
              name="password_nuevo"
              validators={{
                onChange: ({ value }) =>
                  !value ? 'Requerido' : value.length < 8 ? 'Mínimo 8 caracteres' : undefined,
              }}
              children={(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva contraseña <span className="text-danger">*</span>
                  </label>
                  <Input
                    type="password"
                    value={field.state.value}
                    onChange={(e) => { field.handleChange(e.target.value); setPasswordError(null); }}
                    onBlur={field.handleBlur}
                    autoComplete="new-password"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-danger mt-1">{field.state.meta.errors[0]}</p>
                  )}
                </div>
              )}
            />

            <passwordForm.Field
              name="confirmar_password"
              validators={{
                onChange: ({ value }) => !value ? 'Requerido' : undefined,
              }}
              children={(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar nueva contraseña <span className="text-danger">*</span>
                  </label>
                  <Input
                    type="password"
                    value={field.state.value}
                    onChange={(e) => { field.handleChange(e.target.value); setPasswordError(null); }}
                    onBlur={field.handleBlur}
                    autoComplete="new-password"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-danger mt-1">{field.state.meta.errors[0]}</p>
                  )}
                </div>
              )}
            />

            <div className="flex gap-3 pt-4 border-t">
              <Button type="submit" disabled={isUpdatingPassword}>
                {isUpdatingPassword ? 'Guardando...' : 'Cambiar contraseña'}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setIsChangingPassword(false);
                  setPasswordError(null);
                  passwordForm.reset();
                }}
                variant="ghost"
                disabled={isUpdatingPassword}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}
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
