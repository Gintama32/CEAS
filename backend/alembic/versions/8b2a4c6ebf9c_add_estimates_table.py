"""add estimates table

Revision ID: 8b2a4c6ebf9c
Revises: d0c8c8d3bfb5
Create Date: 2025-12-01 18:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "8b2a4c6ebf9c"
down_revision: Union[str, Sequence[str], None] = "d0c8c8d3bfb5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create estimates table for template-derived estimates."""
    op.create_table(
        "estimates",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("template_id", sa.Integer(), sa.ForeignKey("templates.id"), nullable=True),
        sa.Column("excel_data_id", sa.Integer(), sa.ForeignKey("excel_data.id"), nullable=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="draft"),
        sa.Column("total_cost", sa.Float(), nullable=False, server_default="0"),
        sa.Column("total_labor", sa.Float(), nullable=False, server_default="0"),
        sa.Column("total_material", sa.Float(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_estimates_project_id", "estimates", ["project_id"])
    op.create_index("ix_estimates_template_id", "estimates", ["template_id"])


def downgrade() -> None:
    """Drop estimates table."""
    op.drop_index("ix_estimates_template_id", table_name="estimates")
    op.drop_index("ix_estimates_project_id", table_name="estimates")
    op.drop_table("estimates")


