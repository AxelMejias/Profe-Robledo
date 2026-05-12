## Why

Food Store necesita un sistema de autenticación y autorización completo antes de cualquier otra epic funcional. Sin JWT válido, sin RBAC y sin guards, ningún endpoint de catálogo, pedidos ni admin puede protegerse. US-001 a US-006 cubren el núcleo de identidad y acceso del que depende todo el sistema.

## What Changes

- `POST /api/v1/auth/register` — registro de cliente con hash bcrypt, rol CLIENT asignado automáticamente (no del request)
- `POST /api/v1/auth/login` — emisión de access token (JWT HS256, 30 min) + refresh token (UUID v4, 7 días) con rate limiting 5/IP/15min
- `POST /api/v1/auth/refresh` — rotación de refresh token; detecta replay attack y revoca todos los tokens del usuario
- `POST /api/v1/auth/logout` — revocación del refresh token activo en BD
- `GET /api/v1/auth/me` — perfil del usuario autenticado (sin password_hash)
- `get_current_user` dependency — valida JWT, carga usuario, lanza 401 si inválido/expirado
- `require_role([...])` dependency factory — verifica rol del usuario contra lista permitida, lanza 403 si insuficiente
- Módulo `refreshtokens` — modelo `RefreshToken` en BD con `token_hash` (SHA-256), `expires_at`, `revoked_at`
- Rate limiting via `slowapi` en login endpoint

## Capabilities

### New Capabilities

- `auth`: Registro, login, refresh, logout y endpoint `/me`. Incluye emisión y validación de JWT, rotación de refresh tokens, detección de replay attack y rate limiting en login.
- `rbac`: Sistema de roles RBAC con 4 roles fijos (ADMIN, STOCK, PEDIDOS, CLIENT). Dependencias FastAPI `get_current_user` y `require_role`. Guards HTTP 401/403. Soporte multi-rol por usuario.

### Modified Capabilities

## Impact

- **Archivos nuevos**: `app/modules/auth/model.py`, `schemas.py`, `repository.py`, `service.py`, `router.py`; `app/modules/refreshtokens/model.py`, `repository.py`
- **Modificados**: `app/core/security.py` (ya sin passlib, usa bcrypt directo), `app/main.py` (registro del router auth + slowapi limiter)
- **Dependencias**: `bcrypt` (ya instalado v5), `python-jose[cryptography]`, `slowapi`, `python-multipart`
- **BD**: tabla `refresh_tokens` (ya existe en migración 0001). No se requiere nueva migración.
- **Sin breaking changes** — es funcionalidad nueva sobre infraestructura ya creada en us-000-setup
