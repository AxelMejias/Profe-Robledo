## Mapa de Changes — Food Store

> Metodología: OPSX (explore → propose → apply → archive)
> Specs viven en: `openspec/changes/<nombre>/`

---

## ⚙️ INFRAESTRUCTURA

### 1. `us-000-setup` ✅ ARCHIVADO
- Funcionalidad: Monorepo completo — estructura backend Feature-First + frontend FSD, 16 tablas Alembic, seed data, BaseRepository, UoW, 4 stores Zustand, interceptor Axios.
- Dependencias: ninguna

---

## 🔐 AUTENTICACIÓN Y USUARIOS

### 2. `us-001-auth` 🔄 EN PROGRESO
- Funcionalidad: JWT (HS256, 30 min) + refresh token (UUID v4, 7 días, rotación + replay attack detection), RBAC con 4 roles (ADMIN/STOCK/PEDIDOS/CLIENT), endpoints register/login/refresh/logout/me, dependencias `get_current_user` y `require_role`.
- Dependencias: `us-000-setup`

---

## 📂 CATÁLOGO

### 3. `us-002-categorias`
- Funcionalidad: CRUD de categorías con árbol jerárquico (FK auto-referencial parent_id), CTE recursiva para GET /{id}/arbol, soft delete.
- Dependencias: `us-001-auth`

### 4. `us-003-productos`
- Funcionalidad: CRUD de productos + ingredientes + relaciones producto-categoría + producto-ingrediente, gestión de stock, campo disponible, paginación con filtros.
- Dependencias: `us-002-categorias`

---

## 🧺 CARRITO Y PEDIDOS

### 5. `us-004-carrito`
- Funcionalidad: Validación server-side del carrito (precios, stock, disponibilidad), sincronización con cartStore Zustand del frontend.
- Dependencias: `us-003-productos`

### 6. `us-005-pedidos`
- Funcionalidad: Creación de pedidos (UoW atómico), snapshots de nombre/precio, FSM de 6 estados (PENDIENTE→CONFIRMADO→EN_PREP→EN_CAMINO→ENTREGADO/CANCELADO), historial append-only, PATCH /{id}/estado con validación de transiciones.
- Dependencias: `us-004-carrito`, `us-001-auth`

---

## 💳 PAGOS

### 7. `us-006-pagos-mercadopago`
- Funcionalidad: Checkout API MercadoPago (tarjeta, Rapipago, Pago Fácil), webhook IPN para confirmación automática, idempotency key, external_reference, integración con FSM de pedidos.
- Dependencias: `us-005-pedidos`

---

## 🔧 ADMIN Y DIRECCIONES

### 8. `us-007-admin`
- Funcionalidad: Dashboard con métricas (recharts), CRUD de entidades desde panel, gestión de stock y pedidos, asignación de roles por ADMIN.
- Dependencias: `us-001-auth`, `us-005-pedidos`, `us-003-productos`

### 9. `us-008-direcciones`
- Funcionalidad: CRUD de direcciones de entrega por usuario, marcar dirección principal, snapshot de dirección en pedido.
- Dependencias: `us-001-auth`

---

## ✔ Estado del proyecto

- Total changes: 9
- Archivados: 1 (us-000-setup)
- En progreso: 1 (us-001-auth)
- Pendientes: 7
- Arquitectura: Feature-First backend + Feature-Sliced Design frontend ✔
- Patrones: BaseRepository[T] + UoW + soft delete + snapshot + FSM ✔
