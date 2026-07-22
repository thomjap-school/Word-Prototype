""" app/models.py """

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, UniqueConstraint, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    # Nullable : un compte créé via Google n'a pas de mot de passe local.
    hashed_password = Column(String, nullable=True)
    full_name = Column(String, nullable=True)
    google_id = Column(String, unique=True, index=True, nullable=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    verification_token = Column(String, index=True, nullable=True)
    verification_token_expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    documents = relationship("Document", back_populates="owner")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, default="Document sans titre")
    content = Column(JSON, nullable=True)  # HTML ou JSON
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    share_token = Column(String, unique=True, index=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="documents")
    collaborator_links = relationship(
        "DocumentCollaborator",
        back_populates="document",
        cascade="all, delete-orphan",
        foreign_keys="DocumentCollaborator.document_id",
    )

    @property
    def collaborators(self):
        return [link.user for link in self.collaborator_links]


class DocumentCollaborator(Base):
    __tablename__ = "document_collaborators"
    __table_args__ = (UniqueConstraint("document_id", "user_id"),)

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    # Qui a invité ce collaborateur. Nullable car une personne qui rejoint
    # via un lien de partage n'a pas d'inviteur direct (voir routes/documents.py,
    # join_via_share_link).
    invited_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship(
        "Document",
        back_populates="collaborator_links",
        foreign_keys=[document_id],
    )
    # Deux ForeignKey vers "users" ici (user_id et invited_by_id) : on doit
    # préciser foreign_keys sur chaque relation pour lever l'ambiguïté,
    # sinon SQLAlchemy plante au démarrage.
    user = relationship("User", foreign_keys=[user_id])
    invited_by = relationship("User", foreign_keys=[invited_by_id])
