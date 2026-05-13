import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/store/authStore';
import { useUIStore } from '@/shared/store/uiStore';
import api from '@/shared/api/axios';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function LogoutButton({ className, children }: LogoutButtonProps) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const addToast = useUIStore((s) => s.addToast);

  const handleLogout = async () => {
    try {
      // Intentar invalidar el refresh token en backend
      if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken });
      }
    } catch (error) {
      // Ignorar errores del backend — logout local siempre se ejecuta
      console.warn('Error al invalidar token en backend:', error);
    } finally {
      logout();
      addToast('info', 'Sesión cerrada');
      navigate('/login');
    }
  };

  return (
    <button onClick={handleLogout} className={className}>
      {children || 'Salir'}
    </button>
  );
}
