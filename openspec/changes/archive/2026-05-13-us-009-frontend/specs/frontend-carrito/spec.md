# Spec: frontend-carrito — Gestión del Carrito de Compras

## ADDED Requirements

### Requirement: Cart persists across sessions

El carrito SHALL persistir en localStorage y sobrevivir al cierre del navegador, refresh de página y logout/login.

#### Scenario: Carrito persiste después de refresh
- **WHEN** usuario agrega items al carrito y recarga la página (F5)
- **THEN** sistema carga items desde `cartStore` (persist en localStorage), carrito mantiene los mismos items con cantidades y personalizaciones

#### Scenario: Carrito persiste después de logout/login
- **WHEN** usuario agrega items, hace logout, y vuelve a loguearse
- **THEN** sistema carga carrito desde localStorage, items se mantienen (el carrito es per-device, no per-user en v1)

#### Scenario: Carrito en múltiples tabs
- **WHEN** usuario abre 2 tabs del sitio y agrega items en tab 1
- **THEN** tab 2 NO se sincroniza automáticamente (carrito es per-tab hasta refresh)

### Requirement: Cart shows accurate totals

El sistema SHALL calcular y mostrar subtotal, costo de envío y total correctamente.

#### Scenario: Cálculo de subtotal
- **WHEN** carrito tiene 3 items: Pizza $500 x2, Hamburguesa $350 x1, Papas $200 x3
- **THEN** sistema calcula subtotal = (500*2) + (350*1) + (200*3) = $1950

#### Scenario: Costo de envío fijo
- **WHEN** carrito tiene items
- **THEN** sistema muestra costo de envío fijo = $50

#### Scenario: Total completo
- **WHEN** subtotal es $1950 y envío $50
- **THEN** sistema muestra total = $2000

#### Scenario: Carrito vacío sin envío
- **WHEN** carrito está vacío
- **THEN** sistema NO muestra costo de envío (solo se aplica si hay items)

### Requirement: Cart supports item personalization

El sistema SHALL permitir personalización de productos mediante exclusión de ingredientes.

#### Scenario: Personalizar producto al agregar
- **WHEN** usuario selecciona "sin cebolla" y "sin tomate" en detalle de producto
- **THEN** sistema agrega item con `personalizacion: [id_cebolla, id_tomate]` al carrito

#### Scenario: Ver personalización en carrito
- **WHEN** carrito tiene item con personalización
- **THEN** sistema muestra debajo del nombre del item: "Sin: Cebolla, Tomate"

#### Scenario: Items con distinta personalización son distintos
- **WHEN** usuario agrega Pizza sin cebolla y luego Pizza sin tomate
- **THEN** sistema crea 2 items separados en el carrito (distintas personalizaciones = distintos items)

### Requirement: Cart quantity controls are intuitive

El sistema SHALL proveer controles claros para ajustar cantidades y remover items.

#### Scenario: Incrementar cantidad
- **WHEN** usuario hace clic en botón "+" de un item
- **THEN** sistema incrementa cantidad en 1, actualiza subtotal del item y total general

#### Scenario: Decrementar cantidad
- **WHEN** usuario hace clic en botón "-" de un item con cantidad > 1
- **THEN** sistema decrementa cantidad en 1, actualiza totales

#### Scenario: Decrementar con cantidad = 1
- **WHEN** usuario hace clic en "-" de un item con cantidad = 1
- **THEN** sistema pregunta confirmación "¿Remover este item del carrito?" antes de eliminar

#### Scenario: Remover item directamente
- **WHEN** usuario hace clic en botón "✕" de un item
- **THEN** sistema remueve item inmediatamente sin confirmación, actualiza totales

#### Scenario: Vaciar carrito completo
- **WHEN** usuario hace clic en "Vaciar carrito"
- **THEN** sistema muestra confirmación "¿Seguro que querés vaciar el carrito?", si confirma llama `cartStore.clearCart()`
