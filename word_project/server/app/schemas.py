""" app/schemas.py """


from pydantic import BaseModel, EmailStr
from datetime import datetime


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
    created_at: datetime

    class Config:
        from_attributes = True


# Réponse contenant le token JWT
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class DocumentCreate(BaseModel):
    title: str = "Document sans titre"
    content: str = ""


class DocumentUpdate(BaseModel):
    title: str | None = None
    content: str | None = None


class DocumentOut(BaseModel):
    id: int
    title: str
    content: str | None
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True


class DocumentSummary(BaseModel):
    """Pour la liste sur Home — pas besoin du contenu complet"""
    id: int
    title: str
    updated_at: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True
