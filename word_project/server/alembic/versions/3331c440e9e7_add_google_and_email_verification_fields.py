"""add google auth and email verification fields to users

Revision ID: 3331c440e9e7
Revises: xxxx
Create Date: 2026-07-20

"""
from alembic import op
import sqlalchemy as sa


revision = "3331c440e9e7"
down_revision = "xxxx"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.alter_column("hashed_password", existing_type=sa.String(), nullable=True)
        batch_op.add_column(sa.Column("google_id", sa.String(), nullable=True))
        batch_op.create_index("ix_users_google_id", ["google_id"], unique=True)
        # server_default=true() : les comptes déjà inscrits restent utilisables
        # sans reconfirmation ; les nouvelles inscriptions passent explicitement
        # is_verified=False côté applicatif (voir routers/auth.py::register).
        batch_op.add_column(
            sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.true())
        )
        batch_op.add_column(sa.Column("verification_token", sa.String(), nullable=True))
        batch_op.create_index("ix_users_verification_token", ["verification_token"], unique=False)
        batch_op.add_column(
            sa.Column("verification_token_expires_at", sa.DateTime(timezone=True), nullable=True)
        )


def downgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("verification_token_expires_at")
        batch_op.drop_index("ix_users_verification_token")
        batch_op.drop_column("verification_token")
        batch_op.drop_column("is_verified")
        batch_op.drop_index("ix_users_google_id")
        batch_op.drop_column("google_id")
        batch_op.alter_column("hashed_password", existing_type=sa.String(), nullable=False)
