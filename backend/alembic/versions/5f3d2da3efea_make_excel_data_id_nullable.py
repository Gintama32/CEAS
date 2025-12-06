"""make excel_data_id nullable on data

Revision ID: 5f3d2da3efea
Revises: 8b2a4c6ebf9c
Create Date: 2025-12-03 18:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "5f3d2da3efea"
down_revision: Union[str, Sequence[str], None] = "8b2a4c6ebf9c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("data", "excel_data_id", existing_type=sa.Integer(), nullable=True)


def downgrade() -> None:
    op.alter_column("data", "excel_data_id", existing_type=sa.Integer(), nullable=False)

