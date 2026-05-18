"""add precio to ingredientes

Revision ID: 0004
Revises: 0003
Create Date: 2026-05-18
"""

from alembic import op
import sqlalchemy as sa

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "ingredientes",
        sa.Column("precio", sa.Numeric(precision=10, scale=2), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("ingredientes", "precio")
