# Tasks: us-007-admin

- [x] schemas.py — MetricasKPI, MetricaPorEstado, MetricaIngresoDia
- [x] repository.py — AdminRepository (sin BaseRepository): total_pedidos, ingresos_hoy, pedidos_pendientes, productos_sin_stock, por_estado, ingresos_7_dias
- [x] service.py — get_kpis, get_por_estado, get_ingresos_7_dias
- [x] router.py — 3 endpoints GET, todos require_role(["ADMIN"])
- [x] uow.py — registrar AdminRepository como self.admin
