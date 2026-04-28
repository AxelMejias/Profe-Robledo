from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import ARRAY, INTEGER
from sqlmodel import Field, SQLModel


class EstadoPedido(SQLModel, table=True):
    __tablename__ = "estados_pedido"

    codigo: str = Field(primary_key=True, max_length=20)
    nombre: str = Field(max_length=80)
    descripcion: Optional[str] = Field(default=None)
    es_terminal: bool = Field(default=False)
    orden: int = Field(default=0)


class Pedido(SQLModel, table=True):
    __tablename__ = "pedidos"

    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuarios.id")
    estado_codigo: str = Field(
        foreign_key="estados_pedido.codigo", max_length=20, default="PENDIENTE"
    )
    direccion_id: Optional[int] = Field(
        default=None, foreign_key="direcciones_entrega.id"
    )
    forma_pago_codigo: str = Field(foreign_key="formas_pago.codigo", max_length=20)
    subtotal: Decimal = Field(decimal_places=2, max_digits=10)
    costo_envio: Decimal = Field(
        decimal_places=2, max_digits=10, default=Decimal("50.00")
    )
    total: Decimal = Field(decimal_places=2, max_digits=10)
    direccion_snapshot: Optional[str] = Field(default=None)
    notas: Optional[str] = Field(default=None)
    creado_en: datetime = Field(default_factory=datetime.utcnow)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow)
    eliminado_en: Optional[datetime] = Field(default=None)


class DetallePedido(SQLModel, table=True):
    __tablename__ = "detalle_pedidos"

    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedidos.id")
    producto_id: int = Field(foreign_key="productos.id")
    nombre_snapshot: str = Field(max_length=200)
    precio_snapshot: Decimal = Field(decimal_places=2, max_digits=10)
    cantidad: int = Field(ge=1)
    subtotal: Decimal = Field(decimal_places=2, max_digits=10)
    personalizacion: Optional[list[int]] = Field(
        default=None, sa_column=Column(ARRAY(INTEGER), nullable=True)
    )


class HistorialEstadoPedido(SQLModel, table=True):
    __tablename__ = "historial_estados_pedido"

    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedidos.id")
    estado_desde: Optional[str] = Field(
        default=None, foreign_key="estados_pedido.codigo", max_length=20
    )
    estado_hasta: str = Field(
        foreign_key="estados_pedido.codigo", max_length=20
    )
    usuario_id: Optional[int] = Field(default=None, foreign_key="usuarios.id")
    motivo: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
