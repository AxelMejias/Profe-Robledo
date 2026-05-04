from fastapi import HTTPException, status

from app.core.uow import UnitOfWork
from app.modules.usuarios.model import Usuario
from app.modules.usuarios.schemas import AssignRolesRequest, UserRolesResponse, VALID_ROLES


async def assign_roles(
    uow: UnitOfWork,
    usuario_id: int,
    data: AssignRolesRequest,
    asignado_por: Usuario,
) -> UserRolesResponse:
    invalid = set(data.roles) - VALID_ROLES
    if invalid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Roles inválidos: {', '.join(sorted(invalid))}",
        )

    usuario = await uow.usuarios.get_with_roles(usuario_id)
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    # RN-RB04: proteger el último ADMIN
    current_roles = {ur.rol_codigo for ur in usuario.usuario_roles}
    if "ADMIN" in current_roles and "ADMIN" not in data.roles:
        admin_count = await uow.usuarios.count_with_role("ADMIN")
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede quitar el rol ADMIN al último administrador",
            )

    await uow.usuarios.set_roles(usuario_id, data.roles, asignado_por_id=asignado_por.id)

    usuario = await uow.usuarios.get_with_roles(usuario_id)
    return UserRolesResponse(
        id=usuario.id,
        email=usuario.email,
        roles=[ur.rol_codigo for ur in usuario.usuario_roles],
    )
