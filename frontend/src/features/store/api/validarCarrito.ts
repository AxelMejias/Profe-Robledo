import axios from '@/shared/api/axios';

interface ValidarCarritoItem {
  producto_id: number;
  cantidad: number;
  personalizacion: number[];
  precio?: number;
}

interface ValidarCarritoResponse {
  valido: boolean;
  errores: string[];
  advertencias: string[];
}

export async function validarCarrito(
  items: ValidarCarritoItem[]
): Promise<ValidarCarritoResponse> {
  const response = await axios.post<ValidarCarritoResponse>(
    '/carrito/validar',
    { items }
  );
  return response.data;
}
