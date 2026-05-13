import math
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from fastapi import HTTPException

from app.core.uow import UnitOfWork
from app.modules.pedidos.model import DetallePedido, HistorialEstadoPedido, Pedido
from app.modules.pedidos.schemas import (
    AvanzarEstadoRequest,
    CrearPedidoRequest,
    DetallePedidoRead,
    HistorialRead,
    PedidoDetail,
    PedidoListResponse,
    PedidoRead,
)
from app.modules.usuarios.model import Usuario

# FSM: transitions allowed via PATCH /estado (ADMIN/PEDIDOS only)
_FSM = {
    "PENDIENTE": {"CONFIRMADO", "CANCELADO"},
    "CONFIRMADO": {"EN_PREP", "CANCELADO"},
    "EN_PREP": {"EN_CAMINO", "CANCELADO"},
    "EN_CAMINO": {"ENTREGADO"},
}

_TERMINALES = {"ENTREGADO", "CANCELADO"}


def _roles(usuario: Usuario) -> list[str]:
    return usuario.__dict__.get("_roles", [])


def _es_admin_pedidos(usuario: Usuario) -> bool:
    r = _roles(usuario)
    return "ADMIN" in r or "PEDIDOS" in r


def _to_read(pedido: Pedido) -> PedidoRead:
    return PedidoRead.model_validate(pedido)


async def get_list(
    uow: UnitOfWork,
    page: int,
    size: int,
    current_user: Usuario,
    estado_codigo: Optional[str] = None,
) -> PedidoListResponse:
    usuario_id_filter: Optional[int] = None if _es_admin_pedidos(current_user) else current_user.id
    pedidos, total = await uow.pedidos.list_paginated(page, size, usuario_id_filter, estado_codigo)
    pages = math.ceil(total / size) if size else 1
    return PedidoListResponse(
        items=[_to_read(p) for p in pedidos],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


async def get_detail(
    uow: UnitOfWork,
    pedido_id: int,
    current_user: Usuario,
) -> PedidoDetail:
    pedido = await uow.pedidos.get_by_id(pedido_id)
    if pedido is None:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if not _es_admin_pedidos(current_user) and pedido.usuario_id != current_user.id:
        raise HTTPException(status_code=403, detail="Acceso denegado")

    detalles = await uow.pedidos.get_detalles(pedido_id)
    historial = await uow.pedidos.get_historial(pedido_id)

    return PedidoDetail(
        **_to_read(pedido).model_dump(),
        items=[DetallePedidoRead.model_validate(d) for d in detalles],
        historial=[HistorialRead.model_validate(h) for h in historial],
    )


async def get_historial(
    uow: UnitOfWork,
    pedido_id: int,
    current_user: Usuario,
) -> list[HistorialRead]:
    pedido = await uow.pedidos.get_by_id(pedido_id)
    if pedido is None:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if not _es_admin_pedidos(current_user) and pedido.usuario_id != current_user.id:
        raise HTTPException(status_code=403, detail="Acceso denegado")

    return [HistorialRead.model_validate(h) for h in await uow.pedidos.get_historial(pedido_id)]


async def crear_pedido(
    uow: UnitOfWork,
    data: CrearPedidoRequest,
    current_user: Usuario,
) -> PedidoRead:
    # 1. Validar forma de pago
    if await uow.pedidos.get_forma_pago(data.forma_pago_codigo) is None:
        raise HTTPException(status_code=400, detail="Forma de pago inválida o no habilitada")

    # 2. Validar dirección (si viene)
    direccion_snapshot: Optional[str] = None
    if data.direccion_id is not None:
        direccion = await uow.pedidos.get_direccion_del_usuario(data.direccion_id, current_user.id)
        if direccion is None:
            raise HTTPException(status_code=400, detail="Dirección inválida o no pertenece al usuario")
        partes = [direccion.linea1]
        if direccion.linea2:
            partes.append(direccion.linea2)
        partes.append(f"{direccion.ciudad} {direccion.codigo_postal}")
        if direccion.referencia:
            partes.append(direccion.referencia)
        direccion_snapshot = ", ".join(partes)

    # 3. Validar ítems con SELECT FOR UPDATE (RN-PE04, RN-PE05)
    validados: list[tuple] = []
    for item in data.items:
        producto = await uow.pedidos.get_producto_for_update(item.producto_id)
        if producto is None or producto.eliminado_en is not None:
            raise HTTPException(status_code=400, detail=f"Producto {item.producto_id} no encontrado")
        if not producto.disponible:
            raise HTTPException(status_code=400, detail=f"Producto '{producto.nombre}' no está disponible")
        if producto.stock_cantidad < item.cantidad:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente para '{producto.nombre}' (disponible: {producto.stock_cantidad})",
            )
        validados.append((producto, item))

    # 4. Calcular totales (RN-PE08)
    subtotal = sum(p.precio_base * Decimal(str(i.cantidad)) for p, i in validados)
    costo_envio = Decimal("50.00")
    total = subtotal + costo_envio

    # 5. INSERT Pedido (RN-PE01, RN-PE06)
    pedido = Pedido(
        usuario_id=current_user.id,
        estado_codigo="PENDIENTE",
        direccion_id=data.direccion_id,
        forma_pago_codigo=data.forma_pago_codigo,
        subtotal=subtotal,
        costo_envio=costo_envio,
        total=total,
        direccion_snapshot=direccion_snapshot,
        notas=data.notas,
    )
    pedido = await uow.pedidos.create(pedido)

    # 6. INSERT DetallePedido × N (RN-PE02, RN-PE07)
    for producto, item in validados:
        detalle = DetallePedido(
            pedido_id=pedido.id,
            producto_id=producto.id,
            nombre_snapshot=producto.nombre,
            precio_snapshot=producto.precio_base,
            cantidad=item.cantidad,
            subtotal=producto.precio_base * Decimal(str(item.cantidad)),
            personalizacion=item.personalizacion,
        )
        await uow.pedidos.add_detalle(detalle)

    # 7. Primer historial: estado_desde=None (RN-PE06, RN-FS07)
    await uow.pedidos.add_historial(
        HistorialEstadoPedido(
            pedido_id=pedido.id,
            estado_desde=None,
            estado_hasta="PENDIENTE",
            usuario_id=current_user.id,
        )
    )

    return _to_read(pedido)


