# Design: us-000-setup — Infraestructura Base de Food Store

## Árbol de archivos completo

### Backend

```
backend/
├── requirements.txt
├── .env.example
├── alembic.ini
├── alembic/
│   ├── env.py
│   └── versions/
│       └── 0001_initial_schema.py
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── security.py
│   │   ├── uow.py
│   │   └── repository.py
│   ├── db/
│   │   ├── __init__.py
│   │   └── seed.py
│   └── modules/
│       ├── auth/
│       │   ├── __init__.py
│       │   ├── model.py
│       │   ├── schemas.py
│       │   ├── repository.py
│       │   ├── service.py
│       │   └── router.py
│       ├── refreshtokens/
│       │   ├── __init__.py
│       │   ├── model.py
│       │   ├── schemas.py
│       │   ├── repository.py
│       │   ├── service.py
│       │   └── router.py
│       ├── usuarios/
│       │   └── ... (misma estructura)
│       ├── direcciones/
│       │   └── ...
│       ├── categorias/
│       │   └── ...
│       ├── productos/
│       │   └── ...
│       ├── pedidos/
│       │   └── ...
│       ├── pagos/
│       │   └── ...
│       └── admin/
│           └── ...
```

### Frontend

```
frontend/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
├── index.html
└── src/
    ├── app/
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── providers.tsx
    ├── pages/
    │   └── .gitkeep
    ├── widgets/
    │   └── .gitkeep
    ├── features/
    │   └── .gitkeep
    ├── entities/
    │   └── .gitkeep
    └── shared/
        ├── api/
        │   └── axios.ts
        ├── store/
        │   ├── authStore.ts
        │   ├── cartStore.ts
        │   ├── paymentStore.ts
        │   └── uiStore.ts
        ├── types/
        │   └── index.ts
        └── lib/
            └── queryClient.ts
```

---

## Backend — Diseño detallado

### `app/core/config.py`

Usa `pydantic-settings` con `BaseSettings` para leer variables de entorno. Todas las variables tienen tipos explícitos y valores por defecto razonables para desarrollo.

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]
    MP_ACCESS_TOKEN: str = ""
    MP_PUBLIC_KEY: str = ""
    MP_NOTIFICATION_URL: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
```

### `app/core/database.py`

Engine asíncrono con `create_async_engine` de SQLAlchemy. Session factory como async context manager.

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlmodel import SQLModel

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
```

> **Nota**: Si se elige implementación sincrónica (más simple para el parcial), usar `create_engine` + `Session` sin async. La arquitectura en capas no cambia.

### `app/core/repository.py` — BaseRepository[T]

```python
from typing import Generic, TypeVar, Type
from sqlmodel import SQLModel, select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

T = TypeVar("T", bound=SQLModel)

class BaseRepository(Generic[T]):
    def __init__(self, model: Type[T], session: AsyncSession):
        self.model = model
        self.session = session

    async def get_by_id(self, entity_id: int) -> T | None:
        result = await self.session.get(self.model, entity_id)
        if result and hasattr(result, "eliminado_en") and result.eliminado_en:
            return None
        return result

    async def list_all(self, skip: int = 0, limit: int = 20) -> list[T]:
        stmt = select(self.model)
        if hasattr(self.model, "eliminado_en"):
            stmt = stmt.where(self.model.eliminado_en == None)
        stmt = stmt.offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def count(self) -> int:
        stmt = select(func.count()).select_from(self.model)
        if hasattr(self.model, "eliminado_en"):
            stmt = stmt.where(self.model.eliminado_en == None)
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def create(self, entity: T) -> T:
        self.session.add(entity)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def update(self, entity: T) -> T:
        self.session.add(entity)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def soft_delete(self, entity: T) -> None:
        entity.eliminado_en = datetime.now(timezone.utc)
        self.session.add(entity)
        await self.session.flush()

    async def hard_delete(self, entity: T) -> None:
        await self.session.delete(entity)
        await self.session.flush()
```

### `app/core/uow.py` — Unit of Work

El UoW actúa como context manager. Al entrar (`__aenter__`) abre la sesión e inicializa los repositorios como atributos. Al salir sin excepción hace `commit`. Si hay excepción hace `rollback`. Los servicios nunca llaman `session.commit()` directamente.

