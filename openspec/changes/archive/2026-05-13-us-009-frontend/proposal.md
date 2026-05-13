# Proposal: us-009-frontend — Frontend Completo con Feature-Sliced Design

## Why

El frontend actual (`frontend/src/app/App.tsx`) es un demo mínimo funcional de 395 líneas que demuestra la integración con el backend, pero no es un producto real:
- **Monolítico**: toda la lógica (login, catálogo, carrito, pedidos, admin) vive en un solo archivo sin separación de responsabilidades
- **Incompleto**: solo cubre ~30% de las funcionalidades que el backend ya soporta (faltan direcciones, perfil, checkout MercadoPago real, gestión de usuarios/stock, filtros avanzados)
- **No escalable**: sin arquitectura FSD, agregar features genera acoplamiento y colisiones entre desarrolladores

El backend está 100% completo (us-000 a us-008 archivados) con API REST, RBAC, FSM de pedidos, MercadoPago, y métricas admin. El frontend debe alcanzar el mismo nivel de madurez para que el sistema sea entregable.

## What Changes

Refactor completo del frontend de monolito a **Feature-Sliced Design** con implementación de TODAS las funcionalidades soportadas por el backend:

### Arquitectura
- **shared/api/axios.ts** — interceptor JWT con refresh automático (ya existe, solo ajustar)
- **shared/store/** — 4 stores Zustand (authStore, cartStore, paymentStore, uiStore) — ya existen, ajustar según nuevos flujos
- **shared/types/** — tipos TypeScript de dominio (Usuario, Producto, Pedido, Pago, Categoria, DireccionEntrega)
- **entities/** — lógica de datos por entidad (hooks TanStack Query: useProductos, usePedidos, useCategorias, etc.)
- **features/** — features autocontenidas:
  - **features/auth**: LoginForm, RegisterForm, ProtectedRoute, RoleGuard
  - **features/store**: CatalogoGrid, ProductoCard, FiltrosCatalogo, ProductoDetalle, CartDrawer, AgregarAlCarrito
  - **features/pedidos**: PedidosList, PedidoDetalle, PedidoTimeline (FSM visual), CrearPedido
  - **features/admin**: Dashboard (KPIs + gráficos Recharts), GestionProductos, GestionCategorias, GestionUsuarios, GestionStock, PedidosAdmin
  - **features/direcciones**: ListaDirecciones, FormDireccion, SeleccionarDireccion
  - **features/pagos**: CheckoutMP (MercadoPago SDK React), EstadoPago, HistorialPagos
  - **features/perfil**: PerfilUsuario, EditarPerfil
- **widgets/** — composición de múltiples features (ej: CheckoutFlow = DireccionEntrega + FormaPago + ResumenPedido)
- **pages/** — routing React Router DOM, una página por ruta principal

### Stack Completo
- **React 18** + **TypeScript strict**
- **Vite** con HMR y proxy `/api/v1`
- **TanStack Query v5** — server state (productos, pedidos, admin), invalidación automática post-mutación
- **TanStack Form** — formularios tipados con validación (register, editar producto, direcciones)
- **Zustand** — client state (carrito persist, auth tokens, payment status, UI modals)
- **Axios** — instancia centralizada con interceptors
- **Tailwind CSS** — responsive mobile-first, sistema de diseño consistente
- **Recharts** — gráficos dashboard admin (ingresos 7 días, pedidos por estado)
- **@mercadopago/sdk-react** — componente CardPayment para tokenización PCI-compliant

### Responsivo
- **Mobile-first**: breakpoints Tailwind (sm:, md:, lg:)
- Navegación: drawer lateral en mobile, navbar fija en desktop
- Grids adaptativas: 1 col mobile → 2 md → 3/4 lg

### Integración Backend
- `/api/v1/auth` — register, login, refresh, logout, me
- `/api/v1/productos` — listado paginado, detalle, filtros (categoría, búsqueda, alérgenos)
- `/api/v1/categorias` — árbol jerárquico para filtro
- `/api/v1/carrito/validar` — validación server-side antes de crear pedido
- `/api/v1/pedidos` — crear, listar (propio/todos según rol), detalle, avanzar estado (admin/gestor), cancelar
- `/api/v1/pagos` — crear pago MP, webhook (backend), consultar estado
- `/api/v1/admin` — KPIs, métricas por estado, ingresos 7 días
- `/api/v1/direcciones` — CRUD direcciones del usuario, marcar principal
- `/api/v1/usuarios/{id}` — perfil propio (GET /me), editar perfil

### UX Patterns
- **Loading states**: skeleton loaders en listas, spinners en botones
- **Error states**: toast notifications con retry, mensajes inline en forms
- **Empty states**: ilustraciones + CTA cuando no hay datos
- **Confirmation modals**: diálogos antes de acciones destructivas (cancelar pedido, eliminar dirección)
- **Optimistic updates**: actualizar UI inmediatamente, rollback si falla (TanStack Query)

## Capabilities

### New Capabilities
- `frontend-auth`: Autenticación completa — registro, login, logout, renovación automática de tokens, rutas protegidas por rol (ADMIN, STOCK, PEDIDOS, CLIENT), guards React Router
- `frontend-catalogo`: Catálogo de productos — listado paginado con filtros (categoría, búsqueda, rango de precio, alérgenos), detalle de producto con ingredientes, agregar al carrito con personalización (excluir ingredientes)
- `frontend-carrito`: Carrito de compras — persistencia en Zustand + localStorage, validación server-side pre-checkout, subtotal + costo de envío + total, gestión de cantidades y personalizaciones
- `frontend-pedidos`: Gestión de pedidos — crear desde carrito, listar mis pedidos (CLIENT) o todos (ADMIN/PEDIDOS), detalle con líneas y snapshots, timeline visual del FSM (PENDIENTE → CONFIRMADO → EN_PREP → EN_CAMINO → ENTREGADO), cancelar pedido (validación por estado)
- `frontend-pagos`: Checkout MercadoPago — integración SDK React CardPayment con tokenización, crear pago en backend, polling de estado tras redirección, historial de pagos por pedido
- `frontend-admin`: Panel administración — dashboard con KPIs (total pedidos, ingresos hoy, pendientes, sin stock), gráficos Recharts (ingresos 7 días, pedidos por estado), CRUD productos (con categorías e ingredientes), CRUD categorías (árbol jerárquico), gestión de stock, gestión de usuarios y roles, gestión de pedidos (avanzar estados, ver historial), solo accesible con rol ADMIN
- `frontend-direcciones`: Direcciones de entrega — CRUD de direcciones del usuario, marcar dirección principal, selección en checkout
- `frontend-perfil`: Perfil de usuario — ver datos propios (nombre, email, roles), editar nombre y teléfono (sin cambio de email/password en v1)

### Modified Capabilities
<!-- No hay capabilities previas de frontend a modificar; el demo actual no tenía specs -->

## Impact

**Affected**:
- `frontend/src/app/App.tsx` — **BREAKING**: se reemplaza completamente por arquitectura FSD
- `frontend/src/` — toda la estructura de carpetas se reorganiza según FSD
- `package.json` — se agregan: `react-router-dom`, `@tanstack/react-form`, `@mercadopago/sdk-react`
- `tailwind.config.js` — se extiende con tema custom (colores primarios, espaciado consistente)

**No affected**:
- Backend (`backend/`) — cero cambios, solo consumo de API existente
- Base de datos — cero cambios
- Stores Zustand — ya existen en `shared/store/`, solo se ajustan acciones si es necesario
- Axios interceptor — ya existe, solo se verifica comportamiento con TanStack Query

**Dependencies**:
- Nuevo: `@mercadopago/sdk-react` (SDK oficial MP para React)
- Nuevo: `@tanstack/react-form` (formularios tipados)
- Nuevo: `react-router-dom` v6 (routing)
- Ya existe: `@tanstack/react-query`, `zustand`, `axios`, `tailwindcss`, `recharts`

**Rollout**:
- Desarrollo local primero (validar todos los flujos contra backend en `http://localhost:8000`)
- Preview en Vercel/Netlify para testing
- Deploy producción cuando backend esté en Railway/Render
