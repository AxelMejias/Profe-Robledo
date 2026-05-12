# Proposal: us-002-categorias

## Qué
CRUD completo de categorías con soporte de jerarquía recursiva (parent_id).

## Por qué
Los productos necesitan estar organizados en categorías para que el cliente pueda navegar la tienda.

## Alcance
- `GET /api/v1/categorias` — lista paginada, filtro por parent_id
- `POST /api/v1/categorias` — crear (ADMIN/STOCK)
- `GET /api/v1/categorias/{id}` — detalle
- `PATCH /api/v1/categorias/{id}` — actualizar (ADMIN/STOCK)
- `DELETE /api/v1/categorias/{id}` — soft delete (ADMIN/STOCK)

## Commit
1ebc571 feat(Change 2 Categorias): implement CRUD categorias con jerarquia recursiva
