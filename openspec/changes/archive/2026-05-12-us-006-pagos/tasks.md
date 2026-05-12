# Tasks: us-006-pagos

- [x] model.py — Pago(id, pedido_id FK, monto, mp_payment_id, mp_status, external_reference, idempotency_key, timestamps)
- [x] schemas.py — CrearPagoRequest, PagoRead, WebhookMP
- [x] repository.py — PagoRepository: get_by_pedido, get_by_external_reference
- [x] service.py — crear_pago (idempotency_key uuid, MP SDK), _verificar_firma (HMAC-SHA256 x-signature header), procesar_webhook (RN-FS02 PENDIENTE→CONFIRMADO, RN-FS03 stock decrement)
- [x] router.py — POST /crear (201), POST /webhook (200 siempre), GET /{pedido_id}
- [x] config.py — agregar MP_WEBHOOK_SECRET
- [x] uow.py — registrar PagoRepository como self.pagos
