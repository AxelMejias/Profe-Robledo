## Context

El proyecto tiene backend 100% completo (us-000 a us-008) y frontend completo (us-009). Este change implementa 5 historias de usuario faltantes identificadas en el audit pre-presentación. El orden de implementación va de menor a mayor esfuerzo para maximizar cobertura en el menor tiempo posible.

Stack: FastAPI + SQLModel + Alembic (backend), React 18 + TypeScript + TanStack Query + Zustand (frontend). Patrón: Router → Service → UoW → Repository → Model.

## Goals / Non-Goals

**Goals:**
- Cerrar las 5 US faltantes más visibles para el evaluador
- Cero breaking changes en endpoints existentes
- Una sola migración Alembic para el campo `activo`
- Mantener el patrón arquitectónico existente sin introducir nuevas dependencias

**Non-Goals:**
- US-060 (configuración del sistema) — demasiado scope para el TPI
- Tests unitarios — fuera del alcance de este change
- Auditoría de accesos (login fallido por usuario inactivo no genera log persistente)

## Decisions

### D-01: Orden de implementación (menor → mayor esfuerzo)

1. **US-070** — Validación de precios: ya existe `POST /carrito/validar`, solo se extiende el response para incluir `advertencias: list[str]`. Cambio mínimo en backend + frontend.
2. **US-023** — Filtro alérgenos: query param adicional en `list_productos` + subquery EXISTS en el repository + checkboxes en `FiltrosCatalogo`.
3. **US-058** — Top productos: nueva query SQL de agregación en `AdminRepository` + 1 endpoint + 1 componente frontend.
4. **US-055** — Desactivar usuario: migración + campo en modelo + 1 endpoint + verificación en login + botón en UI.
5. **US-063** — Cambio de contraseña: 1 endpoint + schema + verificación de contraseña actual + form en frontend.

**Alternativa descartada**: implementar en orden inverso (más complejo primero). Rechazada porque si el tiempo apremia, las US más simples y visibles quedan hechas.

### D-02: Campo `activo` en `Usuario`

Se agrega `activo: bool = Field(default=True)` al modelo SQLModel. La verificación ocurre en `auth_service.login()` antes de emitir tokens: si `usuario.activo == False` → 403 con code `USER_INACTIVE`.

**Alternativa descartada**: soft delete del usuario. Rechazada porque la US pide "desactivar", no eliminar. El admin debe poder reactivar.

### D-03: Filtro alérgenos en `list_productos`

Query param: `excluir_alergenos: Optional[list[int]] = Query(None)`. En el repository se agrega un `NOT EXISTS` subquery contra `producto_ingrediente` JOIN `ingrediente` WHERE `ingrediente.id IN excluir_alergenos`. Esto excluye productos que contengan **cualquiera** de los alérgenos indicados.

**Alternativa descartada**: filtrar en Python post-query. Rechazada por performance: con muchos productos, traer todo para filtrar en memoria no escala.

### D-04: Validación de precios en `POST /carrito/validar`

Se extiende `ValidarCarritoResponse` con `advertencias: list[str]`. Para cada ítem del carrito, se compara `item.precio` (precio en el store Zustand) con `producto.precio_base` actual. Si difieren → se agrega advertencia "El precio de {nombre} cambió de ${viejo} a ${nuevo}". El pedido no se bloquea, solo se advierte.

**Alternativa descartada**: bloquear el checkout si hay cambio de precio. Rechazada porque el snapshot se toma al crear el pedido de todas formas, y bloquear es disruptivo para el usuario.

### D-05: Top productos más vendidos

Query SQL: `SELECT p.id, p.nombre, SUM(dp.cantidad) as total_vendido FROM detalle_pedido dp JOIN producto p ON p.id = dp.producto_id JOIN pedido ped ON ped.id = dp.pedido_id WHERE ped.estado_codigo != 'CANCELADO' GROUP BY p.id, p.nombre ORDER BY total_vendido DESC LIMIT 5`. Retorna lista de `{producto_id, nombre, total_vendido}`. Frontend usa `BarChart` de Recharts (ya instalado).

## Risks / Trade-offs

- **Migración en producción**: la columna `activo` se agrega con `DEFAULT TRUE` — safe para tablas existentes, no bloquea filas.
- **Filtro alérgenos con lista vacía**: si `excluir_alergenos=[]` el parámetro es ignorado (no filtra). Comportamiento esperado.
- **Top productos en BD vacía**: la query retorna lista vacía — el frontend debe mostrar `EmptyState` en ese caso.
- **Cambio de contraseña sin email de confirmación**: aceptable para el TPI, en producción real se añadiría verificación por email.

## Migration Plan

1. Crear migración Alembic: `alembic revision --autogenerate -m "add activo to usuarios"`
2. Verificar que el SQL generado tenga `server_default='true'`
3. `alembic upgrade head`
4. Rollback: `alembic downgrade -1` (elimina la columna)
