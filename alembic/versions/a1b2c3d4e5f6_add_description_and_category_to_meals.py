"""add description and category to meals

Revision ID: a1b2c3d4e5f6
Revises: 853088fb7455
Create Date: 2026-06-08 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "853088fb7455"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("meals", sa.Column("description", sa.String(), nullable=True))
    op.add_column("meals", sa.Column("category", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("meals", "category")
    op.drop_column("meals", "description")
