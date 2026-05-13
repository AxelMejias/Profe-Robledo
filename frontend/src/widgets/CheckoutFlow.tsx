// Este widget ya está implementado en CrearPedidoForm que integra:
// 1. Validación de carrito (botón "Validar stock" en CartDrawer)
// 2. Selección de dirección (inline en CrearPedidoForm)
// 3. Selección de forma de pago (inline en CrearPedidoForm)
// 4. Confirmación y creación de pedido (submit de CrearPedidoForm)
//
// Para mantener la arquitectura limpia, este widget simplemente
// reexporta el componente principal del flujo.

export { CrearPedidoForm as CheckoutFlow } from '@/features/pedidos';
