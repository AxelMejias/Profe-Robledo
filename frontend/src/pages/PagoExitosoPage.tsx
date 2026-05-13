import { useParams } from 'react-router-dom';
import { PagoExitoso } from '@/features/pagos';

export function PagoExitosoPage() {
  const { id } = useParams<{ id: string }>();

  return <PagoExitoso pedidoId={Number(id)} />;
}
