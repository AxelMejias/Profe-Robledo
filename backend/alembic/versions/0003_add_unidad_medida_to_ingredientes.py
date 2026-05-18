"""add unidad_medida to ingredientes

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-17
"""

from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "ingredientes",
        sa.Column("unidad_medida", sa.String(length=10), nullable=False, server_default="UNIDAD"),
    )


def downgrade() -> None:
    op.drop_column("ingredientes", "unidad_medida")
