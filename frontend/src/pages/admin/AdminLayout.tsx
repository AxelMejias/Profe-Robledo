import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/store/authStore';
import { Button } from '@/shared/ui';
import { useEffect } from 'react';

const menuItems = [
  { to: '/admin', label: 'Dashboard', icon: '📊' },
  { to: '/admin/productos', label: 'Productos', icon: '🍕' },
  { to: '/admin/categorias', label: 'Categorías', icon: '📁' },
  { to: '/admin/ingredientes', label: 'Ingredientes', icon: '🧂' },
  { to: '/admin/usuarios', label: 'Usuarios', icon: '👥' },
  { to: '/admin/stock', label: 'Stock', icon: '📦' },
  { to: '/admin/pedidos', label: 'Pedidos', icon: '🛒' },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const hasRole = useAuthStore((s) => s.hasRole);

  useEffect(() => {
    if (!hasRole('ADMIN')) {
      navigate('/');
    }
  }, [hasRole, navigate]);

  if (!hasRole('ADMIN')) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold text-danger mb-4">Acceso denegado</h1>
        <p className="text-gray-600 mb-6">No tenés permisos para acceder al panel de administración.</p>
        <Button onClick={() => navigate('/')}>Volver al inicio</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-primary-500 mb-6">Admin Panel</h2>
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}

