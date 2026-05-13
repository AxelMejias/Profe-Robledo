from datetime import datetime, timezone
from math import ceil
from typing import Optional

from fastapi import HTTPException, status

from app.core.uow import UnitOfWork
from app.modules.productos.model import Ingrediente, Producto
from app.modules.productos.schemas import (
    AsociarIngredienteRequest,
    AssignCategoriasRequest,
    CategoriaResumen,
    DisponibilidadUpdate,
    IngredienteCreate,
    IngredienteRead,
    IngredienteUpdate,
    PaginatedProductos,
    ProductoCreate,
    ProductoDetail,
    ProductoIngredienteRead,
    ProductoRead,
    ProductoUpdate,
)


# ── Ingrediente standalone ───────────────────────────────────────────────────

async def create_ingrediente(uow: UnitOfWork, data: IngredienteCreate) -> IngredienteRead:
    if await uow.ingredientes.get_by_nombre(data.nombre):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un ingrediente con ese nombre",
        )
    ing = await uow.ingredientes.create(
        Ingrediente(
            nombre=data.nombre,
            descripcion=data.descripcion,
            es_alergeno=data.es_alergeno,
        )
    )
    return IngredienteRead.model_validate(ing)


async def list_ingredientes(uow: UnitOfWork) -> list[IngredienteRead]:
    items = await uow.ingredientes.list_all(skip=0, limit=1000)
    return [IngredienteRead.model_validate(i) for i in items]


async def get_ingrediente(uow: UnitOfWork, ingrediente_id: int) -> IngredienteRead:
    ing = await uow.ingredientes.get_by_id(ingrediente_id)
    if ing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingrediente no encontrado")
    return IngredienteRead.model_validate(ing)


async def update_ingrediente(
    uow: UnitOfWork, ingrediente_id: int, data: IngredienteUpdate
) -> IngredienteRead:
    ing = await uow.ingredientes.get_by_id(ingrediente_id)
    if ing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingrediente no encontrado")
    if data.nombre is not None:
        ing.nombre = data.nombre
    if data.descripcion is not None:
        ing.descripcion = data.descripcion
    if data.es_alergeno is not None:
        ing.es_alergeno = data.es_alergeno
    ing.actualizado_en = datetime.utcnow()
    updated = await uow.ingredientes.update(ing)
    return IngredienteRead.model_validate(updated)


async def delete_ingrediente(uow: UnitOfWork, ingrediente_id: int) -> None:
    ing = await uow.ingredientes.get_by_id(ingrediente_id)
    if ing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingrediente no encontrado")
    await uow.ingredientes.soft_delete(ing)


# ── Producto ─────────────────────────────────────────────────────────────────

async def list_productos(
    uow: UnitOfWork,
    page: int,
    size: int,
    categoria_id: Optional[int] = None,
    precio_min: Optional[float] = None,
    precio_max: Optional[float] = None,
    disponible: Optional[bool] = None,
    search: Optional[str] = None,
    excluir_alergenos: Optional[list[int]] = None,
) -> PaginatedProductos:
    items, total = await uow.productos.list_paginated(
        page=page,
        size=size,
        categoria_id=categoria_id,
        precio_min=precio_min,
        precio_max=precio_max,
        disponible=disponible,
        search=search,
        excluir_alergenos=excluir_alergenos,
    )
    pages = ceil(total / size) if size else 1
    return PaginatedProductos(
        items=[ProductoRead.model_validate(p) for p in items],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


async def _build_detail(uow: UnitOfWork, producto: Producto) -> ProductoDetail:
    categorias_data = await uow.productos.get_categorias(producto.id)
    ingredientes_data = await uow.productos.get_ingredientes(producto.id)
    return ProductoDetail(
        **ProductoRead.model_validate(producto).model_dump(),
        categorias=[CategoriaResumen(**c) for c in categorias_data],
        ingredientes=[ProductoIngredienteRead(**i) for i in ingredientes_data],
    )


async def get_detail(uow: UnitOfWork, producto_id: int) -> ProductoDetail:
    producto = await uow.productos.get_by_id(producto_id)
    if producto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    return await _build_detail(uow, producto)


async def create(uow: UnitOfWork, data: ProductoCreate) -> ProductoRead:
    for cat_id in data.categoria_ids:
        if await uow.categorias.get_by_id(cat_id) is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Categoría {cat_id} no encontrada",
            )

    producto = await uow.productos.create(
        Producto(
            nombre=data.nombre,
            descripcion=data.descripcion,
            imagen_url=data.imagen_url,
            precio_base=data.precio_base,
            stock_cantidad=data.stock_cantidad,
            disponible=data.disponible,
        )
    )

    if data.categoria_ids:
        await uow.productos.set_categorias(producto.id, data.categoria_ids)

    return ProductoRead.model_validate(producto)


