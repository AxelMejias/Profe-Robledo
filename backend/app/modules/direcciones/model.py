from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class DireccionEntrega(SQLModel, table=True):
    __tablename__ = "direcciones_entrega"

    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuarios.id")
    alias: Optional[str] = Field(default=None, max_length=50)
    linea1: str
    linea2: Optional[str] = Field(default=None)
    ciudad: str = Field(max_length=100)
    codigo_postal: str = Field(max_length=20)
    referencia: Optional[str] = Field(default=None)
    es_principal: bool = Field(default=False)
    creado_en: datetime = Field(default_factory=datetime.utcnow)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow)
    eliminado_en: Optional[datetime] = Field(default=None)
