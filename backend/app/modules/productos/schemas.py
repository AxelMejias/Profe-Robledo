from datetime import datetime
from decimal import Decimal
from typing import Optional


from pydantic import BaseModel, Field, field_validator


# ── Ingrediente ─────────────────────────────────────────────────────────────

class IngredienteCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    es_alergeno: bool = False
    unidad_medida: str = "UNIDAD"
    precio: Decimal = Decimal("0")
    tipo_extra: Optional[str] = None
    disponible_como_extra: bool = False

    @field_validator("nombre")
    @classmethod
    def nombre_valido(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("El nombre no puede estar vacío")
        return v


class IngredienteUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    es_alergeno: Optional[bool] = None
    unidad_medida: Optional[str] = None
    precio: Optional[Decimal] = None
    tipo_extra: Optional[str] = None
    disponible_como_extra: Optional[bool] = None


class IngredienteRead(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    es_alergeno: bool
    unidad_medida: str
    precio: Decimal
    tipo_extra: Optional[str]
    disponible_como_extra: bool
    model_config = {"from_attributes": True}


# ── Pivot producto-ingrediente ───────────────────────────────────────────────

class AsociarIngredienteRequest(BaseModel):
    ingrediente_id: int
    es_removible: bool = True
    cantidad: int = 1


class ActualizarIngredientePivotRequest(BaseModel):
    cantidad: int = Field(default=1, ge=1)


class ProductoIngredienteRead(BaseModel):
    ingrediente_id: int
    nombre: str
    es_alergeno: bool
    es_removible: bool
    cantidad: int = 1


# ── Resumen de categoría (para incluir en detalle de producto) ───────────────

class CategoriaResumen(BaseModel):
    id: int
    nombre: str


# ── Producto ─────────────────────────────────────────────────────────────────

class ProductoCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None
    precio_base: Decimal
    stock_cantidad: int = 0
    disponible: bool = True
    categoria_ids: list[int] = []

    @field_validator("precio_base")
    @classmethod
    def precio_no_negativo(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("El precio debe ser mayor o igual a 0")
        return v

    @field_validator("stock_cantidad")
    @classmethod
    def stock_no_negativo(cls, v: int) -> int:
        if v < 0:
            raise ValueError("El stock no puede ser negativo")
        return v


class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None
    precio_base: Optional[Decimal] = None
    stock_cantidad: Optional[int] = None
    disponible: Optional[bool] = None

    @field_validator("precio_base")
    @classmethod
    def precio_no_negativo(cls, v: Decimal | None) -> Decimal | None:
        if v is not None and v < 0:
            raise ValueError("El precio debe ser mayor o igual a 0")
        return v

    @field_validator("stock_cantidad")
    @classmethod
    def stock_no_negativo(cls, v: int | None) -> int | None:
        if v is not None and v < 0:
            raise ValueError("El stock no puede ser negativo")
        return v


class DisponibilidadUpdate(BaseModel):
    disponible: bool


class AssignCategoriasRequest(BaseModel):
    categoria_ids: list[int]


class ProductoRead(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    imagen_url: Optional[str]
    precio_base: Decimal
    stock_cantidad: int
    disponible: bool
    creado_en: datetime
    model_config = {"from_attributes": True}


class ProductoDetail(ProductoRead):
    categorias: list[CategoriaResumen]
    ingredientes: list[ProductoIngredienteRead]


class PaginatedProductos(BaseModel):
    items: list[ProductoRead]
    total: int
    page: int
    size: int
    pages: int
