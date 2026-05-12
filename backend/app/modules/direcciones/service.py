from datetime import datetime, timezone

from fastapi import HTTPException

from app.core.uow import UnitOfWork
from app.modules.direcciones.model import DireccionEntrega
from app.modules.direcciones.schemas import DireccionCreate, DireccionRead, DireccionUpdate
from app.modules.usuarios.model import Usuario


async def list_direcciones(uow: UnitOfWork, current_user: Usuario) -> list[DireccionRead]:
    return [
        DireccionRead.model_validate(d)
        for d in await uow.direcciones.list_del_usuario(current_user.id)
    ]


async def crear(uow: UnitOfWork, data: DireccionCreate, current_user: Usuario) -> DireccionRead:
    count = await uow.direcciones.count_del_usuario(current_user.id)
    es_principal = count == 0  # RN-DI01: primera dirección es principal automáticamente

    direccion = DireccionEntrega(
        usuario_id=current_user.id,
        alias=data.alias,
        linea1=data.linea1,
        linea2=data.linea2,
        ciudad=data.ciudad,
        codigo_postal=data.codigo_postal,
        referencia=data.referencia,
        es_principal=es_principal,
    )
    return DireccionRead.model_validate(await uow.direcciones.create(direccion))


async def get_one(
    uow: UnitOfWork, direccion_id: int, current_user: Usuario
) -> DireccionRead:
    direccion = await uow.direcciones.get_del_usuario(direccion_id, current_user.id)
    if not direccion:
        raise HTTPException(status_code=404, detail="Dirección no encontrada")
    return DireccionRead.model_validate(direccion)


async def actualizar(
    uow: UnitOfWork, direccion_id: int, data: DireccionUpdate, current_user: Usuario
) -> DireccionRead:
    direccion = await uow.direcciones.get_del_usuario(direccion_id, current_user.id)
    if not direccion:
        raise HTTPException(status_code=404, detail="Dirección no encontrada")

    for campo, valor in data.model_dump(exclude_unset=True).items():
        setattr(direccion, campo, valor)
    direccion.actualizado_en = datetime.utcnow()
    return DireccionRead.model_validate(await uow.direcciones.update(direccion))


async def eliminar(uow: UnitOfWork, direccion_id: int, current_user: Usuario) -> None:
    direccion = await uow.direcciones.get_del_usuario(direccion_id, current_user.id)
    if not direccion:
        raise HTTPException(status_code=404, detail="Dirección no encontrada")
    await uow.direcciones.soft_delete(direccion)


async def marcar_principal(
    uow: UnitOfWork, direccion_id: int, current_user: Usuario
) -> DireccionRead:
    direccion = await uow.direcciones.get_del_usuario(direccion_id, current_user.id)
    if not direccion:
        raise HTTPException(status_code=404, detail="Dirección no encontrada")

    # RN-DI02: desactivar todas, activar solo la seleccionada
    await uow.direcciones.desactivar_todas(current_user.id)
    direccion.es_principal = True
    direccion.actualizado_en = datetime.utcnow()
    return DireccionRead.model_validate(await uow.direcciones.update(direccion))
