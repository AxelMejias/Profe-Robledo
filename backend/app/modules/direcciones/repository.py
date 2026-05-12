from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repository import BaseRepository
from app.modules.direcciones.model import DireccionEntrega


class DireccionRepository(BaseRepository[DireccionEntrega]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(DireccionEntrega, session)

    async def list_del_usuario(self, usuario_id: int) -> list[DireccionEntrega]:
        stmt = (
            select(DireccionEntrega)
            .where(
                DireccionEntrega.usuario_id == usuario_id,
                DireccionEntrega.eliminado_en.is_(None),
            )
            .order_by(DireccionEntrega.es_principal.desc(), DireccionEntrega.creado_en.asc())
        )
        return list((await self.session.execute(stmt)).scalars().all())

    async def get_del_usuario(
        self, direccion_id: int, usuario_id: int
    ) -> DireccionEntrega | None:
        stmt = select(DireccionEntrega).where(
            DireccionEntrega.id == direccion_id,
            DireccionEntrega.usuario_id == usuario_id,
            DireccionEntrega.eliminado_en.is_(None),
        )
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def count_del_usuario(self, usuario_id: int) -> int:
        stmt = (
            select(func.count())
            .select_from(DireccionEntrega)
            .where(
                DireccionEntrega.usuario_id == usuario_id,
                DireccionEntrega.eliminado_en.is_(None),
            )
        )
        return (await self.session.execute(stmt)).scalar_one()

    async def desactivar_todas(self, usuario_id: int) -> None:
        await self.session.execute(
            update(DireccionEntrega)
            .where(
                DireccionEntrega.usuario_id == usuario_id,
                DireccionEntrega.eliminado_en.is_(None),
            )
            .values(es_principal=False)
        )
