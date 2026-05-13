from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AssignRolesRequest(BaseModel):
    roles: list[str]


class ToggleEstadoRequest(BaseModel):
    activo: bool


class UserRolesResponse(BaseModel):
    id: int
    email: str
    roles: list[str]


class UserRead(BaseModel):
    id: int
    nombre: str
    apellido: str
    email: str
    telefono: Optional[str] = None
    activo: bool = True
    roles: list[str] = []
    creado_en: datetime


class PaginatedUsers(BaseModel):
    items: list[UserRead]
    total: int
    page: int
    size: int
    pages: int
