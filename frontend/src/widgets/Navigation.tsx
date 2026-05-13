import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/store/authStore';
import { useCartStore } from '@/shared/store/cartStore';
import { Button, Badge } from '@/shared/ui';

export function Navigation() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const hasRole = useAuthStore((s) => s.hasRole);
  const logout = useAuthStore((s) => s.logout);
  const itemCount = useCartStore((s) => s.itemCount);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🍔</span>
            <span className="text-xl font-bold text-primary-500">Food Store</span>
          </Link>

          {/* Menu */}
          <div className="flex items-center gap-6">
            <Link to="/catalogo" className="hover:text-primary-500 transition-colors">
              Catálogo
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to={hasRole('ADMIN') ? '/ventas' : '/pedidos'}
                  className="hover:text-primary-500 transition-colors"
                >
                  {hasRole('ADMIN') ? 'Ventas' : 'Mis Pedidos'}
                </Link>

                <Link to="/carrito" className="relative hover:text-primary-500 transition-colors">
                  🛒 Carrito
                  {itemCount() > 0 && (
                    <Badge
                      variant="danger"
                      size="sm"
                      className="absolute -top-2 -right-2"
                    >
                      {itemCount()}
                    </Badge>
                  )}
                </Link>

                {hasRole('ADMIN') && (
                  <Link to="/admin" className="hover:text-primary-500 transition-colors">
                    Admin
                  </Link>
                )}

                <div className="flex items-center gap-3">
                  <Link to="/perfil" className="hover:text-primary-500 transition-colors">
                    👤 {user?.nombre}
                  </Link>
                  <Button onClick={handleLogout} variant="ghost" size="sm">
                    Salir
                  </Button>
                </div>
              </>
            )}

            {!isAuthenticated && (
              <>
                <Button onClick={() => navigate('/login')} variant="ghost" size="sm">
                  Iniciar sesión
                </Button>
                <Button onClick={() => navigate('/register')} size="sm">
                  Registrarse
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

