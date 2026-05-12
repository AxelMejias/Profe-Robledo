from fastapi import APIRouter, Depends

from app.core.deps import get_current_user
from app.core.uow import UnitOfWork
from app.modules.direcciones import service as direcciones_service
from app.modules.direcciones.schemas import DireccionCreate, DireccionRead, DireccionUpdate
from app.modules.usuarios.model import Usuario

router = APIRouter(prefix="/direcciones", tags=["direcciones"])


@router.get("", response_model=list[DireccionRead])
async def list_direcciones(
    current_user: Usuario = Depends(get_current_user),
) -> list[DireccionRead]:
    async with UnitOfWork() as uow:
        return await direcciones_service.list_direcciones(uow, current_user)


@router.post("", response_model=DireccionRead, status_code=201)
async def crear_direccion(
    body: DireccionCreate,
    current_user: Usuario = Depends(get_current_user),
) -> DireccionRead:
    async with UnitOfWork() as uow:
        return await direcciones_service.crear(uow, body, current_user)


@router.get("/{direccion_id}", response_model=DireccionRead)
async def get_direccion(
    direccion_id: int,
    current_user: Usuario = Depends(get_current_user),
) -> DireccionRead:
    async with UnitOfWork() as uow:
        return await direcciones_service.get_one(uow, direccion_id, current_user)


@router.put("/{direccion_id}", response_model=DireccionRead)
async def actualizar_direccion(
    direccion_id: int,
    body: DireccionUpdate,
    current_user: Usuario = Depends(get_current_user),
) -> DireccionRead:
    async with UnitOfWork() as uow:
        return await direcciones_service.actualizar(uow, direccion_id, body, current_user)


@router.delete("/{direccion_id}", status_code=204)
async def eliminar_direccion(
    direccion_id: int,
    current_user: Usuario = Depends(get_current_user),
) -> None:
    async with UnitOfWork() as uow:
        await direcciones_service.eliminar(uow, direccion_id, current_user)


@router.patch("/{direccion_id}/principal", response_model=DireccionRead)
async def marcar_principal(
    direccion_id: int,
    current_user: Usuario = Depends(get_current_user),
) -> DireccionRead:
    async with UnitOfWork() as uow:
        return await direcciones_service.marcar_principal(uow, direccion_id, current_user)
