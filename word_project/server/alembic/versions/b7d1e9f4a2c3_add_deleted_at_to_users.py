"""add deleted_at column to users

Revision ID: b7d1e9f4a2c3
Revises: a4f2d3c8e1b7
Create Date: 2026-07-22

"""
from alembic import op
import sqlalchemy as sa


revision = "b7d1e9f4a2c3"
down_revision = "a4f2d3c8e1b7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("deleted_at")
