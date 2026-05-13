# Spec: frontend-direcciones — Direcciones de Entrega

## ADDED Requirements

### Requirement: User can manage delivery addresses

El sistema SHALL permitir CRUD de direcciones de entrega del usuario autenticado.

#### Scenario: Listar direcciones propias
- **WHEN** usuario autenticado accede a `/perfil/direcciones`
- **THEN** sistema llama `GET /api/v1/direcciones`, muestra lista con alias, dirección completa (linea1, ciudad, código postal), badge "Principal" si `es_principal = true`, acciones (editar, eliminar, marcar principal)

#### Scenario: Crear dirección
- **WHEN** usuario hace clic en "Agregar dirección", completa formulario (alias opcional, linea1 requerida, linea2 opcional, ciudad, código postal, referencia opcional) y guarda
- **THEN** sistema llama `POST /api/v1/direcciones`, backend crea dirección, si es la primera se marca como principal automáticamente (RN-DI01), frontend invalida query y muestra toast "Dirección agregada"

#### Scenario: Editar dirección
- **WHEN** usuario edita dirección existente
- **THEN** sistema llama `PUT /api/v1/direcciones/:id`, actualiza campos, invalida query

#### Scenario: Eliminar dirección (soft delete)
- **WHEN** usuario hace clic en "Eliminar" de una dirección
- **THEN** sistema muestra confirmación "¿Eliminar dirección X?", si confirma llama `DELETE /api/v1/direcciones/:id` (soft delete), dirección desaparece de la lista

#### Scenario: No puede eliminar última dirección principal
- **WHEN** usuario intenta eliminar la única dirección que tiene (y es principal)
- **THEN** sistema permite eliminar (puede quedar sin direcciones, las creará al hacer checkout)

#### Scenario: Validación de código postal
- **WHEN** usuario ingresa código postal con formato inválido (ej: letras o menos de 4 dígitos)
- **THEN** formulario muestra error de validación client-side antes de enviar

### Requirement: User can set primary address

El sistema SHALL permitir marcar una dirección como principal, desactivando automáticamente la anterior.

#### Scenario: Marcar dirección como principal
- **WHEN** usuario hace clic en "Marcar como principal" de una dirección
- **THEN** sistema llama `PATCH /api/v1/direcciones/:id/principal`, backend desactiva `es_principal` de todas las demás direcciones del usuario y activa la seleccionada (RN-DI02), frontend actualiza badges

#### Scenario: Primera dirección es principal automáticamente
- **WHEN** usuario crea su primera dirección
- **THEN** backend la marca como principal automáticamente sin input del usuario, frontend muestra badge "Principal"

#### Scenario: Solo una dirección principal a la vez
- **WHEN** sistema marca dirección nueva como principal
- **THEN** backend garantiza que las demás direcciones tienen `es_principal = false` (validación en backend)

### Requirement: Address selection in checkout

El sistema SHALL permitir seleccionar dirección de entrega durante el checkout.

#### Scenario: Seleccionar dirección en checkout
- **WHEN** usuario está en checkout y hace clic en "Seleccionar dirección"
- **THEN** sistema muestra modal/drawer con lista de direcciones del usuario, dirección principal preseleccionada

#### Scenario: Dirección principal preseleccionada
- **WHEN** usuario abre selector de dirección
- **THEN** dirección con `es_principal = true` aparece seleccionada por defecto

#### Scenario: Crear dirección desde checkout
- **WHEN** usuario hace clic en "Agregar nueva dirección" desde el checkout
- **THEN** sistema muestra formulario inline, al guardar crea dirección, la selecciona automáticamente para el pedido actual

#### Scenario: No puede crear pedido sin dirección
- **WHEN** usuario intenta crear pedido sin seleccionar dirección y no tiene ninguna creada
- **THEN** sistema muestra error "Agregá una dirección de entrega para continuar"
