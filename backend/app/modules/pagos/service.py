import hashlib
import hmac
import logging
import uuid
from datetime import datetime
from decimal import Decimal

import mercadopago
from fastapi import HTTPException, Request

logger = logging.getLogger(__name__)

from app.core.config import settings
from app.core.uow import UnitOfWork
from app.modules.pagos.model import Pago
from app.modules.pagos.schemas import CrearPagoRequest, PagoRead, PreferenceResponse, WebhookMP
from app.modules.pedidos.model import HistorialEstadoPedido
from app.modules.usuarios.model import Usuario


async def crear_preference(
    uow: UnitOfWork,
    pedido_id: int,
    current_user: Usuario,
) -> PreferenceResponse:
    pedido = await uow.pedidos.get_by_id(pedido_id)
    if pedido is None or pedido.usuario_id != current_user.id:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if pedido.estado_codigo != "PENDIENTE":
        raise HTTPException(status_code=400, detail="Solo se puede pagar un pedido PENDIENTE")

    pago_existente = await uow.pagos.get_by_pedido(pedido_id)
    if pago_existente and pago_existente.mp_status == "approved":
        raise HTTPException(status_code=400, detail="Este pedido ya tiene un pago aprobado")

    idempotency_key = str(uuid.uuid4())
    external_reference = f"pedido-{pedido_id}-{idempotency_key[:8]}"

    sdk = mercadopago.SDK(settings.MP_ACCESS_TOKEN)
    preference_data = {
        "items": [
            {
                "title": f"Pedido #{pedido_id} — Food Store",
                "quantity": 1,
                "unit_price": float(pedido.total),
                "currency_id": "ARS",
            }
        ],
        "external_reference": external_reference,
        "notification_url": settings.MP_NOTIFICATION_URL if settings.MP_NOTIFICATION_URL else None,
        "back_urls": {
            "success": f"{settings.FRONTEND_URL}/pago-exitoso/{pedido_id}",
            "failure": f"{settings.FRONTEND_URL}/pago-rechazado/{pedido_id}",
            "pending": f"{settings.FRONTEND_URL}/pedidos/{pedido_id}",
        },
    }

    result = sdk.preference().create(preference_data)
    logger.warning("MP preference result status=%s response=%s", result.get("status"), result.get("response"))

    response = result.get("response", {})
    mp_status = result.get("status", 0)

    if mp_status not in (200, 201):
        mp_error = response.get("message") or response.get("error") or str(response)
        raise HTTPException(status_code=502, detail=f"MercadoPago error: {mp_error}")

    init_point = response.get("sandbox_init_point" if settings.MP_SANDBOX else "init_point") or response.get("init_point")

    if not init_point:
        raise HTTPException(status_code=502, detail="MercadoPago no devolvió un link de pago")

    await uow.pagos.create(
        Pago(
            pedido_id=pedido_id,
            monto=pedido.total,
            mp_payment_id=None,
            mp_status="pending",
            external_reference=external_reference,
            idempotency_key=idempotency_key,
        )
    )

    return PreferenceResponse(init_point=init_point)


async def crear_pago(
    uow: UnitOfWork,
    data: CrearPagoRequest,
    current_user: Usuario,
) -> PagoRead:
    pedido = await uow.pedidos.get_by_id(data.pedido_id)
    if pedido is None or pedido.usuario_id != current_user.id:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if pedido.estado_codigo != "PENDIENTE":
        raise HTTPException(status_code=400, detail="Solo se puede pagar un pedido PENDIENTE")

    # Verificar que no haya un pago aprobado previo
    pago_existente = await uow.pagos.get_by_pedido(data.pedido_id)
    if pago_existente and pago_existente.mp_status == "approved":
        raise HTTPException(status_code=400, detail="Este pedido ya tiene un pago aprobado")

    idempotency_key = str(uuid.uuid4())
    external_reference = f"pedido-{data.pedido_id}-{idempotency_key[:8]}"

    sdk = mercadopago.SDK(settings.MP_ACCESS_TOKEN)
    payment_data = {
        "transaction_amount": float(pedido.total),
        "token": data.card_token,
        "description": f"Pedido #{data.pedido_id} — Food Store",
        "installments": 1,
        "payment_method_id": data.payment_method_id,
        "payer": {"email": data.payer_email},
        "external_reference": external_reference,
        "notification_url": settings.MP_NOTIFICATION_URL,
    }

    result = sdk.payment().create(payment_data, {"X-Idempotency-Key": idempotency_key})
    response = result.get("response", {})
    mp_status = response.get("status", "pending")
    mp_payment_id = response.get("id")

    if pago_existente:
        pago_existente.mp_payment_id = mp_payment_id
        pago_existente.mp_status = mp_status
        pago_existente.actualizado_en = datetime.utcnow()
        pago = await uow.pagos.update(pago_existente)
    else:
        pago = await uow.pagos.create(
            Pago(
                pedido_id=data.pedido_id,
                monto=pedido.total,
                mp_payment_id=mp_payment_id,
                mp_status=mp_status,
                external_reference=external_reference,
                idempotency_key=idempotency_key,
            )
        )

    return PagoRead.model_validate(pago)


