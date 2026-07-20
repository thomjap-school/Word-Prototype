""" app/schemas.py """

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, Any


# Ce que le client envoie pour s'inscrire
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None


# Ce que le client envoie pour se connecter
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# Ce que l'API renvoie (jamais le mot de passe !)
class UserOut(BaseModel):
    id: int
    email: str
    full_name: str | None
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Réponse contenant le token JWT
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class VerifyEmailResponse(BaseModel):
    message: str


class UserUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class DocumentCreate(BaseModel):
    title: str = "Document sans titre"
    content: Optional[Any] = None


class DocumentUpdate(BaseModel):
    title: str | None = None
    content: Optional[dict[str, Any]] = None


class CollaboratorOut(BaseModel):
    id: int
    email: str
    full_name: str | None

    class Config:
        from_attributes = True


class DocumentOut(BaseModel):
    id: int
    title: str
    content: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime | None
    owner_id: int
    collaborators: list[CollaboratorOut] = []

    class Config:
        from_attributes = True


class DocumentSummary(BaseModel):
    id: int
    title: str
    updated_at: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True


class InviteRequest(BaseModel):
    email: EmailStr


class ShareLinkOut(BaseModel):
    share_token: str
