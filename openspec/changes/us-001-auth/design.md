## Context

El sistema ya tiene la infraestructura base de us-000-setup: modelos SQLModel, UoW, BaseRepository, `app/core/security.py` con bcrypt directo (sin passlib), y la tabla `refresh_tokens` creada en la migración 0001. Este change implementa las capas de servicio, repositorio y router del módulo `auth`, más las dependencias FastAPI `get_current_user` y `require_role` que son prerequisito de todas las epics posteriores.

Stack fijo por requerimiento: FastAPI + SQLModel + bcrypt 5.x (directo) + python-jose + slowapi.

## Goals / Non-Goals

**Goals:**
- Implementar los 5 endpoints de auth (`/register`, `/login`, `/refresh`, `/logout`, `/me`) siguiendo Router → Service → UoW → Repository → Model
- Implementar rotación de refresh tokens con detección de replay attack (RN-AU04, RN-AU05)
- Rate limiting en login: 5 intentos/IP/15min con slowapi (RN-AU06)
- Dependencias FastAPI `get_current_user` y `require_role([...])` reutilizables por todas las epics
- RBAC multi-rol: un usuario puede tener varios roles simultáneos (tabla `usuario_roles`)

**Non-Goals:**
- OAuth2 social login (Google, Facebook) — fuera de alcance v1
- Autenticación 2FA — fuera de alcance v1
- Blacklist de access tokens — JWT es stateless; la invalidación se maneja solo a nivel de refresh token
- Endpoints de gestión de usuarios (CRUD `/usuarios`) — pertenecen a una epic posterior

## Decisions

### D1: Refresh token como UUID v4 almacenado hasheado en BD

El refresh token que viaja en el response es un UUID v4 en texto plano. En BD se almacena únicamente el SHA-256 del token (campo `token_hash CHAR(64)`). Así, si la BD se compromete, los tokens crudos no están expuestos.

**Alternativa descartada**: almacenar el token en texto plano. Descartado porque viola principio de mínima exposición.

### D2: Rotación total + detección de replay attack (RN-AU04, RN-AU05)

En cada `POST /auth/refresh`:
1. Buscar el token por hash en BD
2. Si `revoked_at IS NOT NULL` → replay attack → revocar TODOS los tokens del usuario → retornar 401
3. Si expirado → retornar 401
4. Si válido → revocar token actual (`revoked_at = now()`) → emitir nuevo par (access + refresh)

**Alternativa descartada**: usar familia de tokens con `family_id`. Se optó por el enfoque más simple: al detectar replay, revocar todos. Es más conservador y suficiente para v1.

### D3: Rate limiting con slowapi en decorator, no middleware global

El límite de 5/15min aplica exclusivamente al endpoint de login. Se usa `@limiter.limit("5/15minutes")` sobre la función del router, con `request` como primer parámetro para que slowapi extraiga la IP.

El `Limiter` se instancia en `app/core/limiter.py` y se adjunta a la app FastAPI en `main.py` via `app.state.limiter` + `app.add_exception_handler(RateLimitExceeded, ...)`.

**Alternativa descartada**: middleware global de rate limiting. Es demasiado agresivo para rutas públicas como el catálogo.

### D4: `get_current_user` como FastAPI Dependency con `oauth2_scheme`

```python
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), ...) -> Usuario:
    # decode JWT → extraer sub (user_id) → cargar usuario de BD
    # lanzar 401 si inválido/expirado
```

`require_role` es una factory que retorna una dependency:
```python
def require_role(roles: list[str]):
    async def _check(user: Usuario = Depends(get_current_user)):
        user_roles = [r.codigo for r in user.roles]
        if not any(r in user_roles for r in roles):
            raise HTTPException(403, ...)
    return _check
```

### D5: No nueva migración Alembic

La tabla `refresh_tokens` ya fue creada en la migración 0001 (us-000-setup). Este change solo agrega lógica de aplicación, sin cambios de esquema.

### D6: bcrypt directo en security.py (ya implementado en us-000-setup)

`hash_password` y `verify_password` ya usan `bcrypt.hashpw` / `bcrypt.checkpw` directamente. No se usa passlib (incompatible con bcrypt >= 4.0.0). Este change reutiliza esas funciones sin cambiarlas.

## Risks / Trade-offs

- **[Risk] Access tokens no se invalidan en logout** → El access token sigue siendo válido hasta su expiración natural (30 min). Mitigación: el tiempo de expiración corto lo hace aceptable para v1. En producción se puede agregar un blacklist en Redis.
- **[Risk] Rate limiting in-memory con slowapi no persiste entre reinicios** → En desarrollo es suficiente. En producción se configura con backend Redis. Mitigación: documentar en README.
- **[Risk] SHA-256 de UUID es determinista** → Un atacante con el UUID original puede calcular el hash. Mitigación: el UUID nunca se almacena en ningún lado después de emitirse; solo vive en el response.

## Migration Plan

1. No hay migración de BD (tabla ya existe)
2. Registrar router en `app/main.py`: `app.include_router(auth_router, prefix="/api/v1")`
3. Adjuntar slowapi limiter a la app en `main.py`
4. El orden de arranque es idempotente: no hay estado que migrar

## Open Questions

- ¿El refresh token debe enviarse en httpOnly cookie o en el body JSON? → **Decisión**: body JSON para v1 (frontend maneja con Zustand). Las cookies requieren configuración adicional de SameSite/Secure que se deja para producción.
