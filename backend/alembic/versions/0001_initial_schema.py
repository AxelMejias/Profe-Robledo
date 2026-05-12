"""initial schema — ERD v5 (16 tablas)

Revision ID: 0001
Revises:
Create Date: 2026-04-27
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ------------------------------------------------------------------ #
    # 1. roles — catálogo, sin dependencias                               #
    # ------------------------------------------------------------------ #
    op.create_table(
        "roles",
        sa.Column("codigo", sa.String(20), primary_key=True),
        sa.Column("nombre", sa.String(80), nullable=False),
        sa.Column("descripcion", sa.Text, nullable=False, server_default=""),
    )

    # ------------------------------------------------------------------ #
    # 2. estados_pedido — catálogo, sin dependencias                      #
    # ------------------------------------------------------------------ #
    op.create_table(
        "estados_pedido",
        sa.Column("codigo", sa.String(20), primary_key=True),
        sa.Column("nombre", sa.String(80), nullable=False),
        sa.Column("descripcion", sa.Text, nullable=True),
        sa.Column("es_terminal", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("orden", sa.Integer, nullable=False, server_default="0"),
    )

    # ------------------------------------------------------------------ #
    # 3. formas_pago — catálogo, sin dependencias                         #
    # ------------------------------------------------------------------ #
    op.create_table(
        "formas_pago",
        sa.Column("codigo", sa.String(20), primary_key=True),
        sa.Column("nombre", sa.String(80), nullable=False),
        sa.Column("descripcion", sa.Text, nullable=True),
        sa.Column("habilitado", sa.Boolean, nullable=False, server_default="true"),
    )

    # ------------------------------------------------------------------ #
    # 4. usuarios — sin dependencias                                      #
    # ------------------------------------------------------------------ #
    op.create_table(
        "usuarios",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("nombre", sa.String(80), nullable=False),
        sa.Column("apellido", sa.String(80), nullable=False),
        sa.Column("email", sa.String(254), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(60), nullable=False),
        sa.Column("telefono", sa.String(30), nullable=True),
        sa.Column(
            "creado_en",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "actualizado_en",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column("eliminado_en", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.create_index("ix_usuarios_email", "usuarios", ["email"], unique=True)

    # ------------------------------------------------------------------ #
    # 5. usuario_roles — pivot M2M usuarios × roles                       #
    # ------------------------------------------------------------------ #
    op.create_table(
        "usuario_roles",
        sa.Column("usuario_id", sa.BigInteger, nullable=False),
        sa.Column("rol_codigo", sa.String(20), nullable=False),
        sa.Column("asignado_por_id", sa.BigInteger, nullable=True),
        sa.Column(
            "asignado_en",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.PrimaryKeyConstraint("usuario_id", "rol_codigo"),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["rol_codigo"], ["roles.codigo"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["asignado_por_id"], ["usuarios.id"], ondelete="SET NULL"
        ),
    )

    # ------------------------------------------------------------------ #
    # 6. refresh_tokens — depende de usuarios                             #
    # ------------------------------------------------------------------ #
    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("usuario_id", sa.BigInteger, nullable=False),
        sa.Column("expires_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column(
            "creado_en",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], ondelete="CASCADE"),
    )
    op.create_index(
        "ix_refresh_tokens_token_hash", "refresh_tokens", ["token_hash"], unique=True
    )

    # ------------------------------------------------------------------ #
    # 7. direcciones_entrega — depende de usuarios                        #
    # ------------------------------------------------------------------ #
    op.create_table(
        "direcciones_entrega",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("usuario_id", sa.BigInteger, nullable=False),
        sa.Column("alias", sa.String(50), nullable=True),
        sa.Column("linea1", sa.Text, nullable=False),
        sa.Column("linea2", sa.Text, nullable=True),
        sa.Column("ciudad", sa.String(100), nullable=False),
        sa.Column("codigo_postal", sa.String(20), nullable=False),
        sa.Column("referencia", sa.Text, nullable=True),
        sa.Column("es_principal", sa.Boolean, nullable=False, server_default="false"),
        sa.Column(
            "creado_en",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "actualizado_en",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column("eliminado_en", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], ondelete="CASCADE"),
    )

    # ------------------------------------------------------------------ #
    # 8. categorias — FK auto-referencial (parent_id → categorias.id)    #
    # ------------------------------------------------------------------ #
    op.create_table(
        "categorias",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("descripcion", sa.Text, nullable=True),
        sa.Column("imagen_url", sa.Text, nullable=True),
        sa.Column("parent_id", sa.BigInteger, nullable=True),
        sa.Column(
            "creado_en",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "actualizado_en",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column("eliminado_en", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["parent_id"], ["categorias.id"], ondelete="SET NULL"
        ),
    )

    # ------------------------------------------------------------------ #
    # 9. ingredientes — sin dependencias                                  #
    # ------------------------------------------------------------------ #
    op.create_table(
        "ingredientes",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("nombre", sa.String(100), nullable=False, unique=True),
        sa.Column("descripcion", sa.Text, nullable=True),
        sa.Column("es_alergeno", sa.Boolean, nullable=False, server_default="false"),
        sa.Column(
            "creado_en",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "actualizado_en",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column("eliminado_en", sa.TIMESTAMP(timezone=True), nullable=True),
    )

    # ------------------------------------------------------------------ #
    # 10. productos — sin dependencias directas                           #
    # ------------------------------------------------------------------ #
    op.create_table(
        "productos",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("nombre", sa.String(200), nullable=False),
        sa.Column("descripcion", sa.Text, nullable=True),
        sa.Column("imagen_url", sa.Text, nullable=True),
        sa.Column(
            "precio_base",
            sa.Numeric(precision=10, scale=2),
            nullable=False,
            default=0,
        ),
        sa.Column(
            "stock_cantidad",
            sa.Integer,
            nullable=False,
            server_default="0",
        ),
        sa.Column("disponible", sa.Boolean, nullable=False, server_default="true"),
        sa.Column(
            "creado_en",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "actualizado_en",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column("eliminado_en", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.CheckConstraint("precio_base >= 0", name="ck_productos_precio_base_gte_0"),
        sa.CheckConstraint(
            "stock_cantidad >= 0", name="ck_productos_stock_cantidad_gte_0"
        ),
    )

    # ------------------------------------------------------------------ #
    # 11. producto_categorias — pivot productos × categorias              #
    # ------------------------------------------------------------------ #
    op.create_table(
        "producto_categorias",
        sa.Column("producto_id", sa.BigInteger, nullable=False),
        sa.Column("categoria_id", sa.BigInteger, nullable=False),
        sa.Column("es_principal", sa.Boolean, nullable=False, server_default="false"),
        sa.PrimaryKeyConstraint("producto_id", "categoria_id"),
        sa.ForeignKeyConstraint(["producto_id"], ["productos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["categoria_id"], ["categorias.id"], ondelete="CASCADE"
        ),
    )

    # ------------------------------------------------------------------ #
    # 12. producto_ingredientes — pivot productos × ingredientes          #
    # ------------------------------------------------------------------ #
    op.create_table(
        "producto_ingredientes",
        sa.Column("producto_id", sa.BigInteger, nullable=False),
        sa.Column("ingrediente_id", sa.BigInteger, nullable=False),
        sa.Column("es_removible", sa.Boolean, nullable=False, server_default="true"),
        sa.PrimaryKeyConstraint("producto_id", "ingrediente_id"),
        sa.ForeignKeyConstraint(["producto_id"], ["productos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["ingrediente_id"], ["ingredientes.id"], ondelete="CASCADE"
        ),
    )

    # ------------------------------------------------------------------ #
    # 13. pedidos — depende de usuarios, estados_pedido,                  #
    #              direcciones_entrega, formas_pago                       #
    # ------------------------------------------------------------------ #
    op.create_table(
        "pedidos",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("usuario_id", sa.BigInteger, nullable=False),
        sa.Column(
            "estado_codigo",
            sa.String(20),
            nullable=False,
            server_default="PENDIENTE",
        ),
        sa.Column("direccion_id", sa.BigInteger, nullable=True),
        sa.Column("forma_pago_codigo", sa.String(20), nullable=False),
        sa.Column("subtotal", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column(
            "costo_envio",
            sa.Numeric(precision=10, scale=2),
            nullable=False,
            server_default="50.00",
        ),
        sa.Column("total", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("direccion_snapshot", sa.Text, nullable=True),
        sa.Column("notas", sa.Text, nullable=True),
        sa.Column(
            "creado_en",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "actualizado_en",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column("eliminado_en", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(
            ["estado_codigo"], ["estados_pedido.codigo"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(
            ["direccion_id"], ["direcciones_entrega.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["forma_pago_codigo"], ["formas_pago.codigo"], ondelete="RESTRICT"
        ),
    )

    # ------------------------------------------------------------------ #
    # 14. detalle_pedidos — depende de pedidos, productos                 #
    # ------------------------------------------------------------------ #
    op.create_table(
        "detalle_pedidos",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("pedido_id", sa.BigInteger, nullable=False),
        sa.Column("producto_id", sa.BigInteger, nullable=False),
        sa.Column("nombre_snapshot", sa.String(200), nullable=False),
        sa.Column(
            "precio_snapshot", sa.Numeric(precision=10, scale=2), nullable=False
        ),
        sa.Column("cantidad", sa.Integer, nullable=False),
        sa.Column("subtotal", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column(
            "personalizacion",
            postgresql.ARRAY(sa.Integer),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["pedido_id"], ["pedidos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["producto_id"], ["productos.id"], ondelete="RESTRICT"),
        sa.CheckConstraint("cantidad >= 1", name="ck_detalle_pedidos_cantidad_gte_1"),
    )

    # ------------------------------------------------------------------ #
    # 15. historial_estados_pedido — append-only, sin updated_at          #
    # ------------------------------------------------------------------ #
    op.create_table(
        "historial_estados_pedido",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("pedido_id", sa.BigInteger, nullable=False),
        sa.Column("estado_desde", sa.String(20), nullable=True),
        sa.Column("estado_hasta", sa.String(20), nullable=False),
        sa.Column("usuario_id", sa.BigInteger, nullable=True),
        sa.Column("motivo", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.ForeignKeyConstraint(["pedido_id"], ["pedidos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["estado_desde"], ["estados_pedido.codigo"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(
            ["estado_hasta"], ["estados_pedido.codigo"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(
            ["usuario_id"], ["usuarios.id"], ondelete="SET NULL"
        ),
    )

    # ------------------------------------------------------------------ #
    # 16. pagos — depende de pedidos                                      #
    # ------------------------------------------------------------------ #
    op.create_table(
        "pagos",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("pedido_id", sa.BigInteger, nullable=False),
        sa.Column("monto", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("mp_payment_id", sa.BigInteger, nullable=True, unique=True),
        sa.Column("mp_status", sa.String(30), nullable=False),
        sa.Column("external_reference", sa.String(100), nullable=False, unique=True),
        sa.Column("idempotency_key", sa.String(100), nullable=False, unique=True),
        sa.Column(
            "creado_en",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "actualizado_en",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.ForeignKeyConstraint(["pedido_id"], ["pedidos.id"], ondelete="RESTRICT"),
    )


def downgrade() -> None:
    # Orden inverso al upgrade — primero las tablas con más dependencias
    op.drop_table("pagos")
    op.drop_table("historial_estados_pedido")
    op.drop_table("detalle_pedidos")
    op.drop_table("pedidos")
    op.drop_table("producto_ingredientes")
    op.drop_table("producto_categorias")
    op.drop_table("productos")
    op.drop_table("ingredientes")
    op.drop_table("categorias")
    op.drop_table("direcciones_entrega")
    op.drop_index("ix_refresh_tokens_token_hash", table_name="refresh_tokens")
    op.drop_table("refresh_tokens")
    op.drop_table("usuario_roles")
    op.drop_index("ix_usuarios_email", table_name="usuarios")
    op.drop_table("usuarios")
    op.drop_table("formas_pago")
    op.drop_table("estados_pedido")
    op.drop_table("roles")
