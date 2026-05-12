# Proposal: us-000-setup — Infraestructura Base de Food Store

## Qué

Establecer la estructura completa del monorepo Food Store con:

- **Backend FastAPI** organizado en arquitectura de capas feature-first con todos los módulos funcionales scaffoldeados
- **Frontend React + TypeScript** organizado en Feature-Sliced Design con los cuatro stores Zustand configurados
- **Base de datos PostgreSQL** con todas las tablas del ERD v5 via Alembic y datos semilla obligatorios
- **Infraestructura transversal**: Unit of Work, BaseRepository[T], interceptores Axios, CORS, rate limiting

## Por qué

Sin este change no existe nada. Cada historia de usuario posterior depende directa o indirectamente de esta fundación:

- Sin estructura de carpetas no hay convención de módulos — cada desarrollador haría lo suyo
- Sin las tablas de la BD (`alembic upgrade head`) ningún endpoint puede persistir datos
- Sin seed data (roles, estados, formas de pago) el sistema no puede funcionar: el login, el RBAC y la máquina de estados todos dependen de registros catálogo con IDs estables
- Sin UoW y BaseRepository ningún servicio puede escribir con garantías transaccionales
- Sin los 4 stores Zustand y el interceptor Axios el frontend no tiene cimiento sobre el que construir las features

## Historias de usuario cubiertas

- **US-000**: Scaffolding del monorepo y estructura base
- **US-000a**: Configuración del entorno backend (FastAPI + dependencias)
- **US-000b**: Configuración de PostgreSQL, migraciones Alembic y seed data

## Alcance

### Incluido

**Backend**
- Estructura de carpetas feature-first con todos los módulos del sistema: `auth/`, `refreshtokens/`, `usuarios/`, `direcciones/`, `categorias/`, `productos/`, `pedidos/`, `pagos/`, `admin/`
- Cada módulo contiene archivos vacíos/stub: `model.py`, `schemas.py`, `repository.py`, `service.py`, `router.py`
- `core/` con: `config.py` (settings con Pydantic), `database.py` (engine + session), `security.py` (JWT + bcrypt), `uow.py` (Unit of Work)
- `core/repository.py` con `BaseRepository[T]` genérico
- `main.py` con FastAPI configurado: CORS middleware, rate limiting (slowapi), registro de todos los routers
- `alembic/` configurado con todas las migraciones del ERD v5 (16 tablas)
- `app/db/seed.py` idempotente con: 4 roles, 6 estados de pedido, 3 formas de pago, usuario admin
- `requirements.txt` con todas las dependencias fijadas
- `.env.example` con todas las variables documentadas

**Frontend**
- Estructura FSD: `src/app/`, `src/pages/`, `src/widgets/`, `src/features/`, `src/entities/`, `src/shared/`
- `src/shared/api/axios.ts` — instancia Axios con interceptores JWT (attach + refresh automático al 401)
- `src/store/authStore.ts` — autenticación con persist (solo accessToken)
- `src/store/cartStore.ts` — carrito con persist (items completos)
- `src/store/paymentStore.ts` — estado de pago sin persist
- `src/store/uiStore.ts` — estado de UI sin persist
- `tsconfig.json` con `strict: true`
- `vite.config.ts` con proxy a backend en desarrollo
- `package.json` con todas las dependencias

### Excluido

- Implementación real de endpoints (solo stubs/routers vacíos en backend)
- Componentes React de UI (solo estructura de carpetas en frontend)
- Lógica de negocio en servicios
- Tests

## Resultado esperado

Al terminar este change:
- `uvicorn app.main:app --reload` arranca sin errores en puerto 8000
- `/docs` muestra la documentación Swagger (sin endpoints todavía, solo el health check)
- `alembic upgrade head` crea las 16 tablas sin errores
- `python -m app.db.seed` carga los datos catálogo sin errores y es idempotente
- `npm install && npm run dev` arranca el frontend sin errores en puerto 5173
- Los 4 stores Zustand están disponibles y tipados correctamente
- El interceptor Axios adjunta tokens y maneja refresh automático
