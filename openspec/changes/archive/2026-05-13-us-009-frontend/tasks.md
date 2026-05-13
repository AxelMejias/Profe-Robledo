# Tasks: us-009-frontend — Frontend Completo FSD

## 1. Estructura y Configuración Base

- [x] 1.1 Crear estructura de carpetas FSD completa: `src/{app,pages,widgets,features,entities,shared}`
- [x] 1.2 Configurar React Router DOM v6 en `app/router.tsx` con rutas stub (sin componentes todavía)
- [x] 1.3 Actualizar `package.json` agregando `react-router-dom`, `@tanstack/react-form`, `@mercadopago/sdk-react`
- [x] 1.4 Extender `tailwind.config.js` con tema custom (colores primary/secondary/danger, fuente Inter)
- [x] 1.5 Crear `app/providers.tsx` envolviendo QueryClientProvider + Router + ErrorBoundary
- [x] 1.6 Reemplazar `app/App.tsx` con estructura FSD y RouterProvider

## 2. Shared Layer — Infraestructura

- [x] 2.1 Crear tipos TypeScript en `shared/types/`: Usuario, Producto, Categoria, Pedido, DetallePedido, Pago, DireccionEntrega, EstadoPedido, FormaPago
- [x] 2.2 Verificar `shared/api/axios.ts` — interceptor JWT y refresh automático (ya existe, validar comportamiento)
- [x] 2.3 Ajustar `shared/store/authStore.ts` — agregar `hasRole(role)` helper si no existe
- [x] 2.4 Verificar `shared/store/cartStore.ts` — métodos `addItem`, `removeItem`, `updateCantidad`, `clearCart`, selectores `subtotal()`, `total()`, `itemCount()`
- [x] 2.5 Verificar `shared/store/paymentStore.ts` — estados idle/processing/approved/rejected, métodos `setPaymentStatus`, `reset`
- [x] 2.6 Verificar `shared/store/uiStore.ts` — estados cartOpen, sidebarOpen, toasts, métodos `openCart`, `closeCart`, `addToast`, `removeToast`
- [x] 2.7 Crear componentes UI base en `shared/ui/`: Button, Input, Modal, Toast, Skeleton, EmptyState, Badge

## 3. Entities — Hooks TanStack Query

- [x] 3.1 Crear `entities/producto/api.ts` con funciones `fetchProductos`, `fetchProductoById`, `createProducto`, `updateProducto`, `deleteProducto`, `updateStock`
- [x] 3.2 Crear `entities/producto/hooks.ts` con `useProductos(filters)`, `useProducto(id)`, `useCreateProducto`, `useUpdateProducto`, `useDeleteProducto`, `useUpdateStock`
- [x] 3.3 Crear `entities/categoria/api.ts` y `hooks.ts` con `useCategorias`, `useCreateCategoria`, etc.
- [x] 3.4 Crear `entities/pedido/api.ts` y `hooks.ts` con `usePedidos(filters)`, `usePedido(id)`, `useCreatePedido`, `useAvanzarEstado`, `useCancelarPedido`
- [x] 3.5 Crear `entities/pago/api.ts` y `hooks.ts` con `useCrearPago`, `usePagosByPedido`
- [x] 3.6 Crear `entities/direccion/api.ts` y `hooks.ts` con `useDirecciones`, `useCreateDireccion`, `useUpdateDireccion`, `useDeleteDireccion`, `useMarcarPrincipal`
- [x] 3.7 Crear `entities/usuario/api.ts` y `hooks.ts` con `useUsuarios` (admin), `useUpdateUsuario`, `useUpdateRoles`
- [x] 3.8 Crear `entities/admin/api.ts` y `hooks.ts` con `useKPIs`, `useMetricasPorEstado`, `useIngresos7Dias`

## 4. Feature: Auth

- [x] 4.1 Crear `features/auth/components/LoginForm.tsx` — TanStack Form con validación, llamada a `POST /auth/login`, guarda tokens en authStore
- [x] 4.2 Crear `features/auth/components/RegisterForm.tsx` — TanStack Form con validación (email, contraseña >= 8), llamada a `POST /auth/register`
- [x] 4.3 Crear `features/auth/components/ProtectedRoute.tsx` — HOC que verifica `authStore.isAuthenticated`, redirige a `/login?redirect=<ruta>` si false
- [x] 4.4 Crear `features/auth/components/RoleGuard.tsx` — HOC que verifica `authStore.hasRole(roles)`, muestra 403 si false
- [x] 4.5 Implementar logout en header: botón que llama `POST /auth/logout` + `authStore.logout()` + redirige a `/login`

