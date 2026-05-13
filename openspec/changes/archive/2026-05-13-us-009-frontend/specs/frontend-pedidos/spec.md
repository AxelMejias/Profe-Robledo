# Spec: frontend-pedidos — Gestión de Pedidos

## ADDED Requirements

### Requirement: User can create order from cart

El sistema SHALL permitir crear un pedido desde el carrito validando dirección de entrega y forma de pago.

#### Scenario: Crear pedido exitoso
- **WHEN** usuario tiene carrito válido, selecciona dirección de entrega, forma de pago "EFECTIVO", y hace clic en "Crear pedido"
- **THEN** sistema llama `POST /api/v1/pedidos` con items del carrito + direccion_id + forma_pago_codigo, backend crea pedido en estado PENDIENTE, frontend muestra confirmación con número de pedido, limpia carrito

#### Scenario: Crear pedido sin dirección
- **WHEN** usuario intenta crear pedido sin seleccionar dirección
- **THEN** sistema muestra error "Seleccioná una dirección de entrega" antes de enviar al backend

#### Scenario: Crear pedido con stock insuficiente
- **WHEN** usuario crea pedido pero un producto ya no tiene stock (otro cliente compró primero)
- **THEN** backend responde error 422 "Producto X: stock insuficiente", sistema muestra error y NO limpia el carrito

#### Scenario: Crear pedido con MercadoPago
- **WHEN** usuario selecciona forma de pago "MERCADOPAGO"
- **THEN** sistema crea pedido, redirige al checkout de MP (componente CardPayment)

### Requirement: User can view own orders

El sistema SHALL mostrar listado de pedidos del usuario autenticado con paginación.

#### Scenario: Listado de pedidos (CLIENT)
- **WHEN** usuario CLIENT accede a `/pedidos`
- **THEN** sistema llama `GET /api/v1/pedidos?page=1&size=10`, muestra solo pedidos del usuario con número, fecha, estado (badge coloreado), total

#### Scenario: Listado de pedidos (ADMIN/PEDIDOS)
- **WHEN** usuario con rol ADMIN o PEDIDOS accede a `/pedidos`
- **THEN** sistema llama `GET /api/v1/pedidos?page=1&size=10`, muestra TODOS los pedidos del sistema con filtro por estado

#### Scenario: Filtro por estado
- **WHEN** usuario ADMIN filtra por estado "PENDIENTE"
- **THEN** sistema llama `GET /api/v1/pedidos?estado_codigo=PENDIENTE&page=1&size=10`

#### Scenario: Empty state sin pedidos
- **WHEN** usuario CLIENT no tiene pedidos
- **THEN** sistema muestra "No tenés pedidos todavía" + botón "Ir al catálogo"

### Requirement: User can view order detail

El sistema SHALL mostrar detalle completo del pedido incluyendo líneas con snapshots, historial de estados y pagos.

#### Scenario: Ver detalle de pedido
- **WHEN** usuario hace clic en un pedido
- **THEN** sistema navega a `/pedidos/:id`, llama `GET /api/v1/pedidos/:id`, muestra: número, fecha, estado actual, dirección snapshot, items con nombre_snapshot y precio_snapshot (no precios actuales), subtotal, envío, total

#### Scenario: Items con personalización en detalle
- **WHEN** pedido tiene items con personalización
- **THEN** sistema muestra debajo de cada item: "Sin: Cebolla, Tomate"

#### Scenario: Ver historial de estados
- **WHEN** usuario ve detalle de pedido
- **THEN** sistema muestra timeline vertical con todas las transiciones de estado en orden cronológico: "PENDIENTE → CONFIRMADO (13/05 10:30 por Sistema) → EN_PREP (13/05 11:00 por Juan Pérez) → EN_CAMINO (13/05 12:00 por Juan Pérez)"

#### Scenario: Ver pagos asociados
- **WHEN** pedido tiene pagos registrados
- **THEN** sistema muestra sección "Pagos" con historial: fecha, monto, estado MP (approved/rejected), método (tarjeta terminada en 4242)

### Requirement: User can track order status visually

El sistema SHALL mostrar el estado actual del pedido en una timeline visual con íconos y colores.

#### Scenario: Timeline con estado actual
- **WHEN** pedido está EN_CAMINO
- **THEN** sistema muestra timeline con pasos: PENDIENTE (✓ verde), CONFIRMADO (✓ verde), EN_PREP (✓ verde), EN_CAMINO (● azul pulsante), ENTREGADO (gris deshabilitado)

#### Scenario: Pedido cancelado
- **WHEN** pedido está CANCELADO
- **THEN** sistema muestra timeline hasta último estado válido + badge rojo "CANCELADO" con motivo de cancelación si existe

#### Scenario: Actualización automática de estado
- **WHEN** usuario está viendo detalle de pedido y backend actualiza el estado (ej: webhook MP confirma pago)
- **THEN** sistema hace polling cada 30s a `GET /api/v1/pedidos/:id` para detectar cambios, actualiza UI sin reload

### Requirement: User can cancel own pending order

El sistema SHALL permitir cancelar pedidos propios en estado PENDIENTE o CONFIRMADO.

#### Scenario: Cancelar pedido PENDIENTE
- **WHEN** usuario CLIENT hace clic en "Cancelar pedido" de un pedido PENDIENTE
- **THEN** sistema muestra confirmación "¿Cancelar el pedido #123?", si confirma llama `DELETE /api/v1/pedidos/:id`, backend transiciona a CANCELADO y restaura stock si fue confirmado, frontend actualiza estado

#### Scenario: Cancelar pedido CONFIRMADO
- **WHEN** usuario intenta cancelar pedido CONFIRMADO
- **THEN** sistema muestra advertencia "El pedido ya fue confirmado. ¿Confirmar cancelación? (El stock se restaurará.)", si confirma ejecuta cancelación

#### Scenario: No puede cancelar pedido EN_PREP
- **WHEN** usuario intenta cancelar pedido EN_PREP
- **THEN** sistema deshabilita botón "Cancelar" y muestra tooltip "Solo un administrador puede cancelar pedidos en preparación"

#### Scenario: Admin puede cancelar EN_PREP
- **WHEN** usuario ADMIN hace clic en "Cancelar" de pedido EN_PREP
- **THEN** sistema pide confirmación + motivo obligatorio, llama `PATCH /api/v1/pedidos/:id/cancelar` con motivo, backend valida rol y ejecuta cancelación

### Requirement: Admin can advance order state

El sistema SHALL permitir a ADMIN y PEDIDOS avanzar el estado del pedido según FSM.

#### Scenario: Avanzar CONFIRMADO → EN_PREP
- **WHEN** gestor de pedidos hace clic en "Iniciar preparación" de pedido CONFIRMADO
- **THEN** sistema llama `PATCH /api/v1/pedidos/:id/estado` con `{ nuevo_estado: "EN_PREP" }`, backend valida transición FSM y rol, actualiza estado, frontend invalida query y recarga

#### Scenario: Avanzar EN_PREP → EN_CAMINO
- **WHEN** gestor marca pedido como despachado
- **THEN** sistema avanza a EN_CAMINO con timestamp y usuario responsable en historial

#### Scenario: Avanzar EN_CAMINO → ENTREGADO
- **WHEN** gestor confirma entrega al cliente
- **THEN** sistema avanza a ENTREGADO (estado terminal), botón "Avanzar" desaparece

#### Scenario: Transición inválida
- **WHEN** gestor intenta avanzar PENDIENTE directamente a EN_CAMINO
- **THEN** backend responde 422 "Transición inválida", frontend muestra error sin actualizar estado
