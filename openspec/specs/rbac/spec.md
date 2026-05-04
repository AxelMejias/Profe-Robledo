# rbac Specification

## Purpose
TBD - created by archiving change us-001-auth. Update Purpose after archive.
## Requirements
### Requirement: Dependencia get_current_user
El sistema SHALL proveer una FastAPI Dependency `get_current_user` que extrae y valida el JWT del header `Authorization: Bearer <token>`. SHALL retornar el objeto Usuario con sus roles cargados. SHALL lanzar HTTP 401 si el token es inválido, expirado o ausente.

#### Scenario: Token válido
- **WHEN** un endpoint usa `Depends(get_current_user)` y el request incluye un JWT válido y no expirado
- **THEN** la dependency retorna el objeto Usuario con sus roles cargados desde BD

#### Scenario: Token ausente
- **WHEN** un endpoint usa `Depends(get_current_user)` y el request no incluye Authorization header
- **THEN** HTTP 401 Unauthorized

#### Scenario: Token expirado
- **WHEN** un endpoint usa `Depends(get_current_user)` y el JWT tiene `exp` en el pasado
- **THEN** HTTP 401 con mensaje indicando expiración del token

#### Scenario: Token con firma inválida
- **WHEN** un endpoint usa `Depends(get_current_user)` y el JWT fue firmado con una clave diferente
- **THEN** HTTP 401

---

### Requirement: Dependencia require_role
El sistema SHALL proveer una factory `require_role(roles: list[str])` que retorna una FastAPI Dependency. Esa dependency SHALL verificar que el usuario autenticado tenga al menos uno de los roles especificados. Un usuario puede tener múltiples roles simultáneamente (RN-RB02).

#### Scenario: Usuario con rol permitido
- **WHEN** un endpoint usa `Depends(require_role(["ADMIN"]))` y el usuario tiene rol ADMIN
- **THEN** la request procede normalmente

#### Scenario: Usuario con rol insuficiente
- **WHEN** un endpoint usa `Depends(require_role(["ADMIN"]))` y el usuario solo tiene rol CLIENT
- **THEN** HTTP 403 Forbidden

#### Scenario: Multi-rol satisface require_role
- **WHEN** un endpoint usa `Depends(require_role(["ADMIN", "STOCK"]))` y el usuario tiene rol STOCK
- **THEN** la request procede normalmente

---

### Requirement: Asignación de roles por ADMIN
El sistema SHALL permitir a un usuario con rol ADMIN asignar o revocar roles de otros usuarios. Solo ADMIN puede ejecutar esta operación (RN-RB03). Un ADMIN NO SHALL poder quitarse el rol ADMIN a sí mismo si es el último administrador del sistema (RN-RB04).

#### Scenario: ADMIN asigna rol a usuario
- **WHEN** un usuario con rol ADMIN hace PUT /api/v1/usuarios/{id}/roles con lista de roles válidos
- **THEN** HTTP 200 y el usuario objetivo queda con exactamente esos roles asignados

#### Scenario: Non-ADMIN intenta asignar roles
- **WHEN** un usuario con rol CLIENT o STOCK intenta PUT /api/v1/usuarios/{id}/roles
- **THEN** HTTP 403 Forbidden

#### Scenario: Último ADMIN no puede quitarse el rol ADMIN
- **WHEN** el único usuario con rol ADMIN intenta hacer PUT /api/v1/usuarios/{su_id}/roles con lista que no incluye ADMIN
- **THEN** HTTP 400 con mensaje "No se puede quitar el rol ADMIN al último administrador"

---

### Requirement: Rutas públicas sin autenticación
El sistema SHALL permitir acceso sin token a las rutas del catálogo (`GET /api/v1/productos`), registro (`POST /api/v1/auth/register`), login (`POST /api/v1/auth/login`) y refresh (`POST /api/v1/auth/refresh`). Todas las demás rutas SHALL requerir Bearer token válido.

#### Scenario: Acceso público al catálogo
- **WHEN** se hace GET /api/v1/productos sin Authorization header
- **THEN** HTTP 200 con lista de productos disponibles

#### Scenario: Acceso protegido sin token
- **WHEN** se hace GET /api/v1/auth/me sin Authorization header
- **THEN** HTTP 401

#### Scenario: Rol CLIENT accede a endpoint de ADMIN
- **WHEN** un usuario con solo rol CLIENT intenta acceder a un endpoint que requiere ADMIN
- **THEN** HTTP 403 Forbidden

