from sqlalchemy import delete

from app.modules.auth.repository import UsuarioRepository as _AuthUsuarioRepo


class UsuarioRepository(_AuthUsuarioRepo):
    """Extends auth UsuarioRepository with admin role-management operations."""

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
