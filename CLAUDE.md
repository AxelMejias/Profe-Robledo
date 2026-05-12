# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Food Store — e-commerce de productos alimenticios. Trabajo Práctico Integrador (TPI).  
Fuente de verdad del dominio: `docs/Integrador.txt` (arquitectura, ERD, API, reglas de negocio), `docs/Historias_de_usuario.txt` (US-000 a US-076), `docs/Descripcion.txt` (visión general).

## Commands

### Backend (desde `backend/`)

```bash
# Activar venv (Windows)
.venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Aplicar migraciones
alembic upgrade head

# Cargar seed data (obligatorio después de la primera migración)
# En Windows usar PYTHONIOENCODING para evitar errores de encoding:
set PYTHONIOENCODING=utf-8 && python -m app.db.seed

# Correr servidor de desarrollo
uvicorn app.main:app --reload
```

Swagger UI: `http://localhost:8000/docs`

### Frontend (desde `frontend/`)

```bash
npm install
npm run dev        # dev server en http://localhost:5173
npm run build      # tsc + vite build
npm run lint       # eslint strict (0 warnings)
```

### Base de datos

```bash
# Crear nueva migración (desde backend/)
alembic revision --autogenerate -m "descripcion"

# Revertir última migración
alembic downgrade -1
```

## Architecture

### Backend — capas y flujo de imports

```
Router → Service → UoW → Repository → Model
```

Cada módulo bajo `app/modules/<nombre>/` tiene exactamente cinco archivos:
- `model.py` — SQLModel table. Sin imports de capas superiores.
- `repository.py` — hereda `BaseRepository[T]` de `app/core/repository.py`. Recibe la sesión del UoW por inyección.
- `service.py` — lógica de negocio stateless. Recibe `uow` como parámetro. **Nunca llama `session.commit()` directamente.**
- `schemas.py` — schemas Pydantic v2 separados: `*Create`, `*Update`, `*Read`. Nunca exponer el modelo SQLModel directamente como response.
- `router.py` — HTTP puro. Valida con schemas, delega al service, serializa con `response_model`.

`app/core/` contiene infraestructura compartida: `config.py`, `database.py`, `repository.py` (BaseRepository genérico), `uow.py` (Unit of Work).

### Unit of Work

`UnitOfWork` es un async context manager. Auto-commit al salir sin excepción, auto-rollback si ocurre error. Uso canónico en los routers:

```python
async with UnitOfWork() as uow:
    result = await service.crear_pedido(uow, body, usuario_id)
```

Cuando se implementa un módulo nuevo, se agrega su repository en `UnitOfWork._init_repositories()`.

### Routers en `main.py`

Los routers están **comentados** y se descomentan a medida que se implementa cada change. No descomentar un router hasta que el módulo esté completamente implementado.

### Frontend — Feature-Sliced Design

```
src/
  app/          ← providers, router, estilos globales
  pages/        ← solo define la ruta, delega al feature
  features/     ← auth | store | pedidos | admin (cada una autocontenida)
  entities/     ← tipos de dominio compartidos
  widgets/      ← componentes compuestos reutilizables
  shared/
    api/        ← instancia axios con interceptors JWT
    store/      ← 4 Zustand stores
    types/      ← tipos base
    lib/        ← queryClient
```

**Regla de imports**: flujo unidireccional Pages → Features → Hooks/Stores → API → Types. Sin cross-imports entre features.

### Zustand stores (en `shared/store/`)

| Store | Persiste | Gestiona |
|---|---|---|
| `authStore` | Sí (accessToken, user) | Sesión JWT, `hasRole()` |
| `cartStore` | Sí (items completos) | Items del carrito, totales |
| `paymentStore` | No | Estado del proceso MP (idle/processing/approved/rejected) |
| `uiStore` | No | cartOpen, sidebarOpen, confirmModal |

Reglas de consumo:
- Suscribirse siempre por slice: `useAuthStore(s => s.user)`, no al store completo.
- Acceso fuera de React (interceptores): `useAuthStore.getState().accessToken`.
- TanStack Query gestiona estado del **servidor** (productos, pedidos). Zustand gestiona estado del **cliente**. No mezclar.

### Axios interceptor (`shared/api/axios.ts`)

Adjunta `Authorization: Bearer <token>` en cada request. Maneja refresh automático en 401 con cola de requests pendientes para evitar refresh concurrente.

## Key Conventions

### CORS_ORIGINS en `.env`

Debe ser un JSON array (pydantic-settings v2 deserializa campos `list[str]` como JSON):

```env
CORS_ORIGINS=["http://localhost:5173"]
```

Si se pone como string simple, la app falla al arrancar.

### Soft delete

Entidades de negocio tienen `eliminado_en: Optional[datetime]`. `BaseRepository.get_by_id()` y `list_all()` filtran automáticamente `WHERE eliminado_en IS NULL`. Nunca usar `hard_delete` en entidades con este campo.

### Snapshot pattern en pedidos

`DetallePedido.nombre_snapshot` y `precio_snapshot` son inmutables al crear el pedido. Nunca se actualizan aunque el producto cambie de precio o nombre.

### FSM de estados de pedido

Transiciones válidas (validadas en la capa de servicio, nunca en el router):

```
PENDIENTE → CONFIRMADO | CANCELADO
CONFIRMADO → EN_PREP | CANCELADO
EN_PREP → EN_CAMINO | CANCELADO (solo ADMIN/PEDIDOS)
EN_CAMINO → ENTREGADO
ENTREGADO (terminal) — sin transiciones salientes
CANCELADO (terminal) — sin transiciones salientes
```

- RN-01: estado terminal no admite transiciones salientes.
- RN-02: primer `HistorialEstadoPedido` siempre tiene `estado_desde = NULL`.
- RN-03: `HistorialEstadoPedido` es append-only. Nunca UPDATE ni DELETE.
- RN-05: `motivo` es obligatorio cuando `nuevo_estado = CANCELADO`.

### Rate limiting

`POST /api/v1/auth/login` — 5 intentos por IP en 15 minutos (slowapi). Configurado en `app/main.py` con `@limiter.limit()` en el router de auth.

### API prefix y errores

Todos los endpoints usan prefijo `/api/v1`. Los errores siguen RFC 7807:
```json
{ "detail": "mensaje", "code": "ERROR_CODE", "field": "campo_opcional" }
```

Paginación estándar: `GET /recursos?page=1&size=20` → `{ "items": [...], "total": N, "page": 1, "size": 20, "pages": P }`.

### RBAC — roles

`ADMIN` | `STOCK` | `PEDIDOS` | `CLIENT`. JWT access token (30 min), refresh token en BD (7 días, invalidable via `revoked_at`).

## Implementation Order

```
us-000-setup      ← DONE (archivado)
us-001-auth       ← JWT · RBAC · refresh tokens (en progreso)
us-002-categorias
us-003-productos
us-004-carrito
us-005-pedidos
us-006-pagos-mercadopago
us-007-admin
us-008-direcciones
```

## Development Workflow (OPSX)

Todo cambio sigue el ciclo:

```
/opsx:explore   →  investigar antes de comprometerse (opcional)
/opsx:propose   →  generar propuesta + diseño + tareas
/opsx:apply     →  implementar tarea por tarea
/opsx:archive   →  sincronizar specs y cerrar el change
```

Los artefactos viven en `openspec/changes/<nombre>/` (proposal.md, design.md, tasks.md). Los specs archivados van a `openspec/changes/archive/`.
