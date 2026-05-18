from fastapi import APIRouter, Depends

from app.core.deps import require_role
from app.core.uow import UnitOfWork
from app.modules.admin import service as admin_service
from app.modules.admin.schemas import MetricaIngresoDia, MetricaPorEstado, MetricasKPI, TopProductoItem
from app.modules.usuarios.model import Usuario

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/metricas", response_model=MetricasKPI)
async def get_metricas(
    _: Usuario = Depends(require_role(["ADMIN"])),
) -> MetricasKPI:
    async with UnitOfWork() as uow:
        return await admin_service.get_kpis(uow)


@router.get("/metricas/por-estado", response_model=list[MetricaPorEstado])
async def get_por_estado(
    _: Usuario = Depends(require_role(["ADMIN"])),
) -> list[MetricaPorEstado]:
    async with UnitOfWork() as uow:
        return await admin_service.get_por_estado(uow)


@router.get("/metricas/ingresos-7-dias", response_model=list[MetricaIngresoDia])
async def get_ingresos(
    _: Usuario = Depends(require_role(["ADMIN"])),
) -> list[MetricaIngresoDia]:
    async with UnitOfWork() as uow:
        return await admin_service.get_ingresos_7_dias(uow)


@router.get("/metricas/productos-top", response_model=list[TopProductoItem])
async def get_productos_top(
    _: Usuario = Depends(require_role(["ADMIN"])),
) -> list[TopProductoItem]:
    async with UnitOfWork() as uow:
        return await admin_service.get_top_productos(uow)
