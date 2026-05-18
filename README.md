# Food Store — Repositorio Base

Sistema de e-commerce de productos alimenticios desarrollado con **Spec-Driven Development (SDD)** usando OPSX y Claude Code.

---

## Documentación del sistema

Antes de escribir una línea de código, leé los tres documentos en `docs/`:

| Archivo | Contenido |
|---------|-----------|
| `docs/Descripcion.txt` | Visión general, actores del sistema y stack tecnológico |
| `docs/Integrador.txt` | Arquitectura en capas, ERD, API REST y patrones de diseño |
| `docs/Historias_de_usuario.txt` | US-000 a US-076 con criterios de aceptación y reglas de negocio |

Estos documentos son la fuente de verdad del sistema. El agente los lee antes de cada propuesta.

---

## Stack tecnológico

**Backend**: FastAPI · SQLModel · PostgreSQL · Alembic · bcrypt · python-jose · slowapi · MercadoPago SDK  
**Frontend**: React · TypeScript · Vite · TanStack Query · TanStack Form · Zustand · Axios · Tailwind CSS · Recharts

---

## Setup del entorno de desarrollo

### Requisitos previos
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Claude Code: `npm install -g @anthropic-ai/claude-code`
- OpenSpec CLI: `npm install -g @fission-ai/openspec`

### 1. Clonar e inicializar

```bash
git clone <url-del-repo> food-store
cd food-store
```

### 2. Inicializar OpenSpec

```bash
npx @fission-ai/openspec@latest init
```

Esto genera la carpeta `openspec/` donde van a vivir todos los artefactos del proyecto.

### 3. Backend

```bash
cd backend
cp .env.example .env
# Completar las variables de entorno en .env

python -m venv .venv
source .venv/bin/activate   # Linux/Mac
.venv\Scripts\activate      # Windows

pip install -r requirements.txt
alembic upgrade head
python -m app.db.seed
uvicorn app.main:app --reload
```

API disponible en `http://localhost:8000`  
Documentación Swagger en `http://localhost:8000/docs`

### 4. Frontend

```bash
cd frontend
cp .env.example .env
# Completar VITE_API_URL=http://localhost:8000

npm install
npm run dev
```

App disponible en `http://localhost:5173`

---

## Flujo de desarrollo con OPSX

Todo cambio al sistema sigue este ciclo:

```
/opsx:explore   →  pensar antes de comprometerse (opcional)
/opsx:propose   →  generar propuesta + diseño + tareas
/opsx:apply     →  implementar tarea por tarea
/opsx:archive   →  sincronizar specs y cerrar el change
```

### Orden de implementación

```
us-000-setup               ← infraestructura base (Sprint 0)
us-001-auth                ← JWT · RBAC · refresh tokens
us-002-categorias          ← catálogo jerárquico
us-003-productos           ← CRUD · stock · ingredientes
us-004-carrito             ← estado client-side con Zustand
us-005-pedidos             ← UoW · FSM · audit trail
us-006-pagos-mercadopago   ← checkout · webhooks IPN
us-007-admin               ← panel · métricas
us-008-direcciones         ← direcciones de entrega
```

---

## Variables de entorno

Crear `backend/.env` a partir de `backend/.env.example`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/foodstore
SECRET_KEY=tu-clave-secreta-de-64-caracteres-minimo
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
MP_ACCESS_TOKEN=TEST-tu-token-de-mercadopago
MP_PUBLIC_KEY=TEST-tu-public-key-de-mercadopago
CORS_ORIGINS=http://localhost:5173
```

Crear `frontend/.env` a partir de `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:8000
VITE_MP_PUBLIC_KEY=TEST-tu-public-key-de-mercadopago
```

---

## Convenciones de commits

```
feat(modulo): descripción del cambio
fix(modulo): descripción del bug corregido
refactor(modulo): descripción del refactor
test(modulo): descripción de los tests
docs(modulo): descripción del cambio en docs
```

---

## Changelog

### 2026-05-18 — Integración MercadoPago Checkout Pro + personalización de productos

**MercadoPago Checkout Pro (sandbox)**
- Integración completa del flujo de pago: creación de preferencia → checkout MP → webhook IPN → transición automática PENDIENTE → CONFIRMADO
- Webhook: verificación de firma HMAC-SHA256; en modo sandbox (`MP_SANDBOX=true`) la firma se omite para compatibilidad con el entorno de pruebas de MP
- Columna `mp_payment_id` migrada de `INTEGER` a `BIGINT` (migración `0008`) — los IDs de pago de MP superan el máximo de 32 bits
- Nuevo archivo `backend/.env.example` con todas las variables necesarias incluyendo `MP_NOTIFICATION_URL` y `MP_WEBHOOK_SECRET`
- Para pruebas locales se requiere ngrok (u otro túnel HTTP) con la URL configurada en `MP_NOTIFICATION_URL` y en el panel de webhooks de MP

**Personalización de productos (ingredientes como extras)**
- Los productos ahora soportan ingredientes configurables con `tipo_extra`, `precio_extra` y `disponible_como_extra`
- El carrito y el modal de personalización permiten seleccionar extras al agregar un producto
- Nuevo campo `cantidad` en la tabla intermedia `producto_ingredientes`
- Migraciones `0003` a `0007` para los nuevos campos en ingredientes y producto_ingredientes
- Seed actualizado con datos de ejemplo para ingredientes y extras

**Frontend**
- `PersonalizacionModal`: selección de extras con validación de límites y cálculo de precio en tiempo real
- `CartDrawer`: muestra los extras seleccionados por ítem
- `ProductoCard` / `ProductoDetalle`: integrados con el modal de personalización
- `GestionIngredientes` (admin): CRUD completo de ingredientes con soporte para tipo extra y precio
- `FormProducto` (admin): gestión de ingredientes asociados al producto con cantidad y precio extra
