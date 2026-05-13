import { useParams } from 'react-router-dom';
import { CheckoutMP } from '@/features/pagos';

export function PagoMPPage() {
  const { id } = useParams<{ id: string }>();

  return <CheckoutMP pedidoId={Number(id)} />;
}
