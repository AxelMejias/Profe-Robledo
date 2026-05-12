# Proposal: us-006-pagos

## Qué
Integración con MercadoPago SDK v2: checkout API + webhook IPN para confirmar pedidos. Fix de JWT que no actualizaba el refresh token al rotar.

## Por qué
El flujo de pago real requiere que PENDIENTE→CONFIRMADO ocurra solo cuando MP confirma el pago, nunca desde el cliente directamente.

## Alcance
- `POST /api/v1/pagos/crear` — crea preferencia de pago en MP con idempotency key (CLIENT)
- `POST /api/v1/pagos/webhook` — endpoint público, verifica firma HMAC-SHA256, transiciona PENDIENTE→CONFIRMADO y decrementa stock
- `GET /api/v1/pagos/{pedido_id}` — estado del pago (CLIENT propio / ADMIN)
- Fix: auth/service.py no actualizaba expires_at del refresh token al rotar

## Commit
9f20587 feat(pagos): implementar us-006 — MercadoPago checkout + webhook IPN + reparar JWT no actualizaba los refresh
