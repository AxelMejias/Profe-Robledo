from fastapi import HTTPException, status
from sqlalchemy import func, select

from app.core.uow import UnitOfWork
from app.modules.auth.model import UsuarioRol
from app.modules.usuarios.model import Usuario
from app.modules.usuarios.schemas import AssignRolesRequest, PaginatedUsers, ToggleEstadoRequest, UserRead, UserRolesResponse

_VALID_ROLES = {"ADMIN", "STOCK", "PEDIDOS", "CLIENT"}


def _to_read(usuario: Usuario) -> UserRead:
    return UserRead(
        id=usuario.id,
        nombre=usuario.nombre,
        apellido=usuario.apellido,
        email=usuario.email,
        telefono=usuario.telefono,
        activo=usuario.activo,
        roles=usuario.__dict__.get("_roles", []),
        creado_en=usuario.creado_en,
    )


async def list_usuarios(
    uow: UnitOfWork, page: int = 1, size: int = 50
) -> PaginatedUsers:
    usuarios, total = await uow.usuarios.list_all_with_roles(page, size)
    pages = max(1, (total + size - 1) // size)
    return PaginatedUsers(
        items=[_to_read(u) for u in usuarios],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


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


async def toggle_estado(
    uow: UnitOfWork,
    usuario_id: int,
    data: ToggleEstadoRequest,
    current_user_id: int,
) -> UserRead:
    if usuario_id == current_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No podés desactivar tu propia cuenta",
        )

    target = await uow.usuarios.get_with_roles(usuario_id)
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    # RN: no desactivar al último ADMIN activo
    if not data.activo and "ADMIN" in target.__dict__.get("_roles", []):
        stmt = (
            select(func.count())
            .select_from(UsuarioRol)
            .where(UsuarioRol.rol_codigo == "ADMIN")
        )
        # Also filter by activo=True for active admins
        from app.modules.usuarios.model import Usuario as UsuarioModel
        from sqlalchemy import and_
        stmt_activos = (
            select(func.count())
            .select_from(UsuarioModel)
            .join(UsuarioRol, UsuarioRol.usuario_id == UsuarioModel.id)
            .where(UsuarioRol.rol_codigo == "ADMIN")
            .where(UsuarioModel.activo == True)  # noqa: E712
            .where(UsuarioModel.eliminado_en.is_(None))
        )
        result = await uow._session.execute(stmt_activos)
        admin_activos = result.scalar_one()
        if admin_activos <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede desactivar al único administrador activo del sistema",
            )

    target.activo = data.activo
    await uow.usuarios.update(target)
    return _to_read(target)
