import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/store/authStore';
import { useUIStore } from '@/shared/store/uiStore';
import { Button, Input } from '@/shared/ui';
import api from '@/shared/api/axios';

export function RegisterForm() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const addToast = useUIStore((s) => s.addToast);

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (nombre.length < 2) newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    if (apellido.length < 2) newErrors.apellido = 'El apellido debe tener al menos 2 caracteres';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Email inválido';
    if (password.length < 8) newErrors.password = 'La contraseña debe tener al menos 8 caracteres';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      // 1. Registro
      const { data: tokens } = await api.post('/auth/register', {
        nombre,
        apellido,
        email,
        password,
        telefono: telefono || undefined,
      });

      // 2. Guardamos tokens
      useAuthStore.getState().updateTokens(tokens.access_token, tokens.refresh_token);

      // 3. Cargamos usuario
      const { data: user } = await api.get('/auth/me');

      // 4. Login automático
      login(tokens.access_token, tokens.refresh_token, {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        roles: user.roles,
      });

      addToast('success', '¡Cuenta creada exitosamente!');
      navigate('/catalogo');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (detail?.includes('email')) {
        setErrors({ email: 'El email ya está registrado' });
      } else {
        setErrors({ general: detail || 'Error al crear la cuenta' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Crear cuenta</h1>
        <p className="text-gray-600">Registrate en Food Store</p>
      </div>

      {errors.general && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm">
          {errors.general}
        </div>
      )}

      <Input
        label="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        error={errors.nombre}
        required
      />

      <Input
        label="Apellido"
        value={apellido}
        onChange={(e) => setApellido(e.target.value)}
        error={errors.apellido}
        required
      />

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        placeholder="tu@email.com"
        required
      />

      <Input
        label="Contraseña"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        placeholder="Mínimo 8 caracteres"
        required
      />

      <Input
        label="Teléfono (opcional)"
        type="tel"
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
        placeholder="+54 9 11 1234-5678"
      />

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
      </Button>

      <p className="text-center text-sm text-gray-600">
        ¿Ya tenés cuenta?{' '}
        <a href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
          Iniciá sesión
        </a>
      </p>
    </form>
  );
}
