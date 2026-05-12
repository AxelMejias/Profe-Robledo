from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repository import BaseRepository
from app.modules.direcciones.model import DireccionEntrega
from app.modules.pedidos.model import DetallePedido, HistorialEstadoPedido, Pedido
from app.modules.productos.model import FormaPago, Producto


class PedidoRepository(BaseRepository[Pedido]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Pedido, session)

    async def list_paginated(
        self,
        page: int,
        size: int,
        usuario_id: Optional[int] = None,
    ) -> tuple[list[Pedido], int]:
        stmt = select(Pedido).where(Pedido.eliminado_en.is_(None))
        if usuario_id is not None:
            stmt = stmt.where(Pedido.usuario_id == usuario_id)
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.session.execute(count_stmt)).scalar_one()
        stmt = stmt.order_by(Pedido.creado_en.desc()).offset((page - 1) * size).limit(size)
        pedidos = list((await self.session.execute(stmt)).scalars().all())
        return pedidos, total

    async def get_detalles(self, pedido_id: int) -> list[DetallePedido]:
        stmt = select(DetallePedido).where(DetallePedido.pedido_id == pedido_id)
        return list((await self.session.execute(stmt)).scalars().all())

    async def get_historial(self, pedido_id: int) -> list[HistorialEstadoPedido]:
        stmt = (
            select(HistorialEstadoPedido)
            .where(HistorialEstadoPedido.pedido_id == pedido_id)
            .order_by(HistorialEstadoPedido.created_at.asc())
        )
        return list((await self.session.execute(stmt)).scalars().all())

    async def get_forma_pago(self, codigo: str) -> FormaPago | None:
        stmt = select(FormaPago).where(
            FormaPago.codigo == codigo,
            FormaPago.habilitado == True,  # noqa: E712
        )
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def get_direccion_del_usuario(
        self, direccion_id: int, usuario_id: int
    ) -> DireccionEntrega | None:
        stmt = select(DireccionEntrega).where(
            DireccionEntrega.id == direccion_id,
            DireccionEntrega.usuario_id == usuario_id,
            DireccionEntrega.eliminado_en.is_(None),
        )
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def get_producto_for_update(self, producto_id: int) -> Producto | None:
        stmt = (
            select(Producto)
            .where(Producto.id == producto_id)
            .with_for_update()
        )
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def add_detalle(self, detalle: DetallePedido) -> DetallePedido:
        self.session.add(detalle)
        await self.session.flush()
        return detalle

    async def add_historial(self, entry: HistorialEstadoPedido) -> HistorialEstadoPedido:
        self.session.add(entry)
        await self.session.flush()
        return entry