## 5. Feature: Store (Catálogo)

- [x] 5.1 Crear `features/store/components/CatalogoGrid.tsx` — grid responsive con `useProductos`, paginación, skeleton loaders
- [x] 5.2 Crear `features/store/components/ProductoCard.tsx` — card con imagen, nombre, precio, botón "Agregar" (llama `cartStore.addItem`)
- [x] 5.3 Crear `features/store/components/FiltrosCatalogo.tsx` — sidebar con filtro por categoría (usa `useCategorias`), búsqueda con debounce 500ms, slider rango de precio
- [x] 5.4 Crear `features/store/components/ProductoDetalle.tsx` — detalle completo con `useProducto(id)`, ingredientes con badge alérgeno, botón agregar con personalización
- [x] 5.5 Crear `features/store/components/PersonalizacionModal.tsx` — modal para seleccionar ingredientes a excluir (checkboxes)
- [x] 5.6 Crear `features/store/components/CartDrawer.tsx` — drawer lateral con lista de items, botones +/-, subtotal, envío, total, botones "Validar" y "Crear pedido"
- [x] 5.7 Implementar validación de carrito: botón "Validar stock" llama `POST /carrito/validar`, muestra errores si `valido = false`

## 6. Feature: Pedidos

- [x] 6.1 Crear `features/pedidos/components/PedidosList.tsx` — listado con `usePedidos`, filtro por estado (admin), paginación, cards con número, fecha, estado badge, total
- [x] 6.2 Crear `features/pedidos/components/PedidoDetalle.tsx` — detalle completo con `usePedido(id)`, items con snapshots, dirección snapshot, totales
- [x] 6.3 Crear `features/pedidos/components/PedidoTimeline.tsx` — timeline vertical del FSM con íconos y colores por estado, muestra fecha y usuario responsable de cada transición
- [x] 6.4 Crear `features/pedidos/components/CrearPedidoForm.tsx` — formulario con selección de dirección (usa `useDirecciones`), forma de pago, botón "Crear pedido" llama `useCreatePedido`
- [x] 6.5 Implementar cancelación de pedido: botón "Cancelar" con confirmación, llama `useCancelarPedido`, valida estado permitido
- [x] 6.6 Implementar avance de estado (admin/gestor): botón "Avanzar estado" llama `useAvanzarEstado`, valida transición FSM
- [x] 6.7 Agregar polling cada 30s en PedidoDetalle para detectar cambios de estado (útil después de pago MP)

## 7. Feature: Direcciones

- [x] 7.1 Crear `features/direcciones/components/ListaDirecciones.tsx` — listado con `useDirecciones`, badge "Principal", botones editar/eliminar/marcar principal
- [x] 7.2 Crear `features/direcciones/components/FormDireccion.tsx` — TanStack Form con campos (alias, linea1 requerida, linea2, ciudad, código postal, referencia), validación client-side
- [x] 7.3 Crear `features/direcciones/components/SeleccionarDireccion.tsx` — modal/drawer con lista de direcciones, principal preseleccionada, botón "Agregar nueva" inline
- [x] 7.4 Implementar CRUD completo: `useCreateDireccion`, `useUpdateDireccion`, `useDeleteDireccion` con confirmación, `useMarcarPrincipal`

## 8. Feature: Pagos (MercadoPago)

- [x] 8.1 Inicializar MP SDK en `features/pagos/lib/initMP.ts` con `initMercadoPago(VITE_MP_PUBLIC_KEY)`
- [x] 8.2 Crear `features/pagos/components/CheckoutMP.tsx` — componente `<CardPayment>` con `amount`, `onSubmit` llama `POST /pagos/crear` con token
- [x] 8.3 Crear `features/pagos/components/EstadoPago.tsx` — muestra estado del pago (processing/approved/rejected) con íconos y colores
- [x] 8.4 Implementar polling de estado: después de `POST /pagos/crear`, hacer polling cada 5s a `GET /pedidos/:id` hasta detectar CONFIRMADO o timeout 2min
- [x] 8.5 Crear pantalla de confirmación de pago exitoso con animación, número de pedido, botón "Ver detalle"
- [x] 8.6 Crear pantalla de pago rechazado con mensaje de error, botón "Reintentar"
- [x] 8.7 Agregar `features/pagos/components/HistorialPagos.tsx` — tabla con intentos de pago por pedido (usa `usePagosByPedido`)

