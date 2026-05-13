from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, field_validator


class ItemCarritoRequest(BaseModel):
    producto_id: int
    cantidad: int
    personalizacion: Optional[list[int]] = None
    precio: Optional[float] = None

    @field_validator("cantidad")
    @classmethod
    def cantidad_positiva(cls, v: int) -> int:
        if v < 1:
            raise ValueError("La cantidad debe ser al menos 1")
        return v


class ValidarCarritoRequest(BaseModel):
    items: list[ItemCarritoRequest]

    @field_validator("items")
    @classmethod
    def items_no_vacios(cls, v: list) -> list:
        if not v:
            raise ValueError("El carrito no puede estar vacío")
        return v


class ItemCarritoValidado(BaseModel):
    producto_id: int
    nombre: str
    precio_unitario: Decimal
    cantidad: int
    subtotal: Decimal
    disponible: bool
    stock_suficiente: bool
    error: Optional[str] = None


class ValidarCarritoResponse(BaseModel):
    valido: bool
    items: list[ItemCarritoValidado]
    subtotal: Decimal
    errores: list[str]
    advertencias: list[str] = []
