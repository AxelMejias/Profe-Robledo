import { useUIStore, type Toast as ToastType } from '@/shared/store/uiStore';
import clsx from 'clsx';

function ToastItem({ toast }: { toast: ToastType }) {
  const removeToast = useUIStore((s) => s.removeToast);

  const typeClasses = {
    success: 'bg-secondary-50 border-secondary-500 text-secondary-800',
    error: 'bg-danger-50 border-danger-500 text-danger-800',
    info: 'bg-primary-50 border-primary-500 text-primary-800',
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };

  return (
    <div
      className={clsx(
        'rounded-lg border-l-4 p-4 shadow-lg',
        'flex items-start gap-3',
        'animate-slide-in',
        typeClasses[toast.type]
      )}
    >
      <span className="text-xl font-bold">{icons[toast.type]}</span>
      <p className="flex-1 text-sm font-medium">
        {typeof toast.message === 'string' ? toast.message : 'Error inesperado'}
      </p>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-lg leading-none opacity-50 hover:opacity-100 transition-opacity"
      >
        ×
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <div className="pointer-events-auto space-y-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </div>
  );
}
