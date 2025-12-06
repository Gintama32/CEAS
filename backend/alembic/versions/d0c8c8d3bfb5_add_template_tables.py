"""add template tables

Revision ID: d0c8c8d3bfb5
Revises: c1ecddc6db0b
Create Date: 2025-12-01 16:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d0c8c8d3bfb5"
down_revision: Union[str, Sequence[str], None] = "c1ecddc6db0b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create templates, template_sections, and template_items tables."""
    op.create_table(
        "templates",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("project_type", sa.String(), nullable=False, server_default="General"),
        sa.Column("status", sa.String(), nullable=False, server_default="draft"),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "template_sections",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("template_id", sa.Integer(), sa.ForeignKey("templates.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("csi_code", sa.String(), nullable=True),
        sa.Column("csi_title", sa.String(), nullable=True),
        sa.Column("sort_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("notes", sa.Text(), nullable=True),
    )
    op.create_table(
        "template_items",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("template_id", sa.Integer(), sa.ForeignKey("templates.id", ondelete="CASCADE"), nullable=False),
        sa.Column("section_id", sa.Integer(), sa.ForeignKey("template_sections.id", ondelete="CASCADE"), nullable=True),
        sa.Column("catalog_data_id", sa.Integer(), sa.ForeignKey("data.id"), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("unit", sa.String(), nullable=True),
        sa.Column("default_quantity", sa.Float(), nullable=True),
        sa.Column("material_unit_cost", sa.Float(), nullable=True),
        sa.Column("labor_unit_cost", sa.Float(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("sort_index", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    """Drop template tables."""
    op.drop_table("template_items")
    op.drop_table("template_sections")
    op.drop_table("templates")

