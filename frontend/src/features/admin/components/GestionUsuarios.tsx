import { useState } from 'react';
import { useUsuarios, useToggleEstadoUsuario } from '@/entities/usuario/hooks';
import { Skeleton, EmptyState, Badge } from '@/shared/ui';
import { EditarRolesModal } from './EditarRolesModal';
import type { Usuario } from '@/shared/types';

const ROLE_COLORS: Record<string, 'primary' | 'secondary' | 'danger' | 'gray'> = {
  ADMIN: 'danger',
  STOCK: 'primary',
  PEDIDOS: 'secondary',
  CLIENT: 'gray',
};

export function GestionUsuarios() {
  const { data: usuarios, isLoading } = useUsuarios();
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const toggleEstado = useToggleEstadoUsuario();

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  if (!usuarios || usuarios.items.length === 0) {
    return <EmptyState title="No hay usuarios" description="No se encontraron usuarios en el sistema." />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Roles
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {usuarios.items.map((usuario) => (
              <tr key={usuario.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium">{usuario.nombre} {usuario.apellido}</div>
                  {usuario.telefono && (
                    <div className="text-sm text-gray-500">{usuario.telefono}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {usuario.email}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {usuario.roles.map((rol) => (
                      <Badge key={rol} variant={ROLE_COLORS[rol] || 'gray'} size="sm">
                        {rol}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => toggleEstado.mutate({ id: usuario.id, activo: !usuario.activo })}
                    disabled={toggleEstado.isPending}
                    title={usuario.activo ? 'Click para desactivar' : 'Click para activar'}
                    className="cursor-pointer disabled:opacity-50"
                  >
                    <Badge variant={usuario.activo ? 'primary' : 'gray'} size="sm">
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button
                    onClick={() => setEditingUsuario(usuario)}
                    className="text-primary-500 hover:underline"
                  >
                    Editar roles
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUsuario && (
        <EditarRolesModal
          usuario={editingUsuario}
          onClose={() => setEditingUsuario(null)}
        />
      )}
    </div>
  );
}

