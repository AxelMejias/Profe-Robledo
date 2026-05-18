"""detalle_pedidos add extras column

Revision ID: 0009
Revises: 0008
Create Date: 2026-05-18
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "detalle_pedidos",
        sa.Column("extras", JSONB, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("detalle_pedidos", "extras")
