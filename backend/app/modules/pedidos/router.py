from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.core.deps import get_current_user, require_role
from app.core.uow import UnitOfWork
from app.modules.pedidos import service as pedidos_service
from app.modules.pedidos.schemas import (
    AvanzarEstadoRequest,
    CrearPedidoRequest,
    HistorialRead,
    PedidoDetail,
    PedidoListResponse,
    PedidoRead,
)
from app.modules.usuarios.model import Usuario

router = APIRouter(prefix="/pedidos", tags=["pedidos"])


@router.get("", response_model=PedidoListResponse)
async def list_pedidos(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    estado_codigo: Optional[str] = None,
    current_user: Usuario = Depends(get_current_user),
) -> PedidoListResponse:
    async with UnitOfWork() as uow:
        return await pedidos_service.get_list(uow, page, size, current_user, estado_codigo)


@router.post("", response_model=PedidoRead, status_code=201)
async def crear_pedido(
    body: CrearPedidoRequest,
    current_user: Usuario = Depends(get_current_user),
) -> PedidoRead:
    async with UnitOfWork() as uow:
        return await pedidos_service.crear_pedido(uow, body, current_user)


@router.get("/{pedido_id}", response_model=PedidoDetail)
async def get_pedido(
    pedido_id: int,
    current_user: Usuario = Depends(get_current_user),
) -> PedidoDetail:
    async with UnitOfWork() as uow:
        return await pedidos_service.get_detail(uow, pedido_id, current_user)


@router.patch("/{pedido_id}/estado", response_model=PedidoRead)
async def avanzar_estado(
    pedido_id: int,
    body: AvanzarEstadoRequest,
    current_user: Usuario = Depends(require_role(["ADMIN", "PEDIDOS"])),
) -> PedidoRead:
    async with UnitOfWork() as uow:
        return await pedidos_service.avanzar_estado(uow, pedido_id, body, current_user)


@router.get("/{pedido_id}/historial", response_model=list[HistorialRead])
async def get_historial(
    pedido_id: int,
    current_user: Usuario = Depends(get_current_user),
) -> list[HistorialRead]:
    async with UnitOfWork() as uow:
        return await pedidos_service.get_historial(uow, pedido_id, current_user)


@router.delete("/{pedido_id}", response_model=PedidoRead)
async def cancelar_pedido(
    pedido_id: int,
    current_user: Usuario = Depends(get_current_user),
) -> PedidoRead:
    async with UnitOfWork() as uow:
        return await pedidos_service.cancelar_pedido(uow, pedido_id, current_user)
