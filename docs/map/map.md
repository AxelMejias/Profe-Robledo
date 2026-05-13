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

### 2. `us-001-auth` ✅ ARCHIVADO

**Funcionalidad:** JWT (HS256, 30 min) + refresh token (UUID v4, 7 días, rotación + replay attack detection), RBAC con 4 roles (ADMIN/STOCK/PEDIDOS/CLIENT), endpoints register/login/refresh/logout/me.
**Dependencias:** `us-000-setup`

- [x] `UsuarioRepository` — `get_by_email`, `get_with_roles` (eager load)
- [x] `RefreshTokenRepository` — `get_by_hash`, `revoke`, `revoke_all_for_user`
- [x] `app/core/deps.py` — `get_current_user`, `require_role` factory
- [x] `app/core/limiter.py` — slowapi, rate limit 5/15min en POST /login
- [x] Auth service — register, login, refresh (rotación + replay attack RN-AU05), logout, `_create_token_pair`
- [x] Endpoints: POST /register (201), POST /login, POST /refresh, POST /logout (204), GET /me
- [x] `PUT /usuarios/{id}/roles` con protección RN-RB04 (último ADMIN)
- [x] UoW registra `self.usuarios` y `self.refresh_tokens`

---

## 📂 CATÁLOGO

### 3. `us-002-categorias` ✅ ARCHIVADO

**Funcionalidad:** CRUD de categorías con árbol jerárquico (FK auto-referencial parent_id), soft delete.
**Dependencias:** `us-001-auth`

- [x] `model.py` — `Categoria(id, nombre, descripcion, imagen_url, parent_id FK self, timestamps, eliminado_en)`
- [x] `schemas.py` — `CategoriaCreate`, `CategoriaUpdate`, `CategoriaRead`
- [x] `repository.py` — `BaseRepository[Categoria]` + `list_paginated` con filtro `parent_id`
- [x] `service.py` — CRUD con validación de parent circular, soft delete
- [x] `router.py` — 5 endpoints, `require_role(["ADMIN","STOCK"])` en escritura

### 4. `us-003-productos` ✅ ARCHIVADO

**Funcionalidad:** CRUD de productos + ingredientes + relaciones producto-categoría + producto-ingrediente (M2M), gestión de stock, campo disponible, paginación con filtros.
**Dependencias:** `us-002-categorias`

- [x] `model.py` — `Producto`, `Ingrediente`, `ProductoCategoria`, `ProductoIngrediente`
- [x] `schemas.py` — `ProductoCreate/Update/Read`, `IngredienteCreate/Read`
- [x] `repository.py` — `ProductoRepository` con `list_paginated`, `get_with_ingredientes`
- [x] `service.py` — CRUD productos + gestión ingredientes, snapshot pattern preparado
- [x] `router.py` — endpoints productos + endpoints ingredientes bajo `/ingredientes`

---

## 🧺 CARRITO Y PEDIDOS

### 5. `us-004-carrito` ✅ ARCHIVADO

**Funcionalidad:** Validación server-side del carrito (stock, disponibilidad).
**Dependencias:** `us-003-productos`

- [x] `schemas.py` — `ValidarCarritoRequest`, `ValidarCarritoResponse(valido, errores)`
- [x] `service.py` — `validar_carrito`: verifica `disponible` + stock por ítem
- [x] `router.py` — `POST /carrito/validar` (CLIENT)

### 6. `us-005-pedidos` ✅ ARCHIVADO

**Funcionalidad:** Creación de pedidos (UoW atómico), snapshots de nombre/precio, FSM de 6 estados, historial append-only, PATCH /{id}/estado con validación de transiciones.
**Dependencias:** `us-004-carrito`, `us-001-auth`

