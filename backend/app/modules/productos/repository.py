from typing import Optional

from sqlalchemy import delete, func, select

from app.core.repository import BaseRepository
from app.modules.productos.model import (
    Ingrediente,
    Producto,
    ProductoCategoria,
    ProductoIngrediente,
)


class IngredienteRepository(BaseRepository[Ingrediente]):
    def __init__(self, session) -> None:
        super().__init__(Ingrediente, session)

    async def get_by_nombre(self, nombre: str) -> Ingrediente | None:
        stmt = (
            select(Ingrediente)
            .where(Ingrediente.nombre == nombre)
            .where(Ingrediente.eliminado_en.is_(None))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()


class ProductoRepository(BaseRepository[Producto]):
    def __init__(self, session) -> None:
        super().__init__(Producto, session)

    async def list_paginated(
        self,
        page: int,
        size: int,
        categoria_id: Optional[int] = None,
        precio_min: Optional[float] = None,
        precio_max: Optional[float] = None,
        disponible: Optional[bool] = None,
        search: Optional[str] = None,
        excluir_alergenos: Optional[list[int]] = None,
    ) -> tuple[list[Producto], int]:
        stmt = select(Producto).where(Producto.eliminado_en.is_(None))

        if disponible is not None:
            stmt = stmt.where(Producto.disponible == disponible)
        if search:
            stmt = stmt.where(Producto.nombre.ilike(f"%{search}%"))
        if categoria_id is not None:
            stmt = stmt.where(
                Producto.id.in_(
                    select(ProductoCategoria.producto_id).where(
                        ProductoCategoria.categoria_id == categoria_id
                    )
                )
            )
        if precio_min is not None:
            stmt = stmt.where(Producto.precio_base >= precio_min)
        if precio_max is not None:
            stmt = stmt.where(Producto.precio_base <= precio_max)
        if excluir_alergenos:
            from sqlalchemy import exists as sa_exists
            sub = (
                sa_exists()
                .where(ProductoIngrediente.producto_id == Producto.id)
                .where(ProductoIngrediente.ingrediente_id.in_(excluir_alergenos))
            )
            stmt = stmt.where(~sub)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.session.execute(count_stmt)).scalar_one()

        stmt = stmt.order_by(Producto.nombre).offset((page - 1) * size).limit(size)
        items = list((await self.session.execute(stmt)).scalars().all())
        return items, total

    async def get_categorias(self, producto_id: int) -> list[dict]:
        from app.modules.categorias.model import Categoria

        stmt = (
            select(Categoria.id, Categoria.nombre)
            .join(ProductoCategoria, ProductoCategoria.categoria_id == Categoria.id)
            .where(ProductoCategoria.producto_id == producto_id)
            .where(Categoria.eliminado_en.is_(None))
        )
        result = await self.session.execute(stmt)
        return [{"id": row[0], "nombre": row[1]} for row in result.all()]

    async def get_ingredientes(self, producto_id: int) -> list[dict]:
        stmt = (
            select(
                Ingrediente.id,
                Ingrediente.nombre,
                Ingrediente.es_alergeno,
                ProductoIngrediente.es_removible,
            )
            .join(ProductoIngrediente, ProductoIngrediente.ingrediente_id == Ingrediente.id)
            .where(ProductoIngrediente.producto_id == producto_id)
            .where(Ingrediente.eliminado_en.is_(None))
        )
        result = await self.session.execute(stmt)
        return [
            {
                "ingrediente_id": row[0],
                "nombre": row[1],
                "es_alergeno": row[2],
                "es_removible": row[3],
            }
            for row in result.all()
        ]

    async def set_categorias(self, producto_id: int, categoria_ids: list[int]) -> None:
        await self.session.execute(
            delete(ProductoCategoria).where(ProductoCategoria.producto_id == producto_id)
        )
        for i, cat_id in enumerate(categoria_ids):
            self.session.add(
                ProductoCategoria(
                    producto_id=producto_id,
                    categoria_id=cat_id,
                    es_principal=(i == 0),
                )
            )
        await self.session.flush()

    async def add_ingrediente(
        self, producto_id: int, ingrediente_id: int, es_removible: bool
    ) -> None:
        self.session.add(
            ProductoIngrediente(
                producto_id=producto_id,
                ingrediente_id=ingrediente_id,
                es_removible=es_removible,
            )
        )
        await self.session.flush()

    async def remove_ingrediente(self, producto_id: int, ingrediente_id: int) -> None:
        await self.session.execute(
            delete(ProductoIngrediente)
            .where(ProductoIngrediente.producto_id == producto_id)
            .where(ProductoIngrediente.ingrediente_id == ingrediente_id)
        )
        await self.session.flush()

    async def ingrediente_asociado(self, producto_id: int, ingrediente_id: int) -> bool:
        stmt = (
            select(func.count())
            .select_from(ProductoIngrediente)
            .where(ProductoIngrediente.producto_id == producto_id)
            .where(ProductoIngrediente.ingrediente_id == ingrediente_id)
        )
        return (await self.session.execute(stmt)).scalar_one() > 0
