from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.core.deps import get_current_user, require_role
from app.core.uow import UnitOfWork
from app.modules.usuarios import service as usuario_service
from app.modules.usuarios.model import Usuario
from app.modules.usuarios.schemas import AssignRolesRequest, PaginatedUsers, ToggleEstadoRequest, UserRead, UserRolesResponse

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


@router.get("", response_model=PaginatedUsers)
async def list_usuarios(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: Usuario = Depends(require_role(["ADMIN"])),
) -> PaginatedUsers:
    async with UnitOfWork() as uow:
        return await usuario_service.list_usuarios(uow, page, size)


@router.put("/{usuario_id}/roles", response_model=UserRolesResponse)
async def assign_roles(
    usuario_id: int,
    body: AssignRolesRequest,
    current_user: Usuario = Depends(require_role(["ADMIN"])),
) -> UserRolesResponse:
    async with UnitOfWork() as uow:
        return await usuario_service.set_roles(uow, usuario_id, body, current_user)


@router.patch("/{usuario_id}/estado", response_model=UserRead)
async def toggle_estado(
    usuario_id: int,
    body: ToggleEstadoRequest,
    current_user: Usuario = Depends(require_role(["ADMIN"])),
) -> UserRead:
    async with UnitOfWork() as uow:
        return await usuario_service.toggle_estado(uow, usuario_id, body, current_user.id)
