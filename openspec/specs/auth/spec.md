# auth Specification

## Purpose
TBD - created by archiving change us-001-auth. Update Purpose after archive.
## Requirements
### Requirement: Registro de cliente
El sistema SHALL crear una cuenta de usuario cuando se proveen nombre, apellido, email válido y contraseña de mínimo 8 caracteres. El rol CLIENT se asigna automáticamente en la capa de servicio; nunca viene del request. La contraseña SHALL almacenarse hasheada con bcrypt (cost factor >= 12). La respuesta SHALL incluir un par access token + refresh token.

#### Scenario: Registro exitoso
- **WHEN** se hace POST /api/v1/auth/register con nombre, apellido, email nuevo y contraseña >= 8 chars
- **THEN** se crea el usuario con rol CLIENT, status 201 y body con access_token, refresh_token, token_type y expires_in

#### Scenario: Email duplicado
- **WHEN** se hace POST /api/v1/auth/register con un email ya registrado
- **THEN** se retorna HTTP 400 con detail "El email ya está registrado"

#### Scenario: Contraseña corta
- **WHEN** se hace POST /api/v1/auth/register con contraseña de menos de 8 caracteres
- **THEN** se retorna HTTP 422 con error de validación en campo password

#### Scenario: Rol no manipulable desde request
- **WHEN** el body del registro incluye un campo rol o roles
- **THEN** el campo es ignorado y el usuario recibe CLIENT de todas formas

---

### Requirement: Login con emisión de tokens
El sistema SHALL autenticar al usuario verificando email y password. Si las credenciales son válidas, SHALL emitir un access token JWT (HS256, 30 min) y un refresh token (UUID v4, 7 días). La respuesta NO SHALL diferenciar "email no existe" de "contraseña incorrecta" (RN-AU08). El endpoint SHALL estar protegido por rate limiting de 5 intentos por IP en ventana de 15 minutos.

#### Scenario: Login exitoso
- **WHEN** se hace POST /api/v1/auth/login con email y password correctos
- **THEN** status 200 con access_token (JWT), refresh_token (UUID v4), token_type "bearer" y expires_in 1800

#### Scenario: Credenciales inválidas
- **WHEN** se hace POST /api/v1/auth/login con email inexistente o password incorrecta
- **THEN** HTTP 401 con mensaje genérico sin revelar cuál campo es incorrecto

#### Scenario: Rate limit excedido
- **WHEN** la misma IP hace 6 o más intentos de login en menos de 15 minutos
- **THEN** HTTP 429 con header Retry-After indicando segundos restantes

#### Scenario: Access token contiene claims correctos
- **WHEN** se emite un access token tras login exitoso
- **THEN** el JWT decodificado contiene sub (user_id), email y roles como lista de strings

---

### Requirement: Rotación de refresh token
El sistema SHALL implementar rotación completa de refresh tokens. Cada uso del refresh token SHALL revocar el token actual y emitir un nuevo par. Si se detecta uso de un token ya revocado (replay attack), el sistema SHALL revocar TODOS los tokens activos del usuario.

#### Scenario: Refresh exitoso
- **WHEN** se hace POST /api/v1/auth/refresh con un refresh_token válido y no revocado
- **THEN** HTTP 200 con nuevo access_token y nuevo refresh_token; el token anterior queda con revoked_at != NULL

#### Scenario: Refresh con token expirado
- **WHEN** se hace POST /api/v1/auth/refresh con un refresh_token cuyo expires_at está en el pasado
- **THEN** HTTP 401 indicando que la sesión expiró

#### Scenario: Replay attack detectado
- **WHEN** se hace POST /api/v1/auth/refresh con un refresh_token que ya fue utilizado (revoked_at != NULL)
- **THEN** HTTP 401 y TODOS los refresh tokens del usuario quedan revocados en BD

#### Scenario: Refresh con token inexistente
- **WHEN** se hace POST /api/v1/auth/refresh con un UUID que no existe en BD
- **THEN** HTTP 401

---

### Requirement: Logout con revocación de refresh token
El sistema SHALL revocar el refresh token activo en BD cuando el usuario hace logout. El access token continúa siendo válido hasta su expiración natural (stateless).

#### Scenario: Logout exitoso
- **WHEN** se hace POST /api/v1/auth/logout con Bearer token válido y body con refresh_token activo
- **THEN** HTTP 204 y el registro RefreshToken en BD tiene revoked_at con timestamp actual

#### Scenario: Logout con token ya revocado
- **WHEN** se hace POST /api/v1/auth/logout con un refresh_token ya revocado
- **THEN** HTTP 400 indicando que el token ya fue invalidado

#### Scenario: Logout sin autenticación
- **WHEN** se hace POST /api/v1/auth/logout sin Bearer token en el header
- **THEN** HTTP 401

---

### Requirement: Perfil del usuario autenticado
El sistema SHALL retornar los datos del usuario autenticado sin incluir el campo password_hash.

#### Scenario: GET /me exitoso
- **WHEN** se hace GET /api/v1/auth/me con Bearer token válido
- **THEN** HTTP 200 con id, nombre, apellido, email, roles (lista de strings) y created_at; sin password_hash

#### Scenario: GET /me sin token
- **WHEN** se hace GET /api/v1/auth/me sin Authorization header
- **THEN** HTTP 401

