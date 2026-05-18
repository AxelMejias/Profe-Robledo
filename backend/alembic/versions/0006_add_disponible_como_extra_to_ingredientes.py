"""add disponible_como_extra to ingredientes

Revision ID: 0006
Revises: 0005
Create Date: 2026-05-18
"""
import sqlalchemy as sa
from alembic import op

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "ingredientes",
        sa.Column("disponible_como_extra", sa.Boolean(), nullable=False, server_default="false"),
    )
    # Ingredientes que tienen sentido como extras para el cliente
    op.execute(
        "UPDATE ingredientes SET disponible_como_extra = true "
        "WHERE tipo_extra = 'hamburguesa' AND nombre != 'Pan brioche'"
    )
    op.execute(
        "UPDATE ingredientes SET disponible_como_extra = true "
        "WHERE nombre IN ('Helado de vainilla', 'Crema de leche')"
    )
    # Naranja: extra de jugos, no de bebidas genéricas (Agua, Coca-Cola)
    op.execute(
        "UPDATE ingredientes SET disponible_como_extra = true, tipo_extra = 'jugo' "
        "WHERE nombre = 'Naranja'"
    )


def downgrade() -> None:
    op.drop_column("ingredientes", "disponible_como_extra")
