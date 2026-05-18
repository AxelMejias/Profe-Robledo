"""ingredientes add categoria_id

Revision ID: 0010
Revises: 0009
Create Date: 2026-05-18
"""
from alembic import op
import sqlalchemy as sa

revision = "0010"
down_revision = "0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "ingredientes",
        sa.Column("categoria_id", sa.Integer(), sa.ForeignKey("categorias.id"), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("ingredientes", "categoria_id")
