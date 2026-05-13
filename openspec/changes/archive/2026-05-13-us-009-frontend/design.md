# Design: us-009-frontend — Arquitectura Técnica del Frontend

## Context

El frontend actual (`App.tsx`, 395 líneas) es un demo funcional que prueba la integración con el backend pero no escala:
- **Monolito**: componentes, lógica de negocio, fetching, y routing mezclados en un solo archivo
- **Estado ad-hoc**: llamadas `api.get()` directas con `useEffect`, sin caché ni invalidación coordinada
- **Sin separación de responsabilidades**: agregar features genera conflictos y duplicación

El backend está **100% completo** (us-000 a us-008 archivados):
- API REST con 40+ endpoints documentados en `/docs`
- RBAC con 4 roles, JWT con refresh automático
- FSM de pedidos (6 estados, audit trail append-only)
- Integración MercadoPago (webhook IPN, idempotency keys)
- Dashboard admin con métricas y KPIs

**Restricciones:**
- Stack fijo: React 18 + TypeScript 5 + Vite 5
- Ya existe infraestructura: 4 stores Zustand configurados, interceptor Axios con refresh automático, TanStack Query cliente
- Compatibilidad: backend en `http://localhost:8000/api/v1` (desarrollo), después Railway/Render (producción)
- Desempeño: mobile-first, bundle < 500KB gzipped inicial, code-splitting por ruta

## Goals / Non-Goals

**Goals:**
- Arquitectura **Feature-Sliced Design** con límites de importación estrictos (pages → features → entities → shared)
- **Separación estado cliente/servidor**: Zustand para carrito/auth/UI, TanStack Query para productos/pedidos/admin
- **Cobertura 100%** de funcionalidad backend: auth, catálogo con filtros, pedidos (crear + tracking FSM), pagos MP, admin dashboard, direcciones, perfil
- **UX profesional**: skeleton loaders, error boundaries, toast notifications, optimistic updates, empty states
- **Responsivo mobile-first**: Tailwind breakpoints, navegación drawer lateral (mobile) / navbar (desktop)
- **Tipado end-to-end**: TypeScript strict, tipos compartidos con backend (`Producto`, `Pedido`, etc.)

**Non-Goals:**
- PWA / Service Workers — fuera de alcance v1
- Tests E2E con Playwright — se deja para fase post-MVP
- Internacionalización (i18n) — solo español en v1
- Modo offline / sincronización — requiere replicación local, no aplica
- Server-side rendering (SSR) — Vite SPA es suficiente para v1

## Decisions

### D1: Feature-Sliced Design (FSD) como arquitectura frontend

**Problema**: El monolito actual no escala. Agregar features genera acoplamiento, imports circulares, y conflictos de merge.

**Decisión**: Aplicar **Feature-Sliced Design** con flujo de imports unidireccional:

```
pages/
  → features/
      → widgets/
          → entities/
              → shared/
```

Cada capa solo puede importar de capas inferiores. Las **features** son autocontenidas (auth, store, pedidos, admin) y NO pueden cross-importarse.

**Estructura específica:**
```
src/
  app/                   # providers, router, estilos globales
  pages/                 # routing por ruta (/, /catalogo, /pedidos, /admin)
  widgets/               # composición de features (CheckoutFlow)
  features/
    auth/                # LoginForm, RegisterForm, ProtectedRoute
    store/               # CatalogoGrid, ProductoCard, CartDrawer
    pedidos/             # PedidosList, PedidoDetalle, PedidoTimeline
    admin/               # Dashboard, GestionProductos, GestionStock
    direcciones/         # ListaDirecciones, FormDireccion
    pagos/               # CheckoutMP, EstadoPago
    perfil/              # PerfilUsuario, EditarPerfil
  entities/              # hooks de datos (useProductos, usePedidos)
  shared/
    api/                 # axios.ts (interceptor JWT)
    store/               # authStore, cartStore, paymentStore, uiStore
    types/               # tipos TypeScript de dominio
    ui/                  # componentes base (Button, Input, Modal)
    lib/                 # queryClient, utils
```

**Alternativa descartada**: estructura flat por tipo de archivo (`/components`, `/hooks`, `/store`). Descartada porque mezcla concerns y dificulta la extracción de features a paquetes independientes en el futuro.