- [x] `schemas.py` — `ItemPedidoRequest`, `CrearPedidoRequest`, `AvanzarEstadoRequest`, `PedidoRead`, `PedidoDetail`, `PedidoListResponse`
- [x] `repository.py` — `list_paginated`, `get_detalles`, `get_historial`, `get_producto_for_update` (SELECT FOR UPDATE), `add_detalle`, `add_historial`
- [x] `service.py` — `crear_pedido` (validate stock FOR UPDATE + snapshot), `avanzar_estado` (FSM + stock restore en CONFIRMADO→CANCELADO), `cancelar_pedido` (CLIENT, solo PENDIENTE)
- [x] `router.py` — 6 endpoints, `avanzar_estado` require_role ADMIN/PEDIDOS
- [x] UoW registra `self.pedidos`

---

## 💳 PAGOS

### 7. `us-006-pagos-mercadopago` ✅ ARCHIVADO

**Funcionalidad:** Checkout API MercadoPago, webhook IPN con firma HMAC-SHA256, idempotency key, integración con FSM de pedidos.
**Dependencias:** `us-005-pedidos`

- [x] `model.py` — `Pago(id, pedido_id FK, monto, mp_payment_id, mp_status, external_reference, idempotency_key, timestamps)`
- [x] `schemas.py` — `CrearPagoRequest`, `PagoRead`, `WebhookMP`
- [x] `repository.py` — `get_by_pedido`, `get_by_external_reference`
- [x] `service.py` — `crear_pago` (idempotency_key uuid, MP SDK), `_verificar_firma` (HMAC-SHA256), `procesar_webhook` (RN-FS02 PENDIENTE→CONFIRMADO, RN-FS03 stock decrement)
- [x] `router.py` — `POST /crear` (201), `POST /webhook` (200 siempre), `GET /{pedido_id}`
- [x] `config.py` — `MP_WEBHOOK_SECRET` agregado
- [x] UoW registra `self.pagos`

---

## 🔧 ADMIN Y DIRECCIONES

### 8. `us-007-admin` ✅ ARCHIVADO

**Funcionalidad:** Dashboard con métricas KPI y gráficos (ingresos 7 días, pedidos por estado).
**Dependencias:** `us-001-auth`, `us-005-pedidos`, `us-003-productos`

- [x] `schemas.py` — `MetricasKPI`, `MetricaPorEstado`, `MetricaIngresoDia`
- [x] `repository.py` — `AdminRepository` (sin BaseRepository): `total_pedidos`, `ingresos_hoy`, `pedidos_pendientes`, `productos_sin_stock`, `por_estado`, `ingresos_7_dias`
- [x] `service.py` — `get_kpis`, `get_por_estado`, `get_ingresos_7_dias`
- [x] `router.py` — 3 endpoints GET, todos `require_role(["ADMIN"])`
- [x] UoW registra `self.admin`

### 9. `us-008-direcciones` ✅ ARCHIVADO

**Funcionalidad:** CRUD de direcciones de entrega por usuario, dirección principal, soft delete.
**Dependencias:** `us-001-auth`

- [x] `model.py` — `DireccionEntrega(id, usuario_id FK, alias, linea1, linea2, ciudad, codigo_postal, referencia, es_principal, timestamps, eliminado_en)`
- [x] `schemas.py` — `DireccionCreate`, `DireccionUpdate`, `DireccionRead`
- [x] `repository.py` — `list_del_usuario`, `get_del_usuario`, `count_del_usuario`, `desactivar_todas`
- [x] `service.py` — `crear` (RN-DI01), `actualizar`, `eliminar` (soft), `marcar_principal` (RN-DI02)
- [x] `router.py` — 6 endpoints, `DELETE` retorna 204
- [x] UoW registra `self.direcciones`

---

## ✔ Estado del proyecto

- Total changes: 9
- Archivados: 9 (us-000 → us-008)
- Implementados: 0
- Pendientes: 0
- Arquitectura: Feature-First backend + Feature-Sliced Design frontend ✔
- Patrones: BaseRepository[T] + UoW + soft delete + snapshot + FSM ✔
