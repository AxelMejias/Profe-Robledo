import { Link } from 'react-router-dom';
import { useAuthStore } from '@/shared/store/authStore';
import { Modal } from '@/shared/ui';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasRole = useAuthStore((s) => s.hasRole);

  const menuItems = [
    { to: '/', label: 'Inicio', public: true },
    { to: '/catalogo', label: 'Catálogo', public: true },
    { to: '/pedidos', label: 'Mis Pedidos', public: false },
    { to: '/perfil', label: 'Mi Perfil', public: false },
    { to: '/carrito', label: 'Carrito', public: true },
  ];

  return (
    <Modal open={isOpen} onClose={onClose} title="Menú">
      <nav className="space-y-2">
        {menuItems.map((item) => {
          if (!item.public && !isAuthenticated) return null;

          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              className="block px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {item.label}
            </Link>
          );
        })}

        {isAuthenticated && hasRole('ADMIN') && (
          <Link
            to="/admin"
            onClick={onClose}
            className="block px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-primary-500"
          >
            Panel de Administración
          </Link>
        )}

        {!isAuthenticated && (
          <>
            <Link
              to="/login"
              onClick={onClose}
              className="block px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/register"
              onClick={onClose}
              className="block px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-primary-500"
            >
              Registrarse
            </Link>
          </>
        )}
      </nav>
    </Modal>
  );
}

