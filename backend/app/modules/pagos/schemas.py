from datetime import datetime
from decimal import Decimal
from typing import Any, Optional

from pydantic import BaseModel


class CrearPagoRequest(BaseModel):
    pedido_id: int
    card_token: str
    payment_method_id: str
    payer_email: str


class PagoRead(BaseModel):
    id: int
    pedido_id: int
    monto: Decimal
    mp_payment_id: Optional[int] = None
    mp_status: str
    external_reference: str
    creado_en: datetime

    model_config = {"from_attributes": True}


class WebhookMP(BaseModel):
    action: Optional[str] = None
    api_version: Optional[str] = None
    data: Optional[dict[str, Any]] = None
    type: Optional[str] = None
    live_mode: Optional[bool] = None
