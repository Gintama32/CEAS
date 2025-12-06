"""add csi fields to data

Revision ID: c1ecddc6db0b
Revises: 6e7b1965a5d4
Create Date: 2025-12-01 15:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c1ecddc6db0b"
down_revision: Union[str, Sequence[str], None] = "6e7b1965a5d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add CSI metadata columns to data table."""
    op.add_column("data", sa.Column("csi_code", sa.String(), nullable=True))
    op.add_column("data", sa.Column("csi_title", sa.String(), nullable=True))


def downgrade() -> None:
    """Remove CSI metadata columns from data table."""
    op.drop_column("data", "csi_title")
    op.drop_column("data", "csi_code")

