import axios from '@/shared/api/axios';

interface ValidarCarritoItem {
  producto_id: number;
  cantidad: number;
  personalizacion: number[];
}

interface ValidarCarritoResponse {
  valido: boolean;
  errores: string[];
}

export async function validarCarrito(
  items: ValidarCarritoItem[]
): Promise<ValidarCarritoResponse> {
  const response = await axios.post<ValidarCarritoResponse>(
    '/api/v1/carrito/validar',
    { items }
  );
  return response.data;
}
