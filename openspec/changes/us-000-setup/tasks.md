# Tasks: us-000-setup — Infraestructura Base de Food Store

> Cada tarea es atómica: un commit por tarea. Orden secuencial obligatorio.
> Marcar `[x]` al completar antes de avanzar a la siguiente.

---

## BLOQUE 1 — Estructura base del monorepo

- [x] **T-001** Crear estructura raíz del monorepo con carpetas `backend/` y `frontend/`, archivo `README.md` raíz con instrucciones de setup, y `.gitignore` global que excluya `.env`, `__pycache__/`, `node_modules/`, `.venv/`, `*.pyc`, `dist/`, `.DS_Store`.

- [x] **T-002** Dentro de `backend/`, crear `requirements.txt` con todas las dependencias fijadas (ver design.md), `.env.example` con todas las variables documentadas y `app/__init__.py`.

- [x] **T-003** Dentro de `frontend/`, inicializar proyecto Vite con React + TypeScript (`npm create vite@latest frontend -- --template react-ts`). Instalar todas las dependencias del package.json del design.md. Configurar `tsconfig.json` con `strict: true` y `paths` para imports absolutos (`@/*` → `src/*`). Crear `.env.example` con `VITE_API_URL` y `VITE_MP_PUBLIC_KEY`.

---

## BLOQUE 2 — Core del backend

- [x] **T-004** Crear `app/core/__init__.py` y `app/core/config.py` con la clase `Settings` basada en `pydantic-settings`. Verificar que lee correctamente desde `.env`.

- [x] **T-005** Crear `app/core/database.py` con `create_async_engine`, `AsyncSessionLocal`, y la función `get_session()` como generador async. Crear `app/core/__init__.py`.

- [x] **T-006** Crear `app/core/security.py` con las funciones: `hash_password()`, `verify_password()`, `create_access_token()`, `decode_access_token()`. Usar `passlib[bcrypt]` con cost factor ≥ 12 y `python-jose` con HS256.

- [x] **T-007** Crear `app/core/repository.py` con la clase `BaseRepository[T]` genérica con los métodos: `get_by_id()`, `list_all()`, `count()`, `create()`, `update()`, `soft_delete()`, `hard_delete()`. El soft_delete asigna `eliminado_en = now()`. El `list_all` filtra `eliminado_en IS NULL` si el modelo tiene ese campo.

- [x] **T-008** Crear `app/core/uow.py` con la clase `UnitOfWork` como async context manager. Al `__aenter__` crea la sesión de BD. Al `__exit__` sin excepción hace `commit`, con excepción hace `rollback` y cierra la sesión. Exponer método `flush()`. Agregar atributo de sesión como `_session` (privado).

---

## BLOQUE 3 — Módulos del backend (stubs)

- [x] **T-009** Crear la estructura de carpetas para TODOS los módulos bajo `app/modules/`: `auth/`, `refreshtokens/`, `usuarios/`, `direcciones/`, `categorias/`, `productos/`, `pedidos/`, `pagos/`, `admin/`. Cada carpeta debe tener: `__init__.py`, `model.py`, `schemas.py`, `repository.py`, `service.py`, `router.py` con contenido stub (imports básicos + comentario `# TODO: implementar en change correspondiente`).

- [x] **T-010** Crear `app/main.py` con:
  - Instancia de `FastAPI` con título y versión
  - `CORSMiddleware` con `allow_origins=settings.CORS_ORIGINS`
  - Configuración de `slowapi` (`Limiter`, handler de `RateLimitExceeded`)
  - Endpoint `GET /health` que retorna `{"status": "ok", "version": "1.0.0"}`
  - Comentarios indicando dónde se registrarán los routers de cada módulo

---

## BLOQUE 4 — Migraciones Alembic

- [x] **T-011** Inicializar Alembic en `backend/`: ejecutar `alembic init alembic`. Configurar `alembic.ini` para leer `DATABASE_URL` desde variables de entorno. Editar `alembic/env.py` para importar todos los modelos SQLModel y usar la metadata de SQLModel como target_metadata. Usar el driver síncrono `psycopg2` en `env.py` (Alembic no es async).

- [x] **T-012** Crear la migración `alembic/versions/0001_initial_schema.py` con la creación de las 16 tablas del ERD v5 en el orden correcto (respetando FKs):
  1. `roles`
  2. `estados_pedido`
  3. `formas_pago`
  4. `usuarios`
  5. `usuario_roles`
  6. `refresh_tokens`
  7. `direcciones_entrega`
  8. `categorias`
  9. `ingredientes`
  10. `productos`
  11. `producto_categorias`
  12. `producto_ingredientes`
  13. `pedidos`
  14. `detalle_pedidos`
  15. `historial_estados_pedido`
  16. `pagos`

  La función `downgrade()` debe eliminar las tablas en orden inverso.

- [x] **T-013** Verificar que `alembic upgrade head` ejecuta sin errores en una base de datos PostgreSQL vacía. Corregir cualquier error de FK o tipo antes de continuar.

---

## BLOQUE 5 — Seed data

