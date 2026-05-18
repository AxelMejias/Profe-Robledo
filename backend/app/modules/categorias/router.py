from fastapi import APIRouter, Depends, Response, status

from app.core.deps import require_role
from app.core.uow import UnitOfWork
from app.modules.categorias import service as cat_service
from app.modules.categorias.schemas import (
    CategoriaCreate,
    CategoriaRead,
    CategoriaTree,
    CategoriaUpdate,
)
from app.modules.usuarios.model import Usuario

router = APIRouter(prefix="/categorias", tags=["categorias"])


@router.get("", response_model=list[CategoriaRead])
async def list_flat() -> list[CategoriaRead]:
    async with UnitOfWork() as uow:
        return await cat_service.get_flat(uow)


@router.get("/tree", response_model=list[CategoriaTree])
async def list_tree() -> list[CategoriaTree]:
    async with UnitOfWork() as uow:
        return await cat_service.get_tree(uow)


@router.get("/{categoria_id}", response_model=CategoriaRead)
async def get_one(categoria_id: int) -> CategoriaRead:
    async with UnitOfWork() as uow:
        return await cat_service.get_by_id(uow, categoria_id)


@router.post("", response_model=CategoriaRead, status_code=status.HTTP_201_CREATED)
async def create(
    body: CategoriaCreate,
    _: Usuario = Depends(require_role(["ADMIN", "STOCK"])),
) -> CategoriaRead:
    async with UnitOfWork() as uow:
        return await cat_service.create(uow, body)


@router.put("/{categoria_id}", response_model=CategoriaRead)
async def update(
    categoria_id: int,
    body: CategoriaUpdate,
    _: Usuario = Depends(require_role(["ADMIN", "STOCK"])),
) -> CategoriaRead:
    async with UnitOfWork() as uow:
        return await cat_service.update(uow, categoria_id, body)


@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    categoria_id: int,
    _: Usuario = Depends(require_role(["ADMIN", "STOCK"])),
) -> Response:
    async with UnitOfWork() as uow:
        await cat_service.delete(uow, categoria_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
