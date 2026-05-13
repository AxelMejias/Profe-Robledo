import { useParams } from 'react-router-dom';
import { PedidoDetalle } from '@/features/pedidos';

export function PedidoDetallePage() {
  const { id } = useParams<{ id: string }>();

  return <PedidoDetalle pedidoId={Number(id)} />;
}
