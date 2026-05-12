from fastapi import APIRouter, Depends, Request

from app.core.deps import get_current_user
from app.core.uow import UnitOfWork
from app.modules.pagos import service as pagos_service
from app.modules.pagos.schemas import CrearPagoRequest, PagoRead, WebhookMP
from app.modules.usuarios.model import Usuario

router = APIRouter(prefix="/pagos", tags=["pagos"])


@router.post("/crear", response_model=PagoRead, status_code=201)
async def crear_pago(
    body: CrearPagoRequest,
    current_user: Usuario = Depends(get_current_user),
) -> PagoRead:
    async with UnitOfWork() as uow:
        return await pagos_service.crear_pago(uow, body, current_user)


@router.post("/webhook", status_code=200)
async def webhook_mercadopago(
    request: Request,
    body: WebhookMP,
) -> dict:
    async with UnitOfWork() as uow:
        await pagos_service.procesar_webhook(uow, request, body)
    return {"status": "ok"}


@router.get("/{pedido_id}", response_model=PagoRead)
async def get_pago(
    pedido_id: int,
    current_user: Usuario = Depends(get_current_user),
) -> PagoRead:
    async with UnitOfWork() as uow:
        return await pagos_service.get_pago(uow, pedido_id, current_user)
