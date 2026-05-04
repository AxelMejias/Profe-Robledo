# Find Skills — Cómo navegar el codebase de Food Store

Referencia para encontrar rápidamente cualquier cosa en el proyecto.

---

## Estructura de carpetas de un vistazo

```
food-store/
├── backend/
│   ├── app/
│   │   ├── core/          ← infraestructura compartida (config, db, security, repository, uow)
│   │   ├── modules/       ← un módulo por entidad de dominio
│   │   │   ├── auth/
│   │   │   ├── usuarios/
│   │   │   ├── categorias/
│   │   │   ├── productos/
│   │   │   ├── pedidos/
│   │   │   ├── pagos/
│   │   │   ├── refreshtokens/
│   │   │   ├── direcciones/
│   │   │   └── admin/
│   │   ├── db/            ← seed data
│   │   └── main.py        ← punto de entrada FastAPI
│   ├── alembic/           ← migraciones de base de datos
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/           ← providers, router, estilos globales
│       ├── pages/         ← una carpeta por ruta, solo define la página
│       ├── features/      ← lógica de negocio del cliente (auth, store, pedidos, admin)
│       ├── widgets/       ← componentes compuestos reutilizables
│       ├── entities/      ← tipos de dominio compartidos
│       └── shared/
│           ├── api/       ← instancia axios con interceptors
│           ├── store/     ← 4 stores Zustand
│           ├── lib/       ← queryClient
│           └── types/     ← tipos base (PaginatedResponse, ApiError)
├── docs/                  ← documentación del proyecto
├── openspec/              ← artefactos OPSX (proposals, designs, tasks)
└── CLAUDE.md              ← memoria del agente
```

---

## ¿Dónde está X?

| Qué busco | Dónde está |
|---|---|
| Configuración de variables de entorno | `backend/app/core/config.py` |
| Conexión a la base de datos | `backend/app/core/database.py` |
| Hash de contraseñas / JWT | `backend/app/core/security.py` |
| CRUD genérico | `backend/app/core/repository.py` |
| Unit of Work | `backend/app/core/uow.py` |
| Modelos de base de datos | `backend/app/modules/<modulo>/model.py` |
| Schemas de request/response | `backend/app/modules/<modulo>/schemas.py` |
| Lógica de negocio | `backend/app/modules/<modulo>/service.py` |
| Endpoints HTTP | `backend/app/modules/<modulo>/router.py` |
| Migraciones de BD | `backend/alembic/versions/` |
| Datos iniciales (roles, estados, admin) | `backend/app/db/seed.py` |
| Registro de routers | `backend/app/main.py` |
| Token JWT en requests | `frontend/src/shared/api/axios.ts` |
| Estado de sesión (login/logout) | `frontend/src/shared/store/authStore.ts` |
| Estado del carrito | `frontend/src/shared/store/cartStore.ts` |
| Estado del pago | `frontend/src/shared/store/paymentStore.ts` |
| Estado de UI (modals, sidebars) | `frontend/src/shared/store/uiStore.ts` |
| Configuración de TanStack Query | `frontend/src/shared/lib/queryClient.ts` |
| Rutas de la app | `frontend/src/app/App.tsx` |
| Providers globales | `frontend/src/app/providers.tsx` |
| Tipos de respuesta de la API | `frontend/src/shared/types/index.ts` |

---

## Reglas de imports en el frontend (FSD)

El flujo de imports es **unidireccional**:

```
pages → features → hooks/stores → api → types
```

- `pages` puede importar de `features`, `widgets`, `entities`, `shared`
- `features` puede importar de `entities`, `shared`
- `widgets` puede importar de `entities`, `shared`
- **Nunca** cross-imports entre features (feature A no importa de feature B)
- **Nunca** importar desde capas superiores (shared no importa de features)

---

## Reglas de imports en el backend (Feature-First)

El flujo es:

```
Router → Service → UoW → Repository → Model
```

- El router valida con schemas y delega al service
- El service recibe `uow` como parámetro y nunca llama `session.commit()` directamente
- El repository recibe la sesión del UoW por inyección
- El modelo no importa de ninguna capa superior

---

## Cada módulo del backend tiene exactamente estos 5 archivos

```
app/modules/<nombre>/
├── model.py        ← tabla SQLModel
├── schemas.py      ← Pydantic v2: *Create, *Update, *Read
├── repository.py   ← hereda BaseRepository[T]
├── service.py      ← lógica de negocio stateless
└── router.py       ← endpoints HTTP
```

---

## Buscar por funcionalidad

**¿Cómo se hashea la contraseña?**
→ `backend/app/core/security.py` → función `hash_password()`

**¿Cómo se genera el JWT?**
→ `backend/app/core/security.py` → función `create_access_token()`

**¿Cómo se adjunta el token a los requests?**
→ `frontend/src/shared/api/axios.ts` → request interceptor

**¿Cómo se maneja el refresh automático?**
→ `frontend/src/shared/api/axios.ts` → response interceptor, variable `isRefreshing` + `failedQueue`

**¿Cómo se crean las 16 tablas?**
→ `backend/alembic/versions/0001_initial_schema.py`

**¿Qué datos trae el seed?**
→ `backend/app/db/seed.py`

**¿Cómo se registran los routers en FastAPI?**
→ `backend/app/main.py` (comentados hasta que se implementa el módulo)

**¿Qué variables de entorno existen?**
→ `backend/.env.example` y `frontend/.env.example`