**Beneficios**:
- **Escalabilidad**: agregar nueva feature no toca código existente
- **Mantenibilidad**: cada feature tiene SRP (Single Responsibility Principle)
- **Lazy loading**: `React.lazy()` por feature con route-based code splitting

---

### D2: Separación estricta estado cliente (Zustand) / servidor (TanStack Query)

**Problema**: mezclar ambos tipos de estado en un solo store genera bugs de sincronización (e.g., carrito desactualizado respecto a stock real).

**Decisión**:
- **TanStack Query** gestiona TODO lo que viene del servidor:
  - Productos, categorías (caché 5 min)
  - Pedidos, pagos (caché 2 min)
  - Métricas admin (caché 1 min)
  - Invalidación automática post-mutación (`queryClient.invalidateQueries(['pedidos'])`)
- **Zustand** gestiona SOLO estado que vive en el cliente:
  - `authStore`: accessToken, refreshToken, usuario, isAuthenticated (persist solo accessToken)
  - `cartStore`: items del carrito con personalizaciones (persist completo en localStorage)
  - `paymentStore`: estado del flujo de pago (idle/processing/approved/rejected) — SIN persist
  - `uiStore`: cartOpen, sidebarOpen, confirmModal — SIN persist

**Regla de oro**: si los datos tienen fuente de verdad en el backend → TanStack Query. Si viven solo en el cliente → Zustand.

**Alternativa descartada**: un solo Zustand store global con datos remotos y locales. Descartado porque requiere invalidación manual y pierde los beneficios de caché/retry/refetch de TanStack Query.

---

### D3: TanStack Form para formularios complejos

**Problema**: formularios con validación cross-field (e.g., confirmar contraseña, dirección completa) son verbose con `useState`.

**Decisión**: usar **TanStack Form** para:
- Register (validación email + contraseña con requisitos mínimos)
- Crear/editar productos (ADMIN: nombre, precio, categorías M2M, ingredientes M2M)
- Crear/editar direcciones (linea1 requerida, ciudad, código postal validado)
- Editar perfil

**Configuración:**
```tsx
const form = useForm({
  defaultValues: { email: '', password: '' },
  onSubmit: async (values) => { /* submit logic */ },
})

form.Field({
  name: 'email',
  validators: {
    onChange: ({ value }) => !isValidEmail(value) ? 'Email inválido' : undefined,
  },
  children: (field) => <Input {...field} />
})
```

**Alternativa descartada**: React Hook Form. Descartado porque TanStack Form tiene mejor integración con TanStack Query (submit con mutation) y tipado más estricto.

---

### D4: React Router DOM v6 con guards y lazy loading

**Decisión**: routing con guardas de autenticación y rol:

```tsx
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/catalogo" element={<CatalogoPage />} />
  <Route path="/producto/:id" element={<ProductoDetallePage />} />
  <Route path="/carrito" element={<ProtectedRoute><CarritoPage /></ProtectedRoute>} />
  <Route path="/pedidos" element={<ProtectedRoute><PedidosPage /></ProtectedRoute>} />
  <Route path="/pedidos/:id" element={<ProtectedRoute><PedidoDetallePage /></ProtectedRoute>} />
  <Route path="/admin/*" element={<ProtectedRoute roles={["ADMIN"]}><AdminLayout /></ProtectedRoute>}>
    <Route path="dashboard" element={<DashboardPage />} />
    <Route path="productos" element={<GestionProductosPage />} />
    <Route path="categorias" element={<GestionCategoriasPage />} />
    <Route path="pedidos" element={<GestionPedidosPage />} />
  </Route>
  <Route path="/perfil" element={<ProtectedRoute><PerfilPage /></ProtectedRoute>} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

**Guards:**
- `ProtectedRoute`: verifica `authStore.isAuthenticated`, redirige a `/login` si false
- `ProtectedRoute roles={["ADMIN"]}`: verifica `authStore.hasRole("ADMIN")`, muestra 403 si false

**Lazy loading:**
```tsx
const AdminLayout = React.lazy(() => import('./pages/admin/AdminLayout'));
```

---

### D5: MercadoPago SDK React (no iframe legacy)

**Decisión**: usar `@mercadopago/sdk-react` con componente `CardPayment` para tokenización client-side:

```tsx
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';

initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY);

