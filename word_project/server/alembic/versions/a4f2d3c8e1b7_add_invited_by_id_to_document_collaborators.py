"""add invited_by_id column to document_collaborators

Revision ID: a4f2d3c8e1b7
Revises: 3331c440e9e7
Create Date: 2026-07-22

"""
from alembic import op
import sqlalchemy as sa


revision = "a4f2d3c8e1b7"
down_revision = "3331c440e9e7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("document_collaborators") as batch_op:
        batch_op.add_column(sa.Column("invited_by_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_document_collaborators_invited_by_id_users",
            "users",
            ["invited_by_id"],
            ["id"],
        )


def downgrade() -> None:
    with op.batch_alter_table("document_collaborators") as batch_op:
        batch_op.drop_column("invited_by_id")
