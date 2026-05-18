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

CATEGORIAS = [
    ("Hamburguesas", "Clásicas y especiales"),
    ("Bebidas",      "Frías y calientes"),
    ("Postres",      "Dulces para cerrar"),
    ("Combos",       "Armá tu combo completo"),
]

# (nombre, descripcion, es_alergeno, unidad_medida, precio, tipo_extra, disponible_como_extra)
INGREDIENTES = [
    ("Medallón de carne",   "Medallón de carne vacuna, 150g",              False,  "UNIDAD",   1400, "hamburguesa", True),
    ("Pan brioche",         "Pan artesanal con semillas de sésamo",        True,   "UNIDAD",    400, "hamburguesa", False),
    ("Lechuga",             "Lechuga fresca",                              False,  "G",         150, "hamburguesa", True),
    ("Tomate",              "Tomate fresco en rodajas",                    False,  "G",         180, "hamburguesa", True),
    ("Queso cheddar",       "Feta de queso cheddar madurado, 25g",         True,   "G",         500, "hamburguesa", True),
    ("Cebolla",             "Cebolla en aros o caramelizada",              False,  "G",         100, "hamburguesa", True),
    ("Panceta",             "Panceta ahumada crocante",                    False,  "G",         600, "hamburguesa", True),
    ("Salsa BBQ",           "Salsa barbecue ahumada",                      False,  "ML",        180, "hamburguesa", True),
    ("Ketchup",             "Salsa de tomate",                             False,  "ML",        120, "hamburguesa", True),
    ("Mayonesa",            "Mayonesa casera",                             True,   "ML",        120, "hamburguesa", True),
    ("Chocolate",           "Cobertura de chocolate negro",                True,   "G",         800, "postre",      False),
    ("Harina de trigo",     "Harina 0000",                                 True,   "G",         150, "postre",      False),
    ("Huevo",               "Huevo de gallina",                            True,   "UNIDAD",    200, "postre",      False),
    ("Azúcar",              "Azúcar refinada",                             False,  "G",         100, "postre",      False),
    ("Helado de vainilla",  "Crema de vainilla artesanal",                 True,   "ML",        600, "postre",      True),
    ("Crema de leche",      "Crema para repostería",                       True,   "ML",        350, "postre",      True),
    ("Naranja",             "Naranja fresca exprimida",                    False,  "UNIDAD",    300, "jugo",        True),
]

# producto → [(ingrediente, es_removible, cantidad)]
PRODUCTO_INGREDIENTES = {
    "Hamburguesa Clásica": [
        ("Medallón de carne", False, 1),
        ("Pan brioche",       False, 1),
        ("Lechuga",           True,  1),
        ("Tomate",            True,  1),
        ("Queso cheddar",     True,  1),
        ("Ketchup",           True,  1),
        ("Mayonesa",          True,  1),
    ],
    "Hamburguesa Doble": [
        ("Medallón de carne", False, 2),
        ("Pan brioche",       False, 1),
        ("Queso cheddar",     True,  1),
        ("Cebolla",           True,  1),
        ("Ketchup",           True,  1),
        ("Mayonesa",          True,  1),
    ],
    "Hamburguesa BBQ": [
        ("Medallón de carne", False, 1),
        ("Pan brioche",       False, 1),
        ("Queso cheddar",     True,  1),
        ("Panceta",           True,  1),
        ("Cebolla",           True,  1),
        ("Salsa BBQ",         True,  1),
    ],
    "Jugo de Naranja": [
        ("Naranja",           False, 1),
    ],
    "Brownie con helado": [
        ("Chocolate",         False, 1),
        ("Harina de trigo",   False, 1),
        ("Huevo",             False, 1),
        ("Azúcar",            False, 1),
        ("Helado de vainilla", True, 1),
        ("Crema de leche",    True,  1),
    ],
    "Combo Clásico": [
        ("Medallón de carne", False, 1),
        ("Pan brioche",       False, 1),
        ("Lechuga",           True,  1),
        ("Tomate",            True,  1),
        ("Queso cheddar",     True,  1),
        ("Ketchup",           True,  1),
        ("Mayonesa",          True,  1),
    ],
}

# (nombre, descripcion, precio, stock, categoria)
PRODUCTOS = [
    ("Hamburguesa Clásica",   "Carne, lechuga, tomate y queso",        1200.00, 50, "Hamburguesas", "https://i.imgur.com/55LETSM.png"),
    ("Hamburguesa Doble",     "Doble medallón con cheddar y cebolla",  1750.00, 30, "Hamburguesas", "https://i.imgur.com/MmEOXVA.png"),
    ("Hamburguesa BBQ",       "Medallón, panceta y salsa BBQ",         1900.00, 25, "Hamburguesas", "https://i.imgur.com/NNMZqQS.png"),
    ("Coca-Cola 500ml",       "Lata fría",                              350.00, 100, "Bebidas",     "https://i.imgur.com/Z3fd94q.jpeg"),
    ("Agua Mineral",          "Sin gas, 500ml",                         200.00, 80,  "Bebidas",     "https://i.imgur.com/0dnhFWX.jpeg"),
    ("Jugo de Naranja",       "Natural exprimido",                      450.00, 40,  "Bebidas",     "https://i.imgur.com/4AtOmta.png"),
    ("Brownie con helado",    "Brownie tibio + bocha de vainilla",      800.00, 20,  "Postres",     "https://i.imgur.com/I9P7XOS.jpeg"),
    ("Combo Clásico",         "Hamburguesa Clásica + bebida a elección", 1500.00, 40, "Combos",      "https://i.imgur.com/HLEDpQz.jpeg"),
]


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