async def avanzar_estado(
    uow: UnitOfWork,
    pedido_id: int,
    data: AvanzarEstadoRequest,
    current_user: Usuario,
) -> PedidoRead:
    pedido = await uow.pedidos.get_by_id(pedido_id)
    if pedido is None:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    estado_actual = pedido.estado_codigo
    nuevo_estado = data.nuevo_estado.upper()

    # RN-01: terminales no tienen transiciones salientes
    if estado_actual in _TERMINALES:
        raise HTTPException(status_code=400, detail=f"El pedido está en estado terminal '{estado_actual}'")

    # Validar FSM
    transiciones_validas = _FSM.get(estado_actual, set())
    if nuevo_estado not in transiciones_validas:
        raise HTTPException(
            status_code=400,
            detail=f"Transición inválida: {estado_actual} → {nuevo_estado}",
        )

    # RN-05: motivo obligatorio al cancelar
    if nuevo_estado == "CANCELADO" and not data.motivo:
        raise HTTPException(status_code=400, detail="El motivo es obligatorio al cancelar")

    # RN-FS05: restaurar stock al cancelar desde CONFIRMADO
    if estado_actual == "CONFIRMADO" and nuevo_estado == "CANCELADO":
        for detalle in await uow.pedidos.get_detalles(pedido_id):
            producto = await uow.pedidos.get_producto_for_update(detalle.producto_id)
            if producto is not None:
                producto.stock_cantidad += detalle.cantidad
                uow.pedidos.session.add(producto)

    # Descontar stock al confirmar desde PENDIENTE
    if estado_actual == "PENDIENTE" and nuevo_estado == "CONFIRMADO":
        for detalle in await uow.pedidos.get_detalles(pedido_id):
            producto = await uow.pedidos.get_producto_for_update(detalle.producto_id)
            if producto is not None:
                if producto.stock_cantidad < detalle.cantidad:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Stock insuficiente para '{producto.nombre}' (disponible: {producto.stock_cantidad})",
                    )
                producto.stock_cantidad -= detalle.cantidad
                uow.pedidos.session.add(producto)

    pedido.estado_codigo = nuevo_estado
    pedido.actualizado_en = datetime.utcnow()
    pedido = await uow.pedidos.update(pedido)

    # RN-FS07: historial append-only
    await uow.pedidos.add_historial(
        HistorialEstadoPedido(
            pedido_id=pedido.id,
            estado_desde=estado_actual,
            estado_hasta=nuevo_estado,
            usuario_id=current_user.id,
            motivo=data.motivo,
        )
    )

    return _to_read(pedido)


async def cancelar_pedido(
    uow: UnitOfWork,
    pedido_id: int,
    current_user: Usuario,
) -> PedidoRead:
    pedido = await uow.pedidos.get_by_id(pedido_id)
    if pedido is None:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if pedido.usuario_id != current_user.id:
        raise HTTPException(status_code=403, detail="No podés cancelar un pedido ajeno")
    if pedido.estado_codigo in _TERMINALES:
        raise HTTPException(status_code=400, detail=f"El pedido ya está en estado '{pedido.estado_codigo}'")

    # CLIENT solo puede cancelar desde PENDIENTE (spec: PENDIENTE→CANCELADO para CLIENT)
    if pedido.estado_codigo != "PENDIENTE":
        raise HTTPException(
            status_code=400,
            detail=f"Solo podés cancelar un pedido PENDIENTE (estado actual: {pedido.estado_codigo})",
        )

    estado_anterior = pedido.estado_codigo
    pedido.estado_codigo = "CANCELADO"
    pedido.actualizado_en = datetime.utcnow()
    pedido = await uow.pedidos.update(pedido)

    await uow.pedidos.add_historial(
        HistorialEstadoPedido(
            pedido_id=pedido.id,
            estado_desde=estado_anterior,
            estado_hasta="CANCELADO",
            usuario_id=current_user.id,
            motivo="Cancelado por el cliente",
        )
    )

    return _to_read(pedido)
