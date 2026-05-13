from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, field_validator


class ItemPedidoRequest(BaseModel):
    producto_id: int
    cantidad: int
    personalizacion: Optional[list[int]] = None

    @field_validator("cantidad")
    @classmethod
    def cantidad_positiva(cls, v: int) -> int:
        if v < 1:
            raise ValueError("La cantidad debe ser al menos 1")
        return v


class CrearPedidoRequest(BaseModel):
    items: list[ItemPedidoRequest]
    forma_pago_codigo: str
    direccion_id: Optional[int] = None
    notas: Optional[str] = None

    @field_validator("items")
    @classmethod
    def items_no_vacios(cls, v: list) -> list:
        if not v:
            raise ValueError("El pedido debe tener al menos un ítem")
        return v


class AvanzarEstadoRequest(BaseModel):
    nuevo_estado: str
    motivo: Optional[str] = None


class DetallePedidoRead(BaseModel):
    producto_id: int
    nombre_snapshot: str
    precio_snapshot: Decimal
    cantidad: int
    subtotal: Decimal
    personalizacion: Optional[list[int]] = None

    model_config = {"from_attributes": True}


class HistorialRead(BaseModel):
    id: int
    estado_desde: Optional[str] = None
    estado_hasta: str
    motivo: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PedidoRead(BaseModel):
    id: int
    usuario_id: int
    estado_codigo: str
    subtotal: Decimal
    costo_envio: Decimal
    total: Decimal
    forma_pago_codigo: str
    notas: Optional[str] = None
    creado_en: datetime
    direccion_snapshot: Optional[str] = None
    usuario_nombre: Optional[str] = None

    model_config = {"from_attributes": True}


class PedidoDetail(PedidoRead):
    items: list[DetallePedidoRead] = []
    historial: list[HistorialRead] = []


class PedidoListResponse(BaseModel):
    items: list[PedidoRead]
    total: int
    page: int
    size: int
    pages: int
