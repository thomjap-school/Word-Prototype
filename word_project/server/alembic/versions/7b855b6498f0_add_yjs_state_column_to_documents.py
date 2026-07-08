"""add yjs_state column to documents

Revision ID: xxxx
Revises: 
Create Date: 2026-07-08

"""
from alembic import op
import sqlalchemy as sa


revision = "xxxx"
down_revision = None  # c'est ta première migration, donc None
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("documents") as batch_op:
        batch_op.add_column(sa.Column("yjs_state", sa.LargeBinary(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("documents") as batch_op:
        batch_op.drop_column("yjs_state")