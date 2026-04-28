from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlmodel import Field, SQLModel


class Pago(SQLModel, table=True):
    __tablename__ = "pagos"

    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedidos.id")
    monto: Decimal = Field(decimal_places=2, max_digits=10)
    mp_payment_id: Optional[int] = Field(default=None, unique=True)
    mp_status: str = Field(max_length=30)
    external_reference: str = Field(max_length=100, unique=True)
    idempotency_key: str = Field(max_length=100, unique=True)
    creado_en: datetime = Field(default_factory=datetime.utcnow)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow)
