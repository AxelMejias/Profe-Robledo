import { useState } from 'react';
import { useUpdateRoles } from '@/entities/usuario/hooks';
import { useUIStore } from '@/shared/store/uiStore';
import { Modal, Button } from '@/shared/ui';
import type { Usuario } from '@/shared/types';

interface EditarRolesModalProps {
  usuario: Usuario;
  onClose: () => void;
}

const ROLES_DISPONIBLES = ['ADMIN', 'STOCK', 'PEDIDOS', 'CLIENT'];

export function EditarRolesModal({ usuario, onClose }: EditarRolesModalProps) {
  const updateRolesMutation = useUpdateRoles();
  const addToast = useUIStore((s) => s.addToast);

  const [selectedRoles, setSelectedRoles] = useState<string[]>(usuario.roles);

  const toggleRole = (rol: string) => {
    if (selectedRoles.includes(rol)) {
      setSelectedRoles((prev) => prev.filter((r) => r !== rol));
    } else {
      setSelectedRoles((prev) => [...prev, rol]);
    }
  };

  const handleSubmit = async () => {
    if (selectedRoles.length === 0) {
      addToast('error', 'Seleccioná al menos un rol');
      return;
    }

    try {
      await updateRolesMutation.mutateAsync({
        id: usuario.id,
        roles: selectedRoles,
      });

      addToast('success', 'Roles actualizados correctamente');

      onClose();
    } catch (error: any) {
      addToast('error', error.response?.data?.detail || 'Error al actualizar roles');
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Editar roles de ${usuario.nombre} ${usuario.apellido}`}
    >
      <div className="space-y-6">
        <div className="space-y-3">
          {ROLES_DISPONIBLES.map((rol) => (
            <label
              key={rol}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedRoles.includes(rol)}
                onChange={() => toggleRole(rol)}
                className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <span className="font-medium">{rol}</span>
              </div>
            </label>
          ))}
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button onClick={onClose} variant="ghost" disabled={updateRolesMutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={updateRolesMutation.isPending}>
            {updateRolesMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