```python
from app.core.database import AsyncSessionLocal

class UnitOfWork:
    def __init__(self):
        self._session = None

    async def __aenter__(self):
        self._session = AsyncSessionLocal()
        # Los repositorios se inicializan aquí (lazy, a medida que se agregan módulos)
        # Ejemplo: self.usuarios = UsuarioRepository(self._session)
        return self

    async def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            await self._session.rollback()
        else:
            await self._session.commit()
        await self._session.close()

    async def flush(self):
        await self._session.flush()
```

> Cada módulo que se implemente en changes posteriores agrega su repositorio al UoW.

### `app/core/security.py`

```python
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=30))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
```

### `app/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Food Store API", version="1.0.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers se registran aquí en changes posteriores
# app.include_router(auth_router, prefix="/api/v1")

@app.get("/health")
async def health():
    return {"status": "ok"}
```

### Migración Alembic — 16 tablas del ERD v5

La migración `0001_initial_schema.py` crea estas tablas en orden (respetando FKs):

1. `roles` — catálogo (id, codigo VARCHAR(20) PK semántica, nombre, descripcion)
2. `estados_pedido` — catálogo (codigo VARCHAR(20) PK, nombre, descripcion, es_terminal BOOLEAN, orden INTEGER)
3. `formas_pago` — catálogo (codigo VARCHAR(20) PK, nombre, descripcion, habilitado BOOLEAN)
4. `usuarios` — (id BIGSERIAL PK, nombre, apellido, email UQ, password_hash CHAR(60), telefono, creado_en, actualizado_en, eliminado_en)
5. `usuario_roles` — pivot (usuario_id FK, rol_codigo FK, asignado_por_id FK NULL, asignado_en)
6. `refresh_tokens` — (id, token_hash CHAR(64) UQ, usuario_id FK, expires_at TIMESTAMPTZ, revoked_at NULL, creado_en)
7. `direcciones_entrega` — (id, usuario_id FK, alias VARCHAR(50), linea1, linea2 NULL, ciudad, codigo_postal, referencia NULL, es_principal BOOLEAN, creado_en, actualizado_en, eliminado_en)
8. `categorias` — (id, nombre, descripcion, imagen_url NULL, parent_id FK self-ref NULL, creado_en, actualizado_en, eliminado_en)
9. `ingredientes` — (id, nombre UQ VARCHAR(100), descripcion NULL, es_alergeno BOOLEAN, creado_en, actualizado_en, eliminado_en)
10. `productos` — (id, nombre, descripcion, imagen_url NULL, precio_base DECIMAL(10,2), stock_cantidad INTEGER CHECK >= 0, disponible BOOLEAN, creado_en, actualizado_en, eliminado_en)
11. `producto_categorias` — pivot (producto_id FK, categoria_id FK, es_principal BOOLEAN, PK compuesta)
12. `producto_ingredientes` — pivot (producto_id FK, ingrediente_id FK, es_removible BOOLEAN, PK compuesta)
13. `pedidos` — (id BIGSERIAL, usuario_id FK, estado_codigo FK, direccion_id FK NULL SET NULL, forma_pago_codigo FK, total DECIMAL, costo_envio DECIMAL default 50.00, nombre_snapshot TEXT, precio_snapshot TEXT, direccion_snapshot JSONB, notas NULL, creado_en, actualizado_en, eliminado_en)
14. `detalle_pedidos` — (id, pedido_id FK, producto_id FK, nombre_snapshot VARCHAR(200), precio_snapshot DECIMAL(10,2), cantidad INTEGER CHECK >= 1, subtotal DECIMAL, personalizacion INTEGER[] NULL)
15. `historial_estados_pedido` — (id, pedido_id FK, estado_desde VARCHAR(20) FK NULL, estado_hasta VARCHAR(20) FK, usuario_id FK NULL, motivo TEXT NULL, created_at TIMESTAMPTZ default NOW) — sin updated_at, append-only
16. `pagos` — (id, pedido_id FK, monto DECIMAL, mp_payment_id BIGINT UQ NULL, mp_status VARCHAR(30), external_reference VARCHAR(100) UQ, idempotency_key VARCHAR(100) UQ, creado_en, actualizado_en)

### `app/db/seed.py` — Datos semilla idempotentes

```python
"""
Ejecutar: python -m app.db.seed
Idempotente: puede ejecutarse múltiples veces sin duplicar datos.
"""

