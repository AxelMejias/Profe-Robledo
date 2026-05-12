from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DireccionCreate(BaseModel):
    alias: Optional[str] = None
    linea1: str
    linea2: Optional[str] = None
    ciudad: str
    codigo_postal: str
    referencia: Optional[str] = None


class DireccionUpdate(BaseModel):
    alias: Optional[str] = None
    linea1: Optional[str] = None
    linea2: Optional[str] = None
    ciudad: Optional[str] = None
    codigo_postal: Optional[str] = None
    referencia: Optional[str] = None


class DireccionRead(BaseModel):
    id: int
    alias: Optional[str] = None
    linea1: str
    linea2: Optional[str] = None
    ciudad: str
    codigo_postal: str
    referencia: Optional[str] = None
    es_principal: bool
    creado_en: datetime

    model_config = {"from_attributes": True}
