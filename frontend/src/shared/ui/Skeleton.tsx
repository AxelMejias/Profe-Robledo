import clsx from 'clsx';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className,
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200';
  
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={clsx(baseClasses, variantClasses[variant], className)}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

// Skeleton para card de producto
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <Skeleton variant="rectangular" height={128} />
      <div className="p-3 space-y-2">
        <Skeleton width="80%" />
        <Skeleton width="40%" />
        <Skeleton variant="rectangular" height={32} className="mt-2" />
      </div>
    </div>
  );
}

// Skeleton para fila de tabla
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton />
        </td>
      ))}
    </tr>
  );
}