ROLES = [
    {"codigo": "ADMIN", "nombre": "Administrador", "descripcion": "Acceso total al sistema"},
    {"codigo": "STOCK", "nombre": "Gestor de Stock", "descripcion": "Gestiona productos e inventario"},
    {"codigo": "PEDIDOS", "nombre": "Gestor de Pedidos", "descripcion": "Gestiona el ciclo de vida de pedidos"},
    {"codigo": "CLIENT", "nombre": "Cliente", "descripcion": "Usuario final de la tienda"},
]

ESTADOS_PEDIDO = [
    {"codigo": "PENDIENTE",   "nombre": "Pendiente",       "es_terminal": False, "orden": 1},
    {"codigo": "CONFIRMADO",  "nombre": "Confirmado",       "es_terminal": False, "orden": 2},
    {"codigo": "EN_PREP",     "nombre": "En Preparación",   "es_terminal": False, "orden": 3},
    {"codigo": "EN_CAMINO",   "nombre": "En Camino",        "es_terminal": False, "orden": 4},
    {"codigo": "ENTREGADO",   "nombre": "Entregado",        "es_terminal": True,  "orden": 5},
    {"codigo": "CANCELADO",   "nombre": "Cancelado",        "es_terminal": True,  "orden": 6},
]

FORMAS_PAGO = [
    {"codigo": "MERCADOPAGO",   "nombre": "MercadoPago",    "habilitado": True},
    {"codigo": "EFECTIVO",      "nombre": "Efectivo",       "habilitado": True},
    {"codigo": "TRANSFERENCIA", "nombre": "Transferencia",  "habilitado": True},
]

ADMIN_USER = {
    "nombre": "Admin",
    "apellido": "FoodStore",
    "email": "admin@foodstore.com",
    "password": "Admin1234!",  # Se hashea con bcrypt en seed
}
```

La lógica usa `INSERT ... ON CONFLICT DO NOTHING` (o equivalente con SQLModel) para garantizar idempotencia.

---

## Frontend — Diseño detallado

### `src/shared/api/axios.ts` — Interceptores JWT

```typescript
import axios from "axios";
import { useAuthStore } from "../store/authStore";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api/v1",
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: adjunta access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: refresh automático al 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/v1/auth/refresh`,
          { refresh_token: refreshToken }
        );
        useAuthStore.getState().updateTokens(data.access_token, data.refresh_token);
        failedQueue.forEach((p) => p.resolve(data.access_token));
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch {
        failedQueue.forEach((p) => p.reject(error));
        useAuthStore.getState().logout();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
        failedQueue = [];
      }
    }
    return Promise.reject(error);
  }
);
```

