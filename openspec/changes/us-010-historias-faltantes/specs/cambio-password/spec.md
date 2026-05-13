## ADDED Requirements

### Requirement: Endpoint para cambiar contraseña
`PUT /auth/me/password` SHALL aceptar `{"password_actual": str, "password_nuevo": str}` del usuario autenticado. Verifica que `password_actual` coincida con el hash almacenado antes de actualizar. `password_nuevo` debe tener mínimo 8 caracteres.

#### Scenario: Cambio exitoso
- **WHEN** usuario autenticado envía `password_actual` correcto y `password_nuevo` válido
- **THEN** el hash se actualiza, retorna 204 No Content, y todos los refresh tokens del usuario quedan revocados (forzar re-login)

#### Scenario: Contraseña actual incorrecta
- **WHEN** `password_actual` no coincide con el hash almacenado
- **THEN** retorna 400 con `code: "INVALID_CURRENT_PASSWORD"`

#### Scenario: Nueva contraseña muy corta
- **WHEN** `password_nuevo` tiene menos de 8 caracteres
- **THEN** retorna 422 con error de validación en el campo `password_nuevo`

#### Scenario: Nueva contraseña igual a la actual
- **WHEN** `password_nuevo` es idéntica a `password_actual`
- **THEN** retorna 400 con `code: "SAME_PASSWORD"`

### Requirement: Formulario de cambio de contraseña en perfil
La página de perfil SHALL incluir una sección "Cambiar contraseña" con tres campos: contraseña actual, nueva contraseña y confirmación. Solo se envía si los tres campos están completos y nueva == confirmación.

#### Scenario: Formulario válido
- **WHEN** usuario completa los tres campos correctamente y envía
- **THEN** se llama `PUT /auth/me/password`, se muestra toast de éxito y se limpian los campos

#### Scenario: Confirmación no coincide
- **WHEN** `password_nuevo` y `confirmar_password` no coinciden
- **THEN** se muestra error de validación inline sin llamar al backend

#### Scenario: Error de contraseña actual incorrecta
- **WHEN** el backend retorna 400 `INVALID_CURRENT_PASSWORD`
- **THEN** se muestra el error en el campo de contraseña actual