async def get_pago(
    uow: UnitOfWork,
    pedido_id: int,
    current_user: Usuario,
) -> PagoRead:
    pedido = await uow.pedidos.get_by_id(pedido_id)
    if pedido is None:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    roles = current_user.__dict__.get("_roles", [])
    if "ADMIN" not in roles and pedido.usuario_id != current_user.id:
        raise HTTPException(status_code=403, detail="Acceso denegado")

    pago = await uow.pagos.get_by_pedido(pedido_id)
    if pago is None:
        raise HTTPException(status_code=404, detail="No hay pago registrado para este pedido")
    return PagoRead.model_validate(pago)


def _verificar_firma(request: Request, body: WebhookMP, secret: str) -> bool:
    signature_header = request.headers.get("x-signature", "")
    request_id = request.headers.get("x-request-id", "")
    payment_id = str((body.data or {}).get("id", ""))

    parts: dict[str, str] = {}
    for part in signature_header.split(","):
        if "=" in part:
            k, v = part.split("=", 1)
            parts[k.strip()] = v.strip()

    ts = parts.get("ts", "")
    v1 = parts.get("v1", "")
    if not ts or not v1:
        return False

    manifest = f"id:{payment_id};request-id:{request_id};ts:{ts}"
    expected = hmac.new(secret.encode(), manifest.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, v1)


async def procesar_webhook(
    uow: UnitOfWork,
    request: Request,
    body: WebhookMP,
) -> None:
    # Verificar firma si hay secret configurado
    if settings.MP_WEBHOOK_SECRET and not _verificar_firma(request, body, settings.MP_WEBHOOK_SECRET):
        return  # Ignorar silenciosamente — siempre devolver 200

    if body.type != "payment" or not body.data:
        return

    payment_id = str(body.data.get("id", ""))
    if not payment_id:
        return

    # Consultar estado del pago en MP
    sdk = mercadopago.SDK(settings.MP_ACCESS_TOKEN)
    result = sdk.payment().get(payment_id)
    response = result.get("response", {})
    mp_status = response.get("status", "")
    external_reference = response.get("external_reference", "")

    if not external_reference:
        return

    pago = await uow.pagos.get_by_external_reference(external_reference)
    if pago is None:
        return

    # Actualizar estado del pago
    pago.mp_status = mp_status
    pago.mp_payment_id = int(payment_id)
    pago.actualizado_en = datetime.utcnow()
    await uow.pagos.update(pago)

    # RN-FS02: PENDIENTE→CONFIRMADO solo por webhook aprobado
    if mp_status == "approved":
        pedido = await uow.pedidos.get_by_id(pago.pedido_id)
        if pedido and pedido.estado_codigo == "PENDIENTE":
            # RN-FS03: decrementar stock al confirmar
            for detalle in await uow.pedidos.get_detalles(pedido.id):
                producto = await uow.pedidos.get_producto_for_update(detalle.producto_id)
                if producto is not None:
                    producto.stock_cantidad = max(0, producto.stock_cantidad - detalle.cantidad)
                    uow.pedidos.session.add(producto)

            pedido.estado_codigo = "CONFIRMADO"
            pedido.actualizado_en = datetime.utcnow()
            await uow.pedidos.update(pedido)

            # RN-FS07: historial append-only
            await uow.pedidos.add_historial(
                HistorialEstadoPedido(
                    pedido_id=pedido.id,
                    estado_desde="PENDIENTE",
                    estado_hasta="CONFIRMADO",
                    usuario_id=None,
                    motivo="Pago aprobado por MercadoPago",
                )
            )
