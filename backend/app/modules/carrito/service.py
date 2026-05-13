from decimal import Decimal

from app.core.uow import UnitOfWork
from app.modules.carrito.schemas import (
    ItemCarritoValidado,
    ValidarCarritoRequest,
    ValidarCarritoResponse,
)


async def validar(uow: UnitOfWork, data: ValidarCarritoRequest) -> ValidarCarritoResponse:
    """
    Valida cada ítem del carrito: existencia, disponibilidad y stock.
    Devuelve precios actuales para que el frontend detecte cambios.
    Esta lógica es reutilizada por el servicio de pedidos al crear la orden.
    """
    items_validados: list[ItemCarritoValidado] = []
    errores: list[str] = []
    advertencias: list[str] = []
    subtotal = Decimal("0")

    for item in data.items:
        producto = await uow.productos.get_by_id(item.producto_id)

        if producto is None:
            errores.append(f"Producto {item.producto_id} no encontrado")
            items_validados.append(
                ItemCarritoValidado(
                    producto_id=item.producto_id,
                    nombre="Desconocido",
                    precio_unitario=Decimal("0"),
                    cantidad=item.cantidad,
                    subtotal=Decimal("0"),
                    disponible=False,
                    stock_suficiente=False,
                    error="Producto no encontrado",
                )
            )
            continue

        if item.precio is not None and float(item.precio) != float(producto.precio_base):
            advertencias.append(
                f"El precio de '{producto.nombre}' cambió de ${item.precio} a ${producto.precio_base}"
            )

        disponible = producto.disponible
        stock_ok = producto.stock_cantidad >= item.cantidad
        item_subtotal = producto.precio_base * item.cantidad

        error_msg: str | None = None
        if not disponible:
            error_msg = f"'{producto.nombre}' no está disponible"
            errores.append(error_msg)
        elif not stock_ok:
            error_msg = (
                f"'{producto.nombre}': stock insuficiente "
                f"(disponible: {producto.stock_cantidad}, pedido: {item.cantidad})"
            )
            errores.append(error_msg)
        else:
            subtotal += item_subtotal

        items_validados.append(
            ItemCarritoValidado(
                producto_id=producto.id,
                nombre=producto.nombre,
                precio_unitario=producto.precio_base,
                cantidad=item.cantidad,
                subtotal=item_subtotal,
                disponible=disponible,
                stock_suficiente=stock_ok,
                error=error_msg,
            )
        )

    return ValidarCarritoResponse(
        valido=len(errores) == 0,
        items=items_validados,
        subtotal=subtotal,
        errores=errores,
        advertencias=advertencias,
    )
