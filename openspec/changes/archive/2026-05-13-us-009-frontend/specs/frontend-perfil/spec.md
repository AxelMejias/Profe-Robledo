# Spec: frontend-perfil — Perfil de Usuario

## ADDED Requirements

### Requirement: User can view own profile

El sistema SHALL permitir ver datos del perfil propio incluyendo nombre, email y roles.

#### Scenario: Ver perfil propio
- **WHEN** usuario autenticado accede a `/perfil`
- **THEN** sistema muestra datos desde `authStore.user` (cargados en login): nombre, apellido, email, roles (badges con colores), fecha de registro

#### Scenario: Roles visibles
- **WHEN** usuario tiene múltiples roles (ej: ADMIN + STOCK)
- **THEN** sistema muestra ambos badges coloreados: "ADMIN" (púrpura), "STOCK" (azul)

#### Scenario: Sección de direcciones
- **WHEN** usuario ve su perfil
- **THEN** sistema muestra link "Mis direcciones de entrega" que redirige a `/perfil/direcciones`

### Requirement: User can edit own profile

El sistema SHALL permitir editar nombre, apellido y teléfono del perfil propio (no email ni contraseña en v1).

#### Scenario: Editar nombre y teléfono
- **WHEN** usuario hace clic en "Editar perfil", modifica nombre o teléfono y guarda
- **THEN** sistema llama `PATCH /api/v1/usuarios/me` (o `/perfil`), backend actualiza campos, frontend invalida query de usuario, actualiza `authStore.user`, muestra toast "Perfil actualizado"

#### Scenario: Email no editable
- **WHEN** usuario ve formulario de edición
- **THEN** campo email aparece deshabilitado con tooltip "El email no se puede cambiar"

#### Scenario: Contraseña no editable en v1
- **WHEN** usuario ve su perfil
- **THEN** NO hay opción de cambiar contraseña (funcionalidad pospuesta a v2 por requerir verificación de email)

#### Scenario: Validación de nombre vacío
- **WHEN** usuario intenta guardar perfil con nombre vacío
- **THEN** formulario muestra error de validación "El nombre es obligatorio"

### Requirement: User can view order history from profile

El sistema SHALL mostrar acceso rápido al historial de pedidos desde el perfil.

#### Scenario: Link a mis pedidos
- **WHEN** usuario ve su perfil
- **THEN** sistema muestra sección "Mis pedidos recientes" con últimos 3 pedidos + link "Ver todos mis pedidos" que redirige a `/pedidos`

#### Scenario: Resumen de pedido en perfil
- **WHEN** perfil muestra pedidos recientes
- **THEN** cada pedido muestra: número, fecha, estado (badge), total, link "Ver detalle"
