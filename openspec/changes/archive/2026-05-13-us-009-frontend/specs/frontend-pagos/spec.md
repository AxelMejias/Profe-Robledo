# Spec: frontend-pagos — Checkout con MercadoPago

## ADDED Requirements

### Requirement: User can pay with MercadoPago

El sistema SHALL integrar MercadoPago SDK React para procesar pagos con tarjeta sin que los datos toquen el servidor.

#### Scenario: Inicializar checkout MP
- **WHEN** usuario selecciona forma de pago "MERCADOPAGO" en checkout
- **THEN** sistema inicializa SDK con `initMercadoPago(VITE_MP_PUBLIC_KEY)`, renderiza componente `<CardPayment>` con `amount` del total del pedido

#### Scenario: Tokenización de tarjeta
- **WHEN** usuario completa datos de tarjeta en formulario MP (número, vencimiento, CVV, titular)
- **THEN** SDK tokeniza datos en el browser, genera `cardFormData.token` sin enviar datos de tarjeta al servidor de Food Store (PCI SAQ-A compliant)

#### Scenario: Crear pago exitoso
- **WHEN** usuario hace submit del formulario MP con tarjeta válida
- **THEN** sistema envía `POST /api/v1/pagos/crear` con `{ pedido_id, token: cardFormData.token }`, backend llama API de MP con idempotency key, crea pago, responde con `{ id, estado: "processing" }`, frontend muestra loader "Procesando pago..."

#### Scenario: Pago aprobado
- **WHEN** backend recibe webhook IPN de MP con `status = "approved"`
- **THEN** backend transiciona pedido PENDIENTE→CONFIRMADO y decrementa stock, frontend hace polling cada 5s a `GET /api/v1/pedidos/:id` hasta detectar estado CONFIRMADO, muestra pantalla "✅ Pago aprobado, pedido confirmado"

#### Scenario: Pago rechazado
- **WHEN** MP rechaza pago (tarjeta sin fondos, banco rechaza)
- **THEN** backend recibe webhook con `status = "rejected"`, frontend detecta en polling, muestra error "❌ Pago rechazado: [motivo]", botón "Reintentar con otro método"

#### Scenario: Pago en proceso (efectivo pendiente)
- **WHEN** usuario selecciona pago con Rapipago/Pago Fácil
- **THEN** backend crea pago con `status = "pending"`, frontend muestra "Pago pendiente de acreditación, te notificaremos por email"

### Requirement: Payment status is tracked

El sistema SHALL mostrar el estado actual del pago y permitir consultar historial.

#### Scenario: Ver estado del pago en detalle de pedido
- **WHEN** usuario ve detalle de pedido con pago procesado
- **THEN** sistema llama `GET /api/v1/pagos/:pedido_id`, muestra estado: "Aprobado" (verde), "Rechazado" (rojo), "Pendiente" (amarillo), con fecha, monto, método

#### Scenario: Múltiples intentos de pago
- **WHEN** pedido tiene 2 intentos (primer pago rechazado, segundo aprobado)
- **THEN** sistema muestra historial cronológico: "Intento 1: Rechazado (13/05 10:00) — Fondos insuficientes", "Intento 2: Aprobado (13/05 10:15)"

#### Scenario: Reintentar pago rechazado
- **WHEN** usuario hace clic en "Reintentar pago" de pedido PENDIENTE con pago rechazado
- **THEN** sistema vuelve a mostrar formulario MP, permite nuevo intento sin crear pedido duplicado

### Requirement: Payment flow has clear UX states

El sistema SHALL mostrar estados de carga, error y éxito durante el flujo de pago.

#### Scenario: Loading state durante procesamiento
- **WHEN** usuario hace submit del formulario MP y espera respuesta
- **THEN** sistema muestra overlay con spinner + "Procesando pago, no cierres esta ventana"

#### Scenario: Timeout en polling
- **WHEN** polling de estado tarda más de 2 minutos sin respuesta de MP
- **THEN** sistema muestra "Pago en proceso, puede tardar unos minutos. Te notificaremos por email cuando se confirme" + botón "Ver mis pedidos"

#### Scenario: Error de red al crear pago
- **WHEN** `POST /api/v1/pagos/crear` falla por timeout o 500
- **THEN** sistema muestra error "Error al procesar el pago, intentá de nuevo" con botón "Reintentar", NO limpia el carrito

#### Scenario: Confirmación visual de pago exitoso
- **WHEN** pago es aprobado y pedido confirmado
- **THEN** sistema muestra pantalla de éxito con animación "✅ ¡Pago aprobado!", número de pedido destacado, mensaje "Tu pedido está siendo preparado", botón "Ver detalle del pedido"
