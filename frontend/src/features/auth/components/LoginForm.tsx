import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/shared/store/authStore';
import { useUIStore } from '@/shared/store/uiStore';
import { Button, Input } from '@/shared/ui';
import api from '@/shared/api/axios';

export function LoginForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const addToast = useUIStore((s) => s.addToast);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Login
      const { data: tokens } = await api.post('/auth/login', { email, password });
      
      // 2. Guardamos tokens primero para que el interceptor los use
      useAuthStore.getState().updateTokens(tokens.access_token, tokens.refresh_token);
      
      // 3. Cargamos datos del usuario
      const { data: user } = await api.get('/auth/me');
      
      // 4. Actualizamos el store completo
      login(tokens.access_token, tokens.refresh_token, {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        roles: user.roles,
      });

      addToast('success', 'Sesión iniciada correctamente');

      // Redirigir a la ruta original o al home
      const redirectTo = searchParams.get('redirect') || '/';
      navigate(redirectTo);
    } catch (err: any) {
      const raw = err.response?.data?.detail;
      const message = Array.isArray(raw) ? raw.map((e: any) => e.msg || String(e)).join(', ') : (raw || 'Email o contraseña incorrectos');
      setError(message);
      useAuthStore.getState().logout();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Iniciar sesión</h1>
        <p className="text-gray-600">Ingresá a tu cuenta de Food Store</p>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        required
      />

      <Input
        label="Contraseña"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        required
      />

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Ingresando...' : 'Ingresar'}
      </Button>

      <p className="text-center text-sm text-gray-600">
        ¿No tenés cuenta?{' '}
        <a href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
          Registrate
        </a>
      </p>
    </form>
  );
}
