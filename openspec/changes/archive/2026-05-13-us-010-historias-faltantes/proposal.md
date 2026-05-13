## Why

El proyecto tiene 9 historias de usuario sin implementar y 16 parciales identificadas en el audit de cobertura pre-presentación. Las más críticas afectan flujos visibles para el evaluador: un usuario no puede cambiar su contraseña, los productos no se pueden filtrar por alérgenos, el admin no puede desactivar usuarios y el dashboard carece del top de productos más vendidos.

## What Changes

- **US-023**: Filtro por alérgenos en catálogo — query param `excluir_alergenos` en `GET /productos` + checkboxes en `FiltrosCatalogo`
- **US-055**: Desactivar/reactivar usuario — campo `activo` en modelo + `PATCH /usuarios/{id}/estado` + botón toggle en `GestionUsuarios`
- **US-058**: Top productos más vendidos — query de agregación en `AdminRepository` + `GET /admin/metricas/productos-top` + gráfico en dashboard
- **US-063**: Cambio de contraseña — `PUT /auth/me/password` con validación de contraseña actual + form en perfil del cliente
- **US-070**: Notificación de precio actualizado pre-checkout — `POST /carrito/validar` extendido para retornar advertencias de cambio de precio + alerta en `CartDrawer`

## Capabilities

### New Capabilities

- `filtro-alergenos`: Filtrado de catálogo excluyendo productos con determinados alérgenos
- `desactivar-usuario`: Activación/desactivación de cuentas de usuario por ADMIN, con bloqueo de login para usuarios inactivos
- `top-productos`: Métrica de top 5 productos más vendidos por cantidad de unidades en el admin dashboard
- `cambio-password`: Endpoint autenticado para cambiar contraseña validando la actual primero
- `validacion-precios`: Extensión del endpoint de validación de carrito para detectar y advertir cambios de precio desde que se agregaron los ítems

### Modified Capabilities

- `frontend-catalogo`: Agregar checkboxes de alérgenos en `FiltrosCatalogo` y pasar `excluir_alergenos` al hook `useProductos`
- `frontend-admin`: Agregar botón toggle activo/inactivo en `GestionUsuarios` y gráfico top productos en `Dashboard`
- `frontend-perfil`: Agregar form de cambio de contraseña en `PerfilPage`
- `frontend-carrito`: Mostrar advertencia de precio actualizado en `CartDrawer` cuando `validar` detecte cambios

## Impact

**Backend:**
- `app/modules/usuarios/model.py` — campo `activo: bool = True`
- `app/modules/usuarios/router.py` y `service.py` — `PATCH /usuarios/{id}/estado`
- `app/modules/auth/service.py` — verificar `usuario.activo` en login + nuevo `change_password`
- `app/modules/auth/router.py` y `schemas.py` — `PUT /auth/me/password`
- `app/modules/productos/repository.py` y `service.py` — query param `excluir_alergenos: list[int]`
- `app/modules/admin/repository.py` y `service.py` — `get_top_productos`
- `app/modules/admin/router.py` y `schemas.py` — `GET /admin/metricas/productos-top`
- `app/modules/carrito/service.py` — retornar advertencias de precio
- `alembic/versions/` — migración para columna `activo` en `usuarios`

**Frontend:**
- `frontend/src/entities/usuario/api.ts` — `toggleEstado`
- `frontend/src/entities/admin/api.ts` — `fetchTopProductos`
- `frontend/src/entities/producto/api.ts` — parámetro `excluir_alergenos`
- `frontend/src/features/admin/components/GestionUsuarios.tsx` — botón toggle
- `frontend/src/features/admin/components/Dashboard.tsx` — gráfico top productos
- `frontend/src/features/store/components/FiltrosCatalogo.tsx` — checkboxes alérgenos
- `frontend/src/features/store/components/CartDrawer.tsx` — advertencia de precio
- `frontend/src/features/perfil/components/PerfilUsuario.tsx` — form cambio de contraseña

**Migraciones:** 1 migración nueva (columna `activo` en `usuarios`)
**Breaking changes:** ninguno — solo adiciones y extensiones