### `src/shared/store/authStore.ts`

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthUser {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  roles: string[];
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  logout: () => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      login: (accessToken, refreshToken, user) =>
        set({ accessToken, refreshToken, user, isAuthenticated: true }),
      logout: () =>
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false }),
      updateTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      hasRole: (role) => get().user?.roles.includes(role) ?? false,
    }),
    {
      name: "food-store-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### `src/shared/store/cartStore.ts`

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartItem {
  producto_id: number;
  nombre: string;
  precio: number;
  imagen_url: string | null;
  cantidad: number;
  personalizacion: number[]; // IDs de ingredientes removidos
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "cantidad">, cantidad?: number) => void;
  removeItem: (producto_id: number) => void;
  updateCantidad: (producto_id: number, cantidad: number) => void;
  clearCart: () => void;
  itemCount: () => number;
  subtotal: () => number;
  costoEnvio: () => number;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, cantidad = 1) => {
        const existing = get().items.find((i) => i.producto_id === item.producto_id);
        if (existing) {
          set({ items: get().items.map((i) =>
            i.producto_id === item.producto_id
              ? { ...i, cantidad: i.cantidad + cantidad }
              : i
          )});
        } else {
          set({ items: [...get().items, { ...item, cantidad }] });
        }
      },
      removeItem: (producto_id) =>
        set({ items: get().items.filter((i) => i.producto_id !== producto_id) }),
      updateCantidad: (producto_id, cantidad) =>
        set({ items: get().items.map((i) =>
          i.producto_id === producto_id ? { ...i, cantidad } : i
        )}),
      clearCart: () => set({ items: [] }),
      itemCount: () => get().items.reduce((acc, i) => acc + i.cantidad, 0),
      subtotal: () => get().items.reduce((acc, i) => acc + i.precio * i.cantidad, 0),
      costoEnvio: () => (get().items.length > 0 ? 50 : 0),
      total: () => get().subtotal() + get().costoEnvio(),
    }),
    {
      name: "food-store-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
```

### `src/shared/store/paymentStore.ts`

```typescript
import { create } from "zustand";

type PaymentStatus = "idle" | "processing" | "approved" | "rejected" | "error";

interface PaymentState {
  status: PaymentStatus;
  mpPaymentId: number | null;
  statusDetail: string | null;
  setPaymentStatus: (status: PaymentStatus, mpPaymentId?: number, statusDetail?: string) => void;
  reset: () => void;
}

export const usePaymentStore = create<PaymentState>()((set) => ({
  status: "idle",
  mpPaymentId: null,
  statusDetail: null,
  setPaymentStatus: (status, mpPaymentId = null, statusDetail = null) =>
    set({ status, mpPaymentId, statusDetail }),
  reset: () => set({ status: "idle", mpPaymentId: null, statusDetail: null }),
}));
```

### `src/shared/store/uiStore.ts`

```typescript
import { create } from "zustand";

interface UIState {
  cartOpen: boolean;
  sidebarOpen: boolean;
  confirmModal: { open: boolean; message: string; onConfirm: (() => void) | null };
  openCart: () => void;
  closeCart: () => void;
  toggleSidebar: () => void;
  openConfirmModal: (message: string, onConfirm: () => void) => void;
  closeConfirmModal: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  cartOpen: false,
  sidebarOpen: false,
  confirmModal: { open: false, message: "", onConfirm: null },
  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openConfirmModal: (message, onConfirm) =>
    set({ confirmModal: { open: true, message, onConfirm } }),
  closeConfirmModal: () =>
    set({ confirmModal: { open: false, message: "", onConfirm: null } }),
}));
```

### `src/shared/lib/queryClient.ts`

```typescript
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 2, // 2 minutos
      refetchOnWindowFocus: false,
    },
  },
});
```

---

## Dependencias — `requirements.txt`

```
fastapi>=0.111.0
uvicorn[standard]>=0.29.0
sqlmodel>=0.0.19
sqlalchemy[asyncio]>=2.0.0
alembic>=1.13.0
asyncpg>=0.29.0           # driver async PostgreSQL
psycopg2-binary>=2.9.9   # driver sync para Alembic env.py
passlib[bcrypt]>=1.7.4
python-jose[cryptography]>=3.3.0
slowapi>=0.1.9
mercadopago>=2.3.0
pydantic-settings>=2.0.0
pydantic[email]>=2.0.0
httpx>=0.27.0
python-multipart>=0.0.9
```

## Dependencias — `package.json` (frontend)

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.0",
    "@tanstack/react-query": "^5.40.0",
    "@tanstack/react-form": "^0.28.0",
    "zustand": "^4.5.2",
    "axios": "^1.7.2",
    "recharts": "^2.12.7",
    "@mercadopago/sdk-react": "^0.0.19",
    "tailwindcss": "^3.4.4",
    "clsx": "^2.1.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.4.5",
    "vite": "^5.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.39"
  }
}
```

---

## Decisiones de diseño clave

| Decisión | Elección | Razón |
|----------|----------|-------|
| ORM | SQLModel | Unifica modelos SQLAlchemy + schemas Pydantic, creado por el mismo autor de FastAPI |
| Async vs sync | Async con `asyncpg` | FastAPI es ASGI, el async permite mayor throughput sin threading |
| Persistencia estado | Zustand `persist` | Carrito y sesión sobreviven al refresh; paymentStore y uiStore son efímeros |
| PK catálogos | `codigo VARCHAR(20)` semántica | Los IDs de roles y estados son estables y legibles en el código (ej: `"ADMIN"`, `"PENDIENTE"`) |
| Seed idempotente | `ON CONFLICT DO NOTHING` | Permite re-ejecutar sin errores en cualquier entorno |
| Error format | RFC 7807 | Estándar de la industria, FastAPI lo genera nativamente con `HTTPException` |
