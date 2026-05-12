## 1. Modelo — Relación roles en Usuario

- [ ] 1.1 Agregar `usuario_roles: list["UsuarioRol"]` Relationship en `app/modules/usuarios/model.py` con import forward reference para evitar circular
- [ ] 1.2 Verificar que `password_hash` acepta hashes bcrypt de 60 chars (ya definido, confirmar)

## 2. Schemas de Auth

- [ ] 2.1 Crear `RegisterRequest` (nombre min 2, apellido min 2, email: EmailStr, password min 8 chars) en `app/modules/auth/schemas.py`
- [ ] 2.2 Crear `LoginRequest` (email: EmailStr, password: str) en `app/modules/auth/schemas.py`
- [ ] 2.3 Crear `TokenResponse` (access_token, refresh_token, token_type="bearer", expires_in: int) en `app/modules/auth/schemas.py`
- [ ] 2.4 Crear `UserResponse` (id, nombre, apellido, email, roles: list[str], creado_en) — sin password_hash — en `app/modules/auth/schemas.py`
- [ ] 2.5 Crear `RefreshRequest` (refresh_token: str) en `app/modules/auth/schemas.py`
- [ ] 2.6 Crear `LogoutRequest` (refresh_token: str) en `app/modules/auth/schemas.py`

## 3. Repositorios

- [ ] 3.1 Implementar `UsuarioRepository(BaseRepository[Usuario])` en `app/modules/auth/repository.py` con métodos: `get_by_email(email) → Usuario | None`, `get_with_roles(id) → Usuario | None` (eager load de usuario_roles → rol)
- [ ] 3.2 Implementar `RefreshTokenRepository(BaseRepository[RefreshToken])` en `app/modules/refreshtokens/repository.py` con métodos: `get_by_hash(token_hash: str) → RefreshToken | None`, `revoke(rt: RefreshToken) → None`, `revoke_all_for_user(usuario_id: int) → None`

## 4. Unit of Work — registrar repositorios

- [ ] 4.1 Agregar `self.usuarios: UsuarioRepository` y `self.refresh_tokens: RefreshTokenRepository` en `UnitOfWork._init_repositories()` en `app/core/uow.py`

## 5. Core — dependencias FastAPI

- [ ] 5.1 Crear `app/core/deps.py` con `get_current_user(token: str = Depends(oauth2_scheme)) → Usuario`: decodifica JWT, carga usuario con roles, lanza 401 si inválido o expirado
- [ ] 5.2 Implementar `require_role(roles: list[str]) → Callable` factory en `app/core/deps.py`: verifica que el usuario tenga al menos un rol de la lista, lanza 403 si no cumple

## 6. Auth Service

- [ ] 6.1 Implementar `register(uow, data: RegisterRequest) → TokenResponse`: verificar email único (400 si duplicado), hashear password con bcrypt, crear Usuario, asignar rol CLIENT via UsuarioRol, emitir par de tokens
- [ ] 6.2 Implementar `login(uow, data: LoginRequest) → TokenResponse`: buscar por email, verificar password (401 genérico sin revelar qué campo falló — RN-AU08), emitir par de tokens, guardar RefreshToken con hash SHA-256 en BD
- [ ] 6.3 Implementar `refresh(uow, refresh_token: str) → TokenResponse`: hashear UUID, buscar en BD, si `revoked_at IS NOT NULL` → revocar todos los tokens del usuario → 401 (replay attack RN-AU05), si expirado → 401, si válido → revocar actual, emitir nuevo par
- [ ] 6.4 Implementar `logout(uow, refresh_token: str, current_user: Usuario) → None`: buscar token por hash, verificar que pertenece al current_user, marcar `revoked_at = now()`; si ya revocado → 400
- [ ] 6.5 Extraer helper privado `_create_token_pair(uow, usuario: Usuario) → TokenResponse`: genera access JWT (sub=user_id, email, roles, exp=30min), genera UUID refresh token, guarda `RefreshToken(token_hash=sha256(uuid), usuario_id, expires_at=7días)` en BD via `uow.refresh_tokens.create()`

## 7. Auth Router

- [ ] 7.1 Implementar `POST /register` con body `RegisterRequest` → llama `auth_service.register()` → 201 `TokenResponse`
- [ ] 7.2 Implementar `POST /login` con `@limiter.limit("5/15minutes")`, `request: Request` como primer param, body `LoginRequest` → llama `auth_service.login()` → 200 `TokenResponse`
- [ ] 7.3 Implementar `POST /refresh` con body `RefreshRequest` → llama `auth_service.refresh()` → 200 `TokenResponse`
- [ ] 7.4 Implementar `POST /logout` con body `LogoutRequest` + `Depends(get_current_user)` → llama `auth_service.logout()` → 204 No Content
- [ ] 7.5 Implementar `GET /me` con `Depends(get_current_user)` → 200 `UserResponse`
- [ ] 7.6 Importar `limiter` desde `app.main` en `auth/router.py` (o pasarlo vía `request.app.state.limiter`)

## 8. Usuario — asignación de roles (RBAC)

- [ ] 8.1 Agregar schemas `AssignRolesRequest` (roles: list[str]) y `UserRolesResponse` (id, email, roles: list[str]) en `app/modules/usuarios/schemas.py`
- [ ] 8.2 Implementar `UsuarioRepository` en `app/modules/usuarios/repository.py` con: `get_by_id_with_roles(id)`, `set_roles(usuario_id, roles: list[str], asignado_por_id: int)`
- [ ] 8.3 Implementar lógica en `app/modules/usuarios/service.py`: validar roles válidos, proteger último ADMIN (RN-RB04: si solo queda 1 ADMIN y se intenta quitar → 400), reemplazar roles del usuario
- [ ] 8.4 Implementar `PUT /api/v1/usuarios/{id}/roles` en `app/modules/usuarios/router.py` con `Depends(require_role(["ADMIN"]))` → 200 `UserRolesResponse`

## 9. Wiring — main.py

- [ ] 9.1 Descomentar import y `app.include_router(auth_router, prefix="/api/v1")` en `app/main.py`
- [ ] 9.2 Descomentar import y `app.include_router(usuarios_router, prefix="/api/v1")` en `app/main.py`

## 10. Smoke tests

- [ ] 10.1 `POST /api/v1/auth/register` → 201 con access_token y refresh_token
- [ ] 10.2 `POST /api/v1/auth/login` con credenciales válidas → 200 con tokens
- [ ] 10.3 `POST /api/v1/auth/login` con credenciales inválidas → 401 sin hint de qué campo falló
- [ ] 10.4 `GET /api/v1/auth/me` con Bearer token → 200 con perfil sin password_hash
- [ ] 10.5 `POST /api/v1/auth/refresh` → 200 con nuevo par de tokens; token anterior revocado en BD
- [ ] 10.6 `POST /api/v1/auth/logout` → 204; verificar `revoked_at` en tabla `refresh_tokens`
- [ ] 10.7 Replay attack: usar refresh_token ya revocado → 401 y todos los tokens del usuario quedan revocados
- [ ] 10.8 6to intento de `POST /api/v1/auth/login` desde misma IP → 429 con Retry-After
