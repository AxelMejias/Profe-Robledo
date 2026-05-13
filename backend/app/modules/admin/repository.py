from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.pedidos.model import DetallePedido, Pedido
from app.modules.productos.model import Producto


class AdminRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def total_pedidos(self) -> int:
        stmt = (
            select(func.count())
            .select_from(Pedido)
            .where(Pedido.eliminado_en.is_(None))
        )
        return (await self.session.execute(stmt)).scalar_one()

    async def ingresos_hoy(self) -> Decimal:
        hoy = date.today()
        stmt = (
            select(func.coalesce(func.sum(Pedido.total), 0))
            .where(Pedido.estado_codigo.in_(["CONFIRMADO", "EN_PREP", "EN_CAMINO", "ENTREGADO"]))
            .where(func.date(Pedido.creado_en) == hoy)
        )
        return Decimal(str((await self.session.execute(stmt)).scalar_one()))

    async def pedidos_pendientes(self) -> int:
        stmt = (
            select(func.count())
            .select_from(Pedido)
            .where(Pedido.estado_codigo == "PENDIENTE")
            .where(Pedido.eliminado_en.is_(None))
        )
        return (await self.session.execute(stmt)).scalar_one()

    async def productos_sin_stock(self) -> int:
        stmt = (
            select(func.count())
            .select_from(Producto)
            .where(Producto.disponible == True)  # noqa: E712
            .where(Producto.stock_cantidad == 0)
            .where(Producto.eliminado_en.is_(None))
        )
        return (await self.session.execute(stmt)).scalar_one()

    async def por_estado(self) -> list[dict]:
        stmt = (
            select(Pedido.estado_codigo, func.count().label("cantidad"))
            .where(Pedido.eliminado_en.is_(None))
            .group_by(Pedido.estado_codigo)
        )
        rows = (await self.session.execute(stmt)).all()
        return [{"estado": row[0], "cantidad": row[1]} for row in rows]

    async def get_top_productos(self, limit: int = 5) -> list[dict]:
        stmt = (
            select(
                DetallePedido.producto_id,
                Producto.nombre,
                func.sum(DetallePedido.cantidad).label("total_vendido"),
            )
            .join(Pedido, Pedido.id == DetallePedido.pedido_id)
            .join(Producto, Producto.id == DetallePedido.producto_id)
            .where(Pedido.estado_codigo != "CANCELADO")
            .where(Pedido.eliminado_en.is_(None))
            .group_by(DetallePedido.producto_id, Producto.nombre)
            .order_by(func.sum(DetallePedido.cantidad).desc())
            .limit(limit)
        )
        rows = (await self.session.execute(stmt)).all()
        return [{"producto_id": r[0], "nombre": r[1], "total_vendido": int(r[2])} for r in rows]

    async def ingresos_7_dias(self) -> list[dict]:
        hoy = date.today()
        inicio = hoy - timedelta(days=6)
        stmt = (
            select(
                func.date(Pedido.creado_en).label("fecha"),
                func.coalesce(func.sum(Pedido.total), 0).label("ingresos"),
            )
            .where(Pedido.estado_codigo.in_(["CONFIRMADO", "EN_PREP", "EN_CAMINO", "ENTREGADO"]))
            .where(func.date(Pedido.creado_en) >= inicio)
            .group_by(func.date(Pedido.creado_en))
            .order_by(func.date(Pedido.creado_en).asc())
        )
        rows = (await self.session.execute(stmt)).all()
        return [{"fecha": str(row[0]), "ingresos": Decimal(str(row[1]))} for row in rows]