## 9. Feature: Perfil

- [x] 9.1 Crear `features/perfil/components/PerfilUsuario.tsx` — muestra datos de `authStore.user` (nombre, email, roles badges, fecha registro)
- [x] 9.2 Crear `features/perfil/components/EditarPerfilForm.tsx` — TanStack Form para editar nombre, apellido, teléfono (email deshabilitado), llama `PATCH /usuarios/me`
- [x] 9.3 Agregar sección "Mis pedidos recientes" en perfil con últimos 3 pedidos (usa `usePedidos` con limit=3), link "Ver todos"
- [x] 9.4 Agregar link "Mis direcciones de entrega" que redirige a `/perfil/direcciones`

## 10. Feature: Admin

- [x] 10.1 Crear `features/admin/components/Dashboard.tsx` — 4 KPI cards (total pedidos, ingresos hoy, pendientes, sin stock) con `useKPIs`
- [x] 10.2 Crear `features/admin/components/GraficoIngresos7Dias.tsx` — Recharts LineChart con `useIngresos7Dias`
- [x] 10.3 Crear `features/admin/components/GraficoPedidosPorEstado.tsx` — Recharts BarChart con `useMetricasPorEstado`
- [x] 10.4 Crear `features/admin/components/GestionProductos.tsx` — tabla con todos los productos (admin view), botones nuevo/editar/eliminar
- [x] 10.5 Crear `features/admin/components/FormProducto.tsx` — TanStack Form con todos los campos, selección M2M de categorías e ingredientes
- [x] 10.6 Crear `features/admin/components/GestionCategorias.tsx` — árbol jerárquico expandible, botones nuevo/editar/eliminar, validación de ciclos
- [x] 10.7 Crear `features/admin/components/FormCategoria.tsx` — TanStack Form con nombre, descripción, parent selector (dropdown con árbol)
- [x] 10.8 Crear `features/admin/components/GestionUsuarios.tsx` — tabla con usuarios, badges de roles, botones editar roles/desactivar
- [x] 10.9 Crear `features/admin/components/EditarRolesModal.tsx` — checkboxes para roles ADMIN/STOCK/PEDIDOS/CLIENT, validación RN-RB04 (último ADMIN)
- [x] 10.10 Crear `features/admin/components/GestionStock.tsx` — tabla con productos y stock actual, input para ajustar cantidad, botón guardar llama `useUpdateStock`
- [x] 10.11 Crear `features/admin/components/GestionPedidos.tsx` — listado de todos los pedidos con filtros avanzados, botón "Avanzar estado" por pedido

## 11. Pages — Routing Completo

- [x] 11.1 Crear `pages/HomePage.tsx` — landing page con hero + categorías destacadas + link al catálogo
- [x] 11.2 Crear `pages/CatalogoPage.tsx` — renderiza `<FiltrosCatalogo>` + `<CatalogoGrid>`
- [x] 11.3 Crear `pages/ProductoDetallePage.tsx` — renderiza `<ProductoDetalle>` con id de params
- [x] 11.4 Crear `pages/CarritoPage.tsx` — renderiza `<CartDrawer>` abierto por defecto (alternativa a drawer lateral)
- [x] 11.5 Crear `pages/PedidosPage.tsx` — renderiza `<PedidosList>` con `<ProtectedRoute>`
- [x] 11.6 Crear `pages/PedidoDetallePage.tsx` — renderiza `<PedidoDetalle>` + `<PedidoTimeline>` con `<ProtectedRoute>`
- [x] 11.7 Crear `pages/CheckoutPage.tsx` — renderiza `<CrearPedidoForm>` (selección dirección + forma de pago) con `<ProtectedRoute>`
- [x] 11.8 Crear `pages/PagoMPPage.tsx` — renderiza `<CheckoutMP>` con `<ProtectedRoute>`
- [x] 11.9 Crear `pages/PerfilPage.tsx` — renderiza `<PerfilUsuario>` + `<EditarPerfilForm>` con `<ProtectedRoute>`
- [x] 11.10 Crear `pages/DireccionesPage.tsx` — renderiza `<ListaDirecciones>` con `<ProtectedRoute>`
- [x] 11.11 Crear `pages/admin/AdminLayout.tsx` — layout con sidebar de admin, rutas anidadas, `<RoleGuard roles={["ADMIN"]}>`
- [x] 11.12 Crear `pages/admin/DashboardPage.tsx` — renderiza `<Dashboard>` + gráficos
- [x] 11.13 Crear `pages/admin/ProductosAdminPage.tsx` — renderiza `<GestionProductos>`
- [x] 11.14 Crear `pages/admin/CategoriasAdminPage.tsx` — renderiza `<GestionCategorias>`
- [x] 11.15 Crear `pages/admin/UsuariosAdminPage.tsx` — renderiza `<GestionUsuarios>`
- [x] 11.16 Crear `pages/admin/StockAdminPage.tsx` — renderiza `<GestionStock>`
- [x] 11.17 Crear `pages/admin/PedidosAdminPage.tsx` — renderiza `<GestionPedidos>`
- [x] 11.18 Crear `pages/LoginPage.tsx` — renderiza `<LoginForm>`, redirige a redirect query param tras login exitoso
- [x] 11.19 Crear `pages/RegisterPage.tsx` — renderiza `<RegisterForm>`
- [x] 11.20 Crear `pages/NotFoundPage.tsx` — página 404 con link a home

