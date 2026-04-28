"""
Script de seed — datos catálogo obligatorios para Food Store.

Ejecutar UNA VEZ después de `alembic upgrade head`:
    cd backend
    python -m app.db.seed

Idempotente: ejecutarlo múltiples veces no duplica datos.
Usa INSERT ... ON CONFLICT DO NOTHING en cada entidad.
"""

import os
import re
import sys

from sqlalchemy import create_engine, text

# ---------------------------------------------------------------------------
# URL de BD — convierte asyncpg → psycopg2 si hace falta
# ---------------------------------------------------------------------------
_raw_url = os.environ.get("DATABASE_URL", "")
if not _raw_url:
    try:
        from app.core.config import settings
        _raw_url = settings.DATABASE_URL
    except Exception:
        print("ERROR: no se encontró DATABASE_URL en el entorno ni en .env")
        sys.exit(1)

SYNC_URL = re.sub(r"^postgresql\+asyncpg", "postgresql+psycopg2", _raw_url)
SYNC_URL = re.sub(r"^postgresql://", "postgresql+psycopg2://", SYNC_URL)


# ---------------------------------------------------------------------------
# Datos catálogo
# ---------------------------------------------------------------------------

ROLES = [
    ("ADMIN",   "Administrador",      "Acceso total al sistema"),
    ("STOCK",   "Gestor de Stock",    "Gestiona productos e inventario"),
    ("PEDIDOS", "Gestor de Pedidos",  "Gestiona el ciclo de vida de pedidos"),
    ("CLIENT",  "Cliente",            "Usuario final de la tienda"),
]

ESTADOS_PEDIDO = [
    ("PENDIENTE",  "Pendiente",       "Pedido creado, pago pendiente",       False, 1),
    ("CONFIRMADO", "Confirmado",      "Pago procesado y confirmado",         False, 2),
    ("EN_PREP",    "En Preparación",  "En preparación en cocina",            False, 3),
    ("EN_CAMINO",  "En Camino",       "Despachado al cliente",               False, 4),
    ("ENTREGADO",  "Entregado",       "Entrega confirmada por el cliente",   True,  5),
    ("CANCELADO",  "Cancelado",       "Pedido cancelado",                    True,  6),
]

FORMAS_PAGO = [
    ("MERCADOPAGO",   "MercadoPago",    "Pago via MercadoPago Checkout API"),
    ("EFECTIVO",      "Efectivo",       "Pago en efectivo al recibir"),
    ("TRANSFERENCIA", "Transferencia",  "Transferencia bancaria"),
]

ADMIN_EMAIL    = os.environ.get("ADMIN_EMAIL",    "admin@foodstore.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Admin1234!")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _hash_password(password: str) -> str:
    import bcrypt as _bcrypt
    return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt(rounds=12)).decode()


def _seed_roles(conn) -> None:
    inserted = 0
    for codigo, nombre, descripcion in ROLES:
        result = conn.execute(
            text(
                "INSERT INTO roles (codigo, nombre, descripcion) "
                "VALUES (:codigo, :nombre, :descripcion) "
                "ON CONFLICT (codigo) DO NOTHING"
            ),
            {"codigo": codigo, "nombre": nombre, "descripcion": descripcion},
        )
        inserted += result.rowcount
    total = len(ROLES)
    skipped = total - inserted
    print(f"  roles          → {inserted} insertados, {skipped} ya existían")


def _seed_estados_pedido(conn) -> None:
    inserted = 0
    for codigo, nombre, descripcion, es_terminal, orden in ESTADOS_PEDIDO:
        result = conn.execute(
            text(
                "INSERT INTO estados_pedido "
                "(codigo, nombre, descripcion, es_terminal, orden) "
                "VALUES (:codigo, :nombre, :descripcion, :es_terminal, :orden) "
                "ON CONFLICT (codigo) DO NOTHING"
            ),
            {
                "codigo": codigo,
                "nombre": nombre,
                "descripcion": descripcion,
                "es_terminal": es_terminal,
                "orden": orden,
            },
        )
        inserted += result.rowcount
    total = len(ESTADOS_PEDIDO)
    skipped = total - inserted
    print(f"  estados_pedido → {inserted} insertados, {skipped} ya existían")


def _seed_formas_pago(conn) -> None:
    inserted = 0
    for codigo, nombre, descripcion in FORMAS_PAGO:
        result = conn.execute(
            text(
                "INSERT INTO formas_pago (codigo, nombre, descripcion, habilitado) "
                "VALUES (:codigo, :nombre, :descripcion, true) "
                "ON CONFLICT (codigo) DO NOTHING"
            ),
            {"codigo": codigo, "nombre": nombre, "descripcion": descripcion},
        )
        inserted += result.rowcount
    total = len(FORMAS_PAGO)
    skipped = total - inserted
    print(f"  formas_pago    → {inserted} insertados, {skipped} ya existían")


def _seed_admin_user(conn) -> None:
    # Verificar si ya existe
    row = conn.execute(
        text("SELECT id FROM usuarios WHERE email = :email"),
        {"email": ADMIN_EMAIL},
    ).fetchone()

    if row:
        print(f"  usuario admin  → ya existe ({ADMIN_EMAIL}), omitido")
        return

    password_hash = _hash_password(ADMIN_PASSWORD)
    result = conn.execute(
        text(
            "INSERT INTO usuarios "
            "(nombre, apellido, email, password_hash) "
            "VALUES ('Admin', 'FoodStore', :email, :hash) "
            "RETURNING id"
        ),
        {"email": ADMIN_EMAIL, "hash": password_hash},
    )
    usuario_id = result.fetchone()[0]

    conn.execute(
        text(
            "INSERT INTO usuario_roles (usuario_id, rol_codigo) "
            "VALUES (:uid, 'ADMIN') "
            "ON CONFLICT DO NOTHING"
        ),
        {"uid": usuario_id},
    )
    print(f"  usuario admin  → creado (id={usuario_id}, email={ADMIN_EMAIL})")
    print(f"  ATENCION: cambia la contrasena del admin antes de ir a produccion")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def run() -> None:
    print("Food Store — seed data")
    print(f"BD: {SYNC_URL.split('@')[-1]}")  # muestra solo host/db, no credenciales
    print()

    engine = create_engine(SYNC_URL, echo=False)

    with engine.begin() as conn:
        _seed_roles(conn)
        _seed_estados_pedido(conn)
        _seed_formas_pago(conn)
        _seed_admin_user(conn)

    print()
    print("Seed completado.")


if __name__ == "__main__":
    run()
