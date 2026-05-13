import { CartDrawer } from '@/features/store';

export function CarritoPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Mi Carrito</h1>
      <CartDrawer isOpen />
    </div>
  );
}