async def update(uow: UnitOfWork, producto_id: int, data: ProductoUpdate) -> ProductoRead:
    producto = await uow.productos.get_by_id(producto_id)
    if producto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    if data.nombre is not None:
        producto.nombre = data.nombre
    if data.descripcion is not None:
        producto.descripcion = data.descripcion
    if data.imagen_url is not None:
        producto.imagen_url = data.imagen_url
    if data.precio_base is not None:
        producto.precio_base = data.precio_base
    if data.stock_cantidad is not None:
        producto.stock_cantidad = data.stock_cantidad
    if data.disponible is not None:
        producto.disponible = data.disponible

    producto.actualizado_en = datetime.utcnow()
    updated = await uow.productos.update(producto)
    return ProductoRead.model_validate(updated)


async def patch_disponibilidad(
    uow: UnitOfWork, producto_id: int, data: DisponibilidadUpdate
) -> ProductoRead:
    producto = await uow.productos.get_by_id(producto_id)
    if producto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    producto.disponible = data.disponible
    producto.actualizado_en = datetime.utcnow()
    updated = await uow.productos.update(producto)
    return ProductoRead.model_validate(updated)


async def delete(uow: UnitOfWork, producto_id: int) -> None:
    producto = await uow.productos.get_by_id(producto_id)
    if producto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    await uow.productos.soft_delete(producto)


async def get_ingredientes_de_producto(
    uow: UnitOfWork, producto_id: int
) -> list[ProductoIngredienteRead]:
    if await uow.productos.get_by_id(producto_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    data = await uow.productos.get_ingredientes(producto_id)
    return [ProductoIngredienteRead(**i) for i in data]


async def add_ingrediente(
    uow: UnitOfWork, producto_id: int, data: AsociarIngredienteRequest
) -> ProductoIngredienteRead:
    if await uow.productos.get_by_id(producto_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    ing = await uow.ingredientes.get_by_id(data.ingrediente_id)
    if ing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingrediente no encontrado")

    if await uow.productos.ingrediente_asociado(producto_id, data.ingrediente_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El ingrediente ya está asociado a este producto",
        )

    await uow.productos.add_ingrediente(producto_id, data.ingrediente_id, data.es_removible)
    return ProductoIngredienteRead(
        ingrediente_id=ing.id,
        nombre=ing.nombre,
        es_alergeno=ing.es_alergeno,
        es_removible=data.es_removible,
    )


async def remove_ingrediente(uow: UnitOfWork, producto_id: int, ingrediente_id: int) -> None:
    if not await uow.productos.ingrediente_asociado(producto_id, ingrediente_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El ingrediente no está asociado a este producto",
        )
    await uow.productos.remove_ingrediente(producto_id, ingrediente_id)


async def assign_categorias(
    uow: UnitOfWork, producto_id: int, data: AssignCategoriasRequest
) -> ProductoDetail:
    producto = await uow.productos.get_by_id(producto_id)
    if producto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    for cat_id in data.categoria_ids:
        if await uow.categorias.get_by_id(cat_id) is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Categoría {cat_id} no encontrada",
            )

    await uow.productos.set_categorias(producto_id, data.categoria_ids)
    return await _build_detail(uow, producto)