- [x] **T-014** Crear `app/db/__init__.py` y `app/db/seed.py` con las funciones para insertar los datos catálogo usando `INSERT ... ON CONFLICT DO NOTHING` (idempotente):
  - 4 roles: ADMIN, STOCK, PEDIDOS, CLIENT
  - 6 estados de pedido: PENDIENTE, CONFIRMADO, EN_PREP, EN_CAMINO, ENTREGADO, CANCELADO (con `es_terminal` correcto y `orden`)
  - 3 formas de pago: MERCADOPAGO, EFECTIVO, TRANSFERENCIA
  - Usuario admin: `admin@foodstore.com` / `Admin1234!` (hasheado con bcrypt) con rol ADMIN asignado

- [x] **T-015** Verificar que `python -m app.db.seed` ejecuta correctamente y que ejecutarlo dos veces no duplica datos. El script debe imprimir qué datos insertó y cuáles ya existían.

---

## BLOQUE 6 — Frontend: estructura y stores

- [x] **T-016** Crear la estructura FSD completa en `frontend/src/`:
  - `app/App.tsx`, `app/main.tsx`, `app/providers.tsx`
  - `pages/`, `widgets/`, `features/`, `entities/` con `.gitkeep`
  - `shared/api/`, `shared/store/`, `shared/types/`, `shared/lib/`
  
  Configurar `vite.config.ts` con:
  - Plugin React
  - Alias `@` → `./src`
  - Proxy `/api/v1` → `http://localhost:8000` para desarrollo

- [x] **T-017** Crear `src/shared/store/authStore.ts` con la interfaz `AuthState` y el store Zustand con middleware `persist`. El `partialize` debe persistir solo `accessToken`, `refreshToken`, `user`, `isAuthenticated`. Acciones: `login()`, `logout()`, `updateTokens()`, `hasRole()`.

- [x] **T-018** Crear `src/shared/store/cartStore.ts` con la interfaz `CartItem` y el store Zustand con middleware `persist`. El `partialize` persiste solo `items`. Acciones: `addItem()` (con merge si existe), `removeItem()`, `updateCantidad()`, `clearCart()`. Selectores: `itemCount()`, `subtotal()`, `costoEnvio()` (fijo $50), `total()`.

- [x] **T-019** Crear `src/shared/store/paymentStore.ts` SIN middleware persist. Estado: `status` (idle/processing/approved/rejected/error), `mpPaymentId`, `statusDetail`. Acciones: `setPaymentStatus()`, `reset()`.

- [x] **T-020** Crear `src/shared/store/uiStore.ts` SIN middleware persist. Estado: `cartOpen`, `sidebarOpen`, `confirmModal`. Acciones: `openCart()`, `closeCart()`, `toggleSidebar()`, `openConfirmModal()`, `closeConfirmModal()`.

---

## BLOQUE 7 — Frontend: Axios y QueryClient

- [x] **T-021** Crear `src/shared/api/axios.ts` con la instancia Axios configurada con `baseURL` desde `VITE_API_URL`. Implementar:
  - **Request interceptor**: adjunta `Authorization: Bearer <token>` leyendo del `authStore` con `getState()` (fuera de React)
  - **Response interceptor**: detecta 401, ejecuta refresh via `POST /auth/refresh` con el `refreshToken` del store, actualiza tokens con `updateTokens()`, reintenta el request original. Si el refresh falla, llama `logout()`. Implementar cola de requests fallidos durante el refresh (`failedQueue`) para evitar múltiples refreshes simultáneos.

- [x] **T-022** Crear `src/shared/lib/queryClient.ts` con la instancia de `QueryClient` configurada con: `retry: 1`, `staleTime: 120000` (2 min), `refetchOnWindowFocus: false`.

- [x] **T-023** Crear `src/app/providers.tsx` con `QueryClientProvider` wrapping `ReactQueryDevtools` (solo en desarrollo) y `BrowserRouter`. Crear `src/app/App.tsx` con routing básico (rutas vacías por ahora) usando `react-router-dom`. Crear `src/app/main.tsx` que monta `<App />` en el `#root`.

---

## BLOQUE 8 — Verificación final

- [x] **T-024** Verificar backend end-to-end:
  - `pip install -r requirements.txt` sin errores
  - `uvicorn app.main:app --reload` arranca en puerto 8000
  - `GET /health` retorna `{"status": "ok", "version": "1.0.0"}`
  - `GET /docs` muestra Swagger UI
  - `alembic upgrade head` crea las 16 tablas
  - `python -m app.db.seed` carga datos y es idempotente

- [x] **T-025** Verificar frontend end-to-end:
  - `npm install` sin errores
  - `npm run dev` arranca en puerto 5173 sin errores de TypeScript
  - `npm run build` produce build de producción sin errores
  - Los 4 stores son importables y TypeScript los tipa correctamente
  - El interceptor Axios está configurado y no lanza errores en la importación

---

## Criterios de aceptación del change

- `alembic upgrade head` crea las 16 tablas del ERD v5 sin errores en una BD vacía
- `python -m app.db.seed` es idempotente y carga los 4 roles, 6 estados, 3 formas de pago y el usuario admin
- El servidor FastAPI arranca y `/health` responde 200
- El frontend arranca sin errores de TypeScript con `strict: true`
- Los 4 stores Zustand están tipados, funcionales y con persistencia correcta por store
- El interceptor Axios implementa refresh automático con cola de requests pendientes
- Ningún archivo `.env` real está commiteado (solo `.env.example`)
