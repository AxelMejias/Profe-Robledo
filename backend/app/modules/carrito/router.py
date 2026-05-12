from fastapi import APIRouter, Depends

from app.core.deps import get_current_user
from app.core.uow import UnitOfWork
from app.modules.carrito import service as carrito_service
from app.modules.carrito.schemas import ValidarCarritoRequest, ValidarCarritoResponse
from app.modules.usuarios.model import Usuario

router = APIRouter(prefix="/carrito", tags=["carrito"])


@router.post("/validar", response_model=ValidarCarritoResponse)
async def validar_carrito(
    body: ValidarCarritoRequest,
    _: Usuario = Depends(get_current_user),
) -> ValidarCarritoResponse:
    async with UnitOfWork() as uow:
        return await carrito_service.validar(uow, body)