<CardPayment
  initialization={{ amount: total }}
  onSubmit={async (cardFormData) => {
    const { data: pago } = await api.post('/pagos/crear', {
      pedido_id: pedido.id,
      token: cardFormData.token,  // tokenizado por MP
    });
    // Polling de estado o redirección a página de confirmación
  }}
/>
```

**Flujo completo**:
1. Cliente completa datos de tarjeta en componente MP (nunca tocan nuestro servidor)
2. SDK tokeniza → genera `cardFormData.token`
3. Frontend envía token a `POST /api/v1/pagos/crear`
4. Backend llama MercadoPago API con el token → crea pago
5. Backend recibe webhook IPN → avanza pedido PENDIENTE→CONFIRMADO
6. Frontend hace polling cada 5s al estado del pedido hasta detectar CONFIRMADO

**Alternativa descartada**: Checkout Pro con redirección a URL de MP. Descartada porque rompe la UX (el usuario sale de nuestra app).

**PCI compliance**: SAQ-A — datos de tarjeta nunca pasan por nuestro servidor.

---

### D6: Tailwind utility-first con tema custom

**Decisión**: Tailwind CSS sin CSS modules ni styled-components. Extensión de tema:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: { 50: '#eff6ff', 500: '#3b82f6', 700: '#1d4ed8' },  // blue
        secondary: { 500: '#10b981' },  // green
        danger: { 500: '#ef4444' },  // red
      },
      fontFamily: { sans: ['Inter', 'system-ui'] },
    },
  },
}
```

**Sistema de diseño**:
- Botones: `bg-primary-500 hover:bg-primary-700 text-white rounded-lg px-4 py-2 font-medium`
- Inputs: `border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500`
- Cards: `bg-white rounded-xl shadow-sm border border-gray-100 p-4`

**Mobile-first breakpoints**: `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px).

**Alternativa descartada**: styled-components. Descartado por bundle size (runtime CSS-in-JS) y vendor lock-in.

---

### D7: Recharts para gráficos admin

**Decisión**: usar **Recharts** en dashboard admin para:
- Gráfico de línea: ingresos últimos 7 días (`GET /api/v1/admin/metricas/ingresos-7-dias`)
- Gráfico de barras: pedidos por estado (`GET /api/v1/admin/metricas/por-estado`)

```tsx
<LineChart data={ingresos7Dias} width={600} height={300}>
  <XAxis dataKey="fecha" />
  <YAxis />
  <CartesianGrid strokeDasharray="3 3" />
  <Tooltip />
  <Line type="monotone" dataKey="ingresos" stroke="#3b82f6" />
