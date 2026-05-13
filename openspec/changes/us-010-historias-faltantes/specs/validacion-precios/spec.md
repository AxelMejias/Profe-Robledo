## ADDED Requirements

### Requirement: Validar cambios de precio al validar carrito
El endpoint `POST /carrito/validar` SHALL retornar un campo `advertencias: list[str]` con mensajes para cada ítem cuyo `precio` enviado difiera del `precio_base` actual del producto. La validación NO bloquea el checkout.

#### Scenario: Precio sin cambios
- **WHEN** todos los ítems del carrito tienen el mismo precio que `producto.precio_base`
- **THEN** `advertencias` es lista vacía y `valido` refleja solo problemas de stock/disponibilidad

#### Scenario: Precio actualizado
- **WHEN** el precio enviado para un ítem difiere del `precio_base` actual
- **THEN** `advertencias` incluye el mensaje `"El precio de {nombre} cambió de ${precio_enviado} a ${precio_actual}"`

#### Scenario: Múltiples cambios de precio
- **WHEN** varios ítems tienen precios desactualizados
- **THEN** `advertencias` contiene una entrada por cada ítem afectado

### Requirement: Frontend muestra advertencias de precio en CartDrawer
El frontend SHALL mostrar las `advertencias` retornadas por `/carrito/validar` como alertas visuales amarillas en el `CartDrawer`, sin impedir que el usuario continúe al checkout.

#### Scenario: Advertencia visible
- **WHEN** la respuesta de validar contiene `advertencias` no vacías
- **THEN** el `CartDrawer` muestra cada advertencia en un banner amarillo antes del botón de checkout
