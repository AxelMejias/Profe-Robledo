import { useParams } from 'react-router-dom';
import { ProductoDetalle } from '@/features/store';

export function ProductoDetallePage() {
  const { id } = useParams<{ id: string }>();

  return <ProductoDetalle productoId={Number(id)} />;
}
