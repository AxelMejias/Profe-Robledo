## ADDED Requirements

### Requirement: Campo activo en Usuario
El modelo `Usuario` SHALL tener un campo `activo: bool = True`. La migración Alembic SHALL agregar la columna con `server_default='true'` para no afectar usuarios existentes.

#### Scenario: Usuario existente tras migración
- **WHEN** se corre `alembic upgrade head` con usuarios ya en BD
- **THEN** todos los usuarios existentes quedan con `activo = True`

### Requirement: Endpoint para activar/desactivar usuario
`PATCH /usuarios/{id}/estado` SHALL aceptar `{"activo": bool}` y actualizar el campo. Solo accesible para `ADMIN`. No puede desactivarse a sí mismo. No puede desactivar al último ADMIN activo.

#### Scenario: Desactivar usuario
- **WHEN** ADMIN envía `{"activo": false}` para un usuario CLIENT
- **THEN** el usuario queda con `activo = False` y retorna 200 con `UserResponse`

#### Scenario: Reactivar usuario
- **WHEN** ADMIN envía `{"activo": true}` para un usuario inactivo
- **THEN** el usuario queda con `activo = True`

#### Scenario: Intentar desactivarse a sí mismo
- **WHEN** ADMIN envía `{"activo": false}` para su propio id
- **THEN** retorna 400 con `code: "CANNOT_DEACTIVATE_SELF"`

#### Scenario: Desactivar último ADMIN activo
- **WHEN** solo queda 1 ADMIN activo y se intenta desactivarlo
- **THEN** retorna 400 con `code: "LAST_ADMIN"`

### Requirement: Login bloqueado para usuarios inactivos
`POST /auth/login` SHALL verificar `usuario.activo` antes de emitir tokens. Si `activo == False`, retorna 403.

#### Scenario: Login de usuario inactivo
- **WHEN** usuario con `activo = False` intenta hacer login con credenciales correctas
- **THEN** retorna 403 con `code: "USER_INACTIVE"` sin revelar si la contraseña es válida

### Requirement: Toggle activo/inactivo en GestionUsuarios
La tabla de usuarios en el panel admin SHALL mostrar un badge de estado (Activo/Inactivo) clickeable que llama `PATCH /usuarios/{id}/estado` para alternar el valor.

#### Scenario: Toggle exitoso
- **WHEN** ADMIN hace click en el badge de estado de un usuario
- **THEN** se llama el endpoint, el badge cambia de color y se muestra toast de éxito
