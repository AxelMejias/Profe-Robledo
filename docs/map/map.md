# Mapa del Proyecto — Food Store

> Metodología: OPSX (explore → propose → apply → archive)
> Specs viven en: `openspec/changes/<nombre>/`

---

## ⚙️ INFRAESTRUCTURA

### 1. `us-000-setup` ✅ ARCHIVADO

**Funcionalidad:** Monorepo completo — estructura backend Feature-First + frontend FSD, 16 tablas Alembic, seed data, BaseRepository, UoW, 4 stores Zustand, interceptor Axios.
**Dependencias:** ninguna

#### Tareas completadas

**BLOQUE 1 — Estructura raíz**
- [x] **T-001** Estructura raíz: carpetas `backend/` y `frontend/`, `README.md`, `.gitignore` global
- [x] **T-002** `backend/requirements.txt`, `.env.example`, `app/__init__.py`
- [x] **T-003** `frontend/` — Vite + React + TypeScript, dependencias, `tsconfig.json` strict, `.env.example`

**BLOQUE 2 — Core del backend**
- [x] **T-004** `backend/app/core/config.py` — clase `Settings` con pydantic-settings, parse_cors
- [x] **T-005** `backend/app/core/database.py` — `create_async_engine`, `AsyncSessionLocal`, `get_session()`
- [x] **T-006** `backend/app/core/security.py` — `hash_password()`, `verify_password()`, `create_access_token()`, `decode_access_token()`, `create_refresh_token()`
- [x] **T-007** `backend/app/core/repository.py` — `BaseRepository[T]` con `get_by_id()`, `list_all()`, `count()`, `create()`, `update()`, `soft_delete()`, `hard_delete()`
- [x] **T-008** `backend/app/core/uow.py` — `UnitOfWork` async context manager, auto-commit/rollback, `flush()`

**BLOQUE 3 — Módulos del backend (stubs)**
- [x] **T-009** Estructura `app/modules/` — 9 módulos con `model.py`, `schemas.py`, `repository.py`, `service.py`, `router.py` (stubs)
- [x] **T-010** `backend/app/main.py` — FastAPI app, CORSMiddleware, slowapi, `GET /health`, routers comentados

**BLOQUE 4 — Migraciones Alembic**
- [x] **T-011** `backend/alembic.ini` + `backend/alembic/env.py` — lee DATABASE_URL, importa modelos SQLModel
- [x] **T-012** `backend/alembic/versions/0001_initial_schema.py` — 16 tablas en orden FK
- [x] **T-013** Verificación: `alembic upgrade head` sin errores en BD vacía

**BLOQUE 5 — Seed data**
- [x] **T-014** `backend/app/db/seed.py` — 4 roles, 6 estados de pedido, 3 formas de pago, usuario admin
- [x] **T-015** Verificación: `python -m app.db.seed` idempotente

**BLOQUE 6 — Frontend: estructura y stores**
- [x] **T-016** Estructura FSD en `frontend/src/` + `vite.config.ts` con alias `@` y proxy `/api/v1`
- [x] **T-017** `frontend/src/shared/store/authStore.ts` — Zustand + persist, login/logout/updateTokens/hasRole
- [x] **T-018** `frontend/src/shared/store/cartStore.ts` — Zustand + persist, addItem/removeItem/updateCantidad/clearCart + selectores
- [x] **T-019** `frontend/src/shared/store/paymentStore.ts` — Zustand sin persist, estados idle/processing/approved/rejected/error
- [x] **T-020** `frontend/src/shared/store/uiStore.ts` — Zustand sin persist, cartOpen/sidebarOpen/confirmModal

**BLOQUE 7 — Frontend: Axios y QueryClient**
- [x] **T-021** `frontend/src/shared/api/axios.ts` — interceptor Bearer token + refresh automático con failedQueue
- [x] **T-022** `frontend/src/shared/lib/queryClient.ts` — retry:1, staleTime:120000, refetchOnWindowFocus:false
- [x] **T-023** `frontend/src/app/providers.tsx`, `App.tsx`, `main.tsx`

