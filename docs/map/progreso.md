# Mapa de Progreso — FoodStore

## Sprint 0: Infraestructura Base (us-000-setup) ✅ ARCHIVADO

---

### BLOQUE 1 — Estructura raíz del monorepo

- [x] **T-001** Estructura raíz: carpetas `backend/` y `frontend/`, `README.md`, `.gitignore` global
- [x] **T-002** `backend/requirements.txt`, `.env.example`, `app/__init__.py`
- [x] **T-003** `frontend/` — Vite + React + TypeScript, dependencias, `tsconfig.json` strict, `.env.example`

---

### BLOQUE 2 — Core del backend

- [x] **T-004** `backend/app/core/config.py` — clase `Settings` con pydantic-settings, parse_cors
- [x] **T-005** `backend/app/core/database.py` — `create_async_engine`, `AsyncSessionLocal`, `get_session()`
- [x] **T-006** `backend/app/core/security.py` — `hash_password()`, `verify_password()`, `create_access_token()`, `decode_access_token()`, `create_refresh_token()`
- [x] **T-007** `backend/app/core/repository.py` — `BaseRepository[T]` con `get_by_id()`, `list_all()`, `count()`, `create()`, `update()`, `soft_delete()`, `hard_delete()`
- [x] **T-008** `backend/app/core/uow.py` — `UnitOfWork` async context manager, auto-commit/rollback, `flush()`

---

### BLOQUE 3 — Módulos del backend (stubs)

- [x] **T-009** Estructura `app/modules/` — 9 módulos: `auth/`, `refreshtokens/`, `usuarios/`, `direcciones/`, `categorias/`, `productos/`, `pedidos/`, `pagos/`, `admin/`. Cada uno con `model.py`, `schemas.py`, `repository.py`, `service.py`, `router.py` (stubs)
- [x] **T-010** `backend/app/main.py` — FastAPI app, CORSMiddleware, slowapi rate limiter, `GET /health`, routers comentados

---

### BLOQUE 4 — Migraciones Alembic

- [x] **T-011** `backend/alembic.ini` + `backend/alembic/env.py` — configurado para leer DATABASE_URL, importa todos los modelos SQLModel, usa driver síncrono psycopg2
- [x] **T-012** `backend/alembic/versions/0001_initial_schema.py` — crea 16 tablas en orden FK (roles → estados_pedido → formas_pago → usuarios → usuario_roles → refresh_tokens → direcciones_entrega → categorias → ingredientes → productos → producto_categorias → producto_ingredientes → pedidos → detalle_pedidos → historial_estados_pedido → pagos). `downgrade()` elimina en orden inverso.
- [x] **T-013** Verificación: `alembic upgrade head` sin errores en BD vacía

---

### BLOQUE 5 — Seed data

- [x] **T-014** `backend/app/db/seed.py` — seed idempotente: 4 roles, 6 estados de pedido, 3 formas de pago, usuario admin con rol ADMIN
- [x] **T-015** Verificación: `python -m app.db.seed` idempotente (segunda ejecución no duplica)

---

### BLOQUE 6 — Frontend: estructura y stores

- [x] **T-016** Estructura FSD en `frontend/src/` — `app/`, `pages/`, `widgets/`, `features/`, `entities/`, `shared/api/`, `shared/store/`, `shared/types/`, `shared/lib/`. `vite.config.ts` con alias `@` y proxy `/api/v1`
- [x] **T-017** `frontend/src/shared/store/authStore.ts` — Zustand + persist, acciones: `login()`, `logout()`, `updateTokens()`, `hasRole()`
- [x] **T-018** `frontend/src/shared/store/cartStore.ts` — Zustand + persist, acciones: `addItem()`, `removeItem()`, `updateCantidad()`, `clearCart()`, selectores: `itemCount()`, `subtotal()`, `costoEnvio()`, `total()`
- [x] **T-019** `frontend/src/shared/store/paymentStore.ts` — Zustand sin persist, estados: idle/processing/approved/rejected/error
- [x] **T-020** `frontend/src/shared/store/uiStore.ts` — Zustand sin persist, `cartOpen`, `sidebarOpen`, `confirmModal`

---

### BLOQUE 7 — Frontend: Axios y QueryClient

- [x] **T-021** `frontend/src/shared/api/axios.ts` — instancia Axios con request interceptor (Bearer token), response interceptor (refresh automático con `failedQueue` para evitar refreshes concurrentes)
- [x] **T-022** `frontend/src/shared/lib/queryClient.ts` — QueryClient con `retry:1`, `staleTime:120000`, `refetchOnWindowFocus:false`
- [x] **T-023** `frontend/src/app/providers.tsx`, `frontend/src/app/App.tsx`, `frontend/src/app/main.tsx` — providers, routing básico, punto de entrada React

---

### BLOQUE 8 — Verificación final

- [x] **T-024** Verificación backend: `pip install`, `uvicorn` arranca, `/health` 200, `/docs` Swagger, `alembic upgrade head`, seed idempotente
- [x] **T-025** Verificación frontend: `npm install`, `npm run dev` sin errores TS, `npm run build` OK, 4 stores importables, interceptor Axios sin errores

---

## Sprint 1: Core Features (us-001-auth) 🔄 EN PROGRESO

- [ ] **US-001** Autenticación JWT — register/login/refresh/logout/me, refresh token con rotación + replay attack detection, RBAC con 4 roles
- [ ] **US-002** Catálogo de categorías — CRUD, árbol jerárquico con CTE recursiva, soft delete
- [ ] **US-003** Catálogo de productos — CRUD + ingredientes + relaciones, stock, paginación con filtros

---

## Sprints Pendientes

- [ ] **US-004** Carrito — validación server-side, sincronización con cartStore
- [ ] **US-005** Pedidos — UoW atómico, snapshots, FSM 6 estados
- [ ] **US-006** Pagos MercadoPago — Checkout API, webhook IPN, idempotency key
- [ ] **US-007** Admin — dashboard métricas, CRUD desde panel, gestión roles
- [ ] **US-008** Direcciones de entrega — CRUD por usuario, dirección principal, snapshot en pedido

---

## Archivos clave creados en Sprint 0

- `backend/app/core/config.py`
- `backend/app/core/database.py`
- `backend/app/core/security.py`
- `backend/app/core/repository.py`
- `backend/app/core/uow.py`
- `backend/app/main.py`
- `backend/app/db/seed.py`
- `backend/alembic/env.py`
- `backend/alembic/versions/0001_initial_schema.py`
- `frontend/src/shared/api/axios.ts`
- `frontend/src/shared/lib/queryClient.ts`
- `frontend/src/shared/store/authStore.ts`
- `frontend/src/shared/store/cartStore.ts`
- `frontend/src/shared/store/paymentStore.ts`
- `frontend/src/shared/store/uiStore.ts`
- `frontend/src/app/providers.tsx`
- `frontend/src/app/App.tsx`
- `frontend/src/app/main.tsx`
