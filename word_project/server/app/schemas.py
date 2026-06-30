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
