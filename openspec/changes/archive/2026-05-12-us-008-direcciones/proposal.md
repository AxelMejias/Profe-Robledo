# Proposal: us-008-direcciones

## Qué
CRUD de direcciones de entrega por usuario con soporte de dirección principal única.

## Por qué
El pedido necesita una dirección de entrega. RN-DI01: la primera dirección creada es principal automáticamente. RN-DI02: solo puede haber una principal por usuario.

## Alcance
- `GET /api/v1/direcciones` — lista del usuario autenticado
- `POST /api/v1/direcciones` — crear (RN-DI01: primera = principal)
- `GET /api/v1/direcciones/{id}` — detalle (solo propia)
- `PATCH /api/v1/direcciones/{id}` — actualizar campos
- `PATCH /api/v1/direcciones/{id}/principal` — marcar como principal (RN-DI02: desactiva las demás)
- `DELETE /api/v1/direcciones/{id}` — soft delete, retorna 204

## Commit
b15e857 feat(direcciones): implementar us-008 — CRUD direcciones, RN-DI01/02/03
