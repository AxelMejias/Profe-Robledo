# Proposal: us-007-admin

## Qué
Dashboard de métricas KPIs para el panel de administración. Consultas agregadas sobre pedidos y productos.

## Por qué
El administrador necesita visibilidad del negocio: ingresos, pedidos pendientes, productos sin stock.

## Alcance
- `GET /api/v1/admin/metricas` — KPIs: total_pedidos, ingresos_hoy, pedidos_pendientes, sin_stock (ADMIN)
- `GET /api/v1/admin/metricas/por-estado` — conteo de pedidos agrupado por estado (ADMIN)
- `GET /api/v1/admin/metricas/ingresos` — ingresos por día últimos 7 días (ADMIN)

## Nota de implementación
AdminRepository NO hereda BaseRepository (no tiene un modelo único). Constructor: `__init__(self, session: AsyncSession)`.

## Commit
b59a9fe feat(admin): implementar us-007 — dashboard métricas KPIs y gráficos
