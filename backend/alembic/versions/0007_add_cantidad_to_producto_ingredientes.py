"""add cantidad to producto_ingredientes

Revision ID: 0007
Revises: 0006
Create Date: 2026-05-18
"""
import sqlalchemy as sa
from alembic import op

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "producto_ingredientes",
        sa.Column("cantidad", sa.Integer(), nullable=False, server_default="1"),
    )
    # Hamburguesa Doble lleva 2 medallones
    op.execute("""
        UPDATE producto_ingredientes
        SET cantidad = 2
        WHERE ingrediente_id = (
            SELECT id FROM ingredientes WHERE nombre = 'Medallón de carne' AND eliminado_en IS NULL
        )
        AND producto_id = (
            SELECT id FROM productos WHERE nombre = 'Hamburguesa Doble' AND eliminado_en IS NULL
        )
    """)


def downgrade() -> None:
    op.drop_column("producto_ingredientes", "cantidad")
