from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, Column
from sqlmodel import Field, SQLModel


class Usuario(SQLModel, table=True):
    __tablename__ = "usuarios"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=80)
    apellido: str = Field(max_length=80)
    email: str = Field(max_length=254, unique=True, index=True)
    password_hash: str = Field(max_length=60)
    telefono: Optional[str] = Field(default=None, max_length=30)
    activo: bool = Field(default=True, sa_column=Column(Boolean, server_default="true", nullable=False))
    creado_en: datetime = Field(default_factory=datetime.utcnow)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow)
    eliminado_en: Optional[datetime] = Field(default=None)
