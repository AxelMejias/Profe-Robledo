import { Badge } from '@/shared/ui';

interface EstadoPagoProps {
  estado: string; // pending | approved | rejected | in_process | cancelled
  className?: string;
}

const ESTADOS_CONFIG = {
  pending: {
    variant: 'gray' as const,
    icon: '⏳',
    label: 'Pendiente',
    color: 'text-gray-700',
  },
  approved: {
    variant: 'secondary' as const,
    icon: '✅',
    label: 'Aprobado',
    color: 'text-green-700',
  },
  rejected: {
    variant: 'danger' as const,
    icon: '❌',
    label: 'Rechazado',
    color: 'text-red-700',
  },
  in_process: {
    variant: 'primary' as const,
    icon: '⏳',
    label: 'En proceso',
    color: 'text-blue-700',
  },
  cancelled: {
    variant: 'danger' as const,
    icon: '✕',
    label: 'Cancelado',
    color: 'text-red-700',
  },
};

export function EstadoPago({ estado, className = '' }: EstadoPagoProps) {
  const config = ESTADOS_CONFIG[estado as keyof typeof ESTADOS_CONFIG] || ESTADOS_CONFIG.pending;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`text-2xl ${config.color}`}>{config.icon}</span>
      <Badge variant={config.variant}>{config.label}</Badge>
    </div>
  );
}
