import { useParams } from 'react-router-dom';
import { PagoRechazado } from '@/features/pagos';

export function PagoRechazadoPage() {
  const { id } = useParams<{ id: string }>();

  return <PagoRechazado pedidoId={Number(id)} />;
}
