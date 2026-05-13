# Tasks: us-010-historias-faltantes
# Orden: menor → mayor esfuerzo

## 1. US-070 — Validación de precios pre-checkout

- [x] 1.1 `backend/app/modules/carrito/schemas.py` — agregar `advertencias: list[str] = []` a `ValidarCarritoResponse`
- [x] 1.2 `backend/app/modules/carrito/service.py` — extender `validar_carrito`: para cada ítem comparar `item.precio` (nuevo campo en request) con `producto.precio_base`; si difieren, agregar mensaje a `advertencias`
- [x] 1.3 `backend/app/modules/carrito/schemas.py` — agregar campo `precio: float` en `ItemCarritoRequest` (opcional, si no viene no se compara)
- [x] 1.4 `frontend/src/features/store/api/validarCarrito.ts` — incluir `precio` de cada ítem en el payload
- [x] 1.5 `frontend/src/features/store/components/CartDrawer.tsx` — mostrar `advertencias` como banners amarillos entre el resumen y el botón de checkout

## 2. US-023 — Filtro por alérgenos en catálogo

- [x] 2.1 `backend/app/modules/productos/router.py` — agregar `excluir_alergenos: Optional[list[int]] = Query(None)` al endpoint `GET /productos`
- [x] 2.2 `backend/app/modules/productos/repository.py` — en `list_paginated`: si `excluir_alergenos` no es None, agregar subquery `NOT EXISTS (SELECT 1 FROM producto_ingrediente pi JOIN ingrediente i ON i.id = pi.ingrediente_id WHERE pi.producto_id = Producto.id AND i.id = ANY(excluir_alergenos))`
- [x] 2.3 `backend/app/modules/productos/service.py` — pasar `excluir_alergenos` hasta el repository
- [x] 2.4 `frontend/src/entities/producto/api.ts` — agregar `excluir_alergenos?: number[]` a `FetchProductosParams`
- [x] 2.5 `frontend/src/entities/producto/hooks.ts` — agregar `excluir_alergenos` a `UseProductosFilters`
- [x] 2.6 `frontend/src/features/store/components/FiltrosCatalogo.tsx` — agregar sección "Sin alérgenos" con checkboxes usando `useIngredientes()` filtrado por `es_alergeno: true`; al marcar/desmarcar actualizar `excluir_alergenos` en el estado de filtros

## 3. US-058 — Top productos más vendidos

- [x] 3.1 `backend/app/modules/admin/schemas.py` — agregar `TopProductoItem(producto_id: int, nombre: str, total_vendido: int)`
- [x] 3.2 `backend/app/modules/admin/repository.py` — implementar `get_top_productos(limit=5)`: query SQL con `SUM(DetallePedido.cantidad) GROUP BY producto ORDER BY total DESC` excluyendo pedidos CANCELADOS
- [x] 3.3 `backend/app/modules/admin/service.py` — implementar `get_top_productos(uow) -> list[TopProductoItem]`
- [x] 3.4 `backend/app/modules/admin/router.py` — agregar `GET /admin/metricas/productos-top` con `require_role(["ADMIN"])`
- [x] 3.5 `frontend/src/entities/admin/api.ts` — agregar `fetchTopProductos()` → `GET /admin/metricas/productos-top`
- [x] 3.6 `frontend/src/entities/admin/hooks.ts` — agregar `useTopProductos()`
- [x] 3.7 `frontend/src/features/admin/components/Dashboard.tsx` — agregar sección con `BarChart` (Recharts) de top 5 productos; si vacío mostrar `EmptyState`

## 4. US-055 — Desactivar/reactivar usuario

- [x] 4.1 `backend/app/modules/usuarios/model.py` — agregar `activo: bool = Field(default=True, sa_column=Column(Boolean, server_default='true', nullable=False))`
- [x] 4.2 `alembic/versions/` — crear migración `alembic revision --autogenerate -m "add activo to usuarios"` y verificar que el SQL tenga `server_default`
- [x] 4.3 `backend/app/modules/auth/service.py` — en `login()`, después de verificar contraseña, verificar `usuario.activo`; si False → raise 403 con `code="USER_INACTIVE"`
- [x] 4.4 `backend/app/modules/usuarios/schemas.py` — agregar `ToggleEstadoRequest(activo: bool)` y `activo` en `UserResponse`
- [x] 4.5 `backend/app/modules/usuarios/service.py` — implementar `toggle_estado(uow, usuario_id, activo, current_user_id)`: validar no-autodesactivación y no-último-ADMIN-activo
- [x] 4.6 `backend/app/modules/usuarios/router.py` — agregar `PATCH /usuarios/{id}/estado` con `require_role(["ADMIN"])`
- [x] 4.7 `frontend/src/entities/usuario/api.ts` — agregar `toggleEstado(id, activo)` → `PATCH /usuarios/{id}/estado`
- [x] 4.8 `frontend/src/entities/usuario/hooks.ts` — agregar `useToggleEstadoUsuario()`
- [x] 4.9 `frontend/src/features/admin/components/GestionUsuarios.tsx` — reemplazar badge de estado estático por badge clickeable que llama `useToggleEstadoUsuario`

## 5. US-063 — Cambio de contraseña

- [x] 5.1 `backend/app/modules/auth/schemas.py` — agregar `ChangePasswordRequest(password_actual: str, password_nuevo: str Field(min_length=8))`
- [x] 5.2 `backend/app/modules/auth/service.py` — implementar `change_password(uow, data, current_user)`: verificar `password_actual` con `verify_password`, validar que no sea igual a `password_nuevo`, hashear y actualizar, revocar todos los refresh tokens del usuario
- [x] 5.3 `backend/app/modules/auth/router.py` — agregar `PUT /auth/me/password` con `Depends(get_current_user)` → 204 No Content
- [x] 5.4 `frontend/src/entities/auth/` (o `features/perfil/`) — agregar función `changePassword(data)` → `PUT /auth/me/password`
- [x] 5.5 `frontend/src/features/perfil/components/PerfilUsuario.tsx` — agregar sección "Cambiar contraseña" con TanStack Form: campos `password_actual`, `password_nuevo`, `confirmar_password`; validar que nuevo == confirmar antes de enviar; manejar error `INVALID_CURRENT_PASSWORD` mostrándolo en el campo correspondiente
