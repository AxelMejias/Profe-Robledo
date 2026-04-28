from fastapi import APIRouter

router = APIRouter(prefix="/pagos", tags=["pagos"])

# TODO: implementar en change us-006-pagos-mercadopago
# POST /crear         (CLIENT)
# POST /webhook       (público — IPN MercadoPago)
# GET  /{pedido_id}   (propietario/ADMIN)
