from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Categoria(SQLModel, table=True):
    __tablename__ = "categorias"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=100)
    descripcion: Optional[str] = Field(default=None)
    imagen_url: Optional[str] = Field(default=None)
    parent_id: Optional[int] = Field(default=None, foreign_key="categorias.id")
    creado_en: datetime = Field(default_factory=datetime.utcnow)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow)
    eliminado_en: Optional[datetime] = Field(default=None)
