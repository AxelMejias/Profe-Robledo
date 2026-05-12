# Proposal: us-003-productos

## Qué
Catálogo de productos con ingredientes (M2M), asociación a categorías, control de stock y soft delete.

## Por qué
Núcleo de la tienda: sin productos no hay carrito ni pedidos.

## Alcance
- `GET /api/v1/productos` — lista paginada, filtro disponible/categoria
- `POST /api/v1/productos` — crear con lista de ingredientes (ADMIN/STOCK)
- `GET /api/v1/productos/{id}` — detalle con ingredientes y categorías
- `PATCH /api/v1/productos/{id}` — actualizar (ADMIN/STOCK)
- `DELETE /api/v1/productos/{id}` — soft delete (ADMIN/STOCK)
- Ingredientes: CRUD propio + tabla pivot producto_ingredientes (es_removible)
- Tabla pivot producto_categorias (es_principal)

## Commit
e988da2 feat(Change 3 productos): implement catalogo con ingredientes y pivots M2M
