from typing import Optional

from sqlalchemy import delete, select

from app.modules.auth.repository import UsuarioRepository as _AuthUsuarioRepo


class UsuarioRepository(_AuthUsuarioRepo):
    """Extends auth UsuarioRepository with admin role-management operations."""

    async def list_all_with_roles(
        self,
        page: int = 1,
        size: int = 50,
    ) -> tuple[list[Usuario], int]:
        from app.modules.auth.model import Rol, UsuarioRol
        from app.modules.usuarios.model import Usuario

        # Total count
        count_stmt = select(Usuario).where(Usuario.eliminado_en.is_(None))
        total = len((await self.session.execute(count_stmt)).scalars().all())

        # Paginated users
        stmt = (
            select(Usuario)
            .where(Usuario.eliminado_en.is_(None))
            .order_by(Usuario.creado_en.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
        usuarios = list((await self.session.execute(stmt)).scalars().all())

        # Populate roles for each user
        for usuario in usuarios:
            roles_stmt = (
                select(Rol.codigo)
                .join(UsuarioRol, UsuarioRol.rol_codigo == Rol.codigo)
                .where(UsuarioRol.usuario_id == usuario.id)
            )
            result = await self.session.execute(roles_stmt)
            usuario.__dict__["_roles"] = [row[0] for row in result.all()]

        return usuarios, total

    async def set_roles(
        self,
        usuario_id: int,
        roles: list[str],
        asignado_por_id: int,
    ) -> None:
        from app.modules.auth.model import UsuarioRol

        await self.session.execute(
            delete(UsuarioRol).where(UsuarioRol.usuario_id == usuario_id)
        )
        for rol_codigo in roles:
            self.session.add(
                UsuarioRol(
                    usuario_id=usuario_id,
                    rol_codigo=rol_codigo,
                    asignado_por_id=asignado_por_id,
                )
            )
        await self.session.flush()
