from typing import Optional

from fastapi import APIRouter, Depends, Query, Response, status

from app.core.deps import require_role
from app.core.uow import UnitOfWork
from app.modules.productos import service as prod_service
from app.modules.productos.schemas import (
    AsociarIngredienteRequest,
    AssignCategoriasRequest,
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
from app.modules.usuarios.model import Usuario

router = APIRouter(prefix="/productos", tags=["productos"])
ingredientes_router = APIRouter(prefix="/ingredientes", tags=["ingredientes"])


# ── Ingredientes (standalone) ────────────────────────────────────────────────

@ingredientes_router.get("", response_model=list[IngredienteRead])
async def list_ingredientes() -> list[IngredienteRead]:
    async with UnitOfWork() as uow:
        return await prod_service.list_ingredientes(uow)


@ingredientes_router.get("/{ingrediente_id}", response_model=IngredienteRead)
async def get_ingrediente(ingrediente_id: int) -> IngredienteRead:
    async with UnitOfWork() as uow:
        return await prod_service.get_ingrediente(uow, ingrediente_id)


@ingredientes_router.post("", response_model=IngredienteRead, status_code=status.HTTP_201_CREATED)
async def create_ingrediente(
    body: IngredienteCreate,
    _: Usuario = Depends(require_role(["ADMIN", "STOCK"])),
) -> IngredienteRead:
    async with UnitOfWork() as uow:
        return await prod_service.create_ingrediente(uow, body)


@ingredientes_router.put("/{ingrediente_id}", response_model=IngredienteRead)
async def update_ingrediente(
    ingrediente_id: int,
    body: IngredienteUpdate,
    _: Usuario = Depends(require_role(["ADMIN", "STOCK"])),
) -> IngredienteRead:
    async with UnitOfWork() as uow:
        return await prod_service.update_ingrediente(uow, ingrediente_id, body)


@ingredientes_router.delete("/{ingrediente_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ingrediente(
    ingrediente_id: int,
    _: Usuario = Depends(require_role(["ADMIN", "STOCK"])),
) -> Response:
    async with UnitOfWork() as uow:
        await prod_service.delete_ingrediente(uow, ingrediente_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ── Productos ────────────────────────────────────────────────────────────────

@router.get("", response_model=PaginatedProductos)
async def list_productos(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    categoria_id: Optional[int] = None,
    precio_min: Optional[float] = None,
    precio_max: Optional[float] = None,
    disponible: Optional[bool] = None,
    search: Optional[str] = None,
    excluir_alergenos: Optional[list[int]] = Query(None),
) -> PaginatedProductos:
    async with UnitOfWork() as uow:
        return await prod_service.list_productos(uow, page, size, categoria_id, precio_min, precio_max, disponible, search, excluir_alergenos)


@router.get("/{producto_id}", response_model=ProductoDetail)
async def get_detail(producto_id: int) -> ProductoDetail:
    async with UnitOfWork() as uow:
        return await prod_service.get_detail(uow, producto_id)


@router.post("", response_model=ProductoRead, status_code=status.HTTP_201_CREATED)
async def create(
    body: ProductoCreate,
    _: Usuario = Depends(require_role(["ADMIN", "STOCK"])),
) -> ProductoRead:
    async with UnitOfWork() as uow:
        return await prod_service.create(uow, body)


@router.put("/{producto_id}", response_model=ProductoRead)
async def update(
    producto_id: int,
    body: ProductoUpdate,
    _: Usuario = Depends(require_role(["ADMIN", "STOCK"])),
) -> ProductoRead:
    async with UnitOfWork() as uow:
        return await prod_service.update(uow, producto_id, body)


@router.patch("/{producto_id}/disponibilidad", response_model=ProductoRead)
async def patch_disponibilidad(
    producto_id: int,
    body: DisponibilidadUpdate,
    _: Usuario = Depends(require_role(["ADMIN", "STOCK"])),
) -> ProductoRead:
    async with UnitOfWork() as uow:
        return await prod_service.patch_disponibilidad(uow, producto_id, body)


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    producto_id: int,
    _: Usuario = Depends(require_role(["ADMIN"])),
) -> Response:
    async with UnitOfWork() as uow:
        await prod_service.delete(uow, producto_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{producto_id}/ingredientes", response_model=list[ProductoIngredienteRead])
async def get_ingredientes(producto_id: int) -> list[ProductoIngredienteRead]:
    async with UnitOfWork() as uow:
        return await prod_service.get_ingredientes_de_producto(uow, producto_id)


@router.post(
    "/{producto_id}/ingredientes",
    response_model=ProductoIngredienteRead,
    status_code=status.HTTP_201_CREATED,
)
async def add_ingrediente(
    producto_id: int,
    body: AsociarIngredienteRequest,
    _: Usuario = Depends(require_role(["ADMIN"])),
) -> ProductoIngredienteRead:
    async with UnitOfWork() as uow:
        return await prod_service.add_ingrediente(uow, producto_id, body)


@router.delete(
    "/{producto_id}/ingredientes/{ingrediente_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_ingrediente(
    producto_id: int,
    ingrediente_id: int,
    _: Usuario = Depends(require_role(["ADMIN"])),
) -> Response:
    async with UnitOfWork() as uow:
        await prod_service.remove_ingrediente(uow, producto_id, ingrediente_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/{producto_id}/categorias", response_model=ProductoDetail)
async def assign_categorias(
    producto_id: int,
    body: AssignCategoriasRequest,
    _: Usuario = Depends(require_role(["ADMIN", "STOCK"])),
) -> ProductoDetail:
    async with UnitOfWork() as uow:
        return await prod_service.assign_categorias(uow, producto_id, body)
