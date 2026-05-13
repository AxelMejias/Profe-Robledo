import { ReactNode } from 'react';
import { useAuthStore } from '@/shared/store/authStore';

interface RoleGuardProps {
  roles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ roles, children, fallback }: RoleGuardProps) {
  const hasRole = useAuthStore((s) => s.hasRole);

  const hasRequiredRole = roles.some((role) => hasRole(role));

  if (!hasRequiredRole) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso denegado</h1>
            <p className="text-gray-600 mb-6">
              No tenés permisos para acceder a esta sección.
            </p>
            <a
              href="/"
              className="inline-block bg-primary-500 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Volver al inicio
            </a>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
