from datetime import datetime
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel


class Rol(SQLModel, table=True):
    __tablename__ = "roles"

    codigo: str = Field(primary_key=True, max_length=20)
    nombre: str = Field(max_length=80)
    descripcion: str = Field(default="")

    usuario_roles: list["UsuarioRol"] = Relationship(back_populates="rol")


class UsuarioRol(SQLModel, table=True):
    __tablename__ = "usuario_roles"

    usuario_id: int = Field(foreign_key="usuarios.id", primary_key=True)
    rol_codigo: str = Field(
        foreign_key="roles.codigo", primary_key=True, max_length=20
    )
    asignado_por_id: Optional[int] = Field(
        default=None, foreign_key="usuarios.id"
    )
    asignado_en: datetime = Field(default_factory=datetime.utcnow)

    rol: Optional[Rol] = Relationship(back_populates="usuario_roles")
