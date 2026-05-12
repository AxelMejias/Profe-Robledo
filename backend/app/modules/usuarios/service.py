from fastapi import HTTPException, status
from sqlalchemy import func, select

from app.core.uow import UnitOfWork
from app.modules.auth.model import UsuarioRol
from app.modules.usuarios.model import Usuario
from app.modules.usuarios.schemas import AssignRolesRequest, UserRolesResponse

_VALID_ROLES = {"ADMIN", "STOCK", "PEDIDOS", "CLIENT"}


async def set_roles(
    uow: UnitOfWork,
    usuario_id: int,
    data: AssignRolesRequest,
    current_user: Usuario,
) -> UserRolesResponse:
    invalid = set(data.roles) - _VALID_ROLES
    if invalid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Roles inválidos: {', '.join(sorted(invalid))}",
        )

    target = await uow.usuarios.get_with_roles(usuario_id)
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    current_roles: list[str] = target.__dict__.get("_roles", [])

    # RN-RB04: no quitar ADMIN si es el único
    if "ADMIN" in current_roles and "ADMIN" not in data.roles:
        stmt = (
            select(func.count())
            .select_from(UsuarioRol)
            .where(UsuarioRol.rol_codigo == "ADMIN")
        )
        result = await uow._session.execute(stmt)
        admin_count = result.scalar_one()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede quitar el rol ADMIN al único administrador del sistema",
            )

    await uow.usuarios.set_roles(
        usuario_id=usuario_id,
        roles=data.roles,
        asignado_por_id=current_user.id,
    )

    return UserRolesResponse(id=usuario_id, email=target.email, roles=data.roles)
