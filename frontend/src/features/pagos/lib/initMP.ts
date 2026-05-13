import { initMercadoPago } from '@mercadopago/sdk-react';

let initialized = false;

export function initMP() {
  if (initialized) return;

  const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY;

  if (!publicKey) {
    console.error('VITE_MP_PUBLIC_KEY no está configurada en .env');
    return;
  }

  initMercadoPago(publicKey, {
    locale: 'es-AR',
  });

  initialized = true;
}