**BLOQUE 8 — Verificación final**
- [x] **T-024** Verificación backend: uvicorn arranca, /health 200, /docs Swagger, migrations OK, seed idempotente
- [x] **T-025** Verificación frontend: npm run dev sin errores TS, npm run build OK, 4 stores importables

---

## 🔐 AUTENTICACIÓN Y USUARIOS

### 2. `us-001-auth` 🔄 EN PROGRESO

**Funcionalidad:** JWT (HS256, 30 min) + refresh token (UUID v4, 7 días, rotación + replay attack detection), RBAC con 4 roles (ADMIN/STOCK/PEDIDOS/CLIENT), endpoints register/login/refresh/logout/me.
**Dependencias:** `us-000-setup`

- [ ] JWT access token + refresh token con rotación y replay attack detection
- [ ] Endpoints: POST /register, POST /login, POST /refresh, POST /logout, GET /me
- [ ] Dependencias `get_current_user` y `require_role` para otros módulos
- [ ] Rate limiting: 5 intentos/IP en 15 min en POST /login

---

## 📂 CATÁLOGO

### 3. `us-002-categorias` ⏳ PENDIENTE

**Funcionalidad:** CRUD de categorías con árbol jerárquico (FK auto-referencial parent_id), CTE recursiva para GET /{id}/arbol, soft delete.
**Dependencias:** `us-001-auth`

### 4. `us-003-productos` ⏳ PENDIENTE

**Funcionalidad:** CRUD de productos + ingredientes + relaciones producto-categoría + producto-ingrediente, gestión de stock, campo disponible, paginación con filtros.
**Dependencias:** `us-002-categorias`

---

## 🧺 CARRITO Y PEDIDOS

### 5. `us-004-carrito` ⏳ PENDIENTE

**Funcionalidad:** Validación server-side del carrito (precios, stock, disponibilidad), sincronización con cartStore Zustand.
**Dependencias:** `us-003-productos`

### 6. `us-005-pedidos` ⏳ PENDIENTE

**Funcionalidad:** Creación de pedidos (UoW atómico), snapshots de nombre/precio, FSM de 6 estados (PENDIENTE→CONFIRMADO→EN_PREP→EN_CAMINO→ENTREGADO/CANCELADO), historial append-only, PATCH /{id}/estado con validación de transiciones.
**Dependencias:** `us-004-carrito`, `us-001-auth`

---

## 💳 PAGOS

### 7. `us-006-pagos-mercadopago` ⏳ PENDIENTE

**Funcionalidad:** Checkout API MercadoPago (tarjeta, Rapipago, Pago Fácil), webhook IPN para confirmación automática, idempotency key, external_reference, integración con FSM de pedidos.
**Dependencias:** `us-005-pedidos`

---

## 🔧 ADMIN Y DIRECCIONES

### 8. `us-007-admin` ⏳ PENDIENTE

**Funcionalidad:** Dashboard con métricas (recharts), CRUD de entidades desde panel, gestión de stock y pedidos, asignación de roles por ADMIN.
**Dependencias:** `us-001-auth`, `us-005-pedidos`, `us-003-productos`

### 9. `us-008-direcciones` ⏳ PENDIENTE

**Funcionalidad:** CRUD de direcciones de entrega por usuario, marcar dirección principal, snapshot de dirección en pedido.
**Dependencias:** `us-001-auth`

---

## ✔ Estado del proyecto

- Total changes: 9
- Archivados: 1 (us-000-setup)
- En progreso: 1 (us-001-auth)
- Pendientes: 7
- Arquitectura: Feature-First backend + Feature-Sliced Design frontend ✔
- Patrones: BaseRepository[T] + UoW + soft delete + snapshot + FSM ✔
