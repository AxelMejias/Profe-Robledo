from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repository import BaseRepository
from app.modules.pagos.model import Pago


class PagoRepository(BaseRepository[Pago]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Pago, session)

    async def get_by_pedido(self, pedido_id: int) -> Pago | None:
        stmt = select(Pago).where(Pago.pedido_id == pedido_id)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def get_by_external_reference(self, external_reference: str) -> Pago | None:
        stmt = select(Pago).where(Pago.external_reference == external_reference)
        return (await self.session.execute(stmt)).scalar_one_or_none()
