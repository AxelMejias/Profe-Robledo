from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlmodel import Field, SQLModel


class Ingrediente(SQLModel, table=True):
    __tablename__ = "ingredientes"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=100, unique=True)
    descripcion: Optional[str] = Field(default=None)
    es_alergeno: bool = Field(default=False)
    creado_en: datetime = Field(default_factory=datetime.utcnow)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow)
    eliminado_en: Optional[datetime] = Field(default=None)


class Producto(SQLModel, table=True):
    __tablename__ = "productos"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=200)
    descripcion: Optional[str] = Field(default=None)
    imagen_url: Optional[str] = Field(default=None)
    precio_base: Decimal = Field(decimal_places=2, max_digits=10)
    stock_cantidad: int = Field(default=0, ge=0)
    disponible: bool = Field(default=True)
    creado_en: datetime = Field(default_factory=datetime.utcnow)
    actualizado_en: datetime = Field(default_factory=datetime.utcnow)
    eliminado_en: Optional[datetime] = Field(default=None)


class ProductoCategoria(SQLModel, table=True):
    __tablename__ = "producto_categorias"

    producto_id: int = Field(foreign_key="productos.id", primary_key=True)
    categoria_id: int = Field(foreign_key="categorias.id", primary_key=True)
    es_principal: bool = Field(default=False)


class FormaPago(SQLModel, table=True):
    __tablename__ = "formas_pago"

    codigo: str = Field(primary_key=True, max_length=20)
    nombre: str = Field(max_length=80)
    descripcion: Optional[str] = Field(default=None)
    habilitado: bool = Field(default=True)


class ProductoIngrediente(SQLModel, table=True):
    __tablename__ = "producto_ingredientes"

    producto_id: int = Field(foreign_key="productos.id", primary_key=True)
    ingrediente_id: int = Field(foreign_key="ingredientes.id", primary_key=True)
    es_removible: bool = Field(default=True)
