from app.core.uow import UnitOfWork
from app.modules.admin.schemas import MetricaIngresoDia, MetricaPorEstado, MetricasKPI, TopProductoItem


async def get_kpis(uow: UnitOfWork) -> MetricasKPI:
    return MetricasKPI(
        total_pedidos=await uow.admin.total_pedidos(),
        ingresos_hoy=await uow.admin.ingresos_hoy(),
        pedidos_pendientes=await uow.admin.pedidos_pendientes(),
        sin_stock=await uow.admin.productos_sin_stock(),
    )


async def get_por_estado(uow: UnitOfWork) -> list[MetricaPorEstado]:
    return [MetricaPorEstado(**row) for row in await uow.admin.por_estado()]


async def get_ingresos_7_dias(uow: UnitOfWork) -> list[MetricaIngresoDia]:
    return [MetricaIngresoDia(**row) for row in await uow.admin.ingresos_7_dias()]


async def get_top_productos(uow: UnitOfWork) -> list[TopProductoItem]:
    return [TopProductoItem(**row) for row in await uow.admin.get_top_productos()]