</LineChart>
```

**Alternativa descartada**: Chart.js. Descartado porque Recharts está escrito en React (mejor composición) y Chart.js requiere refs a canvas.

---

### D8: Error boundaries y toast notifications

**Decisión**:
- **Error boundary** global en `App.tsx` para capturar errores React no manejados → mostrar pantalla de error genérica
- **Toast system** con Zustand para notificaciones no bloqueantes:
  - `uiStore.addToast({ type: 'success' | 'error' | 'info', message: string })`
  - Auto-dismiss después de 5s
  - Posición: bottom-right en desktop, top-center en mobile

```tsx
// shared/ui/Toast.tsx
const toasts = useUIStore(s => s.toasts);
return (
  <div className="fixed bottom-4 right-4 space-y-2">
    {toasts.map(t => <ToastItem key={t.id} {...t} />)}
  </div>
);
```

---

### D9: Optimistic updates con TanStack Query

**Problema**: al agregar al carrito o cancelar pedido, esperar la respuesta del servidor genera latencia percibida.

**Decisión**: usar optimistic updates con rollback automático si falla:

```tsx
const mutation = useMutation({
  mutationFn: (pedidoId: number) => api.patch(`/pedidos/${pedidoId}/cancelar`),
  onMutate: async (pedidoId) => {
    await queryClient.cancelQueries(['pedidos', pedidoId]);
    const previousPedido = queryClient.getQueryData(['pedidos', pedidoId]);
    queryClient.setQueryData(['pedidos', pedidoId], (old) => ({
      ...old,
      estado_codigo: 'CANCELADO'
    }));
    return { previousPedido };
  },
  onError: (err, pedidoId, context) => {
    queryClient.setQueryData(['pedidos', pedidoId], context.previousPedido);
    toast.error('Error al cancelar pedido');
  },
  onSettled: (pedidoId) => {
    queryClient.invalidateQueries(['pedidos', pedidoId]);
  },
});
```

---

## Risks / Trade-offs

**[Risk] Complejidad inicial de FSD** → La estructura FSD tiene curva de aprendizaje para devs acostumbrados a estructura flat. **Mitigación**: documentar convenciones en `CONTRIBUTING.md` con diagramas de capas y ejemplos de import válidos/inválidos.

**[Risk] Bundle size grande** → Recharts + MercadoPago SDK + Tailwind pueden sumar >300KB. **Mitigación**: (1) lazy loading de admin y checkout, (2) Tailwind purge en producción, (3) tree-shaking de Recharts (solo importar componentes usados).

**[Risk] Caché stale de TanStack Query** → Si un admin actualiza stock y un cliente tiene el catálogo cacheado, ve datos desactualizados. **Mitigación**: `staleTime` corto (2-5 min) + `refetchOnWindowFocus: true` en queries críticas (productos, pedidos).

**[Risk] Polling de estado de pago es ineficiente** → Si 10 usuarios esperan confirmación simultáneamente, 10 requests cada 5s saturan el backend. **Mitigación**: usar WebSockets (Socket.io) en v2 para push notifications de cambios de estado. En v1, polling con backoff exponencial (5s → 10s → 20s).

**[Trade-off] TanStack Form vs React Hook Form** → TanStack Form es menos maduro (v0.x) que RHF (v7.x). **Justificación**: mejor integración con TanStack Query y tipado más estricto compensan la madurez menor.

**[Trade-off] No SSR** → Sin SSR, el SEO del catálogo es pobre (bots ven HTML vacío). **Justificación**: en v1 no es crítico (e-commerce local sin SEO). En v2 se puede migrar a Next.js o Remix si el negocio lo requiere.

---

## Migration Plan

**Fase 1 — Estructura y routing (sin lógica)**
1. Crear estructura de carpetas FSD completa
2. Configurar React Router con rutas stub (sin componentes reales)
3. Migrar stores Zustand existentes a `shared/store/` sin cambios
4. Verificar: `npm run dev` arranca sin errores, rutas accesibles

**Fase 2 — Shared y entities (infraestructura de datos)**
5. Crear tipos TypeScript en `shared/types/` (Producto, Pedido, Usuario, etc.)
6. Implementar hooks TanStack Query en `entities/` (useProductos, usePedidos, useCategorias, etc.)
7. Verificar: queries devuelven datos del backend en `/docs`

**Fase 3 — Features (una por una)**
8. Implementar `features/auth` (login, register, ProtectedRoute)
9. Implementar `features/store` (catálogo, detalle, carrito)
10. Implementar `features/pedidos` (crear, listar, detalle, timeline)
11. Implementar `features/direcciones` (CRUD)
12. Implementar `features/pagos` (checkout MP)
13. Implementar `features/perfil` (ver/editar)
14. Implementar `features/admin` (dashboard, CRUDs, gestión pedidos)

**Fase 4 — Polish**
15. Error boundaries + toast notifications
16. Skeleton loaders en listas
17. Empty states en listas vacías
18. Optimistic updates en mutaciones críticas
19. Responsive testing en Chrome DevTools (mobile, tablet, desktop)

**Rollback plan**: si algo falla críticamente, el `App.tsx` original está en git history. Se puede revertir con `git checkout <commit> -- frontend/src/app/App.tsx`.

---

## Open Questions

1. ¿Los roles de usuario se deben validar solo en frontend o también en cada request backend?
   → **Respuesta**: Backend SIEMPRE valida (con `require_role`). Frontend valida para UX (ocultar opciones inaccesibles).

2. ¿Qué hacer si el webhook de MercadoPago tarda más de 2 minutos en llegar?
   → **Respuesta**: Mostrar pantalla de "Pago en proceso, te notificaremos por email" después de 2 min de polling. El webhook eventualmente actualizará el pedido.

3. ¿El carrito debe sincronizarse entre pestañas/dispositivos del mismo usuario?
   → **Respuesta**: No en v1 (carrito en localStorage es per-device). En v2 se puede guardar en backend (`/api/v1/carrito`).
