from datetime import datetime
from typing import Optional

from fastapi import HTTPException, status

from app.core.uow import UnitOfWork
from app.modules.categorias.model import Categoria
from app.modules.categorias.schemas import (
    CategoriaCreate,
    CategoriaRead,
    CategoriaTree,
    CategoriaUpdate,
)


def _build_tree(cats: list[Categoria], parent_id: Optional[int]) -> list[CategoriaTree]:
    return [
        CategoriaTree(
            id=c.id,
            nombre=c.nombre,
            imagen_url=c.imagen_url,
            subcategorias=_build_tree(cats, parent_id=c.id),
        )
        for c in cats
        if c.parent_id == parent_id
    ]


async def get_tree(uow: UnitOfWork) -> list[CategoriaTree]:
    cats = await uow.categorias.get_all_flat()
    return _build_tree(cats, parent_id=None)


async def get_by_id(uow: UnitOfWork, categoria_id: int) -> CategoriaRead:
    cat = await uow.categorias.get_by_id(categoria_id)
    if cat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")
    return CategoriaRead.model_validate(cat)


async def create(uow: UnitOfWork, data: CategoriaCreate) -> CategoriaRead:
    if data.parent_id is not None:
        parent = await uow.categorias.get_by_id(data.parent_id)
        if parent is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Categoría padre no encontrada"
            )

    existing = await uow.categorias.get_by_nombre_and_parent(data.nombre, data.parent_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una categoría con ese nombre en este nivel",
        )

    cat = await uow.categorias.create(
        Categoria(
            nombre=data.nombre,
            descripcion=data.descripcion,
            imagen_url=data.imagen_url,
            parent_id=data.parent_id,
        )
    )
    return CategoriaRead.model_validate(cat)


async def update(uow: UnitOfWork, categoria_id: int, data: CategoriaUpdate) -> CategoriaRead:
    cat = await uow.categorias.get_by_id(categoria_id)
    if cat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")

    if "parent_id" in data.model_fields_set:
        new_parent_id = data.parent_id
        if new_parent_id is not None:
            if await uow.categorias.would_create_cycle(categoria_id, new_parent_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La operación generaría un ciclo en la jerarquía de categorías",
                )
            parent = await uow.categorias.get_by_id(new_parent_id)
            if parent is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Categoría padre no encontrada",
                )
        cat.parent_id = new_parent_id

    if data.nombre is not None:
        cat.nombre = data.nombre
    if data.descripcion is not None:
        cat.descripcion = data.descripcion
    if data.imagen_url is not None:
        cat.imagen_url = data.imagen_url

    cat.actualizado_en = datetime.utcnow()
    updated = await uow.categorias.update(cat)
    return CategoriaRead.model_validate(updated)


async def delete(uow: UnitOfWork, categoria_id: int) -> None:
    cat = await uow.categorias.get_by_id(categoria_id)
    if cat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")

    if await uow.categorias.has_active_products(categoria_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar: la categoría tiene productos activos asociados",
        )

    if await uow.categorias.has_active_children(categoria_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar: la categoría tiene subcategorías activas",
        )

    await uow.categorias.soft_delete(cat)