## 12. Widgets — Composición de Features

- [x] 12.1 Crear `widgets/CheckoutFlow.tsx` — wizard multi-step: (1) validar carrito, (2) seleccionar dirección, (3) seleccionar forma de pago, (4) confirmar y crear pedido
- [x] 12.2 Crear `widgets/Navigation.tsx` — navbar responsive con logo, menú adaptado por rol (usa `authStore.hasRole`), badge del carrito, botón user + dropdown
- [x] 12.3 Crear `widgets/Sidebar.tsx` — drawer lateral para mobile con menú de navegación

## 13. Polish — UX y Responsivo

- [x] 13.1 Agregar skeleton loaders en todas las listas (productos, pedidos, usuarios)
- [x] 13.2 Agregar empty states en listas vacías con ilustración + mensaje + CTA
- [x] 13.3 Implementar toast notifications globales con `uiStore` (success/error/info, auto-dismiss 5s)
- [x] 13.4 Implementar error boundary global en `app/App.tsx` para capturar errores React no manejados
- [x] 13.5 Agregar confirmación modal antes de acciones destructivas (eliminar producto, cancelar pedido, eliminar dirección)
- [x] 13.6 Implementar optimistic updates en mutaciones críticas (agregar al carrito, cancelar pedido)
- [x] 13.7 Verificar responsive en breakpoints Tailwind: mobile (< 640px), tablet (640-1024px), desktop (> 1024px)
- [x] 13.8 Ajustar navegación para mobile: drawer lateral con menú hamburguesa, carrito en drawer
- [x] 13.9 Optimizar imágenes de productos: lazy loading con `loading="lazy"`, placeholder mientras carga
- [x] 13.10 Agregar transiciones suaves en modales, drawers y toasts con Tailwind transitions

## 14. Verificación Final

- [x] 14.1 Verificar que `npm run build` compila sin errores TypeScript
- [x] 14.2 Verificar que bundle size es < 500KB gzipped (analizar con `vite-plugin-bundle-analyzer`)
- [x] 14.3 Probar flujo completo end-to-end: register → login → navegar catálogo → agregar al carrito → validar → seleccionar dirección → crear pedido → ver en Mis Pedidos
- [x] 14.4 Probar flujo de pago MP con tarjeta de prueba: checkout → tokenización → crear pago → polling de estado → confirmación
- [x] 14.5 Probar rutas protegidas: acceso sin auth redirige a login, acceso sin rol muestra 403
- [x] 14.6 Probar refresh de página en rutas protegidas: authStore persiste tokens y recarga usuario
- [x] 14.7 Probar panel admin: ver KPIs, gráficos, CRUD productos, CRUD categorías, gestión usuarios, avanzar estados de pedidos
- [x] 14.8 Verificar responsivo en Chrome DevTools: mobile (iPhone SE), tablet (iPad), desktop (1920x1080)
- [x] 14.9 Corregir warnings de consola (React keys, propTypes, deprecations)
- [x] 14.10 Eliminar `console.log` de debug del código
