""" app/models.py """

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
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
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship("Document", back_populates="collaborator_links")
    user = relationship("User")