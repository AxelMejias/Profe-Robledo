# top-productos Specification

## Purpose
TBD - created by archiving change us-010-historias-faltantes. Update Purpose after archive.
## Requirements
### Requirement: Endpoint top productos más vendidos
`GET /admin/metricas/productos-top` SHALL retornar los 5 productos con mayor cantidad de unidades vendidas (suma de `DetallePedido.cantidad`) excluyendo pedidos en estado `CANCELADO`. Solo accesible para rol `ADMIN`.

#### Scenario: Con pedidos confirmados
- **WHEN** existen pedidos en estados distintos a CANCELADO con detalles
- **THEN** retorna lista de hasta 5 items `{producto_id, nombre, total_vendido}` ordenados DESC por `total_vendido`

#### Scenario: Sin pedidos
- **WHEN** no hay pedidos o todos están cancelados
- **THEN** retorna lista vacía `[]`

#### Scenario: Acceso sin rol ADMIN
- **WHEN** usuario con rol CLIENT o sin token llama el endpoint
- **THEN** retorna 403 Forbidden

### Requirement: Gráfico top productos en dashboard admin
El `Dashboard` de admin SHALL mostrar un `BarChart` (Recharts) con los top 5 productos más vendidos usando los datos de `GET /admin/metricas/productos-top`. Si la lista está vacía, muestra un `EmptyState` con el mensaje "Aún no hay ventas registradas".

#### Scenario: Con datos
- **WHEN** el endpoint retorna productos con ventas
- **THEN** el gráfico muestra barras horizontales con nombre del producto y total vendido

#### Scenario: Sin datos
- **WHEN** el endpoint retorna lista vacía
- **THEN** se muestra `EmptyState` en lugar del gráfico