def _seed_categorias(conn) -> dict[str, int]:
    """Inserta categorías y devuelve un dict nombre→id."""
    nombre_a_id: dict[str, int] = {}
    for nombre, descripcion in CATEGORIAS:
        row = conn.execute(
            text("SELECT id FROM categorias WHERE nombre = :nombre AND eliminado_en IS NULL"),
            {"nombre": nombre},
        ).fetchone()
        if row:
            nombre_a_id[nombre] = row[0]
        else:
            result = conn.execute(
                text(
                    "INSERT INTO categorias (nombre, descripcion) "
                    "VALUES (:nombre, :descripcion) RETURNING id"
                ),
                {"nombre": nombre, "descripcion": descripcion},
            )
            nombre_a_id[nombre] = result.fetchone()[0]
    print(f"  categorias     → {len(CATEGORIAS)} procesadas")
    return nombre_a_id


def _seed_productos(conn, nombre_a_cat_id: dict[str, int]) -> dict[str, int]:
    """Inserta productos y devuelve un dict nombre→id."""
    nombre_a_id: dict[str, int] = {}
    inserted = 0
    for nombre, descripcion, precio, stock, categoria, imagen_url in PRODUCTOS:
        row = conn.execute(
            text("SELECT id FROM productos WHERE nombre = :nombre AND eliminado_en IS NULL"),
            {"nombre": nombre},
        ).fetchone()
        if row:
            producto_id = row[0]
        else:
            result = conn.execute(
                text(
                    "INSERT INTO productos (nombre, descripcion, precio_base, stock_cantidad, disponible, imagen_url) "
                    "VALUES (:nombre, :descripcion, :precio, :stock, true, :imagen) RETURNING id"
                ),
                {"nombre": nombre, "descripcion": descripcion, "precio": precio, "stock": stock, "imagen": imagen_url},
            )
            producto_id = result.fetchone()[0]
            inserted += 1

        nombre_a_id[nombre] = producto_id

        cat_id = nombre_a_cat_id.get(categoria)
        if cat_id:
            conn.execute(
                text(
                    "INSERT INTO producto_categorias (producto_id, categoria_id, es_principal) "
                    "VALUES (:pid, :cid, true) ON CONFLICT DO NOTHING"
                ),
                {"pid": producto_id, "cid": cat_id},
            )
    skipped = len(PRODUCTOS) - inserted
    print(f"  productos      → {inserted} insertados, {skipped} ya existían")
    return nombre_a_id


def _seed_ingredientes(conn) -> dict[str, int]:
    """Inserta ingredientes y devuelve un dict nombre→id."""
    nombre_a_id: dict[str, int] = {}
    inserted = 0
    for nombre, descripcion, es_alergeno, unidad_medida, precio, tipo_extra, disponible_como_extra in INGREDIENTES:
        row = conn.execute(
            text("SELECT id FROM ingredientes WHERE nombre = :nombre AND eliminado_en IS NULL"),
            {"nombre": nombre},
        ).fetchone()
        if row:
            nombre_a_id[nombre] = row[0]
        else:
            result = conn.execute(
                text(
                    "INSERT INTO ingredientes (nombre, descripcion, es_alergeno, unidad_medida, precio, tipo_extra, disponible_como_extra) "
                    "VALUES (:nombre, :descripcion, :es_alergeno, :unidad_medida, :precio, :tipo_extra, :disponible_como_extra) RETURNING id"
                ),
                {"nombre": nombre, "descripcion": descripcion, "es_alergeno": es_alergeno, "unidad_medida": unidad_medida, "precio": precio, "tipo_extra": tipo_extra, "disponible_como_extra": disponible_como_extra},
            )
            nombre_a_id[nombre] = result.fetchone()[0]
            inserted += 1
    skipped = len(INGREDIENTES) - inserted
    print(f"  ingredientes   → {inserted} insertados, {skipped} ya existían")
    return nombre_a_id


def _seed_producto_ingredientes(
    conn,
    nombre_a_prod_id: dict[str, int],
    nombre_a_ing_id: dict[str, int],
) -> None:
    inserted = 0
    for prod_nombre, ings in PRODUCTO_INGREDIENTES.items():
        prod_id = nombre_a_prod_id.get(prod_nombre)
        if not prod_id:
            continue
        for ing_nombre, es_removible, cantidad in ings:
            ing_id = nombre_a_ing_id.get(ing_nombre)
            if not ing_id:
                continue
            result = conn.execute(
                text(
                    "INSERT INTO producto_ingredientes (producto_id, ingrediente_id, es_removible, cantidad) "
                    "VALUES (:pid, :iid, :removible, :cantidad) ON CONFLICT DO NOTHING"
                ),
                {"pid": prod_id, "iid": ing_id, "removible": es_removible, "cantidad": cantidad},
            )
            inserted += result.rowcount
    print(f"  prod↔ing       → {inserted} asociaciones nuevas")


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
        cat_ids = _seed_categorias(conn)
        prod_ids = _seed_productos(conn, cat_ids)
        ing_ids = _seed_ingredientes(conn)
        _seed_producto_ingredientes(conn, prod_ids, ing_ids)

    print()
    print("Seed completado.")


if __name__ == "__main__":
    run()
