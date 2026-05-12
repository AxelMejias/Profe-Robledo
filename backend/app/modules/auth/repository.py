from sqlalchemy import select

from app.core.repository import BaseRepository
from app.modules.usuarios.model import Usuario


class UsuarioRepository(BaseRepository[Usuario]):
    def __init__(self, session) -> None:
        super().__init__(Usuario, session)

    async def get_by_email(self, email: str) -> Usuario | None:
        stmt = (
            select(Usuario)
            .where(Usuario.email == email)
            .where(Usuario.eliminado_en.is_(None))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_with_roles(self, usuario_id: int) -> Usuario | None:
        """Returns the user with ._roles list[str] populated via a second query."""
        from app.modules.auth.model import Rol, UsuarioRol

        usuario = await self.get_by_id(usuario_id)
        if usuario is None:
            return None

        stmt = (
            select(Rol.codigo)
            .join(UsuarioRol, UsuarioRol.rol_codigo == Rol.codigo)
            .where(UsuarioRol.usuario_id == usuario_id)
        )
        result = await self.session.execute(stmt)
        usuario.__dict__["_roles"] = [row[0] for row in result.all()]
        return usuario
