# Proposal: us-005-pedidos

## Qué
Ciclo de vida completo de pedidos: crear, avanzar estados con FSM, cancelar, historial append-only.

## Por qué
Núcleo transaccional de la app. Requiere atomicidad (UoW), control de stock con SELECT FOR UPDATE, y snapshots inmutables de precio/nombre.

## Alcance
- `GET /api/v1/pedidos` — lista paginada (CLIENT ve solo los suyos, ADMIN/PEDIDOS ven todos)
- `POST /api/v1/pedidos` — crear pedido con items (CLIENT)
- `GET /api/v1/pedidos/{id}` — detalle con items e historial
- `PATCH /api/v1/pedidos/{id}/estado` — avanzar FSM (ADMIN/PEDIDOS)
- `DELETE /api/v1/pedidos/{id}` — cancelar desde PENDIENTE (CLIENT)
- `GET /api/v1/pedidos/{id}/historial` — historial append-only

## FSM
PENDIENTE → CONFIRMADO (solo webhook) | CANCELADO  
CONFIRMADO → EN_PREP | CANCELADO  
EN_PREP → EN_CAMINO | CANCELADO  
EN_CAMINO → ENTREGADO  
ENTREGADO / CANCELADO → terminales

## Commit
14c2917 feat(pedidos): implementar us-005 — FSM pedidos, UoW atómico, stock FOR UPDATE
