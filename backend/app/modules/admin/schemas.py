from decimal import Decimal

from pydantic import BaseModel


class MetricasKPI(BaseModel):
    total_pedidos: int
    ingresos_hoy: Decimal
    pedidos_pendientes: int
    sin_stock: int


class MetricaPorEstado(BaseModel):
    estado: str
    cantidad: int


class MetricaIngresoDia(BaseModel):
    fecha: str
    ingresos: Decimal
