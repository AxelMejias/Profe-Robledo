"""add tipo_extra to ingredientes

Revision ID: 0005
Revises: 0004
Create Date: 2026-05-18
"""

from alembic import op
import sqlalchemy as sa

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "ingredientes",
        sa.Column("tipo_extra", sa.String(length=50), nullable=True),
    )
    # Asignar tipo segun categoria de uso
    op.execute(
        "UPDATE ingredientes SET tipo_extra = 'hamburguesa' WHERE nombre IN "
        "('Medallón de carne', 'Pan brioche', 'Lechuga', 'Tomate', "
        "'Queso cheddar', 'Cebolla', 'Panceta', 'Salsa BBQ', 'Ketchup', 'Mayonesa')"
    )
    op.execute(
        "UPDATE ingredientes SET tipo_extra = 'postre' WHERE nombre IN "
        "('Chocolate', 'Harina de trigo', 'Huevo', 'Azúcar', "
        "'Helado de vainilla', 'Crema de leche')"
    )
    op.execute(
        "UPDATE ingredientes SET tipo_extra = 'bebida' WHERE nombre = 'Naranja'"
    )


def downgrade() -> None:
    op.drop_column("ingredientes", "tipo_extra")
