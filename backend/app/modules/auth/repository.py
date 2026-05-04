from typing import Optional

from sqlalchemy import delete as sa_delete
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.repository import BaseRepository
from app.modules.auth.model import UsuarioRol
from app.modules.usuarios.model import Usuario


class UsuarioRepository(BaseRepository[Usuario]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Usuario, session)

    async def get_by_email(self, email: str) -> Usuario | None:
        stmt = select(Usuario).where(
            Usuario.email == email,
            Usuario.eliminado_en.is_(None),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_with_roles(self, usuario_id: int) -> Usuario | None:
        stmt = (
            select(Usuario)
            .where(Usuario.id == usuario_id, Usuario.eliminado_en.is_(None))
            .options(selectinload(Usuario.usuario_roles).selectinload(UsuarioRol.rol))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def add_rol(
        self,
        usuario_id: int,
        rol_codigo: str,
        asignado_por_id: Optional[int] = None,
    ) -> None:
        ur = UsuarioRol(
            usuario_id=usuario_id,
            rol_codigo=rol_codigo,
            asignado_por_id=asignado_por_id,
        )
        self.session.add(ur)
        await self.session.flush()

    async def set_roles(
        self,
        usuario_id: int,
        roles: list[str],
        asignado_por_id: int,
    ) -> None:
        await self.session.execute(
            sa_delete(UsuarioRol).where(UsuarioRol.usuario_id == usuario_id)
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

    async def count_with_role(self, rol_codigo: str) -> int:
        stmt = (
            select(func.count())
            .select_from(UsuarioRol)
            .where(UsuarioRol.rol_codigo == rol_codigo)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()
