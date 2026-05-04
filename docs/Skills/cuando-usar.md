# Mapa de Skills — Cuándo usar cada una

Referencia rápida para saber qué herramienta o patrón aplicar según la tarea.

---

## Frontend

| Situación | Skill / Herramienta | Dónde |
|---|---|---|
| Necesito leer datos del servidor (productos, pedidos, etc.) | `useQuery` de TanStack Query | `features/<modulo>/hooks/` |
| Necesito escribir datos al servidor (crear, editar, borrar) | `useMutation` de TanStack Query | `features/<modulo>/hooks/` |
| Necesito invalidar el cache después de una mutación | `queryClient.invalidateQueries()` | dentro del `onSuccess` del mutation |
| Necesito estado que persiste entre sesiones (token, carrito) | Zustand con `persist` | `shared/store/authStore` o `cartStore` |
| Necesito estado temporal de UI (modal abierto, sidebar) | Zustand sin `persist` | `shared/store/uiStore` |
| Necesito estado del proceso de pago | Zustand sin `persist` | `shared/store/paymentStore` |
| Necesito acceder al store fuera de un componente React | `useXStore.getState()` | interceptores, funciones utilitarias |
| Necesito construir un formulario con validación | TanStack Form + `useForm` | `features/<modulo>/ui/` |
| Necesito navegar entre rutas | `useNavigate()` de React Router | cualquier componente |
| Necesito leer parámetros de la URL | `useParams()` o `useSearchParams()` | pages o features |
| Necesito clases CSS condicionales | `clsx()` | cualquier componente |
| Necesito mostrar gráficos o métricas | Recharts | `features/admin/` |
| Necesito tipar una respuesta paginada | `PaginatedResponse<T>` | `shared/types/index.ts` |
| Necesito tipar un error de la API | `ApiError` | `shared/types/index.ts` |
| Necesito hacer una llamada HTTP autenticada | instancia `api` de axios | importar desde `shared/api/axios.ts` |

---

## Backend

| Situación | Skill / Herramienta | Dónde |
|---|---|---|
| Necesito crear una nueva entidad de BD | SQLModel Table en `model.py` | `app/modules/<modulo>/model.py` |
| Necesito definir qué datos recibe o devuelve un endpoint | Schema Pydantic en `schemas.py` | `app/modules/<modulo>/schemas.py` |
| Necesito hacer CRUD básico sobre una entidad | Heredar `BaseRepository[T]` | `app/modules/<modulo>/repository.py` |
| Necesito lógica de negocio | Función en `service.py` que recibe `uow` | `app/modules/<modulo>/service.py` |
| Necesito un endpoint HTTP | Función en `router.py` con `APIRouter` | `app/modules/<modulo>/router.py` |
| Necesito que una operación sea atómica (todo o nada) | `async with UnitOfWork() as uow:` | en el router |
| Necesito hashear o verificar una contraseña | `hash_password()` / `verify_password()` | `app/core/security.py` |
| Necesito crear un JWT | `create_access_token()` | `app/core/security.py` |
| Necesito proteger un endpoint por autenticación | `get_current_user` dependency | `app/modules/auth/dependencies.py` |
| Necesito restringir un endpoint a ciertos roles | `require_role(["ADMIN"])` dependency | `app/modules/auth/dependencies.py` |
| Necesito borrar lógicamente (sin eliminar de la BD) | `soft_delete()` del repository | `BaseRepository` en `app/core/repository.py` |
| Necesito crear o modificar la estructura de la BD | `alembic revision --autogenerate` | desde `backend/` |
| Necesito agregar datos iniciales | función en `seed.py` con `ON CONFLICT DO NOTHING` | `app/db/seed.py` |
| Necesito limitar intentos de login | `@limiter.limit("5/15minutes")` | router de auth |
| Necesito registrar un nuevo router | descommentarlo en `main.py` | `app/main.py` |

---

## OPSX (flujo de desarrollo)

| Situación | Comando |
|---|---|
| Quiero entender cómo encaja algo antes de proponer | `/opsx:explore` |
| Quiero generar los artefactos (proposal + design + tasks) de un change | `/opsx:propose <nombre>` |
| Quiero implementar las tareas de un change aprobado | `/opsx:apply <nombre>` |
| Quiero cerrar un change y sincronizar las specs | `/opsx:archive <nombre>` |
| Quiero ver todos los changes y su estado | revisar `docs/map/map.md` |

---

## Patrones de arquitectura

| Patrón | Cuándo usarlo |
|---|---|
| **Snapshot** (`nombre_snapshot`, `precio_snapshot`) | Al crear un pedido — guardar nombre y precio del producto tal como están en ese momento, para que no cambien si el producto se modifica después |
| **Soft delete** (`eliminado_en`) | Al "borrar" categorías, productos, usuarios — nunca borrar físicamente, solo marcar con fecha de eliminación |
| **FSM (máquina de estados)** | Al cambiar el estado de un pedido — validar en service que la transición es válida antes de aplicarla |
| **Append-only** (`HistorialEstadoPedido`) | Al registrar cambios de estado — solo INSERT, nunca UPDATE ni DELETE |
| **Idempotencia** (seed, idempotency key) | Al repetir operaciones que no deben duplicar datos |
| **Refresh token rotation** | Al renovar el JWT — invalidar el refresh token viejo y emitir uno nuevo |
