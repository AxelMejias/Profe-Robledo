from fastapi import APIRouter, Depends

from app.core.deps import require_role
from app.core.uow import UnitOfWork
from app.modules.usuarios import service as usuarios_service
from app.modules.usuarios.model import Usuario
from app.modules.usuarios.schemas import AssignRolesRequest, UserRolesResponse

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


@router.put("/{usuario_id}/roles", response_model=UserRolesResponse)
async def assign_roles(
    usuario_id: int,
    body: AssignRolesRequest,
    current_user: Usuario = Depends(require_role(["ADMIN"])),
) -> UserRolesResponse:
    async with UnitOfWork() as uow:
        return await usuarios_service.assign_roles(uow, usuario_id, body, current_user)
