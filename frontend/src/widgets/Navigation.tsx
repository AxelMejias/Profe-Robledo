import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/store/authStore';
import { useCartStore } from '@/shared/store/cartStore';
import { Button } from '@/shared/ui';

export function Navigation() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const hasRole = useAuthStore((s) => s.hasRole);
  const logout = useAuthStore((s) => s.logout);
  const itemCount = useCartStore((s) => s.itemCount());

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-[#EDD298]/70 shadow-md border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🍔</span>
            <span className="text-xl font-bold text-primary-500">Food Store</span>
          </Link>

          {/* Menu */}
          <div className="flex items-center gap-6 font-semibold">
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

                {hasRole('ADMIN') && (
                  <Link to="/admin" className="hover:text-primary-500 transition-colors">
                    Panel de Gestión
                  </Link>
                )}
              </>
            )}

            {/* Carrito visible para todos */}
            <Link to="/carrito" className="relative hover:text-primary-500 transition-colors">
              🛒 Carrito
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[1.1rem] h-[1.1rem] flex items-center justify-center bg-[#69A9FF] text-black text-xs font-bold rounded-full px-1">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Dropdown usuario */}
            {isAuthenticated && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="flex items-center gap-1.5 hover:text-primary-500 transition-colors focus:outline-none"
                >
                  <span>👤</span>
                  <span>{user?.nombre}</span>
                  <span className="text-xs text-gray-500">{dropdownOpen ? '▲' : '▼'}</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                    <Link
                      to="/perfil"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#F8F1EB] transition-colors"
                    >
                      <span>👤</span> Mi perfil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-[#F8F1EB] transition-colors"
                    >
                      <span>🚪</span> Salir
                    </button>
                  </div>
                )}
              </div>
            )}

            {!isAuthenticated && (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border-2 border-[#69A9FF] text-gray-800 focus:outline-none"
                  style={{ backgroundColor: '#efd9a9' }}
                >
                  Iniciar sesión
                </button>
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

