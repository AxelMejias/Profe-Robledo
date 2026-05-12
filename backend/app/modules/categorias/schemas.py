from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator


class CategoriaCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None
    parent_id: Optional[int] = None

    @field_validator("nombre")
    @classmethod
    def nombre_valido(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("El nombre no puede estar vacío")
        if len(v) > 100:
            raise ValueError("Máximo 100 caracteres")
        return v


class CategoriaUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None
    parent_id: Optional[int] = None

    @field_validator("nombre")
    @classmethod
    def nombre_valido(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if not v:
            raise ValueError("El nombre no puede estar vacío")
        if len(v) > 100:
            raise ValueError("Máximo 100 caracteres")
        return v


class CategoriaRead(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    imagen_url: Optional[str]
    parent_id: Optional[int]
    creado_en: datetime

    model_config = {"from_attributes": True}


class CategoriaTree(BaseModel):
    id: int
    nombre: str
    imagen_url: Optional[str]
    subcategorias: list["CategoriaTree"] = []

    model_config = {"from_attributes": True}


CategoriaTree.model_rebuild()
